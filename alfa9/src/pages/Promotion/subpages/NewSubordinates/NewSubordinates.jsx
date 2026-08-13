import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import './NewSubordinates.css';

const FILTERS = ['Today', 'Yesterday', 'This month'];

function NewSubordinates() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Today');
  const [subordinates, setSubordinates] = useState([]);

  useEffect(() => {
    apiFetch(`/promotion/new-subordinates?filter=${encodeURIComponent(activeFilter)}`)
      .then((data) => {
        setSubordinates((data.subordinates || []).map((s) => ({
          id: s.id,
          initial: s.initial,
          name: s.name,
          date: new Date(s.date).toLocaleDateString(),
          amount: `Rs${Number(s.amount).toFixed(2)}`
        })));
      })
      .catch(() => setSubordinates([]));
  }, [activeFilter]);

  return (
    <div className="new-subordinates-page">
      <div className="page-wrapper">
        {/* HEADER */}
        <div className="top-bar">
          <div className="back-btn" onClick={() => navigate(-1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>
          <span className="top-title">New subordinates</span>
        </div>

        {/* FILTER TABS */}
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <div
              key={f}
              className={`filter-tab ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {subordinates.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                  stroke="url(#eg1)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M14 2v6h6" stroke="url(#eg1)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 13h8M8 17h5" stroke="url(#eg1)" strokeWidth="1.4" strokeLinecap="round" />
                <defs>
                  <linearGradient id="eg1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5A4020" />
                    <stop offset="100%" stopColor="#3A2812" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="empty-label">No data</div>
          </div>
        )}

        {/* LIST (populated state) */}
        {subordinates.length > 0 && (
          <div className="sub-list">
            {subordinates.map((s) => (
              <div className="sub-item" key={s.id}>
                <div className="sub-avatar">{s.initial}</div>
                <div className="sub-info">
                  <div className="sub-name">{s.name}</div>
                  <div className="sub-date">{s.date}</div>
                </div>
                <div className="sub-amount">{s.amount}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bottom-spacer"></div>
      </div>
    </div>
  );
}

export default NewSubordinates;