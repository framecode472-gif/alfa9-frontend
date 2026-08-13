import { useNavigate } from 'react-router-dom';
import './WinStreak.css';

function WinStreak() {
  const navigate = useNavigate();

  return (
    <div className="ad-page">
      <header className="ad-header">
        <button className="ad-back" onClick={() => navigate(-1)} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="ad-title">Activity details</h1>
      </header>

      <div className="ad-banner">
        <img src="/image/activity-5.png" alt="WIN STREAK BONUS" />
      </div>

      <div className="ad-section-title">WIN STREAK BONUS</div>

      <div className="ad-body">
        {/* Placeholder — replace with the real info graphic for this activity */}
        <img src="/image/alfa-coming-soon.png" alt="WIN STREAK BONUS details" />
      </div>
    </div>
  );
}

export default WinStreak;