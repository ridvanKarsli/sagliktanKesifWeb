import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';
import { useCan } from '@/features/auth/useSession';
import { Button } from '@/shared/ui';
import { useAddDisease } from '@/features/catalog/AddDiseaseDialog';

export function TopBar() {
  const { user, mode, clear } = useAuthStore();
  const canAnalyst = useCan('analyst');
  const canAdmin = useCan('admin');
  const nav = useNavigate();
  const { open } = useAddDisease();
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brand-mark" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.5 3.5l10 10a4.95 4.95 0 0 1-7 7l-10-10a4.95 4.95 0 0 1 7-7z" />
            <path d="M8.5 8.5l7 7" />
          </svg>
        </span>
        <span className="brand-text">
          <span className="brand-name">Sağlıktan Keşif</span>
          <span className="brand-sub">Literatürden ilaç hipotezleri</span>
        </span>
      </Link>
      <nav className="topnav">
        {(user || mode === 'disabled') && canAnalyst && (
          <Button variant="secondary" onClick={open}>
            Hastalık ekle
          </Button>
        )}
        {canAdmin && mode !== 'disabled' && (
          <Link className="menu-btn" to="/users">
            Kullanıcılar
          </Link>
        )}
        {user && mode !== 'disabled' && (
          <>
            <span className="user">
              <b>{user.display_name}</b> · {user.role}
            </span>
            <button
              type="button"
              className="menu-btn"
              onClick={() => {
                clear();
                nav('/login');
              }}
            >
              Çıkış
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
