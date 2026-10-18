export type Role = 'admin' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  is_active: boolean;
  created_at?: string | null;
  last_login_at?: string | null;
}

export interface TokenPair {
  access_token: string;
  token_type: string;
  access_expires_at: string;
  refresh_token: string;
  refresh_expires_at: string;
  user: User;
}

export const ROLE_LEVEL: Record<Role, number> = { viewer: 1, analyst: 2, admin: 3 };
export const canRole = (user: User | null | undefined, role: Role): boolean =>
  !!user && user.is_active && ROLE_LEVEL[user.role] >= ROLE_LEVEL[role];
