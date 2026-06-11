import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brandColumn}>
            <div className={styles.logo}>
              InternBridge
              <span className={styles.logoDot}></span>
            </div>
            <p className={styles.tagline}>
              Empowering students and companies to connect, collaborate, and build the future of work.
            </p>
          </div>

          <div>
            <h4 className={styles.title}>For Students</h4>
            <ul className={styles.links}>
              <li><Link href="/internships">Browse Internships</Link></li>
              <li><Link href="/dashboard/student">Student Dashboard</Link></li>
              <li><Link href="/register">Student Signup</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.title}>For Employers</h4>
            <ul className={styles.links}>
              <li><Link href="/dashboard/company">Employer Dashboard</Link></li>
              <li><Link href="/dashboard/company">Post an Internship</Link></li>
              <li><Link href="/register">Employer Signup</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} InternBridge. All rights reserved.
          </p>
          <div className={styles.socials}>
            <a href="#" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="#" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="#" target="_blank" rel="noopener noreferrer">Github</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
