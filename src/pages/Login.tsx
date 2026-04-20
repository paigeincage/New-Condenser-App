import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../stores/auth';
import { api } from '../api/client';
import { saveProfile } from '../hooks/useProfile';

interface LoginResponse {
  token: string;
  user: { id: string; email: string; name: string };
}

export function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      setAuth(res.token, res.user);
      const [firstName, ...rest] = res.user.name.split(' ');
      await saveProfile({
        firstName: firstName || '',
        lastName: rest.join(' '),
        email: res.user.email,
        signOff: firstName || '',
      });
      nav(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="app-card w-full max-w-sm">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-[var(--text)] mb-1">
          Welcome back
        </h1>
        <p className="text-xs text-[var(--text-3)] mb-6">Log in to The Condenser</p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2.5 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--accent)] focus:outline-none transition-colors text-sm"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2.5 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--accent)] focus:outline-none transition-colors text-sm"
          />
          {error && <p className="text-xs text-[var(--red)]">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="app-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {busy ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <p className="text-xs text-[var(--text-3)] text-center mt-5">
          No account?{' '}
          <Link to="/signup" className="text-[var(--accent)] font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
