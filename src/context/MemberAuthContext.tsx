import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getMemberToken,
  memberLoadMe,
  setMemberToken,
  type MemberEventItem,
  type MemberProfile,
} from '../lib/memberAuth';

type MemberAuthState = {
  loading: boolean;
  account: MemberProfile | null;
  events: MemberEventItem[];
  refresh: () => Promise<void>;
  signInWithToken: (token: string, account: MemberProfile) => void;
  signOut: () => void;
};

const Ctx = createContext<MemberAuthState | null>(null);

export function MemberAuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<MemberProfile | null>(null);
  const [events, setEvents] = useState<MemberEventItem[]>([]);

  const refresh = useCallback(async () => {
    const token = getMemberToken();
    if (!token) {
      setAccount(null);
      setEvents([]);
      setLoading(false);
      return;
    }
    const me = await memberLoadMe();
    if ('error' in me) {
      setMemberToken(null);
      setAccount(null);
      setEvents([]);
    } else {
      setAccount(me.account);
      setEvents(me.events);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signInWithToken = useCallback((token: string, next: MemberProfile) => {
    setMemberToken(token);
    setAccount(next);
  }, []);

  const signOut = useCallback(() => {
    setMemberToken(null);
    setAccount(null);
    setEvents([]);
  }, []);

  const value = useMemo(
    () => ({ loading, account, events, refresh, signInWithToken, signOut }),
    [loading, account, events, refresh, signInWithToken, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMemberAuth(): MemberAuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMemberAuth fuera de MemberAuthProvider');
  return ctx;
}
