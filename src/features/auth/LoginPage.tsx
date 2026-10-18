import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from './api';
import { useAuthStore } from './store';
import { errorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const mode = useAuthStore((s) => s.mode);
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const pair = await authApi.login(email, password);
      setSession(pair.access_token, pair.refresh_token, pair.user);
      nav(loc.state?.from || '/', { replace: true });
    } catch (ex) {
      setErr(errorMessage(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <h1>Giriş</h1>
        {mode === 'oidc' ? (
          <p className="hint">
            Bu kurulumda giriş kurumsal kimlik sağlayıcı üzerinden yapılır. Lütfen oradan oturum açın.
          </p>
        ) : (
          <>
            <label className="field">
              <span>E-posta</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="field">
              <span>Parola</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {err && <div className="err-text">{err}</div>}
            <Button variant="primary" type="submit" disabled={busy}>
              {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
            </Button>
          </>
        )}
        {mode === 'unknown' && <div className="err-text">Sunucuya ulaşılamıyor.</div>}
      </form>
    </div>
  );
}
