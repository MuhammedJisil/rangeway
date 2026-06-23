import React, { useState } from 'react';
import { KeyRound, Mail, LogIn, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess, apiBaseUrl }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-brand-darkest relative overflow-hidden">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-orange/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-orange/10 blur-[120px] pointer-events-none" />

      {/* Main card panel */}
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.jpg" 
              alt="Rangeway Logo" 
              className="h-16 md:h-20 object-contain rounded"
              onError={(e) => {
                e.target.style.display = 'none'; // Fallback text if logo fails to render
              }}
            />
          </div>
          <h1 className="text-2xl font-bold font-outfit uppercase tracking-wider text-white">
            Rangeway Auto Upgrades
          </h1>
          <p className="text-brand-textMuted text-sm mt-1">Job Card Management System</p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-textMuted uppercase tracking-wider mb-2">
              User Email / ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-brand-textMuted" size={18} />
              <input
                type="email"
                placeholder="advisor@rangeway.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-brand-input border border-brand-border text-white placeholder-brand-textMuted focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-textMuted uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 text-brand-textMuted" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-brand-input border border-brand-border text-white placeholder-brand-textMuted focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-brand-orange hover:bg-brand-orangeHover text-white font-semibold transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
