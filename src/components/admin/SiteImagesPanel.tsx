import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CarouselSlide, LogoBrand } from '../../types';
import { useSiteMedia } from '../../context/SiteMediaContext';
import { uploadImageToCloudinary, validateImageFile } from '../../lib/cloudinary';
import { saveSiteMedia } from '../../lib/siteMedia';
import { useToast, useConfirm } from '../../context/FeedbackContext';
import { crm } from './crm/crmTheme';

const tipBox: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(96,62,249,0.09) 0%, rgba(250,248,245,0.95) 55%, rgba(168,255,120,0.05) 100%)',
  border: '1px solid rgba(96,62,249,0.18)',
  borderRadius: 18,
  padding: '22px 24px',
  marginBottom: 28,
  boxShadow: '0 8px 32px rgba(26,16,40,0.05)',
};
const tipTitle: CSSProperties = {
  fontFamily: "'Fraunces', serif",
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: 12,
  letterSpacing: '-0.3px',
};
const tipOl: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  color: 'var(--ink-muted)',
  fontSize: 14,
  lineHeight: 1.65,
};
const card: CSSProperties = {
  background: 'var(--white)',
  borderRadius: 18,
  border: '1px solid rgba(26,16,40,0.07)',
  padding: 24,
  marginBottom: 20,
  boxShadow: '0 8px 32px rgba(26,16,40,0.05)',
};
const cardHead: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  marginBottom: 18,
};
const cardTitle: CSSProperties = {
  fontFamily: "'Fraunces', serif",
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: 4,
};
const cardDesc: CSSProperties = {
  fontSize: 13,
  color: 'var(--ink-muted)',
  lineHeight: 1.5,
  margin: 0,
};

const previewBox = (empty: boolean): CSSProperties => ({
  width: '100%',
  maxWidth: 420,
  height: empty ? 140 : 200,
  borderRadius: 12,
  border: `2px dashed ${empty ? 'var(--border-warm)' : 'transparent'}`,
  background: empty ? 'var(--cream)' : '#111',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  marginBottom: 14,
});

const btnPrimary: CSSProperties = { ...crm.primaryBtn, fontFamily: "'Instrument Sans', sans-serif" };
const btnGhost: CSSProperties = { ...crm.chipBtn, fontFamily: "'Instrument Sans', sans-serif" };
const miniHint: CSSProperties = {
  fontSize: 12,
  color: 'var(--ink-faint)',
  marginTop: 10,
  lineHeight: 1.45,
};

const slideRow: CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'flex-start',
  padding: 16,
  background: 'linear-gradient(135deg, var(--cream) 0%, var(--white) 100%)',
  borderRadius: 14,
  border: '1px solid var(--border-warm)',
  marginBottom: 12,
};
const thumb: CSSProperties = {
  width: 96,
  height: 64,
  objectFit: 'cover',
  borderRadius: 8,
  flexShrink: 0,
  background: '#222',
};
const logoThumb: CSSProperties = {
  ...thumb,
  objectFit: 'contain',
  padding: 6,
  background: 'var(--white)',
  border: '1px solid var(--border-warm)',
};

const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml';
const bar: CSSProperties = {
  position: 'sticky',
  bottom: 0,
  marginTop: 24,
  padding: '16px 0 8px',
  background: 'linear-gradient(to top, var(--cream) 70%, transparent)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'center',
  justifyContent: 'space-between',
};

