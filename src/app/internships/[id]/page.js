'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import styles from './InternshipDetails.module.css';

export default function InternshipDetails() {
  const router = useRouter();
  const { id } = useParams();
  const { user, profile, refreshUser } = useAuth();
  
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  
  // Application Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [useExistingResume, setUseExistingResume] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applyResult, setApplyResult] = useState(null);

  const checkApplicationStatus = useCallback(async () => {
    if (!user || user.role !== 'student') return;
    try {
      // Fetch all applications for the student to see if they've applied for this internship
      const res = await fetch('/api/applications');
      if (res.ok) {
        const applications = await res.json();
        const applied = applications.some(app => app.internship.id === id);
        setAlreadyApplied(applied);
      }
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  }, [user, id]);

  const fetchInternshipDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/internships/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInternship(data);
      } else {
        console.error('Failed to fetch internship details');
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchInternshipDetails();
    }
  }, [id, fetchInternshipDetails]);

  useEffect(() => {
    if (id && user) {
      checkApplicationStatus();
    }
  }, [id, user, checkApplicationStatus]);

  // Set default state based on saved profile resume presence
  useEffect(() => {
    if (profile && !profile.resumeUrl) {
      setUseExistingResume(false);
    }
  }, [profile]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError('');
    setApplying(true);

    try {
      const formData = new FormData();
      if (useExistingResume) {
        formData.append('useExisting', 'true');
      } else {
        if (!selectedFile) {
          setApplyError('Please upload a PDF/Word resume file.');
          setApplying(false);
          return;
        }
        formData.append('resume', selectedFile);
        formData.append('useExisting', 'false');
      }

      const res = await fetch(`/api/internships/${id}/apply`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setApplyResult(data.application);
        setAlreadyApplied(true);
        refreshUser(); // Sync profile resume URL if it was uploaded
      } else {
        setApplyError(data.error || 'Failed to submit application.');
      }
    } catch (err) {
      console.error(err);
      setApplyError('An unexpected network error occurred.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Navbar />
        <main className={styles.main} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
            <p>Loading placement details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className={styles.wrapper}>
        <Navbar />
        <main className={styles.main}>
          <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
            <h2>Internship Not Found</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px 0' }}>The posting you are looking for does not exist or has been removed.</p>
            <Link href="/internships" className="btn btn-primary">Back to Listings</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const companyInitial = internship.company?.companyName 
    ? internship.company.companyName.charAt(0).toUpperCase() 
    : 'C';

  return (
    <div className={styles.wrapper}>
      <Navbar />

      <main className={`container ${styles.main}`}>
        <Link href="/internships" className={styles.backLink}>
          <span>←</span> Back to all listings
        </Link>

        <div className={styles.layout}>
          {/* Main Details Panel */}
          <div className={styles.detailsCard}>
            <div className={styles.header}>
              <h1 className={styles.title}>{internship.title}</h1>
              <span className={styles.companyName}>{internship.company?.companyName}</span>
              
              <div className={styles.grid}>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Stipend</span>
                  <span className={styles.gridValue}>💵 {internship.stipend}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Duration</span>
                  <span className={styles.gridValue}>📅 {internship.duration}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Location</span>
                  <span className={styles.gridValue}>📍 {internship.location}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className={styles.sectionTitle}>Internship Description</h3>
              <p className={styles.description}>{internship.description}</p>
            </div>

            <div>
              <h3 className={styles.sectionTitle}>Required Skills</h3>
              <div className={styles.tags}>
                {internship.skillsRequired?.map((skill, index) => (
                  <span key={index} className={styles.tag}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Actions Panel */}
          <div className={styles.sidebar}>
            {/* Apply Segment */}
            <div className={styles.applyCard}>
              <h3 className={styles.applyTitle}>Apply Today</h3>
              
              {user ? (
                user.role === 'student' ? (
                  alreadyApplied ? (
                    <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                      ✓ Already Applied
                    </button>
                  ) : (
                    <button onClick={() => setShowApplyModal(true)} className="btn btn-primary" style={{ width: '100%' }}>
                      Apply Now
                    </button>
                  )
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Logged in as <strong>{user.role}</strong>. Applications are only available for students.
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Log in to submit your application and track your status.</p>
                  <Link href={`/login?redirect=/internships/${internship._id}`} className="btn btn-primary" style={{ width: '100%' }}>
                    Login to Apply
                  </Link>
                </div>
              )}
            </div>

            {/* Company Bio segment */}
            <div className={styles.companyCard}>
              <div className={styles.companyLogo}>{companyInitial}</div>
              <h3 className={styles.companyTitle}>{internship.company?.companyName}</h3>
              <p className={styles.companyLocation}>📍 {internship.company?.location || 'Location Not Listed'}</p>
              
              {internship.company?.description && (
                <p className={styles.companyDesc}>{internship.company.description}</p>
              )}

              {internship.company?.website && (
                <a href={internship.company.website.startsWith('http') ? internship.company.website : `https://${internship.company.website}`} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className={styles.companyLink}>
                  Visit Company Website ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Quick Apply Modal */}
      {showApplyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Quick Apply</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Applying for <strong>{internship.title}</strong> at <strong>{internship.company?.companyName}</strong>.
            </p>

            {applyResult ? (
              // Application Success Screen with AI Score
              <div style={{ display: 'flex', flex: 'column', gap: '16px', textAlign: 'center', padding: '10px 0' }} className="animate-fade-in">
                <span style={{ fontSize: '3rem' }}>🎉</span>
                <h3 style={{ fontWeight: 700 }}>Application Submitted!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Your application has been received. Our matching system has generated your match score:
                </p>
                <div style={{ margin: '16px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '110px', height: '110px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', boxShadow: '0 4px 14px var(--primary-glow)' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{applyResult.aiMatchScore}%</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>AI Match</span>
                </div>
                <button 
                  onClick={() => {
                    setShowApplyModal(false);
                    setApplyResult(null);
                    router.push('/dashboard/student');
                  }} 
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Go to Student Dashboard
                </button>
              </div>
            ) : (
              // Form Upload Screen
              <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applyError && <div className={styles.errorAlert}>{applyError}</div>}

                <div className={styles.radioGroup}>
                  {profile?.resumeUrl && (
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="resumeChoice"
                        checked={useExistingResume}
                        onChange={() => setUseExistingResume(true)}
                      />
                      <div className={styles.radioLabel}>
                        <span className={styles.radioTitle}>Use Saved Profile Resume</span>
                        <span className={styles.radioDesc}>Apply using the resume uploaded to your dashboard.</span>
                      </div>
                    </label>
                  )}

                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="resumeChoice"
                      checked={!useExistingResume}
                      onChange={() => setUseExistingResume(false)}
                    />
                    <div className={styles.radioLabel}>
                      <span className={styles.radioTitle}>Upload New Resume File</span>
                      <span className={styles.radioDesc}>Select a specific PDF or Word file from your computer.</span>
                    </div>
                  </label>
                </div>

                {!useExistingResume && (
                  <div className={`${styles.fileInputWrapper} animate-fade-in`}>
                    <label className="form-label" htmlFor="resumeFile">Select Resume File (.pdf, .docx)</label>
                    <input
                      id="resumeFile"
                      type="file"
                      accept=".pdf,.docx,.doc"
                      className="form-control"
                      onChange={handleFileChange}
                      required={!useExistingResume}
                    />
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowApplyModal(false);
                      setApplyError('');
                    }} 
                    className="btn btn-secondary"
                    disabled={applying}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={applying}
                  >
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
