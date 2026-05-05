import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useToast } from "../context/FeedbackContext";
import { publicFetch, readApiError } from "../lib/serverApi";
import { fetchCharlas } from "../lib/db";
import type { Charla } from "../types";
import { useSiteMedia } from "../context/SiteMediaContext";
import Footer from "../components/Footer";

type TeamId = "makers" | "planners" | "media";

const TEAM_OPTIONS: { id: TeamId; label: string; oneLiner: string }[] = [
  { id: "makers", label: "Makers", oneLiner: "Producto + datos + automatización para que Xplora escale." },
  { id: "planners", label: "Planners", oneLiner: "Eventos con excelencia operativa: agenda, invitados, logística." },
  { id: "media", label: "Media", oneLiner: "Contenido que cuenta lo que pasa: videos, diseño, redes, comunidad." },
];

export default function SomosXplora() {
  const isMobile = useIsMobile();
  const toast = useToast();
  const { carousel, highlightVideoUrl } = useSiteMedia();

  const mediaVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [mediaPlayingIndex, setMediaPlayingIndex] = useState(0);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [carrera, setCarrera] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [asistio, setAsistio] = useState<"" | "Sí" | "No">("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [equipo, setEquipo] = useState<TeamId | "">("");
  const [motivacion, setMotivacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [charlas, setCharlas] = useState<Charla[]>([]);

  useEffect(() => {
    fetchCharlas().then((rows) => setCharlas(rows));
  }, []);

  const teamPhotoUrl = useMemo(() => {
    const hit = carousel.find((s) => (s.label || "").toLowerCase().includes("equipo"));
    return hit?.url || "";
  }, [carousel]);

  const featuredTalks = useMemo(() => {
    const wanted = ["beltran", "briones", "cristina", "lorenzo", "rastellino", "mujeres lider", "mujeres líderes"];
    const score = (c: Charla) => {
      const hay = `${c.title} ${c.speakerName}`.toLowerCase();
      let pts = 0;
      for (const w of wanted) if (hay.includes(w)) pts += 1;
      return pts;
    };
    const sorted = [...charlas].sort((a, b) => score(b) - score(a));
    const picked = sorted.filter((c) => score(c) > 0).slice(0, 6);
    return (picked.length ? picked : charlas.slice(0, 6)).slice(0, 6);
  }, [charlas]);

  const mediaVideos = useMemo(() => {
    // URLs de reels / videos verticales (ideal: mp4 o embed URL). Si faltan, cae al highlight video.
    const v1 = (import.meta.env.VITE_MEDIA_VIDEO_1 as string | undefined) || "";
    const v2 = (import.meta.env.VITE_MEDIA_VIDEO_2 as string | undefined) || "";
    const v3 = (import.meta.env.VITE_MEDIA_VIDEO_3 as string | undefined) || "";
    const fallback = highlightVideoUrl || "";
    const arr = [v1, v2, v3].filter(Boolean);
    if (arr.length >= 3) return arr.slice(0, 3);
    const out = [...arr];
    while (out.length < 3) out.push(fallback);
    return out;
  }, [highlightVideoUrl]);

  const visibleMediaVideos = useMemo(
    () => (isMobile ? mediaVideos.slice(0, 1) : mediaVideos.slice(0, 3)),
    [isMobile, mediaVideos],
  );

  // Autoplay secuencial (desktop): 1 → 2 → 3 → 1 ...
  // Nota: en móviles el autoplay puede requerir muted + playsInline; si falla, queda manual.
  useEffect(() => {
    if (isMobile) {
      const v = mediaVideoRefs.current[0];
      if (v) {
        v.muted = true;
        v.playsInline = true;
        // best-effort
        void v.play().catch(() => {});
      }
      return;
    }

    const videos = mediaVideoRefs.current.slice(0, 3).filter(Boolean) as HTMLVideoElement[];
    if (videos.length === 0) return;

    const playIndex = (idx: number) => {
      setMediaPlayingIndex(idx);
      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        v.muted = true;
        v.playsInline = true;
        if (i !== idx) {
          try {
            v.pause();
            v.currentTime = 0;
          } catch {
            /* ignore */
          }
        }
      }
      const v = videos[idx];
      void v.play().catch(() => {});
    };

    const handlers = videos.map((v, i) => {
      const onEnded = () => playIndex((i + 1) % videos.length);
      v.addEventListener("ended", onEnded);
      return { v, onEnded };
    });

    playIndex(0);

    return () => {
      for (const h of handlers) h.v.removeEventListener("ended", h.onEnded);
    };
  }, [isMobile, visibleMediaVideos.length]);

  const canSubmit =
    nombre.trim().length > 1 &&
    apellido.trim().length > 1 &&
    carrera.trim().length > 1 &&
    email.trim().includes("@") &&
    telefono.trim().length > 5 &&
    (asistio === "Sí" || asistio === "No") &&
    linkedinUrl.trim().length > 0 &&
    linkedinUrl.trim().toLowerCase().startsWith("http") &&
    Boolean(cvFile) &&
    Boolean(equipo) &&
    motivacion.trim().length > 10;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    const fd = new FormData();
    fd.set("nombre", nombre.trim());
    fd.set("apellido", apellido.trim());
    fd.set("carrera", carrera.trim());
    fd.set("email", email.trim());
    fd.set("telefono", telefono.trim());
    fd.set("asistio_evento", asistio);
    fd.set("linkedin_url", linkedinUrl.trim());
    fd.set("equipo_interes", equipo);
    fd.set("motivacion", motivacion.trim());
    if (cvFile) fd.set("cv", cvFile);

    const res = await publicFetch("/api/public/candidatos", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      const msg = await readApiError(res);
      toast.error(msg);
      return;
    }
    setSent(true);
    toast.success("¡Listo! Recibimos tu solicitud.");
  };

  return (
    <main style={{ padding: 0 }}>
      <section style={s.heroWrap}>
        {teamPhotoUrl ? <div style={{ ...s.heroBg, backgroundImage: `url(${teamPhotoUrl})` }} aria-hidden /> : null}
        <div style={{ ...s.container, padding: isMobile ? "92px 24px 44px" : "120px 80px 66px" }}>
          <div style={s.badge}>Comunidad · Eventos · Producto</div>
          <h1 style={{ ...s.h1, fontSize: isMobile ? 38 : 58, marginTop: 12 }}>Somos Xplora</h1>
          <p style={{ ...s.p, fontSize: isMobile ? 14 : 16, marginTop: 10 }}>
            Xplora es el club de emprendimiento de UCEMA. Creamos un ecosistema para aprender haciendo: eventos, charlas
            y networking con gente que construye en serio.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <a href="#sumate" style={s.primaryCta}>
              Quiero sumarme →
            </a>
            <a href="#equipos" style={s.secondaryCta}>
              Ver equipos
            </a>
          </div>
        </div>
      </section>

      <section style={{ ...s.container, padding: isMobile ? "22px 24px 0" : "30px 80px 0" }}>
        <div style={s.sectionHead}>
          <h2 style={s.h2}>Qué hacemos</h2>
          <p style={s.p}>
            Organizamos eventos semanales, conectamos estudiantes con líderes del ecosistema y construimos producto para
            crecer con datos.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14, marginTop: 16 }}>
          <article style={s.featureCard}>
            <div style={s.featureTitle}>Comunidad</div>
            <div style={s.featureDesc}>Una red que se mueve todo el año: voluntarios, speakers, sponsors y alumnos.</div>
          </article>
          <article style={s.featureCard}>
            <div style={s.featureTitle}>Eventos</div>
            <div style={s.featureDesc}>Charlas, workshops y panels con foco práctico y conexión real.</div>
          </article>
          <article style={s.featureCard}>
            <div style={s.featureTitle}>Ejecución</div>
            <div style={s.featureDesc}>Trabajamos por equipos con ownership claro para que el club se mueva siempre.</div>
          </article>
        </div>
      </section>

      <section style={{ ...s.container, padding: isMobile ? "26px 24px 0" : "34px 80px 0" }}>
        <div style={s.sectionHead}>
          <h2 style={s.h2}>Esto es lo que vivís en Xplora</h2>
          <p style={s.p}>
            Si querés ser parte de esta comunidad y estar involucrado en eventos con líderes como Beltrán Briones,
            Cristina Lorenzo y muchos más, este es tu lugar.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginTop: 16 }}>
          {featuredTalks.slice(0, 6).map((ch) => (
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

      <section id="equipos" style={{ ...s.container, padding: isMobile ? "30px 24px 0" : "46px 80px 0" }}>
        <div style={s.sectionHead}>
          <h2 style={s.h2}>Equipos</h2>
          <p style={s.p}>Tres equipos, un mismo objetivo: que el club se mueva todas las semanas.</p>
        </div>

        <div style={s.teamSection}>
          <div style={s.teamHead}>
            <div style={s.teamTag}>Makers</div>
            <h3 style={s.h3}>¿Sos de construir?</h3>
            <p style={s.p}>
              ¿Perfil analítico, razonamiento basado en datos, fullstack, IA o bases de datos? En Makers creamos y
              automatizamos: herramientas, datos y mejoras al sitio para que Xplora escale.
            </p>
            <ul style={s.bullets}>
              <li style={s.bullet}>Fullstack (React / Node), bases de datos y automatizaciones</li>
              <li style={s.bullet}>IA aplicada (asistentes, clasificación, tooling)</li>
              <li style={s.bullet}>Analytics y métricas para decidir mejor</li>
            </ul>
          </div>
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <article style={s.teamCardRich}>
              <div style={s.teamCardKicker}>Qué vas a hacer</div>
              <div style={s.teamCardTitle}>Construir producto</div>
              <div style={s.teamCardDesc}>
                Features reales para el club: onboarding, data quality, automatizaciones, mejoras UX y tooling interno.
              </div>
            </article>
            <article style={s.teamCardRich}>
              <div style={s.teamCardKicker}>Skills</div>
              <div style={s.teamCardTitle}>Data + Fullstack</div>
              <div style={s.teamCardDesc}>React · Node · SQL · Supabase · IA aplicada · dashboards.</div>
            </article>
            <article style={s.teamCardRich}>
              <div style={s.teamCardKicker}>Impacto</div>
              <div style={s.teamCardTitle}>Escala</div>
              <div style={s.teamCardDesc}>Todo lo que creás se usa en operaciones y eventos de verdad.</div>
            </article>
          </div>
        </div>

        <div style={s.teamSection}>
          <div style={s.teamHead}>
            <div style={s.teamTag}>Planners</div>
            <h3 style={s.h3}>¿Te encanta organizar y ejecutar?</h3>
            <p style={s.p}>
              Planners es el corazón operativo. Si te entusiasma coordinar invitados, logística y experiencia del evento,
              acá vas a aprender haciendo.
            </p>
            <ul style={s.bullets}>
              <li style={s.bullet}>Agenda, invitados y coordinación</li>
              <li style={s.bullet}>Logística, timing y experiencia</li>
              <li style={s.bullet}>Producción el día del evento</li>
            </ul>
          </div>
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <article style={s.teamCardRich}>
              <div style={s.teamCardKicker}>Qué vas a hacer</div>
              <div style={s.teamCardTitle}>Producir eventos</div>
              <div style={s.teamCardDesc}>Invitados, agenda, logística, guión, coordinación y ejecución.</div>
            </article>
            <article style={s.teamCardRich}>
              <div style={s.teamCardKicker}>Skills</div>
              <div style={s.teamCardTitle}>Operación + criterio</div>
              <div style={s.teamCardDesc}>Gestión, comunicación, detalle, experiencia del asistente.</div>
            </article>
            <article style={s.teamCardRich}>
              <div style={s.teamCardKicker}>Resultado</div>
              <div style={s.teamCardTitle}>Nivel premium</div>
              <div style={s.teamCardDesc}>Eventos que se sienten “pro” en cada punto de contacto.</div>
            </article>
          </div>
        </div>

        <div style={s.teamSection}>
          <div style={s.teamHead}>
            <div style={s.teamTag}>Media</div>
            <h3 style={s.h3}>¿Te ves en el área de marketing?</h3>
            <p style={s.p}>
              Si te dan ganas de crear contenido, diseñar, editar y hacer crecer comunidad, Media es tu lugar. Queremos
              videos verticales, clips y piezas que se vean de primer nivel.
            </p>
            <div style={{ marginTop: 14 }}>
              <div style={s.miniKicker}>¿Tenés ganas de crear videos como estos?</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                  marginTop: 10,
                  width: "100%",
                }}
              >
                {visibleMediaVideos.map((src, idx) => (
                  <div key={`${src}-${idx}`} style={s.reelShell}>
                    <video
                      ref={(el) => {
                        mediaVideoRefs.current[idx] = el;
                      }}
                      style={s.reelVideo}
                      src={src}
                      muted
                      playsInline
                      controls
                      preload="auto"
                      onLoadedData={(e) => {
                        // Mostrar primer frame en los que están pausados (evita "pantalla negra").
                        const v = e.currentTarget;
                        if (!isMobile && idx === mediaPlayingIndex) return;
                        try {
                          if (v.currentTime === 0) v.currentTime = 0.01;
                          v.pause();
                        } catch {
                          /* ignore */
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <article style={s.teamCardRich}>
              <div style={s.teamCardKicker}>Qué vas a hacer</div>
              <div style={s.teamCardTitle}>Contenido + marca</div>
              <div style={s.teamCardDesc}>Reels, clips, diseño, cobertura y comunidad. Todo con estándar alto.</div>
            </article>
            <article style={s.teamCardRich}>
              <div style={s.teamCardKicker}>Skills</div>
              <div style={s.teamCardTitle}>Edición + creatividad</div>
              <div style={s.teamCardDesc}>CapCut/Premiere, guión, diseño, storytelling, métricas.</div>
            </article>
            <article style={s.teamCardRich}>
              <div style={s.teamCardKicker}>Resultado</div>
              <div style={s.teamCardTitle}>Crecimiento</div>
              <div style={s.teamCardDesc}>Contenido que atrae gente a eventos y fortalece la comunidad.</div>
            </article>
          </div>
        </div>
      </section>

      <section id="sumate" style={{ ...s.container, padding: isMobile ? "36px 24px 64px" : "56px 80px 96px" }}>
        <div style={s.ctaBox}>
          <div>
            <h2 style={{ ...s.h2, marginTop: 0 }}>¿Querés ser parte?</h2>
            <p style={{ ...s.p, marginBottom: 0 }}>
              Completá este formulario y nos llega tu solicitud. Te vamos a contactar para contarte próximos pasos.
            </p>
          </div>

          {sent ? (
            <div style={s.success}>
              <div style={s.successTitle}>Solicitud enviada</div>
              <div style={s.successText}>Gracias por sumarte. Te escribimos pronto.</div>
            </div>
          ) : (
            <form onSubmit={submit} style={s.form} noValidate>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={s.label}>Nombre</label>
                  <input style={s.input} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </div>
                <div>
                  <label style={s.label}>Apellido</label>
                  <input style={s.input} value={apellido} onChange={(e) => setApellido(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div>
                  <label style={s.label}>Carrera</label>
                  <input style={s.input} value={carrera} onChange={(e) => setCarrera(e.target.value)} required />
                </div>
                <div>
                  <label style={s.label}>Número de teléfono</label>
                  <input style={s.input} value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={s.label}>Email</label>
                <input
                  style={s.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div>
                  <label style={s.label}>¿Ya asististe a algún evento de Xplora?</label>
                  <select style={s.select} value={asistio} onChange={(e) => setAsistio(e.target.value as "" | "Sí" | "No")} required>
                    <option value="" disabled>
                      Elegí una opción
                    </option>
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label style={s.label}>Link de LinkedIn</label>
                  <input
                    style={s.input}
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/..."
                    required
                  />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={s.label}>CV (PDF o Word)</label>
                <input
                  style={s.input}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                  required
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={s.label}>Equipo de interés</label>
                <select style={s.select} value={equipo} onChange={(e) => setEquipo(e.target.value as TeamId | "")} required>
                  <option value="" disabled>
                    Elegí una opción
                  </option>
                  {TEAM_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={s.label}>¿Por qué querés unirte a Xplora?</label>
                <textarea
                  style={s.textarea}
                  value={motivacion}
                  onChange={(e) => setMotivacion(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmit || loading}
                style={{
                  ...s.btn,
                  opacity: !canSubmit || loading ? 0.6 : 1,
                  cursor: !canSubmit || loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Enviando…" : "Enviar solicitud →"}
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
  heroWrap: {
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(1200px 520px at 15% 10%, rgba(96,62,249,0.26) 0%, rgba(96,62,249,0) 58%), radial-gradient(900px 520px at 82% 0%, rgba(168,255,120,0.16) 0%, rgba(168,255,120,0) 60%), linear-gradient(165deg, #F3EEE6 0%, #FAF8F5 55%, #F7F2EC 100%)",
    borderBottom: "1px solid rgba(26,16,40,0.10)",
  },
  heroBg: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "grayscale(30%)",
    opacity: 0.14,
    transform: "scale(1.04)",
  },
  container: { maxWidth: 1120, margin: "0 auto", position: "relative" },
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
  teamSection: {
    marginTop: 18,
    borderRadius: 18,
    border: "1px solid rgba(26,16,40,0.10)",
    background: "rgba(255,255,255,0.72)",
    boxShadow: "0 18px 60px rgba(26,16,40,0.06)",
    padding: 18,
  },
  teamHead: { width: "100%" },
  teamTag: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(96,62,249,0.12)",
    color: "var(--purple)",
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 10,
  },
  h3: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: "-0.5px",
    margin: "0 0 8px",
    color: "var(--ink)",
  },
  bullets: { margin: "12px 0 0", paddingLeft: 18, color: "var(--ink-muted)", lineHeight: 1.9, fontSize: 13 },
  bullet: { marginBottom: 6 },
  teamCardGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  teamCardRich: {
    borderRadius: 18,
    border: "1px solid rgba(26,16,40,0.10)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.82) 100%)",
    padding: 16,
    boxShadow: "0 14px 44px rgba(26,16,40,0.06)",
  },
  teamCardKicker: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
  },
  teamCardTitle: { marginTop: 8, fontSize: 15, fontWeight: 950 as any, color: "var(--ink)", letterSpacing: "-0.2px" },
  teamCardDesc: { marginTop: 8, fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.65 },
  miniKicker: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--ink-muted)",
  },
  reelShell: {
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(26,16,40,0.10)",
    background: "linear-gradient(135deg, #1A1028, #2D1B50)",
    aspectRatio: "9 / 16",
    width: "100%",
  },
  reelVideo: { width: "100%", height: "100%", objectFit: "cover" },
  card: {
    borderRadius: 16,
    border: "1px solid rgba(26,16,40,0.1)",
    background: "rgba(255,255,255,0.75)",
    padding: "16px 16px",
    boxShadow: "0 10px 36px rgba(26,16,40,0.05)",
  },
  cardTag: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(96,62,249,0.12)",
    color: "var(--purple)",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 10,
  },
  cardText: {
    margin: 0,
    color: "var(--ink-soft)",
    fontSize: 14,
    lineHeight: 1.7,
  },
  ctaBox: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    borderRadius: 18,
    border: "1px solid rgba(26,16,40,0.1)",
    background: "linear-gradient(135deg, rgba(96,62,249,0.08) 0%, rgba(255,255,255,0.82) 55%, rgba(168,255,120,0.05) 100%)",
    padding: 20,
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

