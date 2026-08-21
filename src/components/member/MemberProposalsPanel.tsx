import { useEffect, useState, type FormEvent } from 'react';
import { memberFetch } from '../../lib/memberAuth';
import { MemberEmptyState } from './MemberEmptyState';

const KINDS = [
  { id: 'event_idea', label: 'Idea de evento' },
  { id: 'topic', label: 'Tema / tópico' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'other', label: 'Otra' },
] as const;

type Kind = (typeof KINDS)[number]['id'];

type Proposal = {
  id: string;
  kind: Kind | string;
  title: string;
  body: string;
  created_at: string;
};

function kindLabel(kind: string): string {
  return KINDS.find((k) => k.id === kind)?.label || kind;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function MemberProposalsPanel() {
  const [kind, setKind] = useState<Kind>('event_idea');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [list, setList] = useState<Proposal[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const load = async () => {
    setLoadingList(true);
    const res = await memberFetch('/api/member/proposals');
    setLoadingList(false);
    if (!res.ok) {
      setList([]);
      return;
    }
    const data = (await res.json()) as { proposals: Proposal[] };
    setList(data.proposals ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setMsg('');
    const res = await memberFetch('/api/member/proposals', {
      method: 'POST',
      body: JSON.stringify({ kind, title, body }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error || 'No se pudo enviar.');
      return;
    }
    setMsg('Propuesta enviada. Gracias.');
    setTitle('');
    setBody('');
    setKind('event_idea');
    await load();
  };

  return (
    <div className="ma-panel">
      <header className="ma-panel__head">
        <p className="ma-kicker">Comunidad</p>
        <h1 className="ma-title">Propuestas</h1>
        <p className="ma-sub">
          Contanos ideas de eventos, temas que te interesan o feedback para mejorar Xplora.
        </p>
      </header>

      <form className="ma-profile-form ma-proposals-form" onSubmit={onSubmit}>
        <label>
          Tipo
          <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} required>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Título
          <input
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Workshop de fundraising"
          />
        </label>

        <label>
          Contanos la idea
          <textarea
            required
            rows={5}
            maxLength={4000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Qué te gustaría, para quién, por qué importa…"
          />
        </label>

        {err ? <p className="ma-err">{err}</p> : null}
        {msg ? <p className="ma-ok">{msg}</p> : null}

        <button className="ma-btn" type="submit" disabled={busy}>
          {busy ? 'Enviando…' : 'Enviar propuesta'}
        </button>
      </form>

      <section className="ma-proposals-list">
        <h2 className="ma-block__title">Tus envíos</h2>
        {loadingList ? <p className="ma-empty">Cargando…</p> : null}
        {!loadingList && list.length === 0 ? (
          <MemberEmptyState
            title="Todavía no enviaste nada"
            copy="Cuando mandes una propuesta, va a quedar listada acá."
          />
        ) : null}
        {!loadingList && list.length > 0 ? (
          <ul className="ma-proposals-cards">
            {list.map((p) => (
              <li key={p.id} className="ma-proposal-card">
                <div className="ma-proposal-card__top">
                  <span className="ma-badge">{kindLabel(p.kind)}</span>
                  <time dateTime={p.created_at}>{formatDate(p.created_at)}</time>
                </div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
