interface Props {
  type: 'p' | 'g' | 'o' | 'n';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const COLORS = {
  p: { background: 'var(--purple-soft)', color: 'var(--purple)' },
  g: { background: 'var(--green-bg)', color: 'var(--green)' },
  o: { background: 'var(--orange-bg)', color: 'var(--orange)' },
  n: { background: 'var(--warm)', color: 'var(--ink-soft)' },
};

export default function Tag({ type, children, style }: Props) {
  return (
    <span
      style={{
        padding: '3px 10px', borderRadius: 100,
        fontSize: 11, fontWeight: 600,
        ...COLORS[type],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
