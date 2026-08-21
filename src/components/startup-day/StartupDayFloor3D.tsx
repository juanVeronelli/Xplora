import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  SD_CLASSROOM_IDS,
  SD_CLASSROOMS,
  SD_FLOOR_NAV,
  SD_FLOOR_OVERVIEW,
  type SdClassroomId,
  type SdFloorNavId,
} from '../../data/startupDay';
import { SdReveal } from './SdReveal';

const MODEL_URL = '/models/mipiso.glb';
const HOVER_EMISSIVE_COLOR = '#603ef9';
const HOVER_EMISSIVE_INTENSITY = 0.22;
const EMISSIVE_DAMP = 11;
const CAMERA_FOV = 38;
const CAMERA_DIR = new THREE.Vector3(0.48, 0.86, 0.52).normalize();
const FLY_DURATION = 0.95;
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const SPIN_SPEED = 0.22;
const SPIN_DAMP = 6;

useGLTF.preload(MODEL_URL);

function classroomIdFromName(name: string): SdClassroomId | null {
  for (const id of SD_CLASSROOM_IDS) {
    if (name === id || name.includes(id)) return id;
  }
  return null;
}

function isTouchViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function copyEmissive(mesh: THREE.Mesh) {
  const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const cloned = source.map((m) => {
    const clone = (m as THREE.Material).clone() as THREE.MeshStandardMaterial;
    if ('emissive' in clone) {
      clone.emissive = new THREE.Color(HOVER_EMISSIVE_COLOR);
      clone.emissiveIntensity = 0;
    }
    return clone;
  });
  mesh.material = cloned.length === 1 ? cloned[0] : cloned;
  return cloned;
}

function navCopy(id: SdFloorNavId) {
  return id === 'floor' ? SD_FLOOR_OVERVIEW : SD_CLASSROOMS[id];
}

type RoomFrame = { center: THREE.Vector3; size: THREE.Vector3 };

type FloorModelProps = {
  focusId: SdFloorNavId;
  highlightId: SdFloorNavId;
  touch: boolean;
  onHover: (id: SdFloorNavId | null) => void;
  onTap: (id: SdFloorNavId) => void;
};

