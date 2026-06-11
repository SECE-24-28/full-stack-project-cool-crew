'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const isActive = (path) => pathname === path;

  // Determine Dashboard link based on User Role
  const getDashboardLink = () => {
    if (!user) return '/login';
    return `/dashboard/${user.role}`;
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.nav}`}>
        <Link href="/" className={styles.logo}>
          <svg className={styles.logoIcon} width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 22C4 22 9 14 16 14C23 14 28 22 28 22" stroke="url(#logo-grad)" strokeWidth="3" strokeLinecap="round" />
            <path d="M10 22V17" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 22V14" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" />
            <path d="M22 22V17" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 25H28" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" />
            <defs>
              <linearGradient id="logo-grad" x1="4" y1="14" x2="28" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f0cc83" />
                <stop offset="1" stopColor="#d9a74a" />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.logoText}>
            Intern<span className={styles.logoSerif}>Bridge</span>
          </span>
        </Link>

        <nav>
          <ul className={styles.navMenu}>
            <li>
              <Link href="/" className={`${styles.navLink} ${isActive('/') ? styles.activeLink : ''}`}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/internships" className={`${styles.navLink} ${isActive('/internships') ? styles.activeLink : ''}`}>
                Find Internships
              </Link>
            </li>
            {user && (
              <li>
                <Link href={getDashboardLink()} className={`${styles.navLink} ${pathname.startsWith('/dashboard') ? styles.activeLink : ''}`}>
                  Dashboard
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className={styles.authActions}>
          {loading ? (
            <div style={{ width: '80px', height: '24px', opacity: 0.1, backgroundColor: 'white', borderRadius: '4px' }}></div>
          ) : user ? (
            <div className={styles.userSection}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userRole}>{user.role}</span>
              </div>
              <button onClick={logout} className={styles.logoutBtn}>
                Logout
              </button>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Login
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
