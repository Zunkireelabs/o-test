'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

type AuthMode = 'signin' | 'signup';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const router = useRouter();

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  // Check Supabase connection status
  useEffect(() => {
    if (!supabase) return;

    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        setDbStatus(error ? 'offline' : 'online');
      } catch {
        setDbStatus('offline');
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  // Check if user is already logged in
  useEffect(() => {
    if (!supabase) return;

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured. Please set environment variables.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'azure' | 'apple') => {
    if (!supabase) {
      setError('Supabase is not configured. Please set environment variables.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Header */}
      <div className="login-header">
        <div className="login-brand">
          <Image src="/orca-icon.png" alt="Orca" width={28} height={28} />
          <span>orca</span>
        </div>
        <div className="login-api-status">
          <div className={`status-dot ${dbStatus === 'online' ? 'green' : dbStatus === 'offline' ? 'red' : 'gray'}`} />
          <span>
            {dbStatus === 'online' && 'Connected'}
            {dbStatus === 'offline' && 'Offline'}
            {dbStatus === 'checking' && 'Checking...'}
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="login-main">
        <Image src="/orca-icon.png" alt="Orca" width={64} height={64} className="login-icon" />
        <h1 className="login-title">Sign in or sign up</h1>
        <p className="login-subtitle">Start using Orca</p>

        <div className="login-card">
          {error && (
            <div className="login-error">{error}</div>
          )}
          {message && (
            <div className="login-message">{message}</div>
          )}

          {/* OAuth Buttons */}
          <button type="button" className="oauth-btn" onClick={() => handleOAuth('google')} disabled={loading}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button type="button" className="oauth-btn" onClick={() => handleOAuth('azure')} disabled={loading}>
            <svg viewBox="0 0 23 23" width="18" height="18">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            Continue with Microsoft
          </button>

          <button type="button" className="oauth-btn" onClick={() => handleOAuth('apple')} disabled={loading}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#000">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Continue with Apple
          </button>

          <div className="divider"><span>Or</span></div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-toggle">
            {mode === 'signin' ? (
              <span>
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => setMode('signup')}>Sign up</button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('signin')}>Sign in</button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <div className="login-footer-brand">
          <span className="from-text">from</span>
          <Image src="/zunkireelabs-icon.png" alt="Zunkireelabs" width={18} height={18} />
          <span className="brand-name">zunkireelabs</span>
        </div>
        <div className="login-footer-links">
          <a href="#">Terms of service</a>
          <a href="#">Privacy policy</a>
          <span>&copy;2026 Zunkireelabs</span>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          height: 100vh;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .login-header,
        .login-main,
        .login-footer {
          position: relative;
          z-index: 1;
        }
        .login-header {
          flex-shrink: 0;
          padding: 20px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .login-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .login-brand span {
          font-size: 20px;
          font-weight: 600;
          color: #0a0a0a;
          letter-spacing: -0.02em;
        }
        .login-api-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 450;
          color: #71717a;
          letter-spacing: -0.01em;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.green { background: #22c55e; }
        .status-dot.red { background: #ef4444; }
        .status-dot.gray { background: #a1a1aa; }
        .login-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 20px;
          overflow-y: auto;
        }
        .login-icon {
          margin-bottom: 24px;
        }
        .login-title {
          font-size: 28px;
          font-weight: 600;
          color: #0a0a0a;
          margin-bottom: 8px;
          text-align: center;
          letter-spacing: -0.025em;
        }
        .login-subtitle {
          font-size: 15px;
          font-weight: 400;
          color: #71717a;
          margin-bottom: 32px;
          text-align: center;
          letter-spacing: -0.01em;
        }
        .login-card {
          width: 100%;
          max-width: 380px;
        }
        .login-error {
          background: #fef2f2;
          color: #991b1b;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 450;
          margin-bottom: 16px;
          letter-spacing: -0.01em;
        }
        .login-message {
          background: #f0fdf4;
          color: #166534;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 450;
          margin-bottom: 16px;
          letter-spacing: -0.01em;
        }
        .oauth-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 20px;
          background: white;
          border: 1px solid #e4e4e7;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #0a0a0a;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }
        .oauth-btn:hover:not(:disabled) {
          background: #fafafa;
          border-color: #d4d4d8;
        }
        .oauth-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .divider {
          display: flex;
          align-items: center;
          margin: 20px 0;
          color: #a1a1aa;
          font-size: 13px;
          font-weight: 450;
          letter-spacing: -0.01em;
        }
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e4e4e7;
        }
        .divider span {
          padding: 0 16px;
        }
        .form-group {
          margin-bottom: 12px;
        }
        .form-group input {
          width: 100%;
          padding: 12px 14px;
          font-size: 14px;
          font-weight: 400;
          border-radius: 10px;
          border: 1px solid #e4e4e7;
          background: white;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          letter-spacing: -0.01em;
        }
        .form-group input:focus {
          border-color: #0a0a0a;
          box-shadow: 0 0 0 3px rgba(10, 10, 10, 0.05);
        }
        .form-group input::placeholder {
          color: #a1a1aa;
          font-weight: 400;
        }
        .form-group input:disabled {
          background: #f4f4f5;
          cursor: not-allowed;
        }
        .login-btn {
          width: 100%;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 10px;
          background: #18181b;
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-top: 4px;
          letter-spacing: -0.01em;
        }
        .login-btn:hover:not(:disabled) {
          background: #27272a;
        }
        .login-btn:disabled {
          background: #a1a1aa;
          cursor: not-allowed;
        }
        .auth-toggle {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          font-weight: 400;
          color: #71717a;
          letter-spacing: -0.01em;
        }
        .auth-toggle button {
          background: none;
          border: none;
          color: #0a0a0a;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .auth-toggle button:hover {
          color: #3f3f46;
        }
        .login-footer {
          flex-shrink: 0;
          padding: 20px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .login-footer-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          letter-spacing: -0.01em;
        }
        .login-footer-brand .from-text {
          color: #a1a1aa;
          font-weight: 400;
        }
        .login-footer-brand .brand-name {
          color: #0a0a0a;
          font-weight: 500;
        }
        .login-footer-links {
          display: flex;
          align-items: center;
          gap: 24px;
          font-size: 12px;
          font-weight: 400;
          color: #71717a;
          letter-spacing: -0.01em;
        }
        .login-footer-links a {
          color: #71717a;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .login-footer-links a:hover {
          color: #3f3f46;
        }
      `}</style>
    </div>
  );
}
