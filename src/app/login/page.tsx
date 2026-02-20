'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { api } from '@/lib/api';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const router = useRouter();
  const { setToken, setUser } = useAppStore();

  // Check API status
  useEffect(() => {
    const checkApi = async () => {
      const isOnline = await api.checkHealth();
      setApiStatus(isOnline ? 'online' : 'offline');
    };
    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

  // Particle wave animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      const waveCount = 3;
      const colors = [
        'rgba(200, 200, 180, 0.3)',
        'rgba(180, 180, 160, 0.2)',
        'rgba(160, 160, 140, 0.15)',
      ];

      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        for (let x = 0; x <= canvas.width; x += 5) {
          const y = canvas.height * (0.65 + w * 0.08) +
            Math.sin(x * 0.003 + time + w) * 40 +
            Math.sin(x * 0.007 + time * 1.3 + w) * 25 +
            Math.sin(x * 0.001 + time * 0.5 + w) * 60;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fillStyle = colors[w];
        ctx.fill();
      }

      animationId = requestAnimationFrame(drawWave);
    };

    resize();
    drawWave();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.login(email, password);
      setToken(response.token);
      setUser({
        id: response.user.site_id,
        email: response.user.email,
        name: response.user.name,
        site_id: response.user.site_id,
        created_at: new Date().toISOString(),
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const showOAuthMessage = () => {
    alert('OAuth integration coming soon!');
  };

  return (
    <div className="login-page">
      {/* Particle wave background */}
      <canvas ref={canvasRef} className="particle-wave-canvas" />

      {/* Header */}
      <div className="login-header">
        <div className="login-brand">
          <Image src="/orca-icon.png" alt="Orca" width={28} height={28} />
          <span>orca</span>
        </div>
        <div className="login-api-status">
          <div className={`status-dot ${apiStatus === 'online' ? 'green' : apiStatus === 'offline' ? 'red' : 'gray'}`} />
          <span>
            {apiStatus === 'online' && 'API Online'}
            {apiStatus === 'offline' && 'API Offline'}
            {apiStatus === 'checking' && 'Checking...'}
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

          {/* OAuth Buttons */}
          <button type="button" className="oauth-btn" onClick={showOAuthMessage}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button type="button" className="oauth-btn" onClick={showOAuthMessage}>
            <svg viewBox="0 0 23 23" width="18" height="18">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            Continue with Microsoft
          </button>

          <button type="button" className="oauth-btn" onClick={showOAuthMessage}>
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
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Continue'}
            </button>
          </form>
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
          background: #f5f5f0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .particle-wave-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
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
          color: #111;
        }
        .login-api-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.green { background: #22c55e; }
        .status-dot.red { background: #ef4444; }
        .status-dot.gray { background: #9ca3af; }
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
          margin-bottom: 20px;
        }
        .login-title {
          font-size: 26px;
          font-weight: 700;
          color: #111;
          margin-bottom: 6px;
          text-align: center;
        }
        .login-subtitle {
          font-size: 15px;
          color: #6b7280;
          margin-bottom: 24px;
          text-align: center;
        }
        .login-card {
          width: 100%;
          max-width: 380px;
        }
        .login-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .oauth-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 20px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #111;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 10px;
        }
        .oauth-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .divider {
          display: flex;
          align-items: center;
          margin: 16px 0;
          color: #9ca3af;
          font-size: 13px;
        }
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .divider span {
          padding: 0 14px;
        }
        .form-group {
          margin-bottom: 12px;
        }
        .form-group input {
          width: 100%;
          padding: 12px 14px;
          font-size: 14px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: white;
          outline: none;
        }
        .form-group input:focus {
          border-color: #111;
        }
        .form-group input::placeholder {
          color: #9ca3af;
        }
        .login-btn {
          width: 100%;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 10px;
          background: #6b7280;
          color: white;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 4px;
        }
        .login-btn:hover {
          background: #4b5563;
        }
        .login-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .login-footer {
          flex-shrink: 0;
          padding: 16px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .login-footer-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }
        .login-footer-brand .from-text {
          color: #9ca3af;
          font-weight: 400;
        }
        .login-footer-brand .brand-name {
          color: #111;
          font-weight: 500;
        }
        .login-footer-links {
          display: flex;
          align-items: center;
          gap: 20px;
          font-size: 12px;
          color: #6b7280;
        }
        .login-footer-links a {
          color: #6b7280;
          text-decoration: none;
        }
        .login-footer-links a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
