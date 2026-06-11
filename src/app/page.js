import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './Home.module.css';

export default function Home() {
  return (
    <div className={styles.main}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={`container ${styles.heroContent} animate-fade-in`}>
            {/* Tagline */}
            <div className={styles.tagline}>
              · CONNECT · PLACEMENT · PORTAL ·
            </div>

            {/* Premium Heading */}
            <h1 className={styles.title}>
              Bridge the gap to your <br />
              <span className={styles.titleSerif}>dream career.</span>
            </h1>

            {/* Subheading copy matching the style of the screenshot */}
            <p className={styles.subtitle}>
              InternBridge replaces disjointed job boards with one command center—AI matching, direct placements, and application status tracking for operators who move fast.
            </p>

            {/* CTA Buttons */}
            <div className={styles.ctaButtons}>
              <Link href="/internships" className={`btn ${styles.ctaPrimary}`} style={{ padding: '14px 28px', fontSize: '0.95rem' }}>
                Browse Internships &rarr;
              </Link>
              <Link href="/register?role=student" className={`btn ${styles.ctaSecondary}`} style={{ padding: '14px 28px', fontSize: '0.95rem' }}>
                Create Student Profile
              </Link>
            </div>

            {/* Horizontal Pill Badges */}
            <div className={styles.badgeGrid}>
              <div className={styles.badgePill}>
                <span className={styles.badgeDot}></span>
                ACTIVE STUDENTS · 10,000+
              </div>
              <div className={styles.badgePill}>
                <span className={styles.badgeDot}></span>
                VERIFIED COMPANIES · 500+
              </div>
              <div className={styles.badgePill}>
                <span className={styles.badgeDot}></span>
                PLACEMENTS · 2,500+
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Built for both Students and Employers</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                A streamlined portal matching student potential with enterprise needs, managed securely.
              </p>
            </div>

            <div className={styles.featuresGrid}>
              {/* Student Features Card */}
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>👨‍🎓</div>
                <h3 className={styles.featureTitle}>For Students</h3>
                <p className={styles.featureDescription}>
                  Kickstart your career journey. Build a professional profile, upload your resume, and discover placements matched to your skills.
                </p>
                <ul className={styles.featureList}>
                  <li className={styles.featureListItem}>
                    <span className={styles.featureCheck}>✓</span> One-click application using saved profile resume
                  </li>
                  <li className={styles.featureListItem}>
                    <span className={styles.featureCheck}>✓</span> AI Resume Match Score relative to job requirements
                  </li>
                  <li className={styles.featureListItem}>
                    <span className={styles.featureCheck}>✓</span> Real-time application tracking (Pending, Shortlisted, Rejected)
                  </li>
                </ul>
                <Link href="/register?role=student" className="btn btn-primary" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                  Register as Student
                </Link>
              </div>

              {/* Company Features Card */}
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🏢</div>
                <h3 className={styles.featureTitle}>For Companies</h3>
                <p className={styles.featureDescription}>
                  Find and hire the brightest minds. Post internships, manage applications, and shortlist candidates on a unified dashboard.
                </p>
                <ul className={styles.featureList}>
                  <li className={styles.featureListItem}>
                    <span className={styles.featureCheck}>✓</span> Dedicated company profile showing active opportunities
                  </li>
                  <li className={styles.featureListItem}>
                    <span className={styles.featureCheck}>✓</span> Fast review dashboard with AI match-rank sorting
                  </li>
                  <li className={styles.featureListItem}>
                    <span className={styles.featureCheck}>✓</span> Direct candidate status updating (Shortlist / Reject)
                  </li>
                </ul>
                <Link href="/register?role=company" className="btn btn-secondary" style={{ marginTop: 'auto', alignSelf: 'flex-start', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                  Register as Company
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
