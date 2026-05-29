type Variant = 'eventos' | 'charlas';

const ICONS: Record<Variant, React.ReactNode> = {
  eventos: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="14" width="48" height="42" rx="6" stroke="#C8B0FF" strokeWidth="2.5" fill="none"/>
      <path d="M8 26h48" stroke="#C8B0FF" strokeWidth="2.5"/>
      <rect x="20" y="8" width="4" height="12" rx="2" fill="#C8B0FF"/>
      <rect x="40" y="8" width="4" height="12" rx="2" fill="#C8B0FF"/>
      <circle cx="32" cy="42" r="6" stroke="#A08BFF" strokeWidth="2" fill="none"/>
      <path d="M29 42l2 2 4-4" stroke="#A08BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  charlas: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="32" height="28" rx="6" stroke="#C8B0FF" strokeWidth="2.5" fill="none"/>
      <path d="M10 30l-4 8 8-4" stroke="#C8B0FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="46" cy="44" r="10" stroke="#A08BFF" strokeWidth="2" fill="none"/>
      <path d="M46 40v5" stroke="#A08BFF" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="46" cy="47.5" r="1" fill="#A08BFF"/>
    </svg>
  ),
};

const COPY: Record<Variant, { title: string; sub: string }> = {
  eventos: {
    title: 'No hay eventos próximos',
    sub: 'El equipo de Xplora está preparando el próximo evento. Volvé pronto.',
  },
  charlas: {
    title: 'Todavía no hay contenido publicado en Pasados',
    sub: 'Las grabaciones y materiales van a aparecer acá cuando carguen el equipo.',
  },
};

export default function EmptyState({ variant }: { variant: Variant }) {
  return (
    <div style={s.wrap}>
      <div style={s.iconWrap}>{ICONS[variant]}</div>
      <h3 style={s.title}>{COPY[variant].title}</h3>
      <p style={s.sub}>{COPY[variant].sub}</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
  },
  iconWrap: {
    width: 100, height: 100, borderRadius: '50%',
    background: 'var(--purple-soft)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22, fontWeight: 700, color: 'var(--ink)',
    letterSpacing: '-0.5px', marginBottom: 10,
  },
  sub: {
    fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.75,
    maxWidth: 360,
  },
};
