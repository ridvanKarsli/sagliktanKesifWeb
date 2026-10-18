import { api } from '@/shared/api/client';
import type { Role, User } from '@/entities';

export const usersApi = {
  list: () => api.get<User[]>('/users'),
  create: (body: { email: string; password: string; display_name: string; role: Role }) =>
    api.post<User>('/users', body),
  update: (id: string, body: Partial<{ role: Role; is_active: boolean; display_name: string; password: string }>) =>
    api.patch<User>(`/users/${id}`, body),
};
