import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useMeta } from '../api.js';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const meta = useMeta();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  // basic checks before calling the server
  function validate() {
    if (mode === 'register' && form.name.trim().length < 2) return 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (mode === 'register' && !form.city) return 'Choose your city';
    if (mode === 'register' && form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) {
      return 'Enter a valid phone number';
    }
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
      navigate((location.state && location.state.from) || '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel narrow">
      <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
      <p className="muted">
        {mode === 'login' ? 'Log in to list clothes and send swap requests.' : 'Join the swap community in a minute.'}
      </p>

      <form onSubmit={handleSubmit} className="stack">
        {mode === 'register' && (
          <label>
            Full name
            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Shubham Bagwan" />
          </label>
        )}
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="At least 6 characters" />
        </label>
        {mode === 'register' && (
          <>
            <label>
              City
              <select value={form.city} onChange={(e) => update('city', e.target.value)}>
                <option value="">Choose city</option>
                {meta.cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Phone (shown only after a swap is accepted)
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Optional" />
            </label>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>

      <p className="muted center">
        {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
        <button
          type="button"
          className="link-btn dark"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'Create an account' : 'Log in'}
        </button>
      </p>
    </section>
  );
}
