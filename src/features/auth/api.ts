import { api } from '@/shared/api/client';
import type { TokenPair, User } from '@/entities';

export interface Health {
  ok: boolean;
  version: string;
  db: boolean;
  queue: boolean;
  env: string;
  auth_mode: 'local' | 'oidc' | 'disabled';
}

export const authApi = {
  health: () => api.get<Health>('/health'),
  login: (email: string, password: string) => api.post<TokenPair>('/auth/login', { email, password }),
  me: () => api.get<User>('/auth/me'),
  changePassword: (current_password: string, new_password: string) =>
    api.post<{ ok: boolean }>('/auth/password', { current_password, new_password }),
};