function FloorModel({ focusId, highlightId, touch, onHover, onTap }: FloorModelProps) {
  const { scene } = useGLTF(MODEL_URL);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const look = useRef(new THREE.Vector3());
  const fromPos = useRef(new THREE.Vector3());
  const fromLook = useRef(new THREE.Vector3());
  const toPos = useRef(new THREE.Vector3());
  const toLook = useRef(new THREE.Vector3());
  const tRef = useRef(1);
  const ready = useRef(false);
  const spinRef = useRef<THREE.Group>(null);
  const spinSpeed = useRef(1);
  const reducedMotion = useRef(prefersReducedMotion());
  const { size } = useThree();

  const { nodes, center, halfY, horizRadius, classroomMaterials, rooms, nodeRoom } = useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const boxCenter = box.getCenter(new THREE.Vector3());
    const boxSize = box.getSize(new THREE.Vector3());

    const roomNodes = new Map<SdClassroomId, THREE.Object3D>();
    const roomBoxes = new Map<SdClassroomId, THREE.Box3>();
    const nodeRoom = new Map<string, SdClassroomId>();

    for (const node of scene.children) {
      const id = classroomIdFromName(node.name);
      if (!id) continue;
      roomNodes.set(id, node);
      roomBoxes.set(id, new THREE.Box3().setFromObject(node));
      nodeRoom.set(node.uuid, id);
    }

    const assignNode = (node: THREE.Object3D) => {
      if (nodeRoom.has(node.uuid)) return;
      const nb = new THREE.Box3().setFromObject(node);
      const nc = nb.getCenter(new THREE.Vector3());
      let best: SdClassroomId | null = null;
      let bestDist = Infinity;
      for (const id of SD_CLASSROOM_IDS) {
        const rb = roomBoxes.get(id);
        if (!rb) continue;
        if (rb.containsPoint(nc)) {
          best = id;
          bestDist = 0;
          break;
        }
        const rc = rb.getCenter(new THREE.Vector3());
        const d = Math.hypot(nc.x - rc.x, nc.z - rc.z);
        if (d < bestDist) {
          bestDist = d;
          best = id;
        }
      }
      if (best) {
        nodeRoom.set(node.uuid, best);
        roomBoxes.get(best)!.union(nb);
      }
    };

    for (const node of scene.children) {
      if (classroomIdFromName(node.name)) continue;
      if (node.name.startsWith('_(') || node.name === 'C-sala_estar') continue;
      assignNode(node);
    }

    const mats = new Map<SdClassroomId, THREE.MeshStandardMaterial[]>();
    const rooms = new Map<SdClassroomId, RoomFrame>();

    for (const id of SD_CLASSROOM_IDS) {
      const rb = roomBoxes.get(id);
      if (!rb) continue;
      rooms.set(id, {
        center: rb.getCenter(new THREE.Vector3()).sub(boxCenter),
        size: rb.getSize(new THREE.Vector3()),
      });
      mats.set(id, []);
    }

    for (const node of scene.children) {
      const id = nodeRoom.get(node.uuid);
      if (!id) continue;
      node.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        mats.get(id)!.push(...copyEmissive(child));
      });
    }

    return {
      nodes: [...scene.children],
      center: boxCenter,
      halfY: boxSize.y / 2,
      horizRadius: 0.5 * Math.hypot(boxSize.x, boxSize.z),
      classroomMaterials: mats,
      rooms,
      nodeRoom,
    };
  }, [scene]);

  const idFromObject = (obj: THREE.Object3D): SdClassroomId | null => {
    let cur: THREE.Object3D | null = obj;
    while (cur) {
      const mapped = nodeRoom.get(cur.uuid);
      if (mapped) return mapped;
      const named = classroomIdFromName(cur.name);
      if (named) return named;
      cur = cur.parent;
    }
    return null;
  };

  const yaw = () => spinRef.current?.rotation.y ?? 0;

  const shotFor = (id: SdFloorNavId, aspect: number) => {
    if (id !== 'floor') {
      const room = rooms.get(id);
      if (room) {
        const span = Math.max(room.size.x, room.size.z, room.size.y * 1.15);
        const lookAt = room.center.clone().applyAxisAngle(Y_AXIS, yaw());
        return {
          pos: lookAt.clone().add(CAMERA_DIR.clone().multiplyScalar(span * 1.45)),
          look: lookAt,
        };
      }
    }
    const vFov = THREE.MathUtils.degToRad(CAMERA_FOV);
    const distH = (horizRadius * 0.82 + halfY) / Math.tan(vFov / 2);
    const distW = (horizRadius * 0.82) / (Math.max(aspect, 0.5) * Math.tan(vFov / 2));
    const dist = Math.max(distH, distW) * 1.12;
    return {
      pos: CAMERA_DIR.clone().multiplyScalar(dist),
      look: new THREE.Vector3(0, -halfY * 0.1, 0),
      dist,
    };
  };

  useLayoutEffect(() => {
    const cam = cameraRef.current;
    if (!cam || size.width < 2 || size.height < 2) return;
    const aspect = size.width / size.height;
    const target = shotFor(focusId, aspect);
    const overview = shotFor('floor', aspect);
    cam.near = 0.2;
    cam.far = (overview.dist ?? 400) * 8;
    cam.updateProjectionMatrix();

    if (!ready.current || prefersReducedMotion()) {
      cam.position.copy(target.pos);
      look.current.copy(target.look);
      cam.lookAt(look.current);
      toPos.current.copy(target.pos);
      toLook.current.copy(target.look);
      tRef.current = 1;
      ready.current = true;
      return;
    }

    fromPos.current.copy(cam.position);
    fromLook.current.copy(look.current);
    toPos.current.copy(target.pos);
    toLook.current.copy(target.look);
    tRef.current = 0;
  }, [focusId, size.width, size.height, halfY, horizRadius, rooms]);

  useFrame((_, delta) => {
    spinSpeed.current = THREE.MathUtils.damp(
      spinSpeed.current,
      focusId === 'floor' && !reducedMotion.current ? 1 : 0,
      SPIN_DAMP,
      delta,
    );
    if (spinRef.current) {
      spinRef.current.rotation.y += SPIN_SPEED * spinSpeed.current * delta;
    }

    const cam = cameraRef.current;
    if (cam) {
      if (tRef.current < 1) {
        tRef.current = Math.min(1, tRef.current + delta / FLY_DURATION);
        const k = easeInOutCubic(tRef.current);
        cam.position.lerpVectors(fromPos.current, toPos.current, k);
        look.current.lerpVectors(fromLook.current, toLook.current, k);
      }
      cam.lookAt(look.current);
    }
    classroomMaterials.forEach((mats, id) => {
      const target = highlightId === id ? HOVER_EMISSIVE_INTENSITY : 0;
      mats.forEach((mat) => {
        if ('emissiveIntensity' in mat) {
          mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, target, EMISSIVE_DAMP, delta);
        }
      });
    });
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault fov={CAMERA_FOV} near={0.2} far={4000} />
      <hemisphereLight args={['#ece6ff', '#0c0816', 0.7]} />
      <directionalLight position={[horizRadius * 0.55, horizRadius * 1.1, horizRadius * 0.4]} intensity={1.2} />
      <directionalLight position={[-horizRadius * 0.4, horizRadius * 0.45, -horizRadius * 0.3]} intensity={0.28} />

      <group ref={spinRef}>
        <group position={[-center.x, -center.y, -center.z]}>
          {nodes.map((node) => (
            <primitive
              key={node.uuid}
              object={node}
              onPointerOver={
                touch
                  ? undefined
                  : (e: ThreeEvent<PointerEvent>) => {
                      e.stopPropagation();
                      onHover(idFromObject(e.object));
                    }
              }
              onPointerOut={
                touch
                  ? undefined
                  : (e: ThreeEvent<PointerEvent>) => {
                      e.stopPropagation();
                      onHover(null);
                    }
              }
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                onTap(idFromObject(e.object) ?? 'floor');
              }}
            />
          ))}
        </group>
      </group>
    </>
  );
}

