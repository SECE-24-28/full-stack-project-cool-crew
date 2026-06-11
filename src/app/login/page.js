'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import styles from './Auth.module.css';

export default function Login() {
  const router = useRouter();
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to respective dashboard
  useEffect(() => {
    if (user && !loading) {
      router.push(`/dashboard/${user.role}`);
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      router.push(`/dashboard/${result.role}`);
    } else {
      setError(result.error || 'Failed to login.');
    }
  };

  return (
    <div className={styles.wrapper}>
      <Navbar />

      <main className={styles.container}>
        <div className={`${styles.card} animate-fade-in`}>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Login to access your placement opportunities</p>

          {error && <div className={styles.errorAlert}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary styles.submitBtn"
              disabled={submitting}
              style={{ width: '100%', padding: '12px', marginTop: '16px' }}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className={styles.footerText}>
            Don't have an account?{' '}
            <Link href="/register" className={styles.link}>
              Register here
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
