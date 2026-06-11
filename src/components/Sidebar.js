'use client';

import { useAuth } from '@/context/AuthContext';
import styles from './Sidebar.module.css';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  // Define tabs based on role
  const getTabs = () => {
    switch (user.role) {
      case 'student':
        return [
          { id: 'profile', label: 'My Profile', icon: '👤' },
          { id: 'applications', label: 'Your Applications', icon: '📝' },
        ];
      case 'company':
        return [
          { id: 'jobs', label: 'Posted Internships', icon: '💼' },
          { id: 'post', label: 'Post Internship', icon: '➕' },
          { id: 'profile', label: 'Company Profile', icon: '🏢' },
        ];
      case 'admin':
        return [
          { id: 'stats', label: 'Dashboard Stats', icon: '📊' },
          { id: 'companies', label: 'Verify Companies', icon: '🛡️' },
          { id: 'internships', label: 'Approve Postings', icon: '✅' },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabs();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.profileCard}>
        <div className={styles.avatar}>{firstLetter}</div>
        <span className={styles.name}>{user.name}</span>
        <span className={styles.role}>{user.role}</span>
      </div>

      <ul className={styles.menu}>
        {tabs.map((tab) => (
          <li key={tab.id} className={styles.menuItem}>
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.button} ${activeTab === tab.id ? styles.activeButton : ''}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          </li>
        ))}
        
        <li className={styles.menuItem} style={{ marginTop: 'auto' }}>
          <button onClick={logout} className={`${styles.button} ${styles.logoutBtn}`}>
            <span>🚪</span>
            Logout
          </button>
        </li>
      </ul>
    </aside>
  );
}
