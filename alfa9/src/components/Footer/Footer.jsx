import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import './Footer.css';

// active: 'home' | 'activity' | 'promotion' | 'account' | ''
function Footer({ active = '' }) {
  const { t } = useLanguage();
  return (
    <div className="casino-sticky-container">
      <div className="add-to-desktop-container">
        <div className="add-to-desktop-btn">
          <img className="add-to-desktop-icon" src="/image/favi.png" alt="Icon" />
          <span className="add-to-desktop-text">{t('add_to_desktop')}</span>
        </div>
      </div>

      <div className="casino-footer-bar">
        <Link to="/home" className={`casino-nav-item ${active === 'home' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <svg className="casino-nav-svg" width="28" height="26" viewBox="0 0 46 42" fill="none" filter="url(#luxury-3d)">
            <path d="M9 29C9 20 14 15 23 15C32 15 37 20 37 29H9Z" fill="url(#ruby-gradient)" opacity="0.85" />
            <path d="M7 27C7 25 9 24 12 24H34C37 24 39 25 39 27V31C39 33 37 34 34 34H12C9 34 7 33 7 31V27Z" fill="url(#gold-5d)" />
            <circle cx="14" cy="29" r="1.5" fill="#FFFBF0" /><circle cx="23" cy="29" r="1.5" fill="#FFFBF0" /><circle cx="32" cy="29" r="1.5" fill="#FFFBF0" />
            <path d="M23 4L27.5 17L23 25L18.5 17L23 4Z" fill="url(#gold-5d)" />
            <path d="M11 9L16.5 19L13 25L8.5 19L11 9Z" fill="url(#gold-5d)" />
            <path d="M35 9L37.5 19L33 25L29.5 19L35 9Z" fill="url(#gold-5d)" />
            <circle cx="23" cy="2" r="2" fill="url(#gold-5d)" /><circle cx="11" cy="7" r="1.5" fill="url(#gold-5d)" /><circle cx="35" cy="7" r="1.5" fill="url(#gold-5d)" />
            <path d="M9 34H37V36H9V34Z" fill="url(#gold-5d)" />
          </svg>
          <span className="casino-nav-text">{t('nav_home')}</span>
        </Link>

        <Link to="/activity" className={`casino-nav-item ${active === 'activity' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <svg className="casino-nav-svg" width="28" height="26" viewBox="0 0 46 42" fill="none" filter="url(#luxury-3d)">
            <path d="M6 35C6 35 13 37.5 23 37.5C33 37.5 40 35 40 35V38.5C40 38.5 33 40.5 23 40.5C13 40.5 6 38.5 6 38.5V35Z" fill="url(#gold-5d)" />
            <path d="M23 11C23 11 15 7.5 6 10V30.5C15 28 23 31.5 23 31.5C23 31.5 31 28 40 30.5V10C31 7.5 23 11 23 11Z" fill="#FFFBF0" stroke="url(#gold-5d)" strokeWidth="1.8" />
            <rect x="22.25" y="9" width="1.5" height="22.5" fill="url(#gold-5d)" />
            <path d="M23 3L26 6L23 9L20 6L23 3Z" fill="url(#gold-5d)" />
            <path d="M24.5 31.5V36.5L26.5 34.5L28.5 36.5V31.5H24.5Z" fill="url(#gold-5d)" />
          </svg>
          <span className="casino-nav-text">{t('nav_activity')}</span>
        </Link>

        <Link to="/spin" className="casino-wheel-wrapper" style={{ textDecoration: 'none' }}>
          <div className="wheel-image-container">
            <img className="wheel-img" src="/image/Spin Wheel.png" alt="Spin Wheel" />
          </div>
          <span className="wheel-text">{t('nav_spin')}</span>
        </Link>

        <Link to="/promotion" className={`casino-nav-item ${active === 'promotion' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <svg className="casino-nav-svg" width="28" height="26" viewBox="0 0 45 42" fill="none" filter="url(#luxury-3d)">
            <path d="M22.5 12C16 12 10.5 15 10.5 24.5C10.5 33 15 37.5 22.5 37.5C30 37.5 34.5 33 34.5 24.5C34.5 15 29 12 22.5 12Z" fill="url(#leather-gradient)" stroke="url(#gold-5d)" strokeWidth="1.5" />
            <path d="M16 12C15.2 8.5 17.5 6.5 19 8C20.5 6.5 23.5 6.5 25 8C26.5 6.5 28.8 8.5 28 12H16Z" fill="url(#gold-5d)" />
            <path d="M14.5 13C19 14.5 26 14.5 30.5 13" stroke="url(#gold-5d)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="22.5" cy="25.5" r="6" fill="url(#gold-5d)" />
            <text x="22.5" y="28.5" fontFamily="sans-serif" fontSize="9px" fontWeight="bold" fill="#140A03" textAnchor="middle">$</text>
          </svg>
          <span className="casino-nav-text">{t('nav_promotion')}</span>
        </Link>

        <Link to="/account" className={`casino-nav-item ${active === 'account' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <svg className="casino-nav-svg" width="28" height="26" viewBox="0 0 45 42" fill="none" filter="url(#luxury-3d)">
            <circle cx="22.5" cy="21" r="18" fill="#1C1109" stroke="url(#gold-5d)" strokeWidth="2" />
            <circle cx="22.5" cy="21" r="14" fill="url(#leather-gradient)" />
            <path d="M16.5 15.5L19 18L22.5 14.5L26 18L28.5 15.5V20H16.5V15.5Z" fill="url(#gold-5d)" />
            <circle cx="22.5" cy="23.5" r="3" fill="url(#gold-5d)" />
            <path d="M16 31.5C18 29.5 27 29.5 29 31.5V33.5H16V31.5Z" fill="url(#gold-5d)" />
          </svg>
          <span className="casino-nav-text">{t('nav_account')}</span>
        </Link>
      </div>

      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="luxury-3d" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
            <feOffset in="blur" dx="0.5" dy="1.5" result="offset" />
            <feSpecularLighting in="blur" surfaceScale="3" specularConstant="1.2" specularExponent="12" lightingColor="#FFEFA6" result="specOut">
              <fePointLight x="-50" y="-100" z="150" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specChar" />
            <feComposite in="SourceGraphic" in2="specChar" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
          </filter>
          <linearGradient id="gold-5d" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7A581C" />
            <stop offset="25%" stopColor="#D4AF37" />
            <stop offset="45%" stopColor="#FFF3CD" />
            <stop offset="55%" stopColor="#E1B743" />
            <stop offset="75%" stopColor="#A67C1E" />
            <stop offset="100%" stopColor="#F3DA95" />
          </linearGradient>
          <linearGradient id="ruby-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E52525" />
            <stop offset="100%" stopColor="#5A0000" />
          </linearGradient>
          <linearGradient id="leather-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4E2F13" />
            <stop offset="100%" stopColor="#140A03" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default Footer;