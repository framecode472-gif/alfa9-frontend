import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './RebateRatio.css';

const LOTTERY_DATA = [
  ['0.55%', '0.18%', '0.054%', '0.0162%', '0.00486%', '0.001458%'],
  ['0.65%', '0.245%', '0.08575%', '0.030012%', '0.010504%', '0.003677%'],
  ['0.7%', '0.28125%', '0.105469%', '0.039551%', '0.014832%', '0.005562%'],
  ['0.75%', '0.32%', '0.128%', '0.0512%', '0.02048%', '0.008192%'],
  ['0.8%', '0.36125%', '0.153531%', '0.065251%', '0.027732%', '0.011786%'],
  ['0.85%', '0.405%', '0.18225%', '0.082012%', '0.036906%', '0.016608%'],
  ['0.9%', '0.5%', '0.25%', '0.125%', '0.0625%', '0.03125%'],
  ['0.95%', '0.605%', '0.33275%', '0.183013%', '0.100657%', '0.055361%'],
  ['1%', '0.72%', '0.432%', '0.2592%', '0.15552%', '0.093312%'],
  ['1.4%', '0.98%', '0.686%', '0.4802%', '0.33614%', '0.235298%'],
];

const CASINO_DATA = [
  ['0.3%', '0.09%', '0.027%', '0.0081%', '0.00243%', '0.000729%'],
  ['0.35%', '0.1225%', '0.042875%', '0.015006%', '0.005252%', '0.001838%'],
  ['0.375%', '0.140625%', '0.052734%', '0.019775%', '0.007416%', '0.002781%'],
  ['0.4%', '0.16%', '0.064%', '0.0256%', '0.01024%', '0.004096%'],
  ['0.425%', '0.180625%', '0.076766%', '0.032625%', '0.013866%', '0.005893%'],
  ['0.45%', '0.2025%', '0.091125%', '0.041006%', '0.018453%', '0.008304%'],
  ['0.5%', '0.25%', '0.125%', '0.0625%', '0.03125%', '0.015625%'],
  ['0.55%', '0.3025%', '0.166375%', '0.091506%', '0.050328%', '0.027681%'],
  ['0.6%', '0.36%', '0.216%', '0.1296%', '0.07776%', '0.046656%'],
  ['0.7%', '0.49%', '0.343%', '0.2401%', '0.16807%', '0.117649%'],
];

const TABS = [
  { id: 'lottery', labelKey: 'cat_lottery', data: LOTTERY_DATA },
  { id: 'casino', labelKey: 'cat_casino', data: CASINO_DATA },
  { id: 'sports', labelKey: 'cat_sports', data: CASINO_DATA },
  { id: 'rummy', labelKey: 'cat_rummy', data: CASINO_DATA },
  { id: 'slots', labelKey: 'cat_slots', data: CASINO_DATA },
];

const TAB_ICONS = {
  lottery: (active) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="10" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.8" />
      <circle cx="13" cy="13" r="6" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.8" />
      <circle cx="13" cy="13" r="2.5" fill={active ? '#140A03' : '#8B7355'} />
      <line x1="13" y1="3" x2="13" y2="7" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="19" x2="13" y2="23" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="13" x2="7" y2="13" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="2" strokeLinecap="round" />
      <line x1="19" y1="13" x2="23" y2="13" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  casino: (active) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="3" y="5" width="20" height="14" rx="2" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.8" />
      <line x1="3" y1="12" x2="23" y2="12" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.2" strokeDasharray="2 2" />
      <rect x="10" y="19" width="6" height="3" fill={active ? '#140A03' : '#8B7355'} rx="1" />
      <line x1="7" y1="22" x2="19" y2="22" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="2" strokeLinecap="round" />
      <circle cx="13" cy="8.5" r="1.5" fill={active ? '#140A03' : '#8B7355'} />
    </svg>
  ),
  sports: (active) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="10" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.8" />
      <path d="M13 3 C10 6 10 8 13 10 C16 8 16 6 13 3Z" fill={active ? '#140A03' : '#8B7355'} />
      <path d="M3 13 C6 10 8 10 10 13 C8 16 6 16 3 13Z" fill={active ? '#140A03' : '#8B7355'} />
      <path d="M23 13 C20 16 18 16 16 13 C18 10 20 10 23 13Z" fill={active ? '#140A03' : '#8B7355'} />
      <path d="M13 23 C10 20 10 18 13 16 C16 18 16 20 13 23Z" fill={active ? '#140A03' : '#8B7355'} />
      <path d="M6.5 6.5 C8 9 10 10 13 10 C16 10 18 9 19.5 6.5" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.2" />
      <path d="M6.5 19.5 C8 17 10 16 13 16 C16 16 18 17 19.5 19.5" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.2" />
    </svg>
  ),
  rummy: (active) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="5" y="3" width="16" height="20" rx="3" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.8" />
      <path d="M13 8 C13 8 10 11 10 13 C10 14.7 11.3 16 13 16 C14.7 16 16 14.7 16 13 C16 11 13 8 13 8Z" fill={active ? '#140A03' : '#8B7355'} />
      <line x1="9" y1="19" x2="17" y2="19" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  slots: (active) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="3" y="5" width="20" height="16" rx="3" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.8" />
      <rect x="6" y="9" width="4" height="8" rx="1.5" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.5" />
      <rect x="11" y="9" width="4" height="8" rx="1.5" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.5" />
      <rect x="16" y="9" width="4" height="8" rx="1.5" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="1.5" />
      <line x1="8" y1="3" x2="8" y2="6" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="3" x2="13" y2="6" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="3" x2="18" y2="6" stroke={active ? '#140A03' : '#8B7355'} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const ROW_LABEL_KEYS = ['rr_row_1', 'rr_row_2', 'rr_row_3', 'rr_row_4', 'rr_row_5', 'rr_row_6'];

function LevelCard({ level, values }) {
  const { t } = useLanguage();
  return (
    <div className="level-card">
      <div className="level-header"><span className="level-title">{t('rr_level')}</span><span className="level-num">{level}</span></div>
      <div className="rebate-rows">
        {values.map((pct, i) => (
          <div className="rebate-row" key={i}>
            <div className="row-left">
              <div className="dot-wrap"><div className="dot-circle"><div className="dot-inner"></div></div></div>
              <span className="rebate-label">{t(ROW_LABEL_KEYS[i])}</span>
            </div>
            <span className={`rebate-pct${i === 0 ? ' gold' : ''}`}>{pct}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RebateRatio() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('lottery');
  const tabRefs = useRef({});

  const handleTabClick = (id) => {
    setActiveTab(id);
    tabRefs.current[id]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const activeData = TABS.find((t) => t.id === activeTab).data;

  return (
    <div className="page-wrapper rebate-ratio-page">
      <div className="top-bar">
        <a className="back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>
        <span className="top-title">{t('rr_title')}</span>
      </div>

      <div className="tabs-outer">
        <div className="tabs-scroll">
          {TABS.map((tab) => (
            <div
              key={tab.id}
              ref={(el) => (tabRefs.current[tab.id] = el)}
              className={`tab-item${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <div className="tab-icon">{TAB_ICONS[tab.id](activeTab === tab.id)}</div>
              <span className="tab-label">{t(tab.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="content-area">
        <div className="tab-panel active">
          {activeData.map((values, i) => (
            <LevelCard key={i} level={`L${i}`} values={values} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default RebateRatio;