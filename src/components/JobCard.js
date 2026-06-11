import Link from 'next/link';
import styles from './JobCard.module.css';

export default function JobCard({ internship, alreadyApplied }) {
  const { _id, title, stipend, duration, location, skillsRequired, company, createdAt } = internship;

  // Format date helper
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const companyInitial = company?.companyName ? company.companyName.charAt(0).toUpperCase() : 'C';

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 className={styles.title}>{title}</h3>
            {alreadyApplied && <span className={styles.appliedBadge}>✓ Applied</span>}
          </div>
          <span className={styles.companyName}>{company?.companyName || 'Unknown Company'}</span>
        </div>
        <div className={styles.logoPlaceholder}>
          {companyInitial}
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span>📍</span>
          {location}
        </div>
        <div className={styles.detailItem}>
          <span>💵</span>
          {stipend}
        </div>
        <div className={styles.detailItem}>
          <span>📅</span>
          {duration}
        </div>
      </div>

      <div className={styles.tags}>
        {skillsRequired?.map((skill, index) => (
          <span key={index} className={styles.tag}>
            {skill}
          </span>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.time}>Posted {formatDate(createdAt)}</span>
        <Link href={`/internships/${_id}`} className={styles.actionBtn}>
          View Details
        </Link>
      </div>
    </article>
  );
}
