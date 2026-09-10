'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const redirectPath = searchParams.get('redirect') || '';

  useEffect(() => {
    // If user is already authenticated, redirect them based on role or searchParam
    if (!authLoading && user) {
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        const dest = user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/owner' : '/tenant';
        router.push(dest);
      }
    }
  }, [user, authLoading, redirectPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password');
      }

      setSuccess('Login successful! Redirecting...');
      login(data.user);
      
      setTimeout(() => {
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          const dest = data.user.role === 'admin' ? '/admin' : data.user.role === 'owner' ? '/owner' : '/tenant';
          router.push(dest);
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError('');
    setSuccess('');
    setLoading(true);
    setEmail(demoEmail);
    setPassword('password123');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      setSuccess(`Logged in as ${data.user.name}!`);
      login(data.user);

      setTimeout(() => {
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          const dest = data.user.role === 'admin' ? '/admin' : data.user.role === 'owner' ? '/owner' : '/tenant';
          router.push(dest);
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h2 style={styles.title}>Welcome to S.R Rentals</h2>
        <p style={styles.subtitle}>Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {error && <div style={styles.errorAlert}>{error}</div>}
        {success && <div style={styles.successAlert}>{success}</div>}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            disabled={loading}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            disabled={loading}
          />
        </div>

        <button type="submit" style={styles.submitBtn} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div style={styles.divider}>
        <span style={styles.dividerText}>Or Auto-Bypass With Demo Accounts</span>
      </div>

      <div style={styles.demoGrid}>
        <button
          onClick={() => handleDemoLogin('sheikhsohel691@gmail.com')}
          style={{ ...styles.demoBtn, borderLeft: '4px solid var(--success)' }}
          disabled={loading}
        >
          🔑 Tenant: Sohel Sheikh
        </button>
        <button
          onClick={() => handleDemoLogin('owner@srrentals.com')}
          style={{ ...styles.demoBtn, borderLeft: '4px solid var(--warning)' }}
          disabled={loading}
        >
          🔑 Owner: Rajesh Kumar
        </button>
        <button
          onClick={() => handleDemoLogin('admin@srrentals.com')}
          style={{ ...styles.demoBtn, borderLeft: '4px solid var(--error)' }}
          disabled={loading}
        >
          🔑 Admin: System Administrator
        </button>
      </div>

      <div style={styles.footerLink}>
        <p>Don't have an account? <Link href="/" style={styles.link}>Return to Home</Link> and click "Sign Up"</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={styles.container}>
      <div style={styles.backgroundBlob1}></div>
      <div style={styles.backgroundBlob2}></div>
      <Suspense fallback={<div style={styles.loadingContainer}>Loading login options...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a', // sleek dark slate
    padding: '2rem 1rem',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans)',
  },
  backgroundBlob1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,76,184,0.3) 0%, rgba(0,0,0,0) 70%)',
    top: '-10%',
    left: '-10%',
    zIndex: 1,
  },
  backgroundBlob2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(237,169,32,0.15) 0%, rgba(0,0,0,0) 70%)',
    bottom: '-10%',
    right: '-10%',
    zIndex: 1,
  },
  loadingContainer: {
    color: '#94a3b8',
    fontSize: '1.1rem',
    zIndex: 2,
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // translucent dark
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 'var(--radius-xl)',
    padding: '2.5rem',
    boxShadow: 'var(--shadow-lg), 0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  cardHeader: {
    textAlign: 'center',
  },
  title: {
    fontFamily: 'var(--font-display)',
    color: '#ffffff',
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  errorAlert: {
    backgroundColor: 'rgba(223, 32, 64, 0.15)',
    border: '1px solid var(--error)',
    color: '#fda4af',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    lineHeight: '1.4',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid var(--success)',
    color: '#a7f3d0',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    lineHeight: '1.4',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    color: '#cbd5e1',
    fontSize: '0.825rem',
    fontWeight: '600',
    letterSpacing: '0.025em',
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 'var(--radius-md)',
    color: '#ffffff',
    padding: '0.75rem 1rem',
    fontSize: '0.925rem',
    transition: 'var(--transition)',
    outline: 'none',
  },
  submitBtn: {
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '0.85rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
    marginTop: '0.5rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '0.5rem 0',
  },
  dividerText: {
    width: '100%',
    color: '#64748b',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  demoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  demoBtn: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: 'var(--radius-md)',
    color: '#e2e8f0',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'var(--transition)',
    display: 'flex',
    alignItems: 'center',
  },
  footerLink: {
    textAlign: 'center',
    fontSize: '0.825rem',
    color: '#94a3b8',
    marginTop: '0.5rem',
  },
  link: {
    color: 'var(--accent)',
    fontWeight: '600',
    textDecoration: 'underline',
  },
};
