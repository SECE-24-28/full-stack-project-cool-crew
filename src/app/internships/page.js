'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JobCard from '@/components/JobCard';
import { useAuth } from '@/context/AuthContext';
import styles from './Internships.module.css';

export default function Internships() {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [appliedInternshipIds, setAppliedInternshipIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchText, setSearchText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [durationFilter, setDurationFilter] = useState('');

  // Active filters applied to query
  const [queryFilters, setQueryFilters] = useState({
    search: '',
    location: '',
    duration: '',
  });

  const fetchInternships = useCallback(async () => {
    setLoading(true);
    try {
      const { search, location, duration } = queryFilters;
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (location) params.append('location', location);
      if (duration) params.append('duration', duration);

      const res = await fetch(`/api/internships?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInternships(data);
      } else {
        console.error('Failed to fetch internships');
      }
    } catch (err) {
      console.error('Error fetching internships:', err);
    } finally {
      setLoading(false);
    }
  }, [queryFilters]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  useEffect(() => {
    async function fetchAppliedInternships() {
      if (user && user.role === 'student') {
        try {
          const res = await fetch('/api/applications');
          if (res.ok) {
            const data = await res.json();
            const ids = new Set(data.map(app => app.internship.id));
            setAppliedInternshipIds(ids);
          }
        } catch (err) {
          console.error('Error fetching student applications:', err);
        }
      } else {
        setAppliedInternshipIds(new Set());
      }
    }
    fetchAppliedInternships();
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setQueryFilters({
      search: searchText,
      location: locationText,
      duration: durationFilter,
    });
  };

  const handleClearFilters = () => {
    setSearchText('');
    setLocationText('');
    setDurationFilter('');
    setQueryFilters({
      search: '',
      location: '',
      duration: '',
    });
  };

  return (
    <div className={styles.wrapper}>
      <Navbar />

      <main className={`container ${styles.mainSection}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Browse Internships</h1>
          <p className={styles.subtitle}>Apply to handpicked, verified placements matched to your career path</p>
        </div>

        {/* Search Input Box */}
        <section className={styles.searchSection}>
          <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
            <div className={styles.searchInputWrapper}>
              <span className={styles.inputIcon}>🔍</span>
              <input
                type="text"
                className={styles.input}
                placeholder="Search title, tech stack, skills (e.g. React, Python)"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            
            <div className={styles.locationInputWrapper}>
              <span className={styles.inputIcon}>📍</span>
              <input
                type="text"
                className={styles.input}
                placeholder="City or 'Remote'"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
              Search
            </button>
          </form>
        </section>

        {/* Filters and List Grid */}
        <div className={styles.layout}>
          {/* Filters Sidebar */}
          <aside className={styles.filtersCard}>
            <div className={styles.filterGroup}>
              <h3 className={styles.filterTitle}>Duration</h3>
              <select
                className="form-control"
                style={{ cursor: 'pointer' }}
                value={durationFilter}
                onChange={(e) => {
                  setDurationFilter(e.target.value);
                  setQueryFilters(prev => ({ ...prev, duration: e.target.value }));
                }}
              >
                <option value="">Any Duration</option>
                <option value="1 Month">1 Month</option>
                <option value="2 Months">2 Months</option>
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
              </select>
            </div>

            <button
              onClick={handleClearFilters}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', marginTop: '16px' }}
            >
              Clear All Filters
            </button>
          </aside>

          {/* Results Column */}
          <section className={styles.listingsColumn}>
            <div className={styles.listHeader}>
              <span className={styles.countText}>
                {loading ? 'Finding postings...' : `${internships.length} internship${internships.length !== 1 ? 's' : ''} found`}
              </span>
            </div>

            {loading ? (
              <div className={styles.loader}>
                <div className={styles.spinner}></div>
                <p>Loading placements...</p>
              </div>
            ) : internships.length > 0 ? (
              internships.map((internship) => (
                <div key={internship._id} className="animate-fade-in">
                  <JobCard 
                    internship={internship} 
                    alreadyApplied={appliedInternshipIds.has(internship._id)}
                  />
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📂</div>
                <h3 className={styles.emptyTitle}>No Internships Found</h3>
                <p className={styles.emptyDesc}>
                  We couldn't find any opportunities matching your criteria. Try adjusting your search query, location text, or filters.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
