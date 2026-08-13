import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Notification.css';
import { loadNotifs, saveNotifs, addLoginNotif } from './notifUtils';
import { apiFetch } from '../../../utils/api';

// Backend Notification doc -> same {id,title,body,date,ts} shape the
// rest of this page already renders (from notifUtils' local ones).
function formatBackendNotif(n) {
  const d = new Date(n.createdAt);
  const pad2 = (v) => String(v).padStart(2, '0');
  const dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  const fallbackTitle = { deposit: 'DEPOSIT NOTIFICATION', withdrawal: 'WITHDRAWAL NOTIFICATION', gift: 'GIFT NOTIFICATION', promo: 'PROMOTION', system: 'SYSTEM NOTIFICATION' };
  return {
    id: n._id,
    title: n.title || fallbackTitle[n.type] || 'NOTIFICATION',
    body: n.message,
    date: dateStr,
    ts: d.getTime(),
    fromBackend: true
  };
}

const INFO = [
  {
    id: 'info_1',
    title: 'Welcome to Alfa9!',
    body: 'Wish all of our customers a great experience playing games on the Alfa9 platform.',
    date: '2024-03-05 13:13:52',
  },
  {
    id: 'info_2',
    title: 'Withdrawal Notice',
    body: 'Dear members, before withdrawing please confirm that your wallet has been verified, and the ID card and account number used for verification are true and valid, otherwise your withdrawal will not be successful!',
    date: '2024-05-01 17:21:59',
  },
];

function iconForTitle(title) {
  const t = (title || '').toUpperCase();
  if (t.includes('LOGIN')) {
    return {
      tone: 'tone-gold',
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    };
  }
  if (t.includes('WITHDRAW')) {
    return {
      tone: 'tone-red',
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 6v0M18 18v0" />
        </svg>
      ),
    };
  }
  if (t.includes('DEPOSIT')) {
    return {
      tone: 'tone-green',
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M12 9v0M12 15v0" />
        </svg>
      ),
    };
  }
  if (t.includes('REGISTR')) {
    return {
      tone: 'tone-green',
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
      ),
    };
  }
  if (t.includes('WELCOME')) {
    return {
      tone: 'tone-green',
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="13" rx="1" /><path d="M12 8v13M3 12h18" />
          <path d="M12 8c-1.5 0-3-1-3-2.5S10 3 12 5c0-2 1.5-2.5 3-2.5s3 1 3 2.5S13.5 8 12 8Z" />
        </svg>
      ),
    };
  }
  return {
    tone: 'tone-gold',
    svg: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  };
}

function isRecent(ts) {
  if (!ts) return false;
  return Date.now() - ts < 24 * 60 * 60 * 1000;
}

function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  const cx = e.clientX || rect.left + rect.width / 2;
  const cy = e.clientY || rect.top + rect.height / 2;
  ripple.style.left = cx - rect.left - size / 2 + 'px';
  ripple.style.top = cy - rect.top - size / 2 + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

function Notification() {
  const navigate = useNavigate();

  const [tab, setTab] = useState('notification');
  const [switching, setSwitching] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [removingId, setRemovingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const toastTimer = useRef(null);

  useEffect(() => {
    // Local ones: just the login/register session pings.
    addLoginNotif();
    const local = loadNotifs();

    // Real ones: actual deposit/withdrawal approvals etc. from the backend.
    (async () => {
      try {
        const data = await apiFetch('/notifications/my');
        const backend = (data.notifications || []).map(formatBackendNotif);
        const merged = [...backend, ...local].sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setNotifs(merged);
      } catch (err) {
        // not logged in yet, or backend unreachable — just show the local ones
        setNotifs(local);
      }
    })();
  }, []);

  const switchTab = (t, e) => {
    if (t === tab) return;
    addRipple(e);
    setTab(t);
    setSwitching(true);
    setTimeout(() => setSwitching(false), 300);
  };

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000);
  };

  const askDelete = (id) => { setDeleteId(id); setModalOpen(true); };
  const closeModal = () => { setDeleteId(null); setModalOpen(false); };

  const confirmDelete = (e) => {
    addRipple(e);
    if (!deleteId) { closeModal(); return; }
    const id = deleteId;
    closeModal();
    setRemovingId(id);
    setTimeout(() => {
      // Local (login/register) notifs live in localStorage — keep that in sync.
      saveNotifs(loadNotifs().filter((n) => n.id !== id));
      // Whether local or backend-sourced, drop it from what's on screen.
      setNotifs((prev) => prev.filter((n) => n.id !== id));
      setRemovingId(null);
      showToast('Message deleted');
    }, 300);
  };

  const list = tab === 'information' ? INFO : notifs;
  const isInfoTab = tab === 'information';

  return (
    <div className="notification-page">
      <div className="top-bar">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="top-title">Notification</span>
      </div>

      <div className="tabs-wrap">
        <button className={`tab-btn${tab === 'notification' ? ' active' : ''}`} onClick={(e) => switchTab('notification', e)}>Notification</button>
        <button className={`tab-btn${tab === 'information' ? ' active' : ''}`} onClick={(e) => switchTab('information', e)}>Information</button>
      </div>

      <div className={`notif-list${switching ? ' switching' : ''}${isInfoTab ? ' info-list' : ''}`}>
        {list.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon-wrap">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="1.6">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            {isInfoTab ? 'No information yet' : 'No notifications yet'}
          </div>
        ) : (
          list.map((n) => {
            const ic = iconForTitle(n.title);
            const badge = !isInfoTab && isRecent(n.ts);
            return (
              <div key={n.id} className={`notif-card${isInfoTab ? ' info-card' : ''}${removingId === n.id ? ' removing' : ''}`}>
                <div className="notif-header">
                  <div className="notif-title-row">
                    <div className={`notif-icon ${ic.tone}`}>{ic.svg}</div>
                    <div className="notif-title-col">
                      <div className="notif-title-line">
                        <div className="notif-title">{n.title}</div>
                        {isInfoTab && <span className="info-badge">Official</span>}
                        {badge && <span className="notif-new-badge">NEW</span>}
                      </div>
                      <div className="notif-date">{n.date}</div>
                    </div>
                  </div>
                  {!isInfoTab && (
                    <button className="delete-btn" onClick={(e) => { addRipple(e); askDelete(n.id); }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E52525" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="notif-body">{n.body}</div>
              </div>
            );
          })
        )}
      </div>

      <div className={`modal-overlay${modalOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal-box">
          <div className="modal-warn-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>
          <div className="modal-title">Warning</div>
          <div className="modal-msg">Are you sure to delete this message?</div>
          <div className="modal-btns">
            <button className="modal-cancel" onClick={closeModal}>Cancel</button>
            <button className="modal-confirm" onClick={confirmDelete}>Confirm</button>
          </div>
        </div>
      </div>

      <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default Notification;