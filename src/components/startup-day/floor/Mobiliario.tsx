/**
 * Mesas y sillas de los stands.
 *
 * Solo mesas: las sillas se sacaron a pedido. Va con `InstancedMesh` igual —son 38
 * puestos de tablero más 4 patas, casi 200 mallas— así que instanciado por tipo de pieza
 * quedan 2 draw calls en vez de 190.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MESA_M, todosLosPuestos, type Puesto } from '../../../data/startupDayFloor';
import { MELAMINA, METAL } from './materiales';

const PATA = 0.05;

type Pieza = { pos: [number, number, number]; rotY: number; escala: [number, number, number] };

/** Una instancia por pieza, ya resuelta a posición mundial. */
function armarPiezas(puestos: readonly Puesto[]) {
  const tableros: Pieza[] = [];
  const patas: Pieza[] = [];
  const espesorTablero = 0.04;

  for (const p of puestos) {
    const cos = Math.cos(p.rot);
    const sin = Math.sin(p.rot);
    /** Pasa un offset local de la mesa a coordenadas del piso. */
    const local = (dx: number, dz: number): [number, number] => [
      p.x + dx * cos - dz * sin,
      p.z + dx * sin + dz * cos,
    ];

    tableros.push({
      pos: [p.x, MESA_M.alto - espesorTablero / 2, p.z],
      rotY: p.rot,
      escala: [MESA_M.largo, espesorTablero, MESA_M.ancho],
    });

    const hx = MESA_M.largo / 2 - 0.08;
    const hz = MESA_M.ancho / 2 - 0.08;
    for (const [dx, dz] of [
      [-hx, -hz],
      [hx, -hz],
      [-hx, hz],
      [hx, hz],
    ]) {
      const [wx, wz] = local(dx, dz);
      patas.push({
        pos: [wx, (MESA_M.alto - espesorTablero) / 2, wz],
        rotY: p.rot,
        escala: [PATA, MESA_M.alto - espesorTablero, PATA],
      });
    }
  }
  return { tableros, patas };
}

function Instancias({
  piezas,
  material,
}: {
  piezas: Pieza[];
  material: { color: string; roughness: number; metalness: number };
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const malla = ref.current;
    if (!malla) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const eje = new THREE.Vector3(0, 1, 0);
    piezas.forEach((p, i) => {
      q.setFromAxisAngle(eje, p.rotY);
      m.compose(
        new THREE.Vector3(...p.pos),
        q,
        new THREE.Vector3(...p.escala),
      );
      malla.setMatrixAt(i, m);
    });
    malla.instanceMatrix.needsUpdate = true;
    malla.computeBoundingSphere();
  }, [piezas]);

  if (piezas.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[undefined as never, undefined as never, piezas.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial {...material} />
    </instancedMesh>
  );
}

export function Mobiliario() {
  const piezas = useMemo(() => armarPiezas(todosLosPuestos()), []);
  return (
    <group>
      <Instancias piezas={piezas.tableros} material={MELAMINA} />
      <Instancias piezas={piezas.patas} material={METAL} />
    </group>
  );
}
