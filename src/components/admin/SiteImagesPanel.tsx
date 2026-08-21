/**
 * Web pública: solo hero + 4 fotos de El club (Networking / Empleo / Emprender / Referentes).
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { CarouselSlide } from '../../types';
import { useSiteMedia } from '../../context/SiteMediaContext';
import { DEFAULT_CLUB_MODES } from '../../lib/defaultsMedia';
import { uploadImageToCloudinary, validateImageFile } from '../../lib/cloudinary';
import { resolveClubModes, parseLumaEmbedInput, saveSiteMedia } from '../../lib/siteMedia';
import { useToast } from '../../context/FeedbackContext';
import { crm } from './crm/crmTheme';

export default function SiteImagesPanel() {
  const toast = useToast();
  const {
    heroUrl,
    logoUrl,
    highlightVideoUrl,
    memberLumaEmbedSrc,
    carousel,
    companies,
    sponsors,
    clubModes: ctxModes,
    refetch,
  } = useSiteMedia();

  const [hero, setHero] = useState(heroUrl);
  const [lumaEmbed, setLumaEmbed] = useState(memberLumaEmbedSrc);
  const [modes, setModes] = useState<CarouselSlide[]>(() =>
    resolveClubModes(ctxModes.length ? ctxModes : carousel),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const heroInput = useRef<HTMLInputElement>(null);
  const modeInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setHero(heroUrl);
    setLumaEmbed(memberLumaEmbedSrc);
    setModes(resolveClubModes(ctxModes.length ? ctxModes : carousel));
  }, [heroUrl, memberLumaEmbedSrc, carousel, ctxModes]);

  const uploadHero = useCallback(
    async (file: File) => {
      const v = validateImageFile(file);
      if (v) {
        toast.error(v);
        return;
      }
      setBusy('hero');
      try {
        setHero(await uploadImageToCloudinary(file));
        toast.success('Hero actualizado (guardá para publicar).');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al subir');
      } finally {
        setBusy(null);
      }
    },
    [toast],
  );

  const uploadMode = useCallback(
    async (file: File, index: number) => {
      const v = validateImageFile(file);
      if (v) {
        toast.error(v);
        return;
      }
      setBusy(`mode-${index}`);
      try {
        const url = await uploadImageToCloudinary(file);
        setModes((prev) => prev.map((m, i) => (i === index ? { ...m, url } : m)));
        toast.success('Foto actualizada (guardá para publicar).');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al subir');
      } finally {
        setBusy(null);
      }
    },
    [toast],
  );

  const save = async () => {
    setSaving(true);
    const clubModes = modes.map((m, i) => ({
      id: DEFAULT_CLUB_MODES[i]!.id,
      label: DEFAULT_CLUB_MODES[i]!.label,
      url: m.url,
    }));
    const { error } = await saveSiteMedia({
      heroUrl: hero,
      logoUrl,
      highlightVideoUrl,
      memberLumaEmbedSrc: parseLumaEmbedInput(lumaEmbed),
      carousel: clubModes,
      clubModes,
      companies,
      sponsors,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Web pública actualizada.');
    await refetch();
  };

  return (
    <>
      <div style={grid}>
        <article style={card}>
          <p style={kicker}>Hero</p>
          <h2 style={cardTitle}>Foto principal</h2>
          <p style={cardDesc}>Imagen full-bleed del inicio. Preferí horizontal, bien iluminada.</p>
          <div style={previewHero}>
            {hero ? (
              <img src={hero} alt="Hero" style={previewImg} />
            ) : (
              <span style={emptyHint}>Sin foto</span>
            )}
          </div>
          <input
            ref={heroInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void uploadHero(f);
            }}
          />
          <button
            type="button"
            className="xplora-admin-primary"
            style={crm.primaryBtn}
            disabled={busy === 'hero'}
            onClick={() => heroInput.current?.click()}
          >
            {busy === 'hero' ? 'Subiendo…' : 'Cambiar hero'}
          </button>
        </article>

        <article style={card}>
          <p style={kicker}>El club</p>
          <h2 style={cardTitle}>Cuatro puertas</h2>
          <p style={cardDesc}>Fotos de Networking, Empleo, Emprender y Referentes.</p>
          <div style={modesGrid}>
            {modes.map((m, i) => (
              <div key={m.id} style={modeCard}>
                <div style={modeThumb}>
                  {m.url ? (
                    <img src={m.url} alt={m.label} style={previewImg} />
                  ) : (
                    <span style={emptyHint}>Sin foto</span>
                  )}
                </div>
                <div style={modeMeta}>
                  <span style={modeLabel}>{m.label}</span>
                  <input
                    ref={(el) => {
                      modeInputs.current[i] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) void uploadMode(f, i);
                    }}
                  />
                  <button
                    type="button"
                    style={crm.chipBtn}
                    disabled={busy === `mode-${i}`}
                    onClick={() => modeInputs.current[i]?.click()}
                  >
                    {busy === `mode-${i}` ? 'Subiendo…' : 'Cambiar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article style={{ ...card, marginTop: 16 }}>
        <p style={kicker}>Cuenta miembros</p>
        <h2 style={cardTitle}>Anotate al próximo evento</h2>
        <p style={cardDesc}>
          Pegá la URL del embed de Luma o el HTML completo del iframe. Se muestra en el overview de
          /cuenta, debajo de los atajos. Dejá vacío para ocultar el bloque.
        </p>
        <label style={fieldLabel}>
          Embed Luma
          <textarea
            value={lumaEmbed}
            onChange={(e) => setLumaEmbed(e.target.value)}
            rows={4}
            placeholder="https://luma.com/embed/event/…/simple"
            style={textarea}
            spellCheck={false}
          />
        </label>
        {parseLumaEmbedInput(lumaEmbed) ? (
          <p style={previewUrl}>
            Se publicará: <code>{parseLumaEmbedInput(lumaEmbed)}</code>
          </p>
        ) : lumaEmbed.trim() ? (
          <p style={warnHint}>No reconocimos un embed válido de luma.com / lu.ma.</p>
        ) : (
          <p style={previewUrl}>Vacío = el bloque no se muestra en la cuenta.</p>
        )}
      </article>

      <div style={bar}>
        <p style={barHint}>
          Publicá hero, fotos del club y el embed Luma de la cuenta. El resto se gestiona en Data.
        </p>
        <button
          type="button"
          className="xplora-admin-primary"
          style={crm.primaryBtn}
          disabled={saving || Boolean(busy)}
          onClick={() => void save()}
        >
          {saving ? 'Guardando…' : 'Publicar cambios'}
        </button>
      </div>
    </>
  );
}

const grid: CSSProperties = {
  display: 'grid',
  gap: 16,
};

const card: CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '1px solid rgba(26,16,40,0.08)',
  padding: 'clamp(18px, 3vw, 24px)',
};

const kicker: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--purple)',
};

const cardTitle: CSSProperties = {
  margin: '0 0 6px',
  fontFamily: "'Syne', sans-serif",
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  color: 'var(--ink)',
};

const cardDesc: CSSProperties = {
  margin: '0 0 16px',
  fontSize: 14,
  lineHeight: 1.5,
  color: 'var(--ink-muted)',
};

const previewHero: CSSProperties = {
  width: '100%',
  maxWidth: 520,
  aspectRatio: '16 / 9',
  borderRadius: 12,
  overflow: 'hidden',
  background: '#140c22',
  marginBottom: 14,
};

const previewImg: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const emptyHint: CSSProperties = {
  color: 'rgba(250,248,245,0.45)',
  fontSize: 13,
  display: 'grid',
  placeItems: 'center',
  height: '100%',
};

const modesGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: 12,
};

const modeCard: CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(26,16,40,0.1)',
  overflow: 'hidden',
  background: 'var(--cream)',
};

const modeThumb: CSSProperties = {
  aspectRatio: '3 / 4',
  background: '#140c22',
};

const modeMeta: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '10px 12px',
};

const modeLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--ink)',
};

const bar: CSSProperties = {
  position: 'sticky',
  bottom: 0,
  marginTop: 20,
  padding: '16px 0 4px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'linear-gradient(to top, #faf8f5 65%, transparent)',
};

const barHint: CSSProperties = {
  margin: 0,
  flex: '1 1 220px',
  fontSize: 13,
  color: 'var(--ink-muted)',
  lineHeight: 1.4,
};

const fieldLabel: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
};

const textarea: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid rgba(26,16,40,0.14)',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 13,
  lineHeight: 1.45,
  color: 'var(--ink)',
  background: '#fff',
  resize: 'vertical',
};

const previewUrl: CSSProperties = {
  margin: '12px 0 0',
  fontSize: 13,
  lineHeight: 1.45,
  color: 'var(--ink-muted)',
  wordBreak: 'break-all',
};

const warnHint: CSSProperties = {
  margin: '12px 0 0',
  fontSize: 13,
  lineHeight: 1.45,
  color: '#b45309',
};
