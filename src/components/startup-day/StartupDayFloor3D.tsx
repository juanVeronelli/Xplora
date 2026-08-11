import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SD_CLASSROOMS, type SdClassroomId } from '../../data/startupDay';
import { SdReveal } from './SdReveal';

const MODEL_URL = '/models/pp2.glb';
const CLASSROOM_IDS = Object.keys(SD_CLASSROOMS) as SdClassroomId[];
/** Mismo valor que --sd-purple (startupDay.css) — no se puede leer el custom property fuera del DOM. */
const HOVER_EMISSIVE_COLOR = '#603ef9';
/** "+10–15% sobre el valor base" leído como el rango objetivo de intensidad en hover (base = 0). */
const HOVER_EMISSIVE_INTENSITY = 0.12;
const ROTATION_DAMP = 9;
const EMISSIVE_DAMP = 11;
const CAMERA_FOV = 42;
/** La rotación es sobre el eje X: X nunca cambia en pantalla, por eso la cámara vive en el plano Y-Z. */
const CAMERA_DIR = new THREE.Vector3(0, 0.82, 0.55).normalize();

useGLTF.preload(MODEL_URL);

function isClassroomId(name: string): name is SdClassroomId {
  return (CLASSROOM_IDS as string[]).includes(name);
}

function isTouchViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

type FloorModelProps = {
  rotationSpeed: number;
  activeId: SdClassroomId | null;
  touch: boolean;
  onHover: (id: SdClassroomId | null) => void;
  onTap: (id: SdClassroomId) => void;
  onClear: () => void;
};

function FloorModel({ rotationSpeed, activeId, touch, onHover, onTap, onClear }: FloorModelProps) {
  const { scene } = useGLTF(MODEL_URL);
  const spinRef = useRef<THREE.Group>(null);
  const speedFactor = useRef(1);
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const { nodes, center, halfX, yzRadius, classroomMaterials } = useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const boxCenter = box.getCenter(new THREE.Vector3());
    const boxSize = box.getSize(new THREE.Vector3());

    const mats = new Map<SdClassroomId, THREE.MeshStandardMaterial[]>();
    for (const id of CLASSROOM_IDS) {
      const node = scene.getObjectByName(id);
      if (!node) continue;
      const nodeMats: THREE.MeshStandardMaterial[] = [];
      node.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const source = Array.isArray(child.material) ? child.material : [child.material];
        const cloned = source.map((m) => {
          const clone = (m as THREE.MeshStandardMaterial).clone();
          clone.emissive = new THREE.Color(HOVER_EMISSIVE_COLOR);
          clone.emissiveIntensity = 0;
          return clone;
        });
        child.material = cloned.length === 1 ? cloned[0] : cloned;
        nodeMats.push(...cloned);
      });
      mats.set(id, nodeMats);
    }

    return {
      nodes: [...scene.children],
      center: boxCenter,
      halfX: boxSize.x / 2,
      yzRadius: 0.5 * Math.hypot(boxSize.y, boxSize.z),
      classroomMaterials: mats,
    };
  }, [scene]);

  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const { size } = useThree();

  useLayoutEffect(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    const vFov = THREE.MathUtils.degToRad(CAMERA_FOV);
    const aspect = size.width / size.height;
    // El eje X no cambia en pantalla al rotar sobre X: se puede encuadrar exacto en vez de por esfera completa.
    const distForHeight = yzRadius / Math.tan(vFov / 2);
    const distForWidth = halfX / (aspect * Math.tan(vFov / 2));
    const dist = Math.max(distForHeight, distForWidth) * 1.15;
    cam.position.copy(CAMERA_DIR).multiplyScalar(dist);
    cam.far = dist * 6;
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [size.width, size.height, halfX, yzRadius]);

  useFrame((_, delta) => {
    const targetSpeedFactor = activeId ? 0 : 1;
    speedFactor.current = THREE.MathUtils.damp(
      speedFactor.current,
      targetSpeedFactor,
      ROTATION_DAMP,
      delta,
    );
    if (spinRef.current && !reducedMotion.current) {
      spinRef.current.rotation.x += rotationSpeed * speedFactor.current * delta;
    }
    classroomMaterials.forEach((mats, id) => {
      const target = id === activeId ? HOVER_EMISSIVE_INTENSITY : 0;
      mats.forEach((mat) => {
        mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, target, EMISSIVE_DAMP, delta);
      });
    });
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault fov={CAMERA_FOV} near={0.1} far={1000} />
      <hemisphereLight args={['#ece6ff', '#0c0816', 0.65]} />
      <directionalLight position={[halfX * 0.5, yzRadius * 1.4, yzRadius]} intensity={1.1} />
      <directionalLight position={[-halfX * 0.4, yzRadius * 0.5, -yzRadius]} intensity={0.25} />

      <group ref={spinRef}>
        <group position={[-center.x, -center.y, -center.z]}>
          {nodes.map((node) => {
            const interactive = isClassroomId(node.name);
            return (
              <primitive
                key={node.uuid}
                object={node}
                onPointerOver={
                  interactive && !touch
                    ? (e: ThreeEvent<PointerEvent>) => {
                        e.stopPropagation();
                        onHover(node.name as SdClassroomId);
                      }
                    : undefined
                }
                onPointerOut={
                  interactive && !touch
                    ? (e: ThreeEvent<PointerEvent>) => {
                        e.stopPropagation();
                        onHover(null);
                      }
                    : undefined
                }
                onClick={
                  touch
                    ? (e: ThreeEvent<MouseEvent>) => {
                        e.stopPropagation();
                        if (interactive) onTap(node.name as SdClassroomId);
                        else onClear();
                      }
                    : undefined
                }
              />
            );
          })}
        </group>
      </group>
    </>
  );
}

