/**
 * App shell: enrutado por **estado** (`Page`) + `history.pushState` (sin React Router).
 * Público: XploraSite (shell SD) en el host principal; StartupDay en el subdominio.
 * Panel CRM: entrar solo por la URL configurada (`VITE_PANEL_PATH`).
 */
import { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import type { Page } from './types';
import { useAuth } from './hooks/useAuth';
import { StaffPermissionsProvider } from './context/StaffPermissionsContext';
import { authFetch, readApiError } from './lib/serverApi';
import { getPanelPath, normalizePath, pageToPath, pathToPage } from './lib/routes';
import { isStartupDayHost } from './lib/startupDayHost';
import LoginModal from './components/LoginModal';

const Admin = lazy(() => import('./pages/Admin'));
const StartupDay = lazy(() => import('./pages/StartupDay'));
const XploraSite = lazy(() => import('./pages/XploraSite'));
const Sponsors = lazy(() => import('./pages/Sponsors'));

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
  const startupDay = isStartupDayHost();

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

  // Rutas públicas: home + sponsors; el resto → home
  useEffect(() => {
    if (startupDay) return;
    if (page === 'admin' || page === 'home' || page === 'sponsors') return;
    const path = normalizePath(window.location.pathname);
    if (path !== '/' && path !== '/sponsors' && path !== getPanelPath()) {
      window.history.replaceState({}, '', '/');
      setPage('home');
    }
  }, [page, startupDay]);

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

  if (startupDay) {
    return (
      <Suspense fallback={null}>
        <StartupDay />
      </Suspense>
    );
  }

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

  return (
    <Suspense fallback={null}>
      {page === 'sponsors' ? <Sponsors /> : <XploraSite />}
    </Suspense>
  );
}
