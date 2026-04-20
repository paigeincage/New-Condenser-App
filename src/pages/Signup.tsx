import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../stores/auth';
import { api } from '../api/client';
import { saveProfile } from '../hooks/useProfile';

interface SignupResponse {
  token: string;
  user: { id: string; email: string; name: string };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Signup() {
  const nav = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issues: string[] = [];
  if (name && !name.trim()) issues.push('Name is required');
  if (email && !EMAIL_RE.test(email.trim())) issues.push('Email format looks off');
  if (password && password.length < 8) issues.push('Password must be at least 8 characters');
  const canSubmit = name.trim() && EMAIL_RE.test(email.trim()) && password.length >= 8;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      const res = await api<SignupResponse>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      setAuth(res.token, res.user);
      const [firstName, ...rest] = res.user.name.split(' ');
      await saveProfile({
        firstName: firstName || '',
        lastName: rest.join(' '),
        email: res.user.email,
        signOff: firstName || '',
      });
      nav('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="app-card w-full max-w-sm">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-[var(--text)] mb-1">
          Create account
        </h1>
        <p className="text-xs text-[var(--text-3)] mb-6">7-day free trial · No credit card</p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full px-3 py-2.5 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--accent)] focus:outline-none transition-colors text-sm"
          />
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
            placeholder="Password (8+ characters)"
            className="w-full px-3 py-2.5 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--accent)] focus:outline-none transition-colors text-sm"
          />
          {issues.length > 0 && (
            <ul className="list-disc pl-5 text-[11px] text-[var(--text-3)] space-y-0.5">
              {issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
          {error && <p className="text-xs text-[var(--red)]">{error}</p>}
          <button
            type="submit"
            disabled={busy || !canSubmit}
            className="app-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-xs text-[var(--text-3)] text-center mt-5">
          Already have one?{' '}
          <Link to="/login" className="text-[var(--accent)] font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
