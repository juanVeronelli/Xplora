/**
 * Permisos CRM cargados desde GET /api/auth/me después del login Supabase.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { authFetch } from '../lib/serverApi';
import type { CrmPermissionKey } from '../lib/crmPermissions';

export interface StaffMeResponse {
  email: string;
  permissions: CrmPermissionKey[];
  nombre: string;
  apellido: string;
  equipo: string;
}

interface Ctx {
  loading: boolean;
  permissions: CrmPermissionKey[];
  email: string | null;
  nombre: string;
  apellido: string;
  equipo: string;
  refresh: () => Promise<void>;
}

const StaffPermissionsContext = createContext<Ctx | null>(null);

export function StaffPermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<StaffMeResponse | null>(null);
  /** Evita pantalla "Cargando permisos" al refrescar token / cambiar ref de `user` con el mismo id (volver a la pestaña). */
  const loadedMeForUserId = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setMe(null);
      setLoading(false);
      loadedMeForUserId.current = null;
      return;
    }
    const firstLoadForUser = loadedMeForUserId.current !== userId;
    if (firstLoadForUser) {
      setLoading(true);
    }
    const res = await authFetch('/api/auth/me');
    if (!res.ok) {
      setMe(null);
      loadedMeForUserId.current = null;
      setLoading(false);
      return;
    }
    const j = (await res.json()) as StaffMeResponse;
    setMe(j);
    loadedMeForUserId.current = userId;
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<Ctx>(
    () => ({
      loading,
      permissions: me?.permissions ?? [],
      email: me?.email ?? null,
      nombre: me?.nombre ?? '',
      apellido: me?.apellido ?? '',
      equipo: me?.equipo ?? '',
      refresh: load,
    }),
    [loading, me, load],
  );

  return <StaffPermissionsContext.Provider value={value}>{children}</StaffPermissionsContext.Provider>;
}

export function useStaffPermissions(): Ctx {
  const ctx = useContext(StaffPermissionsContext);
  if (!ctx) {
    throw new Error('useStaffPermissions debe usarse dentro de StaffPermissionsProvider');
  }
  return ctx;
}
