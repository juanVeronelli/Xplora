import type { ReactNode } from 'react';
import { useSiteMedia } from '../../context/SiteMediaContext';
import { useMemberAuth } from '../../context/MemberAuthContext';
import { DEFAULT_LOGO_URL } from '../../lib/defaultsMedia';

export type MemberNavKey = 'overview' | 'perfil' | 'empleo' | 'eventos' | 'propuestas';

type Props = {
  active: MemberNavKey;
  children: ReactNode;
};

const NAV: { key: MemberNavKey; label: string; href: string }[] = [
  { key: 'overview', label: 'Inicio', href: '/cuenta' },
  { key: 'perfil', label: 'Mi perfil', href: '/cuenta/perfil' },
  { key: 'empleo', label: 'Bolsa de empleo', href: '/empleo' },
  { key: 'eventos', label: 'Eventos', href: '/cuenta/eventos' },
  { key: 'propuestas', label: 'Propuestas', href: '/cuenta/propuestas' },
];

export function MemberShell({ active, children }: Props) {
  const { logoUrl } = useSiteMedia();
  const brandLogo = logoUrl || DEFAULT_LOGO_URL;
  const { signOut } = useMemberAuth();

  return (
    <div className="ma-app">
      <div className="ma-app__glow" aria-hidden />
      <header className="ma-app__top">
        <a className="ma-app__brand" href="/" aria-label="Xplora">
          <img
            src={brandLogo}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_URL;
            }}
          />
        </a>

        <nav className="ma-app__nav" aria-label="Cuenta">
          {NAV.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={active === item.key ? 'is-active' : undefined}
              aria-current={active === item.key ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button type="button" className="ma-app__out" onClick={signOut}>
          Salir
        </button>
      </header>

      <main className="ma-app__main">{children}</main>
    </div>
  );
}
