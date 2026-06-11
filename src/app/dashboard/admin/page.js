'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import styles from './Admin.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'companies', 'internships'

  // Admin Data states
  const [counts, setCounts] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalApplications: 0,
    totalApprovedInternships: 0,
    totalPendingInternships: 0,
    totalPendingCompanies: 0,
  });
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [pendingInternships, setPendingInternships] = useState([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');

  // Route Protection
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchAdminData = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts);
        setPendingCompanies(data.pendingCompanies);
        setPendingInternships(data.pendingInternships);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user, activeTab, fetchAdminData]);

  const handleVerifyCompany = async (companyUserId) => {
    setMessage('');
    try {
      const res = await fetch(`/api/companies/${companyUserId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: true }),
      });

      const data = await res.json();

      if (res.ok) {
        setMsgType('success');
        if (data.mockOtp) {
          setMessage(`✓ Company details approved! Verification OTP sent to company email. (Mock OTP: ${data.mockOtp})`);
        } else {
          setMessage('✓ Company verified successfully!');
        }
        fetchAdminData(); // Refresh list
      } else {
        setMsgType('danger');
        setMessage(`Error: ${data.error || 'Failed to verify'}`);
      }
    } catch (err) {
      console.error(err);
      setMsgType('danger');
      setMessage('Network error.');
    }
  };

  const handleModerateInternship = async (jobId, status) => {
    setMessage('');
    try {
      const res = await fetch(`/api/internships/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (res.ok) {
        setMsgType('success');
        setMessage(`✓ Internship posting ${status} successfully.`);
        fetchAdminData();
      } else {
        setMsgType('danger');
        setMessage(`Error: ${data.error || 'Failed moderation'}`);
      }
    } catch (err) {
      console.error(err);
      setMsgType('danger');
      setMessage('Network error.');
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className={styles.layout}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <section className={styles.content}>
          {message && (
            <div className={msgType === 'success' ? styles.successAlert : styles.errorAlert} style={{ marginBottom: '24px' }}>
              {message}
            </div>
          )}

          {activeTab === 'stats' ? (
            // Statistics view
            <div className="animate-fade-in">
              <h1 className={styles.title}>Admin Analytics</h1>
              <p className={styles.subtitle}>Overview of current platform registration and applications metrics</p>

              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
                  <p style={{ color: 'var(--text-secondary)' }}>Gathering platform stats...</p>
                </div>
              ) : (
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>👨‍🎓</div>
                    <div className={styles.statText}>
                      <span className={styles.statNum}>{counts.totalStudents}</span>
                      <span className={styles.statLabel}>Students</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🏢</div>
                    <div className={styles.statText}>
                      <span className={styles.statNum}>{counts.totalCompanies}</span>
                      <span className={styles.statLabel}>Companies</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📝</div>
                    <div className={styles.statText}>
                      <span className={styles.statNum}>{counts.totalApplications}</span>
                      <span className={styles.statLabel}>Applications</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>💼</div>
                    <div className={styles.statText}>
                      <span className={styles.statNum}>{counts.totalApprovedInternships}</span>
                      <span className={styles.statLabel}>Active Posts</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ backgroundColor: 'var(--warning-glow)' }}>⏳</div>
                    <div className={styles.statText}>
                      <span className={styles.statNum} style={{ color: 'var(--warning)' }}>{counts.totalPendingInternships}</span>
                      <span className={styles.statLabel}>Pending Jobs</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ backgroundColor: 'var(--danger-glow)' }}>🛡️</div>
                    <div className={styles.statText}>
                      <span className={styles.statNum} style={{ color: 'var(--danger)' }}>{counts.totalPendingCompanies}</span>
                      <span className={styles.statLabel}>Pending Orgs</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'companies' ? (
            // Verify Companies panel
            <div className="animate-fade-in">
              <h1 className={styles.title}>Verify Companies</h1>
              <p className={styles.subtitle}>Review new employer registrations before authorizing their placement posts</p>

              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                  Loading unverified profiles...
                </div>
              ) : pendingCompanies.length > 0 ? (
                pendingCompanies.map((comp) => (
                  <div key={comp.profileId} className={styles.modCard}>
                    <div className={styles.modHeader}>
                      <div>
                        <h3 className={styles.modTitle}>{comp.companyName}</h3>
                        <span className={styles.modSubtitle}>Owner: {comp.name} ({comp.email})</span>
                        <div className={styles.modMeta}>
                          {comp.location && <span>📍 {comp.location}</span>}
                          {comp.website && (
                            <a href={`https://${comp.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                              🌐 {comp.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.modFooter}>
                      <button
                        onClick={() => handleVerifyCompany(comp.userId)}
                        className="btn btn-primary"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        ✓ Verify Company
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🛡️</span>
                  <h3 style={{ fontWeight: 700 }}>Queue Clear</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No companies are currently waiting for verification.</p>
                </div>
              )}
            </div>
          ) : (
            // Moderate Internships panel
            <div className="animate-fade-in">
              <h1 className={styles.title}>Moderate Internship Postings</h1>
              <p className={styles.subtitle}>Review and approve internship opportunities for public visibility</p>

              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                  Loading pending postings...
                </div>
              ) : pendingInternships.length > 0 ? (
                pendingInternships.map((job) => (
                  <div key={job._id} className={styles.modCard}>
                    <div className={styles.modHeader}>
                      <div>
                        <h3 className={styles.modTitle}>{job.title}</h3>
                        <span className={styles.modSubtitle}>Company: {job.company.companyName} ({job.company.email})</span>
                        
                        <div className={styles.modMeta}>
                          <span>📍 {job.location}</span>
                          <span>💵 {job.stipend}</span>
                          <span>📅 {job.duration}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</h4>
                      <p className={styles.modDesc}>{job.description}</p>
                    </div>

                    {job.skillsRequired?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {job.skillsRequired.map((skill, index) => (
                          <span key={index} style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={styles.modFooter}>
                      <button
                        onClick={() => handleModerateInternship(job._id, 'rejected')}
                        className="btn btn-secondary"
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      >
                        Reject Post
                      </button>
                      <button
                        onClick={() => handleModerateInternship(job._id, 'approved')}
                        className="btn btn-primary"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        ✓ Approve & Publish
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>✅</span>
                  <h3 style={{ fontWeight: 700 }}>Queue Clear</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No internship postings require moderation review.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
