/**
 * Nombres de las salas dentro del render.
 *
 * Las bloqueadas lo llevan arriba del volumen macizo —es lo único que las identifica,
 * porque no se puede ver adentro— y las abiertas lo llevan apoyado en el piso. Se generan
 * como texturas de canvas para no sumar una librería de tipografía 3D al chunk.
 *
 * El texto va en gris neutro a propósito: la identidad por color se sacó del 3D y vive en
 * la referencia HTML al costado del canvas.
 *
 * Las etiquetas quedan **quietas**, clavadas al piso. Se probó orientarlas hacia la cámara
 * y el efecto de que el título girara al mover la vista molestaba; en cambio se acota
 * cuánto se puede girar el modelo (`Controles`) para que nunca se lean espejadas.
 */
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { SALAS, bloqueDeSala, rectDeSala, type Sala } from '../../../data/startupDayFloor';

function crearTextura(texto: string, color: string): { tex: THREE.CanvasTexture; aspecto: number } | null {
  const base = 120;
  const pad = 26;
  const fuente = 'bold ' + base + 'px Syne, system-ui, sans-serif';

  const medidor = document.createElement('canvas').getContext('2d');
  if (!medidor) return null;
  medidor.font = fuente;
  const ancho = Math.ceil(medidor.measureText(texto).width) + pad * 2;
  const alto = Math.ceil(base * 1.4);

  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  const x = c.getContext('2d');
  if (!x) return null;
  x.font = fuente;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = color;
  x.fillText(texto, ancho / 2, alto / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return { tex, aspecto: ancho / alto };
}

function Etiqueta({ sala }: { sala: Sala }) {
  const bloqueada = sala.acceso === 'bloqueada';
  /* Gris sobre el bloque blanco; crema sobre el piso de madera oscura. */
  const color = bloqueada ? 'rgba(58,54,66,0.68)' : 'rgba(248,241,230,0.72)';
  const et = useMemo(() => crearTextura(sala.label, color), [sala.label, color]);
  useEffect(() => () => et?.tex.dispose(), [et]);
  if (!et) return null;

  const { cx, cz, w, d } = rectDeSala(sala);
  /* Sobre el bloque macizo, o apoyada en el piso si la sala es abierta. */
  const y = bloqueada ? bloqueDeSala(sala).alto + 0.02 : 0.03;

  /* Entra en la sala, con tope absoluto para que los nombres largos no salgan enormes. */
  const ALTO_MAX_M = 1.15;
  let ph = Math.min(ALTO_MAX_M, d * 0.32, (w * 0.7) / et.aspecto);
  let pw = ph * et.aspecto;
  if (pw > w * 0.78) {
    pw = w * 0.78;
    ph = pw / et.aspecto;
  }

  return (
    <mesh position={[cx, y, cz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <planeGeometry args={[pw, ph]} />
      <meshBasicMaterial map={et.tex} transparent depthWrite={false} />
    </mesh>
  );
}

export function Etiquetas() {
  return (
    <group>
      {SALAS.map((s) => (
        <Etiqueta key={s.id} sala={s} />
      ))}
    </group>
  );
}
