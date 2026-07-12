import { useState } from 'react';
import http from '../api/http.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await http.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'If the email exists, reset instructions were sent.');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-[#121212] p-8 shadow-xl">
      <h1 className="mb-6 text-3xl font-semibold text-white">Forgot Password</h1>
      <form className="space-y-5" onSubmit={handleSubmit}>
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

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}