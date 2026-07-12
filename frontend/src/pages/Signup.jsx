import { useState } from 'react';
import http from '../api/http.js';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await http.post('/auth/signup', { name, email, password });
      localStorage.setItem('token', response.data.data.token);
      window.location.href = '/';
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-[#121212] p-8 shadow-xl">
      <h1 className="mb-6 text-3xl font-semibold text-white">Create Account</h1>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm text-white/70">
          Name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-white outline-none focus:border-emerald-400/50"
            required
          />
        </label>

        <label className="block text-sm text-white/70">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-white outline-none focus:border-emerald-400/50"
            required
          />
        </label>

        <label className="block text-sm text-white/70">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-white outline-none focus:border-emerald-400/50"
            required
            minLength={8}
          />
        </label>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}