import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSiteMediaRow, mergeSiteMedia, type ResolvedSiteMedia } from '../lib/siteMedia';

type Ctx = ResolvedSiteMedia & {
  loading: boolean;
  refetch: () => Promise<void>;
};

const SiteMediaContext = createContext<Ctx | null>(null);

export function SiteMediaProvider({ children }: { children: React.ReactNode }) {
  const [resolved, setResolved] = useState<ResolvedSiteMedia>(() => mergeSiteMedia(null));
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const row = await fetchSiteMediaRow();
    setResolved(mergeSiteMedia(row));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const value = useMemo(
    () => ({
      ...resolved,
      loading,
      refetch: load,
    }),
    [resolved, loading, load],
  );

  return <SiteMediaContext.Provider value={value}>{children}</SiteMediaContext.Provider>;
}

export function useSiteMedia(): Ctx {
  const ctx = useContext(SiteMediaContext);
  if (!ctx) throw new Error('useSiteMedia debe usarse dentro de SiteMediaProvider');
  return ctx;
}

export type { ResolvedSiteMedia };