/** Piso 3D interactivo (pp2.glb) — 6 aulas + pasillo + baños. Va inmediatamente después de Agenda. */
export function StartupDayFloor3D({ rotationSpeed = 0.18 }: { rotationSpeed?: number }) {
  const [hoveredId, setHoveredId] = useState<SdClassroomId | null>(null);
  const [tappedId, setTappedId] = useState<SdClassroomId | null>(null);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(isTouchViewport());
  }, []);

  const activeId = touch ? tappedId : hoveredId;
  const activeCopy = activeId ? SD_CLASSROOMS[activeId] : null;

  const handleTap = (id: SdClassroomId) => {
    setTappedId((prev) => (prev === id ? null : id));
  };
  const handleClear = () => setTappedId(null);

  return (
    <section id="aulas" className="sd-band sd-band--ink sd-floor3d">
      <SdReveal className="sd-floor3d__head">
        <p className="sd-kicker">El piso</p>
        <h2 className="sd-h2">6 aulas, un mismo día</h2>
      </SdReveal>

      <SdReveal className="sd-floor3d__stage-wrap">
        <div className={`sd-floor3d__stage${activeId ? ' is-hovering' : ''}`}>
          <div className="sd-floor3d__canvas" aria-hidden="true">
            <Canvas
              dpr={[1, 2]}
              gl={{ alpha: true, antialias: true }}
              onPointerMissed={() => {
                if (touch) handleClear();
              }}
            >
              <Suspense fallback={null}>
                <FloorModel
                  rotationSpeed={rotationSpeed}
                  activeId={activeId}
                  touch={touch}
                  onHover={setHoveredId}
                  onTap={handleTap}
                  onClear={handleClear}
                />
              </Suspense>
            </Canvas>
          </div>

          <div className={`sd-floor3d__panel${activeCopy ? ' is-visible' : ''}`} aria-live="polite">
            {activeCopy && (
              <>
                <p className="sd-floor3d__panel-title">{activeCopy.title}</p>
                <p className="sd-floor3d__panel-copy">{activeCopy.copy}</p>
              </>
            )}
          </div>
        </div>
      </SdReveal>
    </section>
  );
}
