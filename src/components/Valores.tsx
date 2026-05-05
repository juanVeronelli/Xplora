import { useInView } from '../hooks/useInView';
import { useIsMobile } from '../hooks/useIsMobile';

export default function Valores() {
  const { ref, inView } = useInView();
  const isMobile = useIsMobile();

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{
        ...s.section,
        padding: isMobile ? '56px 24px' : '88px 80px',
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(28px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      <div style={s.label}>Quiénes somos</div>
      <div style={s.title}>Lo que nos mueve</div>

      <div style={{ ...s.layout, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {/* Intro */}
        <div
          style={{
            ...s.intro,
            paddingRight: isMobile ? 0 : 64,
            paddingBottom: isMobile ? 32 : 0,
            borderRight: isMobile ? 'none' : '1px solid var(--border-warm)',
            borderBottom: isMobile ? '1px solid var(--border-warm)' : 'none',
          }}
        >
          <p style={s.introP}>
            En UCEMA armamos el lugar donde no tenés que explicar por qué querés
            armar algo propio: acá los demás ya lo entienden. Sumamos personas,
            mentorías informales y acceso a un ecosistema que en la teoría no entra
            en el aula.
          </p>
          <p style={{ ...s.introP, marginTop: 20 }}>
            Desde 2022 venimos metiendo charlas, talleres y eventos abiertos: lo
            importante no es el slogan, sino que cada año más gente del campus pase
            del “me gustaría” al “lo estoy probando”.
          </p>
          <span style={s.highlight}>+2.200 miembros</span>
        </div>

        {/* Values */}
        <div style={{ ...s.items, paddingLeft: isMobile ? 0 : 64, paddingTop: isMobile ? 32 : 0 }}>
          {VALORES.map((v, i) => (
            <div
              key={v.title}
              style={{
                ...s.item,
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translateY(20px)',
                transition: `opacity 0.6s ease ${i * 100 + 200}ms, transform 0.6s ease ${i * 100 + 200}ms`,
              }}
            >
              <div style={{ ...s.ico, background: v.bg }}>{v.emoji}</div>
              <div>
                <h3 style={s.valTitle}>{v.title}</h3>
                <p style={s.valP}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const VALORES = [
  {
    emoji: '🌟',
    title: 'Misión',
    desc: 'Acercar la comunidad UCEMA al mundo founder-first: que conocer fundadores, armar equipos y validar ideas sea parte normal de la carrera, no una excepción.',
    bg: 'var(--purple-soft)',
  },
  {
    emoji: '🤝',
    title: 'Valores',
    desc: 'Ejecución honesta, ayuda mutua y criterio. Preferimos introducir de verdad antes que posturear; acá el que prueba algo cuenta más que el que solo lo nombra.',
    bg: 'var(--green-bg)',
  },
  {
    emoji: '📈',
    title: 'Impacto',
    desc: 'Hoy más de 2.200 personas integran la comunidad Xplora; entre charlas, talleres y encuentros presenciales venimos moviendo miles de inscripciones y check-ins que sí podemos medir.',
    bg: 'var(--orange-bg)',
  },
];

const s: Record<string, React.CSSProperties> = {
  section: {
    background: 'var(--white)',
    padding: '88px 80px',
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'var(--purple)',
    marginBottom: 12,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(28px, 3.5vw, 46px)',
    fontWeight: 700,
    letterSpacing: '-1.5px',
    lineHeight: 1.1,
    color: 'var(--ink)',
    marginBottom: 12,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    marginTop: 56,
  },
  intro: {},
  introP: { fontSize: 15, color: 'var(--ink-muted)', lineHeight: 1.85 },
  highlight: {
    fontFamily: "'Fraunces', serif",
    fontSize: 'clamp(32px, 5vw, 40px)',
    fontWeight: 700,
    color: 'var(--purple)',
    letterSpacing: '-2px',
    marginTop: 8,
    display: 'block',
  },
  items: { display: 'flex', flexDirection: 'column', gap: 32 },
  item: { display: 'flex', gap: 20, alignItems: 'flex-start' },
  ico: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 22,
  },
  valTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 17,
    fontWeight: 700,
    marginBottom: 4,
    color: 'var(--ink)',
    letterSpacing: '-0.3px',
  },
  valP: { fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7 },
};
