/**
 * App shell: enrutado por **estado** (`Page`) + `history.pushState` (sin React Router).
 * Carga perezosa de páginas. El **admin** solo accesible con sesión Supabase; si no hay usuario redirige a home.
 */
import { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import type { Page } from './types';
import type { Evento, Charla, Empleo } from './types';
import { useAuth } from './hooks/useAuth';
import { StaffPermissionsProvider } from './context/StaffPermissionsContext';
import { authFetch, readApiError } from './lib/serverApi';
import { normalizePath, pageToPath, pathToPage, PANEL_PATH } from './lib/routes';
import Nav from './components/Nav';
import LoginModal from './components/LoginModal';

const Home = lazy(() => import('./pages/Home'));
const Eventos = lazy(() => import('./pages/Eventos'));
const EventoDetail = lazy(() => import('./pages/EventoDetail'));
const CharlaDetail = lazy(() => import('./pages/CharlaDetail'));
const Bolsa = lazy(() => import('./pages/Bolsa'));
const EmpleoDetail = lazy(() => import('./pages/EmpleoDetail'));
const SomosXplora = lazy(() => import('./pages/SomosXplora'));
const Sponsors = lazy(() => import('./pages/Sponsors'));
const Admin = lazy(() => import('./pages/Admin'));

function AdminLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Instrument Sans', sans-serif",
        color: 'var(--ink-muted)',
        background: 'linear-gradient(165deg, #F3EEE6 0%, #FAF8F5 45%, #F7F2EC 100%)',
      }}
    >
      Cargando panel…
    </div>
  );
}

export default function App() {
  const { user, loading, signIn, signOut } = useAuth();
  const [page, setPage] = useState<Page>(() => pathToPage(window.location.pathname));
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedCharla, setSelectedCharla] = useState<Charla | null>(null);
  const [selectedEmpleo, setSelectedEmpleo] = useState<Empleo | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const goTo = useCallback((p: Page) => {
    setPage(p);
    const nextPath = pageToPath(p);
    if (normalizePath(window.location.pathname) !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (page === 'admin' && !user) {
      setPage('home');
      if (normalizePath(window.location.pathname) === PANEL_PATH) {
        window.history.replaceState({}, '', '/');
      }
    }
  }, [page, user, loading]);

  useEffect(() => {
    const onPop = () => {
      const fromPath = pathToPage(window.location.pathname);
      if (fromPath === 'admin' && !user) {
        setPage('home');
        window.history.replaceState({}, '', '/');
        return;
      }
      setPage(fromPath);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [user]);

  const openEvento = (e: Evento) => {
    setSelectedEvento(e);
    goTo('evento-detail');
  };
  const openCharla = (c: Charla) => {
    setSelectedCharla(c);
    goTo('charla-detail');
  };
  const openEmpleo = (e: Empleo) => {
    setSelectedEmpleo(e);
    goTo('empleo-detail');
  };

  const handleLogin = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.error) return result;
    const me = await authFetch('/api/auth/me');
    if (!me.ok) {
      await signOut();
      const msg = await readApiError(me);
      return {
        error: {
          message: msg,
          name: 'AuthApiError',
          status: me.status,
        } as import('@supabase/supabase-js').AuthError,
      };
    }
    setLoginOpen(false);
    goTo('admin');
    return { error: null };
  };

  const handleSignOut = async () => {
    await signOut();
    goTo('home');
  };

  if (loading) return null;

  if (page === 'admin') {
    if (!user) return null;
    return (
      <Suspense fallback={<AdminLoading />}>
        <StaffPermissionsProvider>
          <Admin signOut={handleSignOut} goToSite={() => goTo('home')} />
        </StaffPermissionsProvider>
      </Suspense>
    );
  }

  const publicPages: Page[] = [
    'home',
    'somos',
    'sponsors',
    'eventos',
    'bolsa',
    'evento-detail',
    'charla-detail',
    'empleo-detail',
  ];
  const showNav = publicPages.includes(page);

  return (
    <>
      {loginOpen && <LoginModal onLogin={handleLogin} onClose={() => setLoginOpen(false)} />}
      {showNav && <Nav current={page} goTo={goTo} />}
      <div style={{ paddingTop: showNav ? 64 : 0 }}>
        <Suspense fallback={null}>
          {page === 'home' && (
            <Home
              goTo={goTo}
              openEvento={openEvento}
              onAdminLogin={() => (user ? goTo('admin') : setLoginOpen(true))}
            />
          )}
          {page === 'somos' && <SomosXplora />}
          {page === 'sponsors' && <Sponsors />}
          {page === 'eventos' && <Eventos openEvento={openEvento} openCharla={openCharla} />}
          {page === 'evento-detail' && selectedEvento && (
            <EventoDetail evento={selectedEvento} goBack={() => goTo('eventos')} />
          )}
          {page === 'charla-detail' && selectedCharla && (
            <CharlaDetail charla={selectedCharla} goBack={() => goTo('eventos')} />
          )}
          {page === 'bolsa' && <Bolsa openEmpleo={openEmpleo} />}
          {page === 'empleo-detail' && selectedEmpleo && (
            <EmpleoDetail empleo={selectedEmpleo} goBack={() => goTo('bolsa')} />
          )}
        </Suspense>
      </div>
    </>
  );
}
