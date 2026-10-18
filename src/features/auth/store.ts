import { create } from 'zustand';
import type { User } from '@/entities';

const REFRESH_KEY = 'sk_refresh';

export type AuthMode = 'local' | 'oidc' | 'disabled' | 'unknown';

interface AuthState {
  mode: AuthMode;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  ready: boolean;
  setMode: (m: AuthMode) => void;
  setSession: (access: string, refresh: string, user: User) => void;
  setUser: (u: User | null) => void;
  setReady: (r: boolean) => void;
  clear: () => void;
}

const readRefresh = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
};

/** Erişim belirteci yalnızca bellekte; yenileme belirteci tarayıcıda kalır (yeniden yüklemede oturum sürer). */
export const useAuthStore = create<AuthState>((set) => ({
  mode: 'unknown',
  accessToken: null,
  refreshToken: readRefresh(),
  user: null,
  ready: false,
  setMode: (mode) => set({ mode }),
  setSession: (accessToken, refreshToken, user) => {
    try {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    } catch {
      /* özel pencere */
    }
    set({ accessToken, refreshToken, user });
  },
  setUser: (user) => set({ user }),
  setReady: (ready) => set({ ready }),
  clear: () => {
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* yok say */
    }
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
