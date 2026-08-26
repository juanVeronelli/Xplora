import type { ReactNode } from 'react';
import { useSiteMedia } from '../../context/SiteMediaContext';
import { DEFAULT_LOGO_URL } from '../../lib/defaultsMedia';

type Props = {
  title: string;
  copy: string;
  action?: ReactNode;
};

/** Empty state con brújula Xplora en monocromo. */
export function MemberEmptyState({ title, copy, action }: Props) {
  const { logoUrl } = useSiteMedia();
  const logo = logoUrl || DEFAULT_LOGO_URL;

  return (
    <div className="ma-empty-state">
      <div className="ma-empty-state__illu" aria-hidden>
        <span className="ma-empty-state__ring" />
        <img
          className="ma-empty-state__logo"
          src={logo}
          alt=""
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_URL;
          }}
        />
      </div>
      <h2 className="ma-empty-state__title">{title}</h2>
      <p className="ma-empty-state__copy">{copy}</p>
      {action}
    </div>
  );
}
