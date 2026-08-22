/**
 * Volúmenes del piso: muros de las salas abiertas con sus aberturas, bloques macizos de
 * las salas bloqueadas, ventanales, columnas y las puertas de los ascensores.
 *
 * Los tramos y los dinteles los calcula `tramosDeMuro` en el módulo de datos; acá solo se
 * dibujan. Van instanciados porque son más de cien y como mallas sueltas cada uno sería
 * un draw call.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  ALTURA_M,
  SALAS,
  SALAS_BLOQUEADAS,
  bloqueDeSala,
  columnas,
  puertasDeAscensor,
  puertasDeBloque,
  todosLosMuros,
  ventanalesDe,
  type Tramo,
} from '../../../data/startupDayFloor';
import { METAL, PUERTA_MARCADA, YESO } from './materiales';

function Cajas({
  tramos,
  material,
}: {
  tramos: Tramo[];
  material: { color: string; roughness: number; metalness: number };
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const malla = ref.current;
    if (!malla) return;
    const m = new THREE.Matrix4();
    tramos.forEach((t, i) => {
      m.compose(
        new THREE.Vector3(t.cx, t.y + t.alto / 2, t.cz),
        new THREE.Quaternion(),
        new THREE.Vector3(t.w, t.alto, t.d),
      );
      malla.setMatrixAt(i, m);
    });
    malla.instanceMatrix.needsUpdate = true;
    malla.computeBoundingSphere();
  }, [tramos]);

  if (tramos.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[undefined as never, undefined as never, tramos.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial {...material} />
    </instancedMesh>
  );
}

/** Ventanales: pocos, van sueltos porque necesitan material transparente. */
function Ventanales() {
  const panos = useMemo(() => SALAS.flatMap(ventanalesDe), []);
  return (
    <group>
      {panos.map((v, i) => (
        <mesh key={i} position={[v.cx, v.y + v.alto / 2, v.cz]}>
          <boxGeometry args={[v.w, v.alto, v.d]} />
          <meshPhysicalMaterial
            color="#cfe3ef"
            roughness={0.08}
            metalness={0}
            transmission={0.85}
            thickness={0.05}
            transparent
            opacity={0.42}
          />
        </mesh>
      ))}
    </group>
  );
}

function Columnas() {
  const cols = useMemo(() => columnas(), []);
  return (
    <group>
      {cols.map((c, i) => (
        <mesh key={i} position={[c.x, ALTURA_M / 2, c.z]} castShadow receiveShadow>
          <cylinderGeometry args={[c.r, c.r, ALTURA_M, 28]} />
          <meshStandardMaterial {...YESO} />
        </mesh>
      ))}
    </group>
  );
}

export function Volumenes() {
  const muros = useMemo(() => todosLosMuros(), []);
  const bloques = useMemo(() => SALAS_BLOQUEADAS.map(bloqueDeSala), []);
  const ascensores = useMemo(() => puertasDeAscensor(), []);
  /* Los baños son macizos: la puerta va marcada sobre la cara, no abierta. */
  const puertasBloque = useMemo(() => SALAS.flatMap(puertasDeBloque), []);

  return (
    <group>
      <Cajas tramos={muros} material={YESO} />
      <Cajas tramos={bloques} material={YESO} />
      <Cajas tramos={ascensores} material={METAL} />
      <Cajas tramos={puertasBloque} material={PUERTA_MARCADA} />
      <Ventanales />
      <Columnas />
    </group>
  );
}