export function StartupDayFloor3D() {
  const [hoveredId, setHoveredId] = useState<SdFloorNavId | null>(null);
  const [pinnedId, setPinnedId] = useState<SdFloorNavId>('floor');
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(isTouchViewport());
  }, []);

  const activeId = hoveredId ?? pinnedId;
  const copy = navCopy(pinnedId);
  const hudId = pinnedId === 'floor' ? 'PLANTA' : pinnedId.replace(/^C-/, '').toUpperCase();

  return (
    <section id="aulas" className="sd-band sd-band--ink sd-floor3d">
      <div className="sd-floor3d__layout">
        <div className="sd-floor3d__rail">
          <SdReveal className="sd-floor3d__head">
            <p className="sd-kicker">Alem 882</p>
            <h2 className="sd-h2">El mapa</h2>
          </SdReveal>

          <ol className="sd-floor3d__list" aria-label="Piso y aulas">
            {SD_FLOOR_NAV.map((item, i) => {
              const on = activeId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`sd-floor3d__item${on ? ' is-on' : ''}`}
                    onMouseEnter={() => {
                      if (!touch) setHoveredId(item.id);
                    }}
                    onMouseLeave={() => {
                      if (!touch) setHoveredId(null);
                    }}
                    onFocus={() => setHoveredId(item.id)}
                    onBlur={() => setHoveredId(null)}
                    onClick={() => setPinnedId(item.id)}
                  >
                    <span className="sd-floor3d__n">{item.id === 'floor' ? '00' : String(i).padStart(2, '0')}</span>
                    <span className="sd-floor3d__item-title">{item.copy.title}</span>
                    <span className="sd-floor3d__item-tag">{item.copy.tag}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="sd-floor3d__detail" aria-live="polite">
            <p className="sd-floor3d__detail-k">
              {copy.tag} · {copy.time}
            </p>
            <p className="sd-floor3d__detail-title">{copy.title}</p>
            <p className="sd-floor3d__detail-copy">{copy.copy}</p>
          </div>
        </div>

        <div className={`sd-floor3d__stage${hoveredId && hoveredId !== 'floor' ? ' is-hovering' : ''}`}>
          <div className="sd-floor3d__hud" aria-hidden="true">
            <span>{hudId}</span>
            <span>UCEMA</span>
          </div>
          <div className="sd-floor3d__canvas">
            <Canvas dpr={[1, 1.75]} gl={{ alpha: true, antialias: true }}>
              <Suspense fallback={null}>
                <FloorModel
                  focusId={pinnedId}
                  highlightId={activeId}
                  touch={touch}
                  onHover={setHoveredId}
                  onTap={setPinnedId}
                />
              </Suspense>
            </Canvas>
          </div>
        </div>
      </div>
    </section>
  );
}
