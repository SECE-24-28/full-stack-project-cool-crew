'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import styles from './Student.module.css';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, profile, loading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'applications'

  // Profile Form States
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [education, setEducation] = useState([]);
  
  // Education form states
  const [showEduForm, setShowEduForm] = useState(false);
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  // File Upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  
  // Save profile state
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Applications list
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Sync profile details into form states
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setSkills(profile.skills || []);
      setEducation(profile.education || []);
    }
  }, [profile]);

  // Auth Protection
  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  // Fetch applications list on tab shift
  useEffect(() => {
    if (activeTab === 'applications' && user) {
      fetchApplications();
    }
  }, [activeTab, user, fetchApplications]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddEducation = (e) => {
    e.preventDefault();
    if (!institution || !degree) return;

    const newEdu = {
      institution,
      degree,
      fieldOfStudy,
      startYear,
      endYear,
    };

    setEducation([...education, newEdu]);
    setInstitution('');
    setDegree('');
    setFieldOfStudy('');
    setStartYear('');
    setEndYear('');
    setShowEduForm(false);
  };

  const handleRemoveEducation = (indexToRemove) => {
    setEducation(education.filter((_, idx) => idx !== indexToRemove));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setFileError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        await refreshUser(); // Fetch updated resumeUrl
      } else {
        setFileError(data.error || 'Failed to upload file.');
      }
    } catch (err) {
      console.error(err);
      setFileError('Network error uploading resume.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMessage('');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          skills,
          education,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfileMessage('✓ Profile updated successfully!');
        await refreshUser();
      } else {
        setProfileMessage(`Error: ${data.error || 'Could not update'}`);
      }
    } catch (err) {
      console.error(err);
      setProfileMessage('Error: Connection timed out.');
    } finally {
      setUpdatingProfile(false);
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
          {activeTab === 'profile' ? (
            // Profile Editor view
            <div className="animate-fade-in">
              <h1 className={styles.title}>My Profile</h1>
              <p className={styles.subtitle}>Keep your professional details updated for the recruitment search</p>

              {profileMessage && (
                <div className={profileMessage.startsWith('✓') ? styles.successAlert : styles.errorAlert} style={{ marginBottom: '24px' }}>
                  {profileMessage}
                </div>
              )}

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Resume Upload Segment */}
                <div className="card">
                  <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Resume Attachment</h3>
                  {fileError && <div className={styles.errorAlert}>{fileError}</div>}
                  
                  {profile?.resumeUrl ? (
                    <div className={styles.resumeBlock}>
                      <div className={styles.resumeInfo}>
                        <span className={styles.resumeIcon}>📄</span>
                        <div className={styles.resumeText}>
                          <span className={styles.resumeLabel}>My Resume File</span>
                          <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className={styles.resumeLink}>
                            View uploaded file ↗
                          </a>
                        </div>
                      </div>
                      
                      <label className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        {uploadingFile ? 'Uploading...' : 'Replace Resume'}
                        <input type="file" accept=".pdf,.docx" onChange={handleResumeUpload} style={{ display: 'none' }} disabled={uploadingFile} />
                      </label>
                    </div>
                  ) : (
                    <div style={{ padding: '24px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>📤</span>
                      <h4 style={{ fontWeight: 700, marginBottom: '6px' }}>No Resume Uploaded</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>Upload your resume in PDF/Word format for easy job applications.</p>
                      
                      <label className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        {uploadingFile ? 'Uploading...' : 'Upload Resume'}
                        <input type="file" accept=".pdf,.docx" onChange={handleResumeUpload} style={{ display: 'none' }} disabled={uploadingFile} />
                      </label>
                    </div>
                  )}
                </div>

                {/* Professional Bio Segment */}
                <div className="card">
                  <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Professional Summary</h3>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bioInput">About Me</label>
                    <textarea
                      id="bioInput"
                      className="form-control"
                      placeholder="Write a brief pitch about your career goals, education highlights, and motivation..."
                      rows="4"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                {/* Skills Segment */}
                <div className="card">
                  <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Skills & Technologies</h3>
                  <div className={styles.skillsContainer}>
                    <div className={styles.skillsTags}>
                      {skills.length > 0 ? (
                        skills.map((skill, index) => (
                          <span key={index} className={styles.skillTag}>
                            {skill}
                            <span onClick={() => handleRemoveSkill(skill)} className={styles.removeSkillBtn}>
                              ×
                            </span>
                          </span>
                        ))
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No skills added yet.</p>
                      )}
                    </div>

                    <div className={styles.skillsInputRow}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Add a skill (e.g. React, Mongoose)"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        style={{ maxWidth: '300px' }}
                      />
                      <button type="button" onClick={handleAddSkill} className="btn btn-secondary">
                        Add Tag
                      </button>
                    </div>
                  </div>
                </div>

                {/* Education Segment */}
                <div className="card">
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>Education History</h3>
                    <button type="button" onClick={() => setShowEduForm(!showEduForm)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      {showEduForm ? 'Close' : 'Add Degree'}
                    </button>
                  </div>

                  {showEduForm && (
                    <div className="card animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)', marginBottom: '24px', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Add Education</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                          <label className="form-label">School / Institution</label>
                          <input type="text" className="form-control" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. Stanford University" required />
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Degree</label>
                            <input type="text" className="form-control" value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g. Bachelor of Science" required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Field of Study</label>
                            <input type="text" className="form-control" value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} placeholder="e.g. Computer Science" />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Start Year</label>
                            <input type="text" className="form-control" value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="e.g. 2022" />
                          </div>
                          <div className="form-group">
                            <label className="form-label">End Year (or Expected)</label>
                            <input type="text" className="form-control" value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="e.g. 2026" />
                          </div>
                        </div>

                        <button type="button" onClick={handleAddEducation} className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
                          Save Entry
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={styles.educationList}>
                    {education.length > 0 ? (
                      education.map((edu, index) => (
                        <div key={index} className={styles.educationItem}>
                          <div>
                            <div className={styles.eduSchool}>{edu.institution}</div>
                            <div className={styles.eduDetails}>
                              {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                            </div>
                            <div className={styles.eduDetails} style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                              {edu.startYear} - {edu.endYear}
                            </div>
                          </div>
                          <button type="button" onClick={() => handleRemoveEducation(index)} className={styles.removeEduBtn}>
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>No education details added yet.</p>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }} disabled={updatingProfile}>
                  {updatingProfile ? 'Saving Changes...' : 'Save Full Profile Details'}
                </button>
              </form>
            </div>
          ) : (
            // Applied jobs list view
            <div className="animate-fade-in">
              <h1 className={styles.title}>Your Applications</h1>
              <p className={styles.subtitle}>Track the live review status of your internship submissions</p>

              {loadingApps ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                  <p style={{ color: 'var(--text-secondary)' }}>Retrieving submitted applications...</p>
                </div>
              ) : applications.length > 0 ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Internship Opportunity</th>
                        <th>Applied Date</th>
                        <th>AI Match Score</th>
                        <th>Review Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app._id}>
                          <td>
                            <div className={styles.jobTitle}>{app.internship.title}</div>
                            <div className={styles.compName}>{app.internship.companyName}</div>
                          </td>
                          <td>
                            {new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td>
                            <div className={styles.matchCell}>
                              <div className={styles.matchBar}>
                                <div className={styles.matchFill} style={{ width: `${app.aiMatchScore}%` }}></div>
                              </div>
                              <span className={styles.matchValue}>{app.aiMatchScore}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${app.status}`}>
                              {app.status}
                            </span>
                          </td>
                          <td>
                            <Link href={`/internships/${app.internship.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                              View Post
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>📝</span>
                  <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>No Applications Yet</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', maxWidth: '300px', margin: '0 auto 16px auto' }}>Browse our listings and submit your first application to see it tracked here.</p>
                  <Link href="/internships" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    Find Internships
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
