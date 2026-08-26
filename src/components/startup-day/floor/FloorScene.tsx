/**
 * Escena 3D del 2º piso: maqueta abierta con materiales reales.
 *
 * Se carga como chunk aparte (`three` pesa más que toda la landing junta), así que este
 * módulo nunca se importa directo: entra por el `React.lazy` de `StartupDayFloor.tsx`.
 *
 * Decisiones de armado:
 * - Muros de altura completa y **sin cielorraso**: con la cámara en ángulo desde arriba se
 *   ve adentro de cada sala, como una maqueta abierta.
 * - **Sin colores de identidad en el 3D.** Los materiales son los del lugar real; qué se
 *   hace en cada sala lo dice la referencia HTML al costado del canvas.
 * - Las luces cálidas a la altura del cielorraso reemplazan a los paneles de las fotos,
 *   que no se pueden modelar sin tapar la vista desde arriba.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ALTURA_M,
  HUELLA_M,
  SALAS,
  SALAS_ABIERTAS,
  bloqueDeSala,
  losasDePiso,
  rectDeSala,
  type Sala,
} from '../../../data/startupDayFloor';
import { crearEntorno, crearTexturaPiso } from './materiales';
import { Mobiliario } from './Mobiliario';
import { Volumenes } from './Muros';
import { Etiquetas } from './Etiquetas';

/**
 * Piso con la textura de vinílico y la oclusión ambiental ya horneada.
 *
 * Va en losas y no en un plano único: el edificio está recortado y tiene cuatro
 * escotaduras donde estaban las salas que se sacaron, así que un rectángulo asomaría por
 * fuera de los muros. Cada losa toma su porción de la textura por UV, de modo que la veta
 * de la madera sigue siendo continua entre losas.
 */
