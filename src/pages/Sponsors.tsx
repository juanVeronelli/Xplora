import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useToast } from "../context/FeedbackContext";
import { publicFetch, readApiError } from "../lib/serverApi";
import { fetchCharlas } from "../lib/db";
import type { Charla } from "../types";
import Footer from "../components/Footer";
import { marketingHeroWrap } from "../lib/pageBackgrounds";

const INTERESES = [
  { id: "sponsor_eventos", label: "Quiero auspiciar eventos (logo / presencia)" },
  { id: "ambos", label: "Ambos" },
] as const;

type InteresId = (typeof INTERESES)[number]["id"];

export default function Sponsors() {
  const isMobile = useIsMobile();
  const toast = useToast();

  const [empresa, setEmpresa] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [interes, setInteres] = useState<InteresId | "">("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [charlas, setCharlas] = useState<Charla[]>([]);

  const stats = useMemo(
    () => [
      { k: "Asistentes", v: "120+ por evento" },
      { k: "Frecuencia", v: "semanal" },
      { k: "Talento", v: "UCEMA top" },
    ],
    [],
  );

  const deliverables = useMemo(
    () => [
      { t: "Logo en piezas", d: "Aparecé en flyers, pantallas y assets de difusión del evento." },
      { t: "Presencia en el evento", d: "Mención + espacio para activación (según el formato)." },
      { t: "Employer branding", d: "Conectá tu marca con perfiles de alto potencial dentro de UCEMA." },
      { t: "Contenido", d: "Clips y fotos para usar en redes (según disponibilidad del evento)." },
    ],
    [],
  );

  useEffect(() => {
    fetchCharlas().then((rows) => setCharlas(rows));
  }, []);

  const featured = useMemo(() => {
    const wanted = [
      "beltran",
      "briones",
      "rastellino",
      "martin rastellino",
      "mujeres lider",
      "mujeres líderes",
      "panel de mujeres",
    ];
    const pick = (c: Charla) => {
      const hay = `${c.title} ${c.speakerName}`.toLowerCase();
      return wanted.some((w) => hay.includes(w));
    };
    const hits = charlas.filter(pick);
    const fallback = charlas.slice(0, 3);
    return (hits.length ? hits : fallback).slice(0, 3);
  }, [charlas]);

  const canSubmit =
    empresa.trim().length > 1 &&
    nombreContacto.trim().length > 2 &&
    email.trim().includes("@") &&
    Boolean(interes) &&
    !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    const res = await publicFetch("/api/public/sponsors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresa: empresa.trim(),
        nombre_contacto: nombreContacto.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        interes,
        mensaje: mensaje.trim(),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    setSent(true);
    toast.success("¡Listo! Te contactamos a la brevedad.");
  };

  return (
    <main style={{ padding: 0 }}>
      <section style={s.heroWrap}>
        <div style={{ ...s.container, padding: isMobile ? "92px 24px 40px" : "120px 80px 64px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: isMobile ? 18 : 22,
              alignItems: "start",
            }}
          >
            <div>
              <div style={s.badge}>Sponsors · Empresas · Marcas</div>
              <h1 style={{ ...s.h1, fontSize: isMobile ? 36 : 56, marginTop: 12 }}>
                Publicitá tu marca donde nace el próximo talento emprendedor.
              </h1>
              <p style={{ ...s.p, fontSize: isMobile ? 14 : 16, marginTop: 10 }}>
                Xplora es el club de emprendedores de UCEMA. Hacemos eventos semanales con estudiantes de alto potencial
                y speakers top. Sponsorizar es visibilidad real + employer branding.
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <a href="#form" style={s.primaryCta}>
                  Agendar reunión →
                </a>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                {stats.map((x) => (
                  <div key={x.k} style={s.statPill}>
                    <div style={s.statK}>{x.k}</div>
                    <div style={s.statV}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...s.container, padding: isMobile ? "22px 24px 0" : "26px 80px 0" }}>
        <div style={s.sectionHead}>
          <h2 style={s.h2}>Qué obtiene un sponsor</h2>
          <p style={s.p}>Un paquete pensado para que tu marca se vea y genere pipeline real.</p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
            gap: 14,
            marginTop: 16,
          }}
        >
          {deliverables.map((d) => (
            <article key={d.t} style={s.featureCard}>
              <div style={s.featureTitle}>{d.t}</div>
              <div style={s.featureDesc}>{d.d}</div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ ...s.container, padding: isMobile ? "26px 24px 0" : "34px 80px 0" }}>
        <div style={s.sectionHead}>
          <h2 style={s.h2}>Charlas destacadas</h2>
          <p style={s.p}>
            Esto es lo que sponsorizás al unirte a Xplora UCEMA: eventos con nuestros mejores speakers.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 16,
            marginTop: 16,
          }}
        >
          {featured.map((ch) => (
            <article key={ch.id} style={s.talkCard}>
              <div style={s.talkThumb}>
                {ch.thumbnailUrl ? <img src={ch.thumbnailUrl} alt="" style={s.talkThumbImg} /> : null}
                <div style={s.talkOverlay} aria-hidden />
                <div style={s.talkTitle}>{ch.title}</div>
              </div>
              <div style={s.talkBody}>
                <div style={s.talkSpeaker}>{ch.speakerName}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="form" style={{ ...s.container, padding: isMobile ? "34px 24px 64px" : "52px 80px 92px" }}>
        <div style={s.ctaBox}>
          <div>
            <h2 style={{ ...s.h2, marginTop: 0 }}>Agendá una reunión</h2>
            <p style={{ ...s.p, marginBottom: 0 }}>
              Dejanos tus datos y te escribimos. Si ya querés coordinar, también podés usar el link de agenda.
            </p>
            <div style={{ marginTop: 10 }}>
              <a
                href="#form"
                style={s.linkBtn}
              >
                Agendar reunión →
              </a>
            </div>
          </div>

          {sent ? (
            <div style={s.success}>
              <div style={s.successTitle}>Formulario enviado</div>
              <div style={s.successText}>Gracias. Nos ponemos en contacto a la brevedad.</div>
            </div>
          ) : (
            <form onSubmit={submit} style={s.form} noValidate>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={s.label}>Empresa / Marca</label>
                  <input style={s.input} value={empresa} onChange={(e) => setEmpresa(e.target.value)} required />
                </div>
                <div>
                  <label style={s.label}>Nombre y apellido</label>
                  <input
                    style={s.input}
                    value={nombreContacto}
                    onChange={(e) => setNombreContacto(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div>
                  <label style={s.label}>Email</label>
                  <input
                    style={s.input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={s.label}>Teléfono (opcional)</label>
                  <input style={s.input} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={s.label}>Interés</label>
                <select
                  style={s.select}
                  value={interes}
                  onChange={(e) => setInteres(e.target.value as InteresId | "")}
                  required
                >
                  <option value="" disabled>
                    Elegí una opción
                  </option>
                  {INTERESES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={s.label}>Mensaje (opcional)</label>
                <textarea style={s.textarea} value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={4} />
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  ...s.btn,
                  opacity: !canSubmit ? 0.6 : 1,
                  cursor: !canSubmit ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Enviando…" : "Enviar y coordinar →"}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer minimal />
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  heroWrap: { ...marketingHeroWrap },
  container: { maxWidth: 1120, margin: "0 auto" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.65)",
    border: "1px solid rgba(26,16,40,0.10)",
    color: "var(--ink)",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  kicker: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "var(--purple)",
    marginBottom: 10,
  },
  h1: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    letterSpacing: "-1.2px",
    marginBottom: 10,
    color: "var(--ink)",
  },
  h2: {
    fontFamily: "'Fraunces', serif",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.6px",
    margin: "0 0 10px",
    color: "var(--ink)",
  },
  p: {
    color: "var(--ink-muted)",
    lineHeight: 1.8,
    maxWidth: 820,
  },
  primaryCta: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 14,
    background: "var(--ink)",
    color: "white",
    textDecoration: "none",
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14,
    fontWeight: 900,
  },
  secondaryCta: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.7)",
    color: "var(--ink)",
    textDecoration: "none",
    border: "1.5px solid var(--border-warm)",
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14,
    fontWeight: 800,
  },
  statPill: {
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.75)",
    border: "1px solid rgba(26,16,40,0.10)",
    minWidth: 150,
  },
  statK: { fontSize: 11, fontWeight: 900, color: "var(--ink-muted)", letterSpacing: "0.12em", textTransform: "uppercase" },
  statV: { marginTop: 4, fontSize: 16, fontWeight: 950 as any, color: "var(--ink)", letterSpacing: "-0.3px" },
  sectionHead: { display: "flex", flexDirection: "column", gap: 6 },
  featureCard: {
    borderRadius: 16,
    border: "1px solid rgba(26,16,40,0.10)",
    background: "white",
    padding: 16,
    boxShadow: "0 12px 40px rgba(26,16,40,0.05)",
  },
  featureTitle: { fontSize: 14, fontWeight: 900, color: "var(--ink)", letterSpacing: "-0.2px" },
  featureDesc: { marginTop: 8, fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.65 },
  talkCard: {
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(26,16,40,0.1)",
    background: "white",
    boxShadow: "0 10px 36px rgba(26,16,40,0.06)",
  },
  talkThumb: {
    position: "relative",
    height: 140,
    background: "linear-gradient(135deg, #1A1028, #2D1B50)",
  },
  talkThumbImg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  talkOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(26,16,40,0.15) 0%, rgba(26,16,40,0.75) 100%)",
  },
  talkTitle: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    color: "white",
    fontFamily: "'Fraunces', serif",
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1.25,
    letterSpacing: "-0.2px",
  },
  talkBody: { padding: 14 },
  talkSpeaker: { fontSize: 13, color: "var(--ink)", fontWeight: 900, letterSpacing: "-0.1px" },
  ctaBox: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    borderRadius: 18,
    border: "1px solid rgba(26,16,40,0.1)",
    background:
      "linear-gradient(135deg, rgba(96,62,249,0.08) 0%, rgba(255,255,255,0.82) 55%, rgba(168,255,120,0.05) 100%)",
    padding: 20,
  },
  linkBtn: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: 14,
    background: "var(--ink)",
    color: "white",
    textDecoration: "none",
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 13,
    fontWeight: 800,
  },
  form: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1.5px solid var(--border-warm)",
    background: "white",
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1.5px solid var(--border-warm)",
    background: "white",
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical" as const,
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1.5px solid var(--border-warm)",
    background: "white",
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  btn: {
    marginTop: 14,
    padding: "12px 16px",
    borderRadius: 14,
    border: "none",
    background: "var(--ink)",
    color: "white",
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 14,
    fontWeight: 800,
    transition: "all .2s",
  },
  success: {
    borderRadius: 16,
    border: "1px solid rgba(45,106,79,0.18)",
    background: "rgba(45,106,79,0.06)",
    padding: 16,
  },
  successTitle: { fontWeight: 800, color: "var(--ink)", marginBottom: 4 },
  successText: { color: "var(--ink-muted)", fontSize: 13, lineHeight: 1.6 },
};

