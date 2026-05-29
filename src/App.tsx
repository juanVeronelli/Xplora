/**
 * App shell: enrutado por **estado** (`Page`) + `history.pushState` (sin React Router).
 * Carga perezosa de páginas. El panel CRM: entrar solo por la URL configurada (`VITE_PANEL_PATH`);
 * sin sesión se muestra login; sin botón público en el sitio.
 */
import { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import type { Page } from './types';
import type { Evento, Charla } from './types';
import { useAuth } from './hooks/useAuth';
import { StaffPermissionsProvider } from './context/StaffPermissionsContext';
import { authFetch, readApiError } from './lib/serverApi';
import { getPanelPath, normalizePath, pageToPath, pathToPage } from './lib/routes';
import Nav from './components/Nav';
import LoginModal from './components/LoginModal';

const Home = lazy(() => import('./pages/Home'));
const Eventos = lazy(() => import('./pages/Eventos'));
const EventoDetail = lazy(() => import('./pages/EventoDetail'));
const CharlaDetail = lazy(() => import('./pages/CharlaDetail'));
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
  const goTo = useCallback((p: Page) => {
    setPage(p);
    const nextPath = pageToPath(p);
    if (normalizePath(window.location.pathname) !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPop = () => {
      setPage(pathToPage(window.location.pathname));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openEvento = (e: Evento) => {
    setSelectedEvento(e);
    goTo('evento-detail');
  };
  const openCharla = (c: Charla) => {
    setSelectedCharla(c);
    goTo('charla-detail');
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
    goTo('admin');
    return { error: null };
  };

  const exitPanelLogin = useCallback(() => {
    setPage('home');
    if (normalizePath(window.location.pathname) === getPanelPath()) {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    goTo('home');
  };

  if (loading) return null;

  if (page === 'admin') {
    if (!user) {
      return (
        <LoginModal
          onLogin={handleLogin}
          onClose={exitPanelLogin}
        />
      );
    }
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
    'evento-detail',
    'charla-detail',
  ];
  const showNav = publicPages.includes(page);

  return (
    <>
      {showNav && <Nav current={page} goTo={goTo} />}
      <div style={{ paddingTop: showNav ? 64 : 0 }}>
        <Suspense fallback={null}>
          {page === 'home' && (
            <Home goTo={goTo} openEvento={openEvento} />
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
        </Suspense>
      </div>
    </>
  );
}
