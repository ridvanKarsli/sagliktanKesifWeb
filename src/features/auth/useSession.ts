import { useEffect } from 'react';
import { useAuthStore } from './store';
import { authApi } from './api';
import { canRole, type Role } from '@/entities';
import { request } from '@/shared/api/client';
import type { TokenPair } from '@/entities';

/** Uygulama açılışı: kimlik kipini öğren, varsa yenileme belirteciyle oturumu geri getir. */
export function useBootstrapSession() {
  const { ready, setReady, setMode, setSession, setUser, clear, refreshToken } = useAuthStore();
  useEffect(() => {
    if (ready) return;
    let alive = true;
    (async () => {
      try {
        const h = await authApi.health();
        if (!alive) return;
        setMode(h.auth_mode);
        if (h.auth_mode === 'disabled') {
          const me = await authApi.me();
          if (alive) setUser(me);
        } else if (refreshToken) {
          try {
            const pair = await request<TokenPair>('/auth/refresh', {
              method: 'POST',
              body: { refresh_token: refreshToken },
              auth: false,
            });
            if (alive) setSession(pair.access_token, pair.refresh_token, pair.user);
          } catch {
            clear();
          }
        }
      } catch {
        setMode('unknown');
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useUser() {
  return useAuthStore((s) => s.user);
}
export function useCan(role: Role): boolean {
  const user = useAuthStore((s) => s.user);
  const mode = useAuthStore((s) => s.mode);
  return mode === 'disabled' ? true : canRole(user, role);
}
