import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './api';
import { useUser } from '@/features/auth/useSession';
import { Button, useToast } from '@/shared/ui';
import { errorMessage } from '@/shared/api/errors';
import { fmtDateTime } from '@/shared/lib/format';
import type { Role } from '@/entities';

const ROLES: { value: Role; label: string }[] = [
  { value: 'viewer', label: 'İzleyici (yalnızca okuma)' },
  { value: 'analyst', label: 'Analist (analiz başlatır, hastalık ekler)' },
  { value: 'admin', label: 'Yönetici' },
];

export function UsersPage() {
  const qc = useQueryClient();
  const me = useUser();
  const { toast } = useToast();
  const users = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const [form, setForm] = useState({ email: '', password: '', display_name: '', role: 'viewer' as Role });
  const refresh = () => qc.invalidateQueries({ queryKey: ['users'] });
  const create = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => {
      toast('Kullanıcı açıldı');
      setForm({ email: '', password: '', display_name: '', role: 'viewer' });
      refresh();
    },
    onError: (e) => toast(errorMessage(e), { bad: true }),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(id, body),
    onSuccess: refresh,
    onError: (e) => toast(errorMessage(e), { bad: true }),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };
  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Kullanıcılar</h1>
          <p className="lead">
            Roller: izleyici yalnızca okur; analist hastalık ekler ve analiz başlatır; yönetici kullanıcıları yönetir ve
            veriyi kalıcı siler.
          </p>
        </div>
      </div>
      <div className="settings">
        <form className="card" onSubmit={submit}>
          <h2>Yeni kullanıcı</h2>
          <div className="fields">
            <label className="field">
              <span>E-posta</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Görünen ad</span>
              <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </label>
            <label className="field">
              <span>Parola (en az 10 karakter)</span>
              <input
                type="password"
                required
                minLength={10}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
            </label>
            <label className="field">
              <span>Rol</span>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Button variant="primary" type="submit" disabled={create.isPending}>
            Kullanıcı aç
          </Button>
        </form>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2>Mevcut kullanıcılar</h2>
          <div className="tablecard" style={{ boxShadow: 'none', marginTop: 10 }}>
            <table className="gtable users-table">
              <thead>
                <tr>
                  <th>E-posta</th>
                  <th>Ad</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th>Son giriş</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.data?.map((u) => {
                  const self = u.id === me?.id;
                  return (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>{u.display_name}</td>
                      <td>
                        <select
                          value={u.role}
                          disabled={self}
                          onChange={(e) => update.mutate({ id: u.id, body: { role: e.target.value as Role } })}
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{u.is_active ? 'aktif' : 'pasif'}</td>
                      <td>{fmtDateTime(u.last_login_at)}</td>
                      <td>
                        {!self && (
                          <Button
                            variant="icon"
                            onClick={() => update.mutate({ id: u.id, body: { is_active: !u.is_active } })}
                          >
                            {u.is_active ? 'Pasife al' : 'Etkinleştir'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
