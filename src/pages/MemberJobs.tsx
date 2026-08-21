/**
 * Bolsa de empleo — solo con cuenta de miembro.
 */
import { useEffect, useState } from 'react';
import { useMemberAuth } from '../context/MemberAuthContext';
import { memberFetch } from '../lib/memberAuth';
import '../styles/memberAccount.css';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  emoji: string;
  type: string;
  modality: string;
  description: string;
  application_link: string;
};

export default function MemberJobs() {
  const { account, loading } = useMemberAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [err, setErr] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    if (!account) return;
    setLoadingJobs(true);
    void (async () => {
      const res = await memberFetch('/api/member/jobs');
      setLoadingJobs(false);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error || 'No se pudo cargar la bolsa');
        return;
      }
      const data = (await res.json()) as { jobs: Job[] };
      setJobs(data.jobs ?? []);
    })();
  }, [account]);

  if (loading) {
    return (
      <div className="ma-page">
        <p className="ma-muted">Cargando…</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="ma-page">
        <header className="ma-top">
          <a className="ma-brand" href="/">
            Xplora
          </a>
        </header>
        <main className="ma-main">
          <section className="ma-card">
            <h1 className="ma-h1">Bolsa de empleo</h1>
            <p className="ma-lead">
              Necesitás una cuenta Xplora para ver las ofertas. Registrate o iniciá sesión con tu
              email.
            </p>
            <a className="ma-btn" href="/cuenta">
              Crear cuenta / Entrar
            </a>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="ma-page">
      <header className="ma-top">
        <a className="ma-brand" href="/">
          Xplora
        </a>
        <nav className="ma-nav">
          <a href="/cuenta">Mi cuenta</a>
          <a href="/empleo" aria-current="page">
            Bolsa
          </a>
        </nav>
      </header>
      <main className="ma-main">
        <h1 className="ma-h1">Bolsa de empleo</h1>
        <p className="ma-lead">Ofertas para la comunidad Xplora.</p>
        {loadingJobs ? <p className="ma-muted">Cargando ofertas…</p> : null}
        {err ? <p className="ma-err">{err}</p> : null}
        {!loadingJobs && jobs.length === 0 ? (
          <p className="ma-muted">Todavía no hay ofertas publicadas.</p>
        ) : null}
        <ul className="ma-jobs">
          {jobs.map((job) => (
            <li key={job.id} className="ma-job">
              <div className="ma-job__emoji" aria-hidden>
                {job.emoji || '💼'}
              </div>
              <div>
                <h2 className="ma-h2">{job.title}</h2>
                <p className="ma-muted">
                  {[job.company, job.location, job.type, job.modality].filter(Boolean).join(' · ')}
                </p>
                {job.description ? <p className="ma-job__desc">{job.description}</p> : null}
                {job.application_link ? (
                  <a
                    className="ma-btn ma-btn--ghost"
                    href={job.application_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Postularme
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
