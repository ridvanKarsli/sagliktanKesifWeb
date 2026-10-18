import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './store';
import { canRole, type Role } from '@/entities';

export function RequireAuth({ role }: { role?: Role }) {
  const { mode, user, ready } = useAuthStore();
  const loc = useLocation();
  if (!ready) return <div className="skeleton">Yükleniyor…</div>;
  if (mode !== 'disabled' && !user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (role && mode !== 'disabled' && !canRole(user, role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