export default function SiteImagesPanel() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const {
    heroUrl,
    logoUrl,
    highlightVideoUrl,
    carousel,
    companies: ctxCompanies,
    sponsors: ctxSponsors,
    refetch,
  } = useSiteMedia();

  const [hero, setHero] = useState(heroUrl);
  const [logo, setLogo] = useState(logoUrl);
  const [highlightVideo, setHighlightVideo] = useState(highlightVideoUrl);
  const [slides, setSlides] = useState<CarouselSlide[]>(() => carousel.map(s => ({ ...s })));
  const [companies, setCompanies] = useState<LogoBrand[]>(() => ctxCompanies.map(c => ({ ...c })));
  const [sponsors, setSponsors] = useState<LogoBrand[]>(() => ctxSponsors.map(s => ({ ...s })));

  const [busy, setBusy] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  const [brandTarget, setBrandTarget] = useState<{ kind: 'company' | 'sponsor'; index: number } | null>(null);
  const [editorTab, setEditorTab] = useState<'inicio' | 'empresas' | 'sponsors'>('inicio');

  const heroInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const brandInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHero(heroUrl);
    setLogo(logoUrl);
    setHighlightVideo(highlightVideoUrl);
    setSlides(carousel.map(s => ({ ...s })));
    setCompanies(ctxCompanies.map(c => ({ ...c })));
    setSponsors(ctxSponsors.map(s => ({ ...s })));
  }, [heroUrl, logoUrl, highlightVideoUrl, carousel, ctxCompanies, ctxSponsors]);

  const runUpload = useCallback(
    async (file: File, which: 'hero' | 'logo' | 'slide') => {
      const v = validateImageFile(file);
      if (v) {
        toast.error(v);
        return;
      }
      setBusy(which === 'slide' ? 'slide' : which);
      setMsg('');
      try {
        const url = await uploadImageToCloudinary(file);
        if (which === 'hero') setHero(url);
        if (which === 'logo') setLogo(url);
        if (which === 'slide') {
          setSlides(prev => [...prev, { id: crypto.randomUUID(), url, label: 'Nueva foto' }]);
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : 'Error al subir';
        toast.error(m);
      } finally {
        setBusy(null);
      }
    },
    [toast],
  );

  const runBrandUpload = useCallback(
    async (file: File, kind: 'company' | 'sponsor', index: number) => {
      const v = validateImageFile(file);
      if (v) {
        toast.error(v);
        return;
      }
      setBusy(`brand-${kind}-${index}`);
      setMsg('');
      try {
        const url = await uploadImageToCloudinary(file);
        if (kind === 'company') {
          setCompanies(prev => prev.map((c, i) => (i === index ? { ...c, logoUrl: url } : c)));
        } else {
          setSponsors(prev => prev.map((s, i) => (i === index ? { ...s, logoUrl: url } : s)));
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : 'Error al subir';
        toast.error(m);
      } finally {
        setBusy(null);
      }
    },
    [toast],
  );

  const openBrandUpload = (kind: 'company' | 'sponsor', index: number) => {
    setBrandTarget({ kind, index });
    brandInput.current?.click();
  };

  const moveSlide = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides(prev => {
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const removeSlide = async (index: number) => {
    const ok = await confirmDialog({
      title: 'Quitar foto del carrusel',
      message: '¿Sacar esta foto del carrusel? Podés volver a subirla después.',
      confirmLabel: 'Quitar',
      cancelLabel: 'Cancelar',
      danger: true,
    });
    if (!ok) return;
    setSlides(prev => prev.filter((_, i) => i !== index));
  };

  const updateLabel = (index: number, label: string) => {
    setSlides(prev => prev.map((s, i) => (i === index ? { ...s, label } : s)));
  };

  const moveBrand = (kind: 'company' | 'sponsor', index: number, dir: -1 | 1) => {
    const j = index + dir;
    const list = kind === 'company' ? companies : sponsors;
    if (j < 0 || j >= list.length) return;
    if (kind === 'company') {
      setCompanies(prev => {
        const next = [...prev];
        [next[index], next[j]] = [next[j], next[index]];
        return next;
      });
    } else {
      setSponsors(prev => {
        const next = [...prev];
        [next[index], next[j]] = [next[j], next[index]];
        return next;
      });
    }
  };

  const removeBrand = async (kind: 'company' | 'sponsor', index: number) => {
    const ok = await confirmDialog({
      title: 'Quitar entrada',
      message: '¿Quitar esta entrada de la lista? Podés volver a agregarla después.',
      confirmLabel: 'Quitar',
      cancelLabel: 'Cancelar',
      danger: true,
    });
    if (!ok) return;
    if (kind === 'company') setCompanies(prev => prev.filter((_, i) => i !== index));
    else setSponsors(prev => prev.filter((_, i) => i !== index));
  };

  const addBrand = (kind: 'company' | 'sponsor') => {
    const row: LogoBrand = {
      id: crypto.randomUUID(),
      name: kind === 'company' ? 'Nueva empresa' : 'Nuevo sponsor',
      logoUrl: '',
    };
    if (kind === 'company') setCompanies(prev => [...prev, row]);
    else setSponsors(prev => [...prev, row]);
  };

  const updateBrandName = (kind: 'company' | 'sponsor', index: number, name: string) => {
    if (kind === 'company') {
      setCompanies(prev => prev.map((c, i) => (i === index ? { ...c, name } : c)));
    } else {
      setSponsors(prev => prev.map((s, i) => (i === index ? { ...s, name } : s)));
    }
  };

  const save = async () => {
    const companiesClean = companies.filter(c => c.name.trim() && c.logoUrl.trim());
    const sponsorsClean = sponsors.filter(s => s.name.trim() && s.logoUrl.trim());
    const incomplete =
      companies.some(c => (c.name.trim() || c.logoUrl.trim()) && !(c.name.trim() && c.logoUrl.trim()))
      || sponsors.some(s => (s.name.trim() || s.logoUrl.trim()) && !(s.name.trim() && s.logoUrl.trim()));
    if (incomplete) {
      toast.error('Completá nombre y logo en cada fila que empezaste, o borrá la fila vacía.');
      setSaveState('err');
      return;
    }

    setSaveState('saving');
    setMsg('');
    const { error } = await saveSiteMedia({
      heroUrl: hero,
      logoUrl: logo,
      highlightVideoUrl: highlightVideo.trim(),
      carousel: slides,
      companies: companiesClean,
      sponsors: sponsorsClean,
    });
    if (error) {
      setSaveState('err');
      const m = error.message || 'No se pudo guardar. ¿Ejecutaste el SQL en Supabase?';
      setMsg(m);
      toast.error(m);
      return;
    }
    setSaveState('saved');
    toast.success('Cambios publicados en el sitio.');
    await refetch();
    setTimeout(() => setSaveState('idle'), 2500);
  };

  return (
    <div style={{ maxWidth: '100%' }}>
      <nav style={{ marginBottom: 22 }} aria-label="Partes del sitio a editar">
        <div style={{ ...crm.segmentRail, justifyContent: 'flex-start' }}>
          <div style={crm.segmentTrack}>
            {(
              [
                ['inicio', 'Inicio'],
                ['empresas', 'Empresas'],
                ['sponsors', 'Sponsors'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                style={crm.segmentBtn(editorTab === id)}
                onClick={() => setEditorTab(id)}
              >
                <span style={crm.segmentLabel}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {editorTab === 'inicio' && (
      <>
      <div style={tipBox}>
        <div style={tipTitle}>Cómo funciona (súper simple)</div>
        <ol style={tipOl}>
          <li>Elegí una foto en tu computadora con los botones de abajo.</li>
          <li>Esperá unos segundos a que suba.</li>
          <li>Tocá <strong>Guardar cambios en el sitio</strong> abajo para que todo el mundo las vea.</li>
        </ol>
      </div>

      {/* Hero */}
      <div style={card}>
        <div style={cardHead}>
          <div>
            <div style={cardTitle}>Foto grande de inicio</div>
            <p style={cardDesc}>
              Es la imagen que aparece a la derecha en la pantalla principal (en celular no se muestra, pero igual conviene tenerla linda).
            </p>
          </div>
        </div>
        <div
          style={previewBox(!hero)}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => {
            e.preventDefault();
            e.stopPropagation();
            const f = e.dataTransfer.files?.[0];
            if (f) runUpload(f, 'hero');
          }}
        >
          {hero ? (
            <img src={hero} alt="Vista previa hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: 'var(--ink-muted)', fontSize: 14, textAlign: 'center', padding: 16 }}>
              Arrastrá una foto acá o usá el botón de abajo
            </span>
          )}
        </div>
        <input
          ref={heroInput}
          type="file"
          accept={ACCEPT_IMAGES}
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) runUpload(f, 'hero');
          }}
        />
        <button
          type="button"
          style={{ ...btnPrimary, opacity: busy === 'hero' ? 0.65 : 1 }}
          disabled={busy !== null}
          onClick={() => heroInput.current?.click()}
        >
          {busy === 'hero' ? 'Subiendo…' : 'Elegir foto'}
        </button>
        <p style={miniHint}>
          <strong>Formato recomendado (Canva):</strong> 3:4 · 1200×1600 px (o 1500×2000 px).<br />
          <strong>Formatos:</strong> JPG, PNG, WEBP, GIF o SVG · hasta 12 MB
        </p>
      </div>

      {/* Logo */}
      <div style={card}>
        <div style={cardHead}>
          <div>
            <div style={cardTitle}>Logo de Xplora</div>
            <p style={cardDesc}>Aparece arriba en el menú y abajo en el pie de página. Usá PNG o WEBP con fondo transparente si podés.</p>
          </div>
        </div>
        <div
          style={{ ...previewBox(!logo), maxWidth: 160, height: 100 }}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => {
            e.preventDefault();
            e.stopPropagation();
            const f = e.dataTransfer.files?.[0];
            if (f) runUpload(f, 'logo');
          }}
        >
          {logo ? (
            <img src={logo} alt="Logo" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
          ) : (
            <span style={{ color: 'var(--ink-muted)', fontSize: 12, textAlign: 'center', padding: 8 }}>
              Arrastrá el logo acá
            </span>
          )}
        </div>
        <input
          ref={logoInput}
          type="file"
          accept={ACCEPT_IMAGES}
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) runUpload(f, 'logo');
          }}
        />
        <button
          type="button"
          style={{ ...btnPrimary, opacity: busy === 'logo' ? 0.65 : 1 }}
          disabled={busy !== null}
          onClick={() => logoInput.current?.click()}
        >
          {busy === 'logo' ? 'Subiendo…' : 'Cambiar logo'}
        </button>
        <p style={miniHint}>
          <strong>Formato recomendado (Canva):</strong> ideal SVG. Si es imagen: 800×400 px (transparente).
        </p>
      </div>

      {/* Video destacado Home */}
      <div style={card}>
        <div style={cardHead}>
          <div>
            <div style={cardTitle}>Video &quot;Charlas y momentos&quot;</div>
            <p style={cardDesc}>
              Es el clip que se reproduce en la página de inicio (sección al lado del texto sobre el archivo de charlas).
              Podés pegar un MP4 de Cloudinary, un link directo al archivo, o la URL de embed de YouTube. Dejalo vacío para
              ocultar el video y mostrar solo el mensaje de “próximamente”.
            </p>
          </div>
        </div>
        <label style={crm.label}>URL del video</label>
        <input
          className="crm-input"
          type="url"
          value={highlightVideo}
          onChange={e => setHighlightVideo(e.target.value)}
          placeholder="https://…"
          style={{ ...crm.input, marginTop: 6, width: '100%', maxWidth: 560 }}
        />
        <p style={miniHint}>
          Ejemplo MP4 Cloudinary: terminación <code style={{ fontSize: 11 }}>.mp4</code>. Si borrás la URL y guardás, no se
          mostrará video hasta que pongas otra dirección.
        </p>
      </div>

      {/* Carousel */}
      <div style={card}>
        <div style={cardHead}>
          <div>
            <div style={cardTitle}>Carrusel &quot;Momentos que nos definen&quot;</div>
            <p style={cardDesc}>
              Son las fotos que se mueven en la página de inicio. Podés sumar las que quieras, sacar las que ya no quieras mostrar, y escribir una corta leyenda debajo de cada una.
            </p>
          </div>
        </div>
        <p style={{ ...miniHint, marginTop: 0 }}>
          <strong>Formato recomendado (Canva):</strong> 3:2 · 1500×1000 px (mínimo 1200×800 px).
        </p>

        {slides.length === 0 && (
          <p style={{ ...cardDesc, marginBottom: 14 }}>Todavía no hay fotos. Agregá la primera con el botón de abajo.</p>
        )}

        {slides.map((s, i) => (
          <div key={s.id} style={slideRow}>
            <img src={s.url} alt="" style={thumb} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={crm.label}>Texto que aparece sobre la foto</label>
              <input
                className="crm-input"
                value={s.label}
                onChange={e => updateLabel(i, e.target.value)}
                style={{ ...crm.input, marginTop: 4 }}
                placeholder="Ej: Networking en el auditorio"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button type="button" style={btnGhost} disabled={i === 0} onClick={() => moveSlide(i, -1)}>
                  Subir
                </button>
                <button type="button" style={btnGhost} disabled={i === slides.length - 1} onClick={() => moveSlide(i, 1)}>
                  Bajar
                </button>
                <button type="button" style={{ ...btnGhost, color: '#C0392B', borderColor: 'rgba(192,57,43,0.25)' }} onClick={() => removeSlide(i)}>
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ))}

        <input
          ref={addInput}
          type="file"
          accept={ACCEPT_IMAGES}
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) runUpload(f, 'slide');
          }}
        />
        <button
          type="button"
          style={{ ...crm.saveBtn, marginTop: 8, fontFamily: "'Instrument Sans', sans-serif" }}
          disabled={busy !== null}
          onClick={() => addInput.current?.click()}
        >
          {busy === 'slide' ? 'Subiendo…' : '+ Agregar otra foto al carrusel'}
        </button>
      </div>
      </>
      )}

      <input
        ref={brandInput}
        type="file"
        accept={ACCEPT_IMAGES}
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f || !brandTarget) return;
          runBrandUpload(f, brandTarget.kind, brandTarget.index);
          setBrandTarget(null);
        }}
      />

      {editorTab === 'empresas' && (
      <>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 18 }}>
        Logos del carrusel horizontal bajo &quot;Empresas que participaron&quot;. <strong>Guardar cambios en el sitio</strong> (abajo)
        aplica todo junto con la pestaña Inicio y Sponsors.
      </p>
      {/* Empresas (marquee) */}
      <div style={card}>
        <div style={cardHead}>
          <div>
            <div style={cardTitle}>Empresas que participaron</div>
            <p style={cardDesc}>
              Logos del carrusel horizontal en la home. Subí SVG o PNG con fondo transparente si podés. El orden es el de izquierda a derecha.
            </p>
          </div>
        </div>
        <p style={{ ...miniHint, marginTop: 0 }}>
          <strong>Formato recomendado (Canva):</strong> ideal SVG. Si es imagen: 800×220 px (transparente).
        </p>

        {companies.map((c, i) => (
          <div key={c.id} style={slideRow}>
            {c.logoUrl ? (
              <img src={c.logoUrl} alt="" style={logoThumb} />
            ) : (
              <div style={{ ...logoThumb, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', fontSize: 11 }}>
                Sin logo
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={crm.label}>Nombre (para accesibilidad)</label>
              <input
                className="crm-input"
                value={c.name}
                onChange={e => updateBrandName('company', i, e.target.value)}
                style={{ ...crm.input, marginTop: 4 }}
                placeholder="Ej: Mercado Libre"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={btnPrimary}
                  disabled={busy !== null}
                  onClick={() => openBrandUpload('company', i)}
                >
                  {busy === `brand-company-${i}` ? 'Subiendo…' : 'Subir logo'}
                </button>
                <button type="button" style={btnGhost} disabled={i === 0} onClick={() => moveBrand('company', i, -1)}>
                  Arriba
                </button>
                <button
                  type="button"
                  style={btnGhost}
                  disabled={i === companies.length - 1}
                  onClick={() => moveBrand('company', i, 1)}
                >
                  Abajo
                </button>
                <button
                  type="button"
                  style={{ ...btnGhost, color: '#C0392B', borderColor: 'rgba(192,57,43,0.25)' }}
                  onClick={() => removeBrand('company', i)}
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          style={{ ...crm.saveBtn, marginTop: 8, fontFamily: "'Instrument Sans', sans-serif" }}
          disabled={busy !== null}
          onClick={() => addBrand('company')}
        >
          + Agregar empresa
        </button>
      </div>
      </>
      )}

      {editorTab === 'sponsors' && (
      <>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 18 }}>
        Sección <strong>Alianzas</strong> en la home. Misma acción de guardado que el resto del sitio.
      </p>
      {/* Sponsors oficiales */}
      <div style={card}>
        <div style={cardHead}>
          <div>
            <div style={cardTitle}>Sponsors oficiales</div>
            <p style={cardDesc}>La grilla de la sección &quot;Alianzas&quot; en la home. Misma lógica: nombre + logo.</p>
          </div>
        </div>
        <p style={{ ...miniHint, marginTop: 0 }}>
          <strong>Formato recomendado (Canva):</strong> ideal SVG. Si es imagen: 800×220 px (transparente).
        </p>

        {sponsors.map((sp, i) => (
          <div key={sp.id} style={slideRow}>
            {sp.logoUrl ? (
              <img src={sp.logoUrl} alt="" style={logoThumb} />
            ) : (
              <div style={{ ...logoThumb, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', fontSize: 11 }}>
                Sin logo
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={crm.label}>Nombre</label>
              <input
                className="crm-input"
                value={sp.name}
                onChange={e => updateBrandName('sponsor', i, e.target.value)}
                style={{ ...crm.input, marginTop: 4 }}
                placeholder="Ej: UCEMA"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={btnPrimary}
                  disabled={busy !== null}
                  onClick={() => openBrandUpload('sponsor', i)}
                >
                  {busy === `brand-sponsor-${i}` ? 'Subiendo…' : 'Subir logo'}
                </button>
                <button type="button" style={btnGhost} disabled={i === 0} onClick={() => moveBrand('sponsor', i, -1)}>
                  Arriba
                </button>
                <button
                  type="button"
                  style={btnGhost}
                  disabled={i === sponsors.length - 1}
                  onClick={() => moveBrand('sponsor', i, 1)}
                >
                  Abajo
                </button>
                <button
                  type="button"
                  style={{ ...btnGhost, color: '#C0392B', borderColor: 'rgba(192,57,43,0.25)' }}
                  onClick={() => removeBrand('sponsor', i)}
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          style={{ ...crm.saveBtn, marginTop: 8, fontFamily: "'Instrument Sans', sans-serif" }}
          disabled={busy !== null}
          onClick={() => addBrand('sponsor')}
        >
          + Agregar sponsor
        </button>
      </div>
      </>
      )}

      {msg && (
        <p style={{ color: '#C0392B', fontSize: 13, marginBottom: 8 }}>{msg}</p>
      )}

      <div style={bar}>
        <div style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.45 }}>
          {saveState === 'saved' && 'Listo: los visitantes ya ven los cambios.'}
          {saveState === 'err' && 'Revisá el mensaje en rojo arriba.'}
        </div>
        <button
          type="button"
          style={{ ...crm.saveBtn, padding: '14px 28px', fontSize: 14, fontFamily: "'Instrument Sans', sans-serif" }}
          disabled={saveState === 'saving'}
          onClick={save}
        >
          {saveState === 'saving' ? 'Guardando…' : 'Guardar cambios en el sitio'}
        </button>
      </div>
    </div>
  );
}
