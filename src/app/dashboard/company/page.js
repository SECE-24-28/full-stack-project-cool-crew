'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import styles from './Company.module.css';

export default function CompanyDashboard() {
  const router = useRouter();
  const { user, profile, loading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'post', 'profile'

  // Post Job Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [stipend, setStipend] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');
  const [posting, setPosting] = useState(false);

  // Profile Form States
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [locationProfile, setLocationProfile] = useState('');
  const [descriptionProfile, setDescriptionProfile] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Postings & Candidate Manager
  const [postings, setPostings] = useState([]);
  const [loadingPostings, setLoadingPostings] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // OTP Verification States
  const [otp, setOtp] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpResending, setOtpResending] = useState(false);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setOtpVerifying(true);
    try {
      const res = await fetch('/api/companies/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSuccess(data.message);
        setOtp('');
        setTimeout(async () => {
          await refreshUser(); // Reload profile & status
        }, 1500);
      } else {
        setOtpError(data.error || 'Failed to verify OTP.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('A network error occurred.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError('');
    setOtpSuccess('');
    setOtpResending(true);
    try {
      const res = await fetch('/api/companies/verify-otp/resend', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSuccess(data.message);
      } else {
        setOtpError(data.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('A network error occurred.');
    } finally {
      setOtpResending(false);
    }
  };

  // Auth Guard
  useEffect(() => {
    if (!loading && (!user || user.role !== 'company')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Sync profile data to form inputs
  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName || '');
      setWebsite(profile.website || '');
      setLocationProfile(profile.location || '');
      setDescriptionProfile(profile.description || '');
    }
  }, [profile]);

  const fetchPostings = useCallback(async () => {
    setLoadingPostings(true);
    try {
      const res = await fetch('/api/internships/my-postings');
      if (res.ok) {
        const data = await res.json();
        setPostings(data);
      }
    } catch (err) {
      console.error('Error fetching postings:', err);
    } finally {
      setLoadingPostings(false);
    }
  }, []);

  // Sync postings list
  useEffect(() => {
    if (activeTab === 'jobs' && user) {
      fetchPostings();
    }
  }, [activeTab, user, fetchPostings]);

  const fetchApplicants = useCallback(async (jobId) => {
    setLoadingApplicants(true);
    try {
      const res = await fetch(`/api/internships/${jobId}/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplicants(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApplicants(false);
    }
  }, []);

  // Fetch applicants when expanding an internship card
  const handleToggleApplicants = (jobId) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      setApplicants([]);
    } else {
      setExpandedJobId(jobId);
      fetchApplicants(jobId);
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        // Refresh applicants for the currently expanded job posting
        if (expandedJobId) {
          fetchApplicants(expandedJobId);
        }
      } else {
        alert('Could not update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setPostError('');
    setPostSuccess('');
    setPosting(true);

    if (!title || !description || !stipend || !duration || !location) {
      setPostError('Please fill in all required fields.');
      setPosting(false);
      return;
    }

    try {
      const res = await fetch('/api/internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          skillsRequired,
          stipend,
          duration,
          location,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPostSuccess('✓ Internship submitted successfully and is pending admin moderation.');
        setTitle('');
        setDescription('');
        setSkillsRequired('');
        setStipend('');
        setDuration('');
        setLocation('');
        
        setTimeout(() => {
          setActiveTab('jobs');
          setPostSuccess('');
        }, 1500);
      } else {
        setPostError(data.error || 'Failed to submit posting.');
      }
    } catch (err) {
      console.error(err);
      setPostError('Network error occurred.');
    } finally {
      setPosting(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage('');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          website,
          location: locationProfile,
          description: descriptionProfile,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfileMessage('✓ Company profile updated successfully!');
        await refreshUser();
      } else {
        setProfileMessage(`Error: ${data.error || 'Could not update'}`);
      }
    } catch (err) {
      console.error(err);
      setProfileMessage('Error: Connection timed out.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const isVerifiedCompany = profile?.isVerified === true;

  return (
    <div className={styles.wrapper} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className={styles.layout}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <section className={styles.content}>
          {user?.companyVerificationStatus === 'otp_sent' ? (
            <div className="animate-fade-in" style={{ maxWidth: '500px', margin: '40px auto' }}>
              <div className="card" style={{ padding: '40px 32px', border: '1px solid rgba(217, 167, 74, 0.25)', boxShadow: '0 8px 32px rgba(217, 167, 74, 0.05)' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>✉️</span>
                  <h2 style={{ fontWeight: 850, fontSize: '1.5rem', marginBottom: '8px' }}>Verify Your Account</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    An administrator has approved your company details. A 6-digit OTP code has been sent to your official email <strong>{user.email}</strong>. Please verify it below.
                  </p>
                </div>

                {otpError && <div className={otpError.startsWith('✓') ? styles.successAlert : styles.errorAlert} style={{ marginBottom: '20px' }}>{otpError}</div>}
                {otpSuccess && <div className={styles.successAlert} style={{ marginBottom: '20px' }}>{otpSuccess}</div>}

                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="otpInput">Enter 6-Digit OTP</label>
                    <input
                      id="otpInput"
                      type="text"
                      className="form-control"
                      placeholder="e.g. 123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      style={{ fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center', fontWeight: '800' }}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #f0cc83 0%, #d9a74a 100%)', color: '#050505', width: '100%', padding: '12px' }} disabled={otpVerifying}>
                    {otpVerifying ? 'Verifying...' : 'Verify & Activate Account \u2192'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Didn't receive the email?{' '}
                  <button onClick={handleResendOtp} style={{ color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }} disabled={otpResending}>
                    {otpResending ? 'Resending...' : 'Resend Code'}
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'jobs' ? (
            // Manage Posted Internships View
            <div className="animate-fade-in">
              <h1 className={styles.title}>Posted Internships</h1>
              <p className={styles.subtitle}>Review your posted opportunities and manage candidates submissions</p>

              {!isVerifiedCompany && (
                <div className={styles.errorAlert} style={{ marginBottom: '24px', backgroundColor: 'var(--warning-glow)', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                  ⚠️ Your company profile is unverified. Admins must review your credentials before your listings can be made public.
                </div>
              )}

              {loadingPostings ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                  <p style={{ color: 'var(--text-secondary)' }}>Retrieving your postings...</p>
                </div>
              ) : postings.length > 0 ? (
                postings.map((job) => (
                  <div key={job._id} className={styles.jobListItem}>
                    <div className={styles.jobHeader}>
                      <div>
                        <h3 className={styles.jobTitle}>{job.title}</h3>
                        <div className={styles.jobMeta}>
                          <span>📍 {job.location}</span>
                          <span>💵 {job.stipend}</span>
                          <span>📅 {job.duration}</span>
                        </div>
                      </div>
                      <span className={`badge badge-${job.status}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className={styles.jobActions}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        👥 {job.applicantCount} Candidate{job.applicantCount !== 1 ? 's' : ''} Applied
                      </span>
                      
                      {job.applicantCount > 0 && (
                        <button
                          onClick={() => handleToggleApplicants(job._id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          {expandedJobId === job._id ? 'Hide Candidates' : 'Inspect Candidates'}
                        </button>
                      )}
                    </div>

                    {/* Applicants Panel (Expanded) */}
                    {expandedJobId === job._id && (
                      <div className={styles.candidatesSection}>
                        <h4 className={styles.candidatesTitle}>
                          <span>👨‍💻</span> Applicants List
                        </h4>

                        {loadingApplicants ? (
                          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
                            Loading applicant profiles...
                          </div>
                        ) : applicants.length > 0 ? (
                          <div className={styles.candidatesList}>
                            {applicants.map((app) => (
                              <div key={app._id} className={styles.candidateCard}>
                                <div className={styles.candidateHeader}>
                                  <div>
                                    <h5 className={styles.candidateName}>{app.student.name}</h5>
                                    <span className={styles.candidateEmail}>{app.student.email}</span>
                                  </div>

                                  <div className={`${styles.scoreBadge} ${app.aiMatchScore >= 70 ? styles.scoreBadgeHigh : ''}`}>
                                    ⚡ AI Match: {app.aiMatchScore}%
                                  </div>
                                </div>

                                {app.student.bio && (
                                  <p className={styles.candidateBio}>"{app.student.bio}"</p>
                                )}

                                {app.student.skills?.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {app.student.skills.map((skill, sIdx) => (
                                      <span key={sIdx} style={{ fontSize: '0.72rem', padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {app.student.education?.length > 0 && (
                                  <div className={styles.candidateEduSection}>
                                    <div className={styles.eduTitle}>Education</div>
                                    {app.student.education.map((edu, eIdx) => (
                                      <div key={eIdx} className={styles.eduItem}>
                                        <strong>{edu.institution}</strong> - {edu.degree} ({edu.startYear} - {edu.endYear})
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className={styles.candidateFooter}>
                                  <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                                    📄 Open Resume file ↗
                                  </a>

                                  <div className={styles.candidateActions}>
                                    {app.status === 'pending' ? (
                                      <>
                                        <button onClick={() => handleUpdateStatus(app._id, 'rejected')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                          Reject
                                        </button>
                                        <button onClick={() => handleUpdateStatus(app._id, 'shortlisted')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'var(--accent)' }}>
                                          Shortlist
                                        </button>
                                      </>
                                    ) : (
                                      <span className={`badge badge-${app.status}`}>
                                        {app.status}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
                            No candidates found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>💼</span>
                  <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>No Internships Posted</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', maxWidth: '300px', margin: '0 auto 16px auto' }}>Get started by publishing your first placement opportunity.</p>
                  <button onClick={() => setActiveTab('post')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    Post Internship
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'post' ? (
            // Post Internship Form
            <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
              <h1 className={styles.title}>Post an Internship</h1>
              <p className={styles.subtitle}>Fill in details to recruit qualified talent</p>

              {!isVerifiedCompany && (
                <div className={styles.errorAlert} style={{ marginBottom: '24px', backgroundColor: 'var(--warning-glow)', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                  ⚠️ Your profile is unverified. You can draft postings, but they will not show up publicly until verified by an Admin.
                </div>
              )}

              {postError && <div className={styles.errorAlert}>{postError}</div>}
              {postSuccess && <div className={styles.successAlert}>{postSuccess}</div>}

              <form onSubmit={handlePostSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="jobTitle">Job Title</label>
                  <input id="jobTitle" type="text" className="form-control" placeholder="e.g. Frontend Engineering Intern" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="jobStipend">Stipend</label>
                    <input id="jobStipend" type="text" className="form-control" placeholder="e.g. $1500 / month, Unpaid" value={stipend} onChange={(e) => setStipend(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="jobDuration">Duration</label>
                    <input id="jobDuration" type="text" className="form-control" placeholder="e.g. 3 Months, 6 Months" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="jobLoc">Location</label>
                  <input id="jobLoc" type="text" className="form-control" placeholder="e.g. Remote, San Francisco" value={location} onChange={(e) => setLocation(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="jobSkills">Required Skills (Comma separated)</label>
                  <input id="jobSkills" type="text" className="form-control" placeholder="e.g. React, Node.js, MongoDB" value={skillsRequired} onChange={(e) => setSkillsRequired(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="jobDesc">Internship Description</label>
                  <textarea id="jobDesc" className="form-control" placeholder="Describe the responsibilities, project scope, qualifications, and benefits..." rows="5" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontSize: '0.95rem' }} disabled={posting}>
                  {posting ? 'Publishing...' : 'Publish Posting'}
                </button>
              </form>
            </div>
          ) : (
            // Company Profile Form
            <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
              <h1 className={styles.title}>Company Profile</h1>
              <p className={styles.subtitle}>Provide information about your company to build candidate trust</p>

              {profileMessage && (
                <div className={profileMessage.startsWith('✓') ? styles.successAlert : styles.errorAlert} style={{ marginBottom: '24px' }}>
                  {profileMessage}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="compNameInput">Company Name</label>
                  <input id="compNameInput" type="text" className="form-control" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="compWeb">Website URL</label>
                    <input id="compWeb" type="text" className="form-control" placeholder="www.example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="compLocInput">Office Location</label>
                    <input id="compLocInput" type="text" className="form-control" placeholder="e.g. Chicago, IL" value={locationProfile} onChange={(e) => setLocationProfile(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="compDescInput">About the Company</label>
                  <textarea id="compDescInput" className="form-control" placeholder="Introduce your mission, target market, team culture..." rows="5" value={descriptionProfile} onChange={(e) => setDescriptionProfile(e.target.value)}></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontSize: '0.95rem' }} disabled={savingProfile}>
                  {savingProfile ? 'Saving Details...' : 'Save Profile Details'}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