function Piso() {
  const tex = useMemo(() => crearTexturaPiso(), []);
  useEffect(() => () => tex?.dispose(), [tex]);
  const losas = useMemo(() => losasDePiso(), []);

  return (
    <group>
      {losas.map((r, i) => {
        const u0 = (r.cx - r.w / 2 - (HUELLA_M.cx - HUELLA_M.w / 2)) / HUELLA_M.w;
        const v0 = (r.cz - r.d / 2 - (HUELLA_M.cz - HUELLA_M.d / 2)) / HUELLA_M.d;
        const du = r.w / HUELLA_M.w;
        const dv = r.d / HUELLA_M.d;
        return (
          <mesh
            key={i}
            position={[r.cx, 0, r.cz]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            onUpdate={(m) => {
              const uv = (m.geometry as THREE.PlaneGeometry).attributes.uv;
              /* La textura está en coordenadas de imagen: V va al revés que en UV. */
              const base: [number, number][] = [
                [u0, 1 - v0],
                [u0 + du, 1 - v0],
                [u0, 1 - v0 - dv],
                [u0 + du, 1 - v0 - dv],
              ];
              base.forEach(([u, v], k) => uv.setXY(k, u, v));
              uv.needsUpdate = true;
            }}
          >
            <planeGeometry args={[r.w, r.d]} />
            <meshStandardMaterial
              map={tex ?? undefined}
              color="#ffffff"
              roughness={0.62}
              metalness={0.04}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Realce de la sala señalada: el piso teñido de violeta de marca, suave.
 *
 * Va con `toneMapped={false}` para que el violeta no se apague contra el mapeo ACES de la
 * escena, y con opacidad baja para que se siga viendo la veta de la madera debajo. Cuando
 * la sala es un volumen macizo (los baños) el paño se apoya arriba del bloque.
 */
function Realce({ sala }: { sala: Sala }) {
  const { cx, cz, w, d } = rectDeSala(sala);
  const y = sala.acceso === 'bloqueada' ? bloqueDeSala(sala).alto + 0.015 : 0.025;
  return (
    <mesh position={[cx, y, cz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial
        color="#603ef9"
        transparent
        opacity={0.19}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Zonas sensibles al puntero, invisibles: dan el hover por sala sin ensuciar el render. */
function Zonas({ onActivar }: { onActivar: (id: string | null) => void }) {
  return (
    <group>
      {SALAS.map((s) => {
        const { cx, cz, w, d } = rectDeSala(s);
        return (
          <mesh
            key={s.id}
            position={[cx, 0.4, cz]}
            onPointerOver={(e) => {
              e.stopPropagation();
              onActivar(s.id);
            }}
            onPointerOut={() => onActivar(null)}
          >
            <boxGeometry args={[w, 0.8, d]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Luces cálidas de cielorraso, una por sala, más un rebote general. */
function LucesInteriores() {
  const puntos = useMemo(
    () =>
      SALAS_ABIERTAS.map((s) => {
        const { cx, cz, w, d } = rectDeSala(s);
        /* Alcance holgado: si la esfera termina en el borde de la sala, las esquinas quedan negras. */
        return { cx, cz, alcance: Math.max(w, d) * 1.9 };
      }),
    [],
  );
  return (
    <group>
      {puntos.map((p, i) => (
        <pointLight
          key={i}
          position={[p.cx, ALTURA_M - 0.15, p.cz]}
          intensity={14}
          distance={p.alcance}
          decay={1.4}
          color="#ffd9a0"
        />
      ))}
    </group>
  );
}

/**
 * OrbitControls acotado: no baja del piso, no se aleja de más y solo gira dentro de una
 * ventana angular. Se sacó la órbita automática: con el giro acotado tendría que rebotar
 * contra el tope, que se ve peor que dejar el modelo quieto.
 */
function Controles() {
  const { camera, gl } = useThree();
  const ref = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.target.set(0, 0, 0);
    c.enablePan = false;
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.minDistance = 20;
    c.maxDistance = 64;
    /* Nunca del todo cenital ni por debajo del piso. */
    c.minPolarAngle = 0.12;
    c.maxPolarAngle = Math.PI / 2 - 0.35;
    /* Ventana de giro acotada: las etiquetas están clavadas al piso y fuera de este rango
       se leerían espejadas. */
    c.minAzimuthAngle = -Math.PI * 0.3;
    c.maxAzimuthAngle = Math.PI * 0.3;
    ref.current = c;
    return () => c.dispose();
  }, [camera, gl]);

  useFrame(() => ref.current?.update());
  return null;
}

function Entorno() {
  const { scene } = useThree();
  useEffect(() => {
    const tex = crearEntorno();
    if (!tex) return;
    scene.environment = tex;
    return () => {
      scene.environment = null;
      tex.dispose();
    };
  }, [scene]);
  return null;
}

function Escena({
  activa,
  onActivar,
}: {
  activa: string | null;
  onActivar: (id: string | null) => void;
}) {
  const sala = SALAS.find((s) => s.id === activa) ?? null;
  return (
    <>
      {/* Igual que `.sd-piso__viewport` en `startupDay.css` (--sd-void): si divergen,
          aparece un marco alrededor del canvas. */}
      <color attach="background" args={['#0b0712']} />
      <Entorno />

      <ambientLight intensity={0.46} />
      <hemisphereLight args={['#fff3e0', '#3a2f48', 0.62]} />
      {/* Sol entrando por el ventanal: es la que tira las sombras largas. */}
      <directionalLight
        position={[-24, 20, 6]}
        intensity={1.6}
        color="#eaf2ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />
      {/* Relleno sin sombras del lado opuesto: levanta la mitad que queda a contraluz. */}
      <directionalLight position={[22, 16, -12]} intensity={0.55} color="#ffe9cf" />
      <LucesInteriores />

      <Piso />
      <Volumenes />
      <Mobiliario />
      <Etiquetas />
      {sala ? <Realce sala={sala} /> : null}
      <Zonas onActivar={onActivar} />

      <Controles />
    </>
  );
}

export default function FloorScene({
  activa,
  onActivar,
}: {
  activa: string | null;
  onActivar: (id: string | null) => void;
}) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      /* Bien alta: con muros de 2,7 m, un ángulo bajo tapa las salas del fondo. */
      camera={{ position: [2, 33, 21], fov: 42, near: 0.5, far: 250 }}
      onPointerMissed={() => onActivar(null)}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.9;
      }}
    >
      <Escena activa={activa} onActivar={onActivar} />
    </Canvas>
  );
}
