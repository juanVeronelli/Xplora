import type { MouseEvent } from 'react';
import type { Page } from '../types';
import { useSiteMedia } from '../context/SiteMediaContext';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  goTo?: (p: Page) => void;
  minimal?: boolean;
}

function DevCredit() {
  const linkHover = (on: boolean) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = on ? 'var(--ink)' : 'var(--ink-muted)';
    e.currentTarget.style.borderBottomColor = on ? 'var(--border-warm)' : 'transparent';
  };

  return (
    <p style={s.dev}>
      Desarrollado por{' '}
      <a
        href="https://www.linkedin.com/in/juanveronelli"
        target="_blank"
        rel="noopener noreferrer"
        style={s.devLink}
        onMouseEnter={linkHover(true)}
        onMouseLeave={linkHover(false)}
      >
        Juan Ignacio Veronelli
      </a>
      {' '}y{' '}
      <a
        href="https://www.linkedin.com/in/robertino-barbuto/"
        target="_blank"
        rel="noopener noreferrer"
        style={s.devLink}
        onMouseEnter={linkHover(true)}
        onMouseLeave={linkHover(false)}
      >
        Robertino Barbuto
      </a>
      .
    </p>
  );
}

export default function Footer({ goTo, minimal = false }: Props) {
  const { logoUrl } = useSiteMedia();
  const isMobile = useIsMobile();

  if (minimal) {
    return (
      <footer
        style={{
          ...s.footerMin,
          padding: isMobile ? '16px 24px' : '20px 80px',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={s.copy}>© 2025 Xplora UCEMA</span>
          <Socials />
        </div>
        <DevCredit />
      </footer>
    );
  }

  return (
    <footer style={{ ...s.footer, padding: isMobile ? '40px 24px 24px' : '52px 80px 32px' }}>
      <div style={{ ...s.grid, gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr', gap: isMobile ? 32 : 52 }}>
        <div style={{ ...s.brand, gridColumn: isMobile ? '1 / -1' : undefined }}>
          <div style={s.ftLogo}>
            <img
              src={logoUrl}
              alt="Xplora"
              style={{ width: 28, height: 28, objectFit: 'contain' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <span style={s.ftLogoText}>Xplora UCEMA</span>
          </div>
          <p style={s.brandP}>
            Club de emprendedores de la Universidad del CEMA. Hoy somos más de
            2.000 personas en la comunidad; desde 2022 acercamos el campus al
            mundo real de founders, inversores y equipos que construyen.
          </p>
        </div>

        <FooterCol title="Club" links={[
          { label: 'Inicio', onClick: () => goTo?.('home') },
          { label: 'Somos Xplora', onClick: () => goTo?.('somos') },
          { label: 'Eventos', onClick: () => goTo?.('eventos') },
          { label: 'Bolsa de empleo', onClick: () => goTo?.('bolsa') },
          { label: 'Sponsors', onClick: () => goTo?.('sponsors') },
        ]} />
        <FooterCol title="Contacto" links={[
          { label: 'hola@xploraucema.com' },
          { label: 'Instagram' },
          { label: 'LinkedIn' },
          { label: 'WhatsApp' },
        ]} />
      </div>

      <div style={s.bottom}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: isMobile ? 'flex-start' : 'flex-start' }}>
          <span style={s.copy}>© 2025 Xplora UCEMA. Todos los derechos reservados.</span>
          <DevCredit />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Socials />
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; onClick?: () => void }[] }) {
  return (
    <div>
      <h5 style={s.colTitle}>{title}</h5>
      {links.map(({ label, onClick }) => (
        <a
          key={label}
          onClick={onClick}
          style={s.colLink}
          onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--ink)')}
          onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--ink-muted)')}
        >
          {label}
        </a>
      ))}
    </div>
  );
}

function Socials() {
  const links = [
    {
      href: import.meta.env.VITE_INSTAGRAM_URL as string,
      label: 'Instagram',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
        </svg>
      ),
    },
    {
      href: import.meta.env.VITE_LINKEDIN_URL as string,
      label: 'LinkedIn',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      ),
    },
    {
      href: import.meta.env.VITE_WHATSAPP_URL as string,
      label: 'WhatsApp',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {links.map(({ href, label, icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          style={socStyle}
        >
          {icon}
        </a>
      ))}
    </div>
  );
}

const socStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  border: '1.5px solid var(--border-warm)',
  background: 'var(--white)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--ink-muted)', cursor: 'pointer',
  fontSize: 12, fontWeight: 700,
};

const s: Record<string, React.CSSProperties> = {
  footer: {
    padding: '52px 80px 32px',
    borderTop: '1px solid var(--border-warm)',
    background: 'var(--cream)',
  },
  footerMin: {
    padding: '20px 80px',
    borderTop: '1px solid var(--border-warm)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  grid: {
    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
    gap: 52, marginBottom: 40,
  },
  brand: {},
  ftLogo: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  ftLogoText: {
    fontFamily: "'Fraunces', serif",
    fontSize: 16, fontWeight: 600, color: 'var(--ink)',
  },
  brandP: { color: 'var(--ink-muted)', fontSize: 13, lineHeight: 1.75, maxWidth: 240 },
  colTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
    textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 16,
  },
  colLink: {
    display: 'block', color: 'var(--ink-muted)', textDecoration: 'none',
    fontSize: 13, padding: '3px 0', cursor: 'pointer', transition: 'color .2s',
  },
  bottom: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: 16,
    borderTop: '1px solid var(--border-warm)', paddingTop: 24,
  },
  copy: { fontSize: 12, color: 'var(--ink-faint)' },
  dev: {
    margin: 0,
    fontSize: 11,
    color: 'var(--ink-faint)',
    lineHeight: 1.5,
  },
  devLink: {
    color: 'var(--ink-muted)',
    textDecoration: 'none',
    borderBottom: '1px solid transparent',
    transition: 'color .2s, border-color .2s',
  },
};
