/**
 * Zona de arrastre + botón para subir imágenes al **API Cloudinary** (`/api/cloudinary-upload`, requiere auth).
 * Usado en eventos, charlas y campañas de email (flyer).
 */
import { useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { uploadImageToCloudinary, validateImageFile } from '../../lib/cloudinary';
import { crm } from './crm/crmTheme';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml';

const previewBox = (empty: boolean): CSSProperties => ({
  width: '100%',
  maxWidth: 360,
  height: empty ? 120 : 160,
  borderRadius: 12,
  border: `2px dashed ${empty ? 'var(--border-warm)' : 'transparent'}`,
  background: empty ? 'var(--cream)' : '#111',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  marginBottom: 12,
});

export default function ThumbnailUpload({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = useCallback(
    async (file: File) => {
      const v = validateImageFile(file);
      if (v) {
        setErr(v);
        return;
      }
      setBusy(true);
      setErr('');
      try {
        const url = await uploadImageToCloudinary(file);
        onChange(url);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'No se pudo subir.');
      } finally {
        setBusy(false);
      }
    },
    [onChange],
  );

  const has = Boolean(value?.trim());

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={crm.label}>{label}</label>
      {hint ? <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '4px 0 10px', lineHeight: 1.45 }}>{hint}</p> : null}
      <div
        style={previewBox(!has)}
        onDragOver={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={e => {
          e.preventDefault();
          e.stopPropagation();
          const f = e.dataTransfer.files?.[0];
          if (f) run(f);
        }}
      >
        {has ? (
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Arrastrá una imagen o usá el botón</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) run(f);
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          style={{ ...crm.primaryBtn, opacity: busy ? 0.65 : 1, fontFamily: "'Instrument Sans', sans-serif" }}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Subiendo…' : has ? 'Cambiar miniatura' : 'Subir miniatura'}
        </button>
        {has ? (
          <button
            type="button"
            style={{ ...crm.chipBtn, color: '#c0392b', borderColor: 'rgba(192,57,43,0.25)', fontFamily: "'Instrument Sans', sans-serif" }}
            onClick={() => onChange('')}
          >
            Quitar imagen
          </button>
        ) : null}
      </div>
      {err ? <p style={{ color: '#c0392b', fontSize: 13, marginTop: 8 }}>{err}</p> : null}
    </div>
  );
}
