import { useLanguage } from '../../context/LanguageContext.jsx';
import './LanguageSwitcher.css';

// A bottom-sheet modal listing all supported languages. Any page can open
// it — pass `open` + `onClose`. Selecting a language updates it everywhere
// in the app immediately (LanguageContext is app-wide) and persists it, so
// it stays selected next time the person visits.
function LanguageSwitcher({ open, onClose }) {
  const { language, setLanguage, t, languages } = useLanguage();

  if (!open) return null;

  const handleSelect = (code) => {
    setLanguage(code);
    onClose();
  };

  return (
    <div className="lang-switcher-overlay" onClick={onClose}>
      <div className="lang-switcher-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="lang-switcher-handle" />
        <div className="lang-switcher-title">{t('select_language')}</div>
        <div className="lang-switcher-hint">{t('language_hint')}</div>

        <div className="lang-switcher-list">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`lang-switcher-item${language === l.code ? ' active' : ''}`}
              onClick={() => handleSelect(l.code)}
            >
              <span className="lang-switcher-native">{l.native}</span>
              <span className="lang-switcher-label">{l.label}</span>
              {language === l.code && (
                <svg className="lang-switcher-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <button type="button" className="lang-switcher-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default LanguageSwitcher;