import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io as socketIOClient } from 'socket.io-client';
import './AdminPanel.css';

/* ============================================================
   ALFA9 ADMIN PANEL
   Deposits, Withdrawals aur Dashboard ab REAL backend API se
   connect hain. Baaki sections (bonuses, gifts, games,
   notifications) abhi bhi local/UI-only hain — jab unka backend
   ready ho tab wahi pattern (apiFetch) use kar ke wire kar lena.
   ============================================================ */

// ===== API HELPER =====
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/admin';

const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('alfa9_admin_token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API Error');
  }

  return response.json();
};

// Notifications live under /api/notifications on the backend, not /api/admin —
// separate helper so those calls hit the right base URL.
const NOTIF_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// socket.io connects to the raw server root, not the /api path — strip it off.
const SOCKET_URL = NOTIF_BASE.replace(/\/api\/?$/, '');

const notifFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('alfa9_admin_token');

  const response = await fetch(`${NOTIF_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API Error');
  }

  return response.json();
};

// Chatbot/chat-logs live under /api/chatbot on the backend
const CHATBOT_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/chatbot';

const chatbotFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('alfa9_admin_token');

  const response = await fetch(`${CHATBOT_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API Error');
  }

  return response.json();
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'users', label: 'Users', icon: 'wallet' },
  { key: 'deposits', label: 'Deposits', icon: 'download' },
  { key: 'withdrawals', label: 'Withdrawals', icon: 'upload' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'chats', label: 'AI Chats', icon: 'chat' },
  { key: 'bonuses', label: 'Bonuses', icon: 'gift' },
  { key: 'gifts', label: 'Gift codes', icon: 'ticket' },
  { key: 'games', label: 'Games', icon: 'dice' },
  { key: 'points', label: 'Give Points', icon: 'wallet' },
];

function Icon({ name }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'grid': return <svg {...common}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
    case 'download': return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
    case 'upload': return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
    case 'gift': return <svg {...common}><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>;
    case 'ticket': return <svg {...common}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" /><line x1="13" y1="5" x2="13" y2="19" strokeDasharray="2 2" /></svg>;
    case 'dice': return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8" cy="8" r="1" fill="currentColor" /><circle cx="16" cy="16" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>;
    case 'users': return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'wallet': return <svg {...common}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case 'bell': return <svg {...common}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case 'chat': return <svg {...common}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;
    case 'copy': return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
    case 'plus': return <svg {...common}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    case 'trash': return <svg {...common}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>;
    case 'check': return <svg {...common}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'chevron-up': return <svg {...common}><polyline points="18 15 12 9 6 15" /></svg>;
    case 'logout': return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
    case 'menu': return <svg {...common}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
    case 'x': return <svg {...common}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
    case 'empty-inbox': return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>;
    case 'empty': return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
    case 'bell-empty': return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case 'gift-empty': return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" /></svg>;
    default: return null;
  }
}

const fmt = (n) => 'Rs' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const nowStamp = () => {
  const d = new Date();
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${day} ${month}, ${h}:${m} ${ampm}`;
};

/* ── Real starting state: no members, no requests, no fake activity.
   Deposits/withdrawals ab API se fetch hote hain, isliye yahan sirf
   empty defaults hain jab tak pehli fetch complete na ho. ── */
const INITIAL_DEPOSITS = [];
const INITIAL_WITHDRAWALS = [];
const INITIAL_NOTIFICATIONS = [];
const INITIAL_CODES = [];

const INITIAL_BONUSES = [
  { key: 'deposit', title: 'New member 1st deposit', desc: 'Bonus applied automatically on a member\u2019s first successful deposit.', enabled: true, value: 100, unit: '%', cap: 5000 },
  { key: 'invite', title: 'Invitation bonus', desc: 'Paid to the referrer once an invited member completes their first deposit.', enabled: true, value: 500, unit: 'Rs', cap: 0 },
  { key: 'attendance', title: 'Attendance bonus', desc: 'Reward increases with consecutive daily sign-ins.', enabled: true, value: 50, unit: 'Rs', cap: 0 },
  { key: 'rebate', title: 'Betting rebate', desc: 'Percentage of daily turnover returned as bonus balance.', enabled: false, value: 1.5, unit: '%', cap: 2000 },
];

// Same images/keys used on the Home page. gameName on the backend
// (GameSetting/Bet models) already supports 'boom' — this just surfaces
// its win-rate/maintenance/bet-limit controls in the admin UI too.
const INITIAL_GAMES = [
  { key: 'wingo', name: 'Win Go', img: '/image/wingo.png', enabled: true, winRate: 50, maintenance: false },
  { key: 'k3', name: 'K3', img: '/image/k3.png', enabled: true, winRate: 50, maintenance: false },
  { key: '5d', name: '5D', img: '/image/5D.png', enabled: true, winRate: 50, maintenance: false },
  { key: 'boom', name: 'Booms Mines', img: '/image/Booms.png', enabled: true, winRate: 50, maintenance: false },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const toastTimer = useRef(null);

  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);

  const [deposits, setDeposits] = useState(INITIAL_DEPOSITS);
  const [dTab, setDTab] = useState('pending');
  const [withdrawals, setWithdrawals] = useState(INITIAL_WITHDRAWALS);
  const [wTab, setWTab] = useState('pending');
  const [bonuses, setBonuses] = useState(INITIAL_BONUSES);
  const [codes, setCodes] = useState(INITIAL_CODES);
  const [games, setGames] = useState(INITIAL_GAMES);

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const [chatLogs, setChatLogs] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // ===== GLOBAL SEARCH (topbar) — filters whichever table is on screen =====
  const [searchQuery, setSearchQuery] = useState('');

  // ===== LIVE CONNECTION (socket.io) — pushes updates the instant a member
  // submits a deposit/withdrawal, no manual refresh or polling needed. =====
  const [liveConnected, setLiveConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('alfa9_role'); // clears the flag AdminRoute checks
    localStorage.removeItem('alfa9_admin_token');
    setProfileOpen(false);
    navigate('/admin-login');
  };

  const showToast = (msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    setToastShow(true);
    toastTimer.current = setTimeout(() => setToastShow(false), 2400);
  };

  // ===== DATA FETCH FUNCTIONS (REAL API) =====

  // Dashboard stats fetch
  const fetchDashboard = async () => {
    try {
      const data = await apiFetch('/dashboard');
      setDashboardStats(data);
    } catch (err) {
      showToast('Failed to load dashboard');
    }
  };

  // Deposits fetch
  const fetchDeposits = async (status) => {
    try {
      const data = await apiFetch(`/deposits?status=${status}`);
      const formatted = data.deposits.map((d) => ({
        id: d._id,
        user: d.userId?.name || 'Unknown',
        uid: d.userId?.uid || d.userId?._id?.toString().slice(-6) || 'N/A',
        amount: d.amount,
        method: d.method,
        status: d.status,
        time: new Date(d.createdAt).toLocaleString(),
        // New deposits store the screenshot as a base64 data URI (works forever,
        // survives Railway redeploys). Old deposits made before this fix still
        // have a disk path like "/uploads/screenshots/xxx.jpg" — those will 404
        // since the old files no longer exist, but we keep the fallback so we
        // don't crash on old records.
        screenshot: d.screenshot ? (d.screenshot.startsWith('data:') ? d.screenshot : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}${d.screenshot}`) : null,
        flagged: !!d.flagged,
        flagReason: d.flagReason || null,
      }));
      setDeposits(formatted);
    } catch (err) {
      showToast('Failed to load deposits');
    }
  };

  // Withdrawals fetch
  const fetchWithdrawals = async (status) => {
    try {
      const data = await apiFetch(`/withdrawals?status=${status}`);
      const formatted = data.withdrawals.map((w) => ({
        id: w._id,
        user: w.userId?.name || 'Unknown',
        uid: w.userId?.uid || w.userId?._id?.toString().slice(-6) || 'N/A',
        amount: w.amount,
        method: w.method,
        account: w.upiId || w.accountNumber || 'N/A',
        status: w.status,
        time: new Date(w.createdAt).toLocaleString(),
        wagerRequired: w.userId?.wagering?.required || 0,
        wagerCompleted: w.userId?.wagering?.completed || 0,
      }));
      setWithdrawals(formatted);
    } catch (err) {
      showToast('Failed to load withdrawals');
    }
  };

  // Users fetch — the list admin uses to find a member's real MongoDB _id
  const fetchUsers = async () => {
    try {
      const data = await apiFetch('/users?limit=100');
      setUsers(data.users || []);
    } catch (err) {
      showToast('Failed to load users');
    }
  };

  // Admin sets/overrides a user's wagering (turnover) requirement — the
  // "must bet this much before withdrawing" gate. Raise `required` above
  // `completed` to deliberately delay a specific user's withdrawal, or set
  // required to 0 (or completed = required) to unlock them immediately.
  const updateUserWagering = async (userId, payload) => {
    try {
      await apiFetch(`/users/${userId}/wagering`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Wagering requirement updated');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update wagering');
    }
  };

  // Generates a brand-new password for a locked-out user (never displays
  // their real one — see resetUserPassword in adminController for why).
  const resetUserPassword = async (userId) => {
    try {
      const data = await apiFetch(`/users/${userId}/reset-password`, { method: 'POST' });
      return data.tempPassword;
    } catch (err) {
      showToast(err.message || 'Failed to reset password');
      return null;
    }
  };

  // ===== AUTO FETCH ON TAB CHANGE =====
  useEffect(() => {
    if (activeNav === 'dashboard') fetchDashboard();
    if (activeNav === 'users') fetchUsers();
    if (activeNav === 'deposits') fetchDeposits(dTab);
    if (activeNav === 'withdrawals') fetchWithdrawals(wTab);
    if (activeNav === 'gifts') fetchGiftCodes();
    if (activeNav === 'games') fetchGameSettings();
    if (activeNav === 'bonuses') fetchBonuses();
    if (activeNav === 'notifications') fetchAdminNotifications();
    if (activeNav === 'chats') fetchChatLogs();
  }, [activeNav, dTab, wTab]);

  // Keep the AI Chats list fresh in real time-ish (polling) while it's open,
  // same pattern as the notification bell below.
  useEffect(() => {
    if (activeNav !== 'chats') return;
    const interval = setInterval(fetchChatLogs, 8000);
    return () => clearInterval(interval);
  }, [activeNav]);

  // Same live-poll pattern for Gift Codes — a member can redeem a code from
  // the app at any moment, and the admin needs to see the real claimed
  // status without it going stale (a stale "Unclaimed" was the root cause
  // of the double-bonus bug: admin would toggle a code that was actually
  // already claimed).
  useEffect(() => {
    if (activeNav !== 'gifts') return;
    const interval = setInterval(fetchGiftCodes, 6000);
    return () => clearInterval(interval);
  }, [activeNav]);

  const fetchChatLogs = async () => {
    try {
      const data = await chatbotFetch('/admin/all');
      setChatLogs(data.logs || []);
    } catch (err) {
      showToast('Failed to load chats');
    }
  };

  // Keep the bell fresh even while sitting on another tab
  useEffect(() => {
    fetchAdminNotifications();
    const interval = setInterval(fetchAdminNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // ===== LIVE PUSH (socket.io) =====
  // The backend already emits 'adminNotification' the instant a member
  // submits a deposit/withdrawal (see notifyAdmin() in the backend). This
  // connects once and, on every push, refreshes the bell plus whichever
  // table is currently on screen — no manual refresh, no polling delay.
  // Refs hold the latest tab state so the socket handler (set up once on
  // mount) always acts on what's actually visible right now.
  const liveStateRef = useRef({ activeNav, dTab, wTab });
  useEffect(() => {
    liveStateRef.current = { activeNav, dTab, wTab };
  }, [activeNav, dTab, wTab]);

  useEffect(() => {
    const token = localStorage.getItem('alfa9_admin_token');
    const socket = socketIOClient(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => setLiveConnected(true));
    socket.on('disconnect', () => setLiveConnected(false));
    socket.on('connect_error', () => setLiveConnected(false));

    socket.on('adminNotification', (notif) => {
      // Always refresh the bell immediately.
      fetchAdminNotifications();
      showToast(notif?.message || 'New activity');

      // Refresh whatever the admin is actually looking at right now.
      const { activeNav: nav, dTab: dt, wTab: wt } = liveStateRef.current;
      if (nav === 'dashboard') fetchDashboard();
      if (nav === 'deposits') fetchDeposits(dt);
      if (nav === 'withdrawals') fetchWithdrawals(wt);
      if (nav === 'users') fetchUsers();
    });

    return () => socket.disconnect();
  }, []);

  // Real feed from the backend — fills whenever a member submits a
  // deposit or withdrawal request (see notifyAdmin() in the backend).
  const fetchAdminNotifications = async () => {
    try {
      const data = await notifFetch('/notifications/admin');
      const formatted = (data.notifications || []).map((n) => ({
        id: n._id,
        type: n.type,
        message: n.message,
        time: new Date(n.createdAt).toLocaleString(),
        read: n.read,
      }));
      setNotifications(formatted);
    } catch (err) {
      showToast('Failed to load notifications');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadChatCount = notifications.filter((n) => !n.read && n.type === 'chat').length;
  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      notifFetch(`/notifications/${n.id}/read`, { method: 'PUT' }).catch(() => {});
    }
  };
  const clearNotifications = () => setNotifications([]); // clears the bell view only (backend history stays intact)
  const openNotification = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    notifFetch(`/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
  };

  /* ── deposit actions (REAL API) ── */
  const setDepositStatus = async (id, status) => {
    try {
      // status here is 'approved' or 'rejected' — backend route verbs are 'approve'/'reject'
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      const body = status === 'rejected' ? JSON.stringify({ reason: 'Admin rejected' }) : undefined;

      await apiFetch(`/deposits/${id}/${endpoint}`, {
        method: 'PUT',
        body,
      });
      showToast(`Deposit ${status} successfully`);
      fetchDeposits(dTab); // Refresh list
    } catch (err) {
      showToast('Failed to update deposit');
    }
  };

  // Approves several pending, non-flagged deposits in one click. Flagged
  // (duplicate-screenshot) deposits are rejected by the backend from a bulk
  // call on purpose — those always need a human look — so this is safe to
  // fire even if the selection accidentally includes one.
  const bulkApproveDeposits = async (ids) => {
    try {
      const result = await apiFetch('/deposits/bulk-approve', {
        method: 'POST',
        body: JSON.stringify({ depositIds: ids }),
      });
      showToast(result.message || `Approved ${result.approved?.length || 0} deposits`);
      fetchDeposits(dTab);
    } catch (err) {
      showToast('Bulk approve failed');
    }
  };
  const dCounts = {
    pending: deposits.filter((d) => d.status === 'pending').length,
    approved: deposits.filter((d) => d.status === 'approved').length,
    rejected: deposits.filter((d) => d.status === 'rejected').length,
  };
  const matchesSearch = (q, ...fields) => {
    if (!q) return true;
    const needle = q.trim().toLowerCase();
    return fields.some((f) => String(f || '').toLowerCase().includes(needle));
  };
  const visibleDeposits = deposits
    .filter((d) => d.status === dTab)
    .filter((d) => matchesSearch(searchQuery, d.uid, d.id, d.user));

  /* ── withdrawal actions (REAL API) ── */
  const setWithdrawStatus = async (id, status) => {
    try {
      // status here is 'approved' or 'rejected' — backend route verbs are 'approve'/'reject'
      const endpoint = status === 'approved' ? 'approve' : 'reject';
      const body = status === 'rejected' ? JSON.stringify({ reason: 'Admin rejected' }) : undefined;

      await apiFetch(`/withdrawals/${id}/${endpoint}`, {
        method: 'PUT',
        body: body,
      });

      showToast(`Withdrawal ${status} successfully`);
      fetchWithdrawals(wTab); // Refresh list
    } catch (err) {
      showToast('Failed to update withdrawal');
    }
  };
  const wCounts = {
    pending: withdrawals.filter((w) => w.status === 'pending').length,
    approved: withdrawals.filter((w) => w.status === 'approved').length,
    rejected: withdrawals.filter((w) => w.status === 'rejected').length,
  };
  const visibleWithdrawals = withdrawals
    .filter((w) => w.status === wTab)
    .filter((w) => matchesSearch(searchQuery, w.uid, w.id, w.user));

  /* ── bonus editing ── */
  const fetchBonuses = async () => {
    try {
      const data = await apiFetch('/bonuses');
      setBonuses(data);
    } catch (err) {
      showToast('Failed to load bonuses');
    }
  };
  const updateBonus = (key, field, value) => {
    setBonuses((prev) => prev.map((b) => (b.key === key ? { ...b, [field]: value } : b)));
  };
  const saveBonus = async (key) => {
    const bonus = bonuses.find((b) => b.key === key);
    try {
      await apiFetch(`/bonuses/${key}`, {
        method: 'PUT',
        body: JSON.stringify({
          enabled: bonus.enabled,
          value: bonus.value,
          cap: bonus.cap,
        }),
      });
      showToast('Bonus settings saved');
    } catch (err) {
      showToast('Failed to save bonus');
    }
  };

  /* ── gift code generator: tied to one specific user ID ── */
  const [codeForm, setCodeForm] = useState({ userId: '', amount: '', expiry: '' });

  // ===== GIVE POINTS =====
  const [pointsForm, setPointsForm] = useState({ userId: '', amount: '', pointType: 'balance', mode: 'add', reason: '' });
  const [foundUser, setFoundUser] = useState(null);
  const [pointsMsg, setPointsMsg] = useState('');
  const [pointsLoading, setPointsLoading] = useState(false);

  const lookupUser = async () => {
    if (!pointsForm.userId.trim()) return;
    setPointsMsg('');
    setFoundUser(null);
    try {
      const data = await apiFetch(`/users/lookup/${pointsForm.userId.trim()}`);
      setFoundUser(data.user);
    } catch (err) {
      setPointsMsg(err.message || 'User not found');
    }
  };

  const givePoints = async () => {
    if (!pointsForm.userId.trim() || !pointsForm.amount) {
      setPointsMsg('Enter a user ID and an amount first');
      return;
    }
    setPointsLoading(true);
    setPointsMsg('');
    try {
      const data = await apiFetch('/users/give-points', {
        method: 'POST',
        body: JSON.stringify({
          userId: pointsForm.userId.trim(),
          amount: Number(pointsForm.amount),
          pointType: pointsForm.pointType,
          mode: pointsForm.mode,
          reason: pointsForm.reason,
        }),
      });
      setPointsMsg(data.message);
      setFoundUser(data.user);
      showToast(data.message);
      setPointsForm((f) => ({ ...f, amount: '', reason: '' }));
    } catch (err) {
      setPointsMsg(err.message || 'Could not give points');
    } finally {
      setPointsLoading(false);
    }
  };

  const fetchGiftCodes = async () => {
    try {
      const data = await apiFetch('/gift-codes');
      setCodes(data.codes || []);
    } catch (err) {
      showToast('Failed to load gift codes');
    }
  };

  const generateCode = async () => {
    if (!codeForm.userId.trim() || !codeForm.amount) {
      showToast('Enter a user ID and an amount');
      return;
    }

    try {
      const data = await apiFetch('/gift-codes', {
        method: 'POST',
        body: JSON.stringify({
          userId: codeForm.userId.trim(),
          amount: Number(codeForm.amount),
          expiry: codeForm.expiry || undefined,
          description: 'Gift from admin',
        }),
      });

      const newCode = {
        code: data.gift.code,
        userId: data.gift.userId,
        amount: data.gift.amount,
        expiry: data.gift.expiry || '\u2014',
        claimed: false,
      };

      setCodes((prev) => [newCode, ...prev]);
      setCodeForm({ userId: '', amount: '', expiry: '' });
      showToast('Gift code generated');
    } catch (err) {
      showToast('Failed to generate code');
    }
  };
  const copyCode = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    showToast(`Copied ${code}`);
  };
  const toggleClaimed = async (code) => {
    try {
      const data = await apiFetch(`/gift-codes/${code}/toggle-claim`, { method: 'PUT' });
      setCodes((prev) => prev.map((c) => (c.code === code ? { ...c, claimed: data.claimed } : c)));
    } catch (err) {
      showToast(err.message || 'Failed to update claim status');
      fetchGiftCodes(); // re-sync in case someone else's redemption just landed
    }
  };
  const deleteCode = async (code) => {
    try {
      await apiFetch(`/gift-codes/${code}`, {
        method: 'DELETE',
      });
      setCodes((prev) => prev.filter((c) => c.code !== code));
      showToast('Code deleted');
    } catch (err) {
      showToast('Failed to delete code');
    }
  };

  /* ── game controls ── */
  const fetchGameSettings = async () => {
    try {
      const settings = await apiFetch('/game-settings');
      setGames((prev) =>
        prev.map((g) => {
          const match = settings.find((s) => s.gameName === g.key);
          if (!match) return g;
          return {
            ...g,
            enabled: match.isActive,
            // Backend's profitPercentage is how often the HOUSE-favorable
            // outcome is chosen — the opposite of "player win rate". Invert
            // it here so the slider genuinely means what it's labeled.
            winRate: 100 - match.profitPercentage,
            maintenance: match.maintenance || false,
          };
        })
      );
    } catch (err) {
      showToast('Failed to load game settings');
    }
  };
  const updateGame = (key, field, value) => {
    setGames((prev) => prev.map((g) => (g.key === key ? { ...g, [field]: value } : g)));
  };
  const saveGame = async (name) => {
    const game = games.find((g) => g.name === name);
    try {
      await apiFetch(`/game-settings/${game.key}`, {
        method: 'PUT',
        body: JSON.stringify({
          isActive: game.enabled,
          // Slider is labeled "Win rate" (the PLAYER's win rate), but the
          // backend's profitPercentage means the opposite — invert on the
          // way out too, matching the fetch above.
          profitPercentage: 100 - game.winRate,
          maintenance: game.maintenance,
        }),
      });
      showToast(`${name} settings saved`);
    } catch (err) {
      showToast('Failed to save settings');
    }
  };

  const currentNav = NAV_ITEMS.find((n) => n.key === activeNav);

  const goNav = (key) => {
    setActiveNav(key);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-page">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ══════ SIDEBAR ══════ */}
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="admin-logo">
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <Icon name="x" />
          </button>
          <img className="admin-logo-img" src="/image/ultraalf9.png" alt="Alfa9" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="admin-logo-sub">ADMIN PANEL</div>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.key}
              className={`admin-nav-item${activeNav === item.key ? ' active' : ''}`}
              onClick={() => goNav(item.key)}
            >
              <span className="nav-icon"><Icon name={item.icon} /></span>
              <span>{item.label}</span>
              {item.key === 'notifications' && unreadCount > 0 ? <span className="admin-nav-badge">{unreadCount}</span> : null}
              {item.key === 'chats' && unreadChatCount > 0 ? <span className="admin-nav-badge">{unreadChatCount}</span> : null}
              {item.key === 'withdrawals' && wCounts.pending > 0 ? <span className="admin-nav-badge">{wCounts.pending}</span> : null}
              {item.key === 'deposits' && dCounts.pending > 0 ? <span className="admin-nav-badge">{dCounts.pending}</span> : null}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div
            className={`admin-profile${profileOpen ? ' open' : ''}`}
            ref={profileRef}
            onClick={() => setProfileOpen((v) => !v)}
          >
            <div className="admin-avatar">
              <img src="/image/admin-logo.png" alt="Admin" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <div>
              <div className="admin-profile-name">Admin</div>
              <div className="admin-profile-role">Super Admin</div>
            </div>
            <span className="profile-chevron"><Icon name="chevron-up" /></span>

            {profileOpen && (
              <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
                <div className="profile-menu-item" onClick={handleLogout}>
                  <Icon name="logout" />
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ══════ MAIN ══════ */}
      <div className="admin-main">
        <div className="admin-topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Icon name="menu" />
            </button>
            <div>
              <div className="admin-page-title">{currentNav?.label}</div>
              <div className="admin-page-sub">
                {activeNav === 'dashboard' && 'Overview of platform activity'}
                {activeNav === 'users' && 'All registered members — copy a user\'s ID to use in Gift codes / Give Points'}
                {activeNav === 'deposits' && 'Review and process member deposit requests'}
                {activeNav === 'withdrawals' && 'Review and process withdrawal requests'}
                {activeNav === 'notifications' && 'Live activity from members'}
                {activeNav === 'chats' && 'Live AI support conversations — see exactly what issue each user is facing'}
                {activeNav === 'bonuses' && 'Manage promotional bonus rules'}
                {activeNav === 'gifts' && 'Create gift codes redeemable by one member'}
                {activeNav === 'games' && 'Enable, disable and tune platform games'}
                {activeNav === 'points' && 'Manually credit balance or VIP EXP to any member by their user ID'}
              </div>
            </div>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-search">
              <Icon name="search" />
              <input
                placeholder="Search UID, order ID, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="admin-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">×</button>
              )}
            </div>
            <div className={`live-indicator ${liveConnected ? 'live-on' : 'live-off'}`} title={liveConnected ? 'Live — updates push instantly' : 'Reconnecting…'}>
              <span className="live-dot" />
              {liveConnected ? 'Live' : 'Connecting'}
            </div>
            <div className="notif-wrap" ref={notifRef}>
              <div className="admin-icon-btn" onClick={() => { setNotifOpen((v) => !v); if (!notifOpen) markAllRead(); }}>
                <Icon name="bell" />
                {unreadCount > 0 ? <span className="count-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
              </div>
              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-panel-header">
                    <span className="notif-panel-title">Notifications</span>
                    {notifications.length > 0 && (
                      <button className="notif-clear-btn" onClick={clearNotifications}>Clear all</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <EmptyState
                      icon="bell-empty"
                      title="No notifications yet"
                      sub="Deposit and withdrawal requests from members will show up here."
                    />
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`} onClick={() => openNotification(n.id)}>
                        <div className="notif-icon"><Icon name={n.type === 'deposit' ? 'download' : n.type === 'withdrawal' ? 'upload' : n.type === 'chat' ? 'chat' : 'bell'} /></div>
                        <div className="notif-body">
                          <div className="notif-text">{n.message}</div>
                          <div className="notif-time">{n.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="admin-content">
          {activeNav === 'dashboard' && (
            <DashboardView deposits={deposits} withdrawals={withdrawals} stats={dashboardStats} />
          )}

          {activeNav === 'users' && (
            <UsersView
              users={users.filter((u) => matchesSearch(searchQuery, u.uid, u._id, u.name, u.email, u.phone))}
              showToast={showToast}
              onSetWagering={updateUserWagering}
              onResetPassword={resetUserPassword}
            />
          )}

          {activeNav === 'deposits' && (
            <DepositsView
              dTab={dTab}
              setDTab={setDTab}
              dCounts={dCounts}
              rows={visibleDeposits}
              onAccept={(id) => setDepositStatus(id, 'approved')}
              onReject={(id) => setDepositStatus(id, 'rejected')}
              onBulkApprove={bulkApproveDeposits}
            />
          )}

          {activeNav === 'withdrawals' && (
            <WithdrawalsView
              wTab={wTab}
              setWTab={setWTab}
              wCounts={wCounts}
              rows={visibleWithdrawals}
              onApprove={(id) => setWithdrawStatus(id, 'approved')}
              onReject={(id) => setWithdrawStatus(id, 'rejected')}
            />
          )}

          {activeNav === 'notifications' && (
            <NotificationsView notifications={notifications} onOpen={openNotification} onClear={clearNotifications} />
          )}

          {activeNav === 'chats' && (
            <ChatsView logs={chatLogs} selectedId={selectedChatId} onSelect={setSelectedChatId} />
          )}

          {activeNav === 'bonuses' && (
            <BonusesView bonuses={bonuses} updateBonus={updateBonus} saveBonus={saveBonus} />
          )}

          {activeNav === 'gifts' && (
            <GiftsView
              codes={codes}
              codeForm={codeForm}
              setCodeForm={setCodeForm}
              generateCode={generateCode}
              copyCode={copyCode}
              toggleClaimed={toggleClaimed}
              deleteCode={deleteCode}
            />
          )}

          {activeNav === 'games' && (
            <GamesView games={games} updateGame={updateGame} saveGame={saveGame} />
          )}

          {activeNav === 'points' && (
            <PointsView
              pointsForm={pointsForm}
              setPointsForm={setPointsForm}
              lookupUser={lookupUser}
              givePoints={givePoints}
              foundUser={foundUser}
              pointsMsg={pointsMsg}
              pointsLoading={pointsLoading}
            />
          )}
        </div>
      </div>

      <div className={`toast${toastShow ? ' show' : ''}`}>{toastMsg}</div>
    </div>
  );
}

/* ============================================================ SHARED EMPTY STATE */
function EmptyState({ icon = 'empty', title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon-wrap"><Icon name={icon} /></div>
      <p className="empty-title">{title}</p>
      {sub ? <p className="empty-sub">{sub}</p> : null}
    </div>
  );
}

/* ============================================================ DASHBOARD */
function UsersView({ users, showToast, onSetWagering, onResetPassword }) {
  const copyUid = (uid) => {
    navigator.clipboard?.writeText(uid).then(
      () => showToast('UID copied — paste it in Gift codes / Give Points'),
      () => showToast('Could not copy')
    );
  };

  const [wagerOpenFor, setWagerOpenFor] = useState(null); // userId whose editor is open
  const [wagerDraft, setWagerDraft] = useState('');

  const openWager = (u) => {
    setWagerOpenFor(u._id);
    setWagerDraft(String(u.wagering?.required || 0));
  };
  const closeWager = () => setWagerOpenFor(null);

  const saveWager = (userId) => {
    const n = Number(wagerDraft);
    if (Number.isNaN(n) || n < 0) { showToast('Enter a valid amount'); return; }
    onSetWagering(userId, { required: n });
    setWagerOpenFor(null);
  };

  // Quick unlock: mark requirement as fully met right now, no betting needed.
  const unlockNow = (userId) => onSetWagering(userId, { required: 0, completed: 0 });

  // ===== RESET PASSWORD =====
  // Shows the generated temp password ONCE in a modal so the admin can
  // relay it to the user — see resetUserPassword in adminController for
  // why we never show/store the user's real password.
  const [resetResult, setResetResult] = useState(null); // { name, password } | null
  const [resettingFor, setResettingFor] = useState(null); // userId currently resetting (loading state)

  const handleResetPassword = async (u) => {
    if (!window.confirm(`Reset ${u.name}'s password? Their old password will stop working immediately.`)) return;
    setResettingFor(u._id);
    const tempPassword = await onResetPassword(u._id);
    setResettingFor(null);
    if (tempPassword) setResetResult({ name: u.name, password: tempPassword });
  };

  const copyResetPassword = () => {
    if (!resetResult) return;
    navigator.clipboard?.writeText(resetResult.password).then(
      () => showToast('Password copied'),
      () => showToast('Could not copy')
    );
  };

  // ===== REFERRALS =====
  const [referralsFor, setReferralsFor] = useState(null); // user object whose modal is open
  const [referralsData, setReferralsData] = useState(null);
  const [referralsLoading, setReferralsLoading] = useState(false);

  const openReferrals = async (u) => {
    setReferralsFor(u);
    setReferralsData(null);
    setReferralsLoading(true);
    try {
      const data = await apiFetch(`/users/${u._id}/referrals`);
      setReferralsData(data.referrals || []);
    } catch (err) {
      showToast(err.message || 'Failed to load referrals');
      setReferralsData([]);
    } finally {
      setReferralsLoading(false);
    }
  };
  const closeReferrals = () => { setReferralsFor(null); setReferralsData(null); };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">All members</div>
      </div>
      <div className="panel-body">
        {users.length === 0 ? (
          <EmptyState icon="empty" title="No users yet" sub="Members who sign up on the site will show up here." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>UID</th><th>Name</th><th>Email / Phone</th><th>Balance</th><th>Status</th><th>Referrals</th><th>Wagering (bet / required)</th><th></th></tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const required = u.wagering?.required || 0;
                  const completed = u.wagering?.completed || 0;
                  const remaining = Math.max(0, required - completed);
                  const canWithdraw = completed >= required;
                  return (
                    <tr key={u._id}>
                      <td className="cell-strong">{u.uid || <span className="cell-muted">{u._id.toString().slice(-6)}</span>}</td>
                      <td>{u.name}</td>
                      <td className="cell-muted">{u.email || u.phone || 'N/A'}</td>
                      <td className="cell-strong">{fmt(u.balance || 0)}</td>
                      <td><StatusBadge status={u.status} /></td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openReferrals(u)}
                          title="See everyone this user referred, and how much each one deposited/withdrew"
                        >
                          {u.referralCount || 0} referred
                        </button>
                      </td>
                      <td>
                        {wagerOpenFor === u._id ? (
                          <div className="btn-row" style={{ alignItems: 'center', gap: 6 }}>
                            <input
                              type="number"
                              min="0"
                              value={wagerDraft}
                              onChange={(e) => setWagerDraft(e.target.value)}
                              style={{ width: 90 }}
                              className="admin-inline-input"
                              autoFocus
                            />
                            <button className="btn btn-success btn-sm" onClick={() => saveWager(u._id)}>Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={closeWager}>Cancel</button>
                          </div>
                        ) : (
                          <div className="btn-row" style={{ alignItems: 'center', gap: 8 }}>
                            <span className={`badge ${canWithdraw ? 'approved' : 'pending'}`}>
                              <span className="badge-dot" />{fmt(completed)} / {fmt(required)}
                            </span>
                            {!canWithdraw && required > 0 && (
                              <span className="cell-muted" style={{ fontSize: 12 }}>Rs{remaining} left</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="btn-row">
                          <button className="btn btn-ghost btn-sm" onClick={() => copyUid(u.uid || u._id)}>Copy UID</button>
                          {wagerOpenFor !== u._id && (
                            <>
                              <button className="btn btn-ghost btn-sm" onClick={() => openWager(u)} title="Set a custom betting requirement — raise it to delay this user's withdrawal">Set requirement</button>
                              {required > 0 && (
                                <button className="btn btn-success btn-sm" onClick={() => unlockNow(u._id)} title="Clear the requirement — allow withdrawal immediately">Unlock now</button>
                              )}
                            </>
                          )}
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleResetPassword(u)}
                            disabled={resettingFor === u._id}
                            title="Generate a new password for this user if they're locked out"
                          >
                            {resettingFor === u._id ? 'Resetting…' : 'Reset Password'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== RESET PASSWORD RESULT MODAL ===== */}
      {resetResult && (
        <div className="modal-overlay" onClick={() => setResetResult(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>New password for {resetResult.name}</h3>
            <p className="cell-muted" style={{ fontSize: 13 }}>
              Share this with the user now — it will not be shown again. They should change it after logging in.
            </p>
            <div
              style={{
                background: 'var(--bg-3, #1a1a1a)',
                border: '1px solid var(--border, #333)',
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 1,
                textAlign: 'center',
                margin: '14px 0'
              }}
            >
              {resetResult.password}
            </div>
            <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={copyResetPassword}>Copy</button>
              <button className="btn btn-success btn-sm" onClick={() => setResetResult(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REFERRALS MODAL ===== */}
      {referralsFor && (
        <div className="modal-overlay" onClick={closeReferrals}>
          <div className="modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{referralsFor.name}'s referrals</h3>
            {referralsLoading ? (
              <p className="cell-muted">Loading…</p>
            ) : !referralsData || referralsData.length === 0 ? (
              <EmptyState icon="empty" title="No referrals yet" sub="Nobody has signed up with this user's invite code yet." />
            ) : (
              <div className="table-scroll" style={{ maxHeight: 420 }}>
                <table>
                  <thead>
                    <tr><th>Name</th><th>UID</th><th>Joined</th><th>Deposited</th><th>Withdrawn</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {referralsData.map((r) => (
                      <tr key={r._id}>
                        <td>{r.invitedUser?.name || '—'}</td>
                        <td className="cell-strong">{r.invitedUser?.uid || '—'}</td>
                        <td className="cell-muted">{r.invitedUser?.joinedAt ? new Date(r.invitedUser.joinedAt).toLocaleDateString() : '—'}</td>
                        <td className="cell-strong">{fmt(r.invitedUser?.totalDeposited || 0)}</td>
                        <td className="cell-strong">{fmt(r.invitedUser?.totalWithdrawn || 0)}</td>
                        <td>{r.invitedUser ? <StatusBadge status={r.invitedUser.status} /> : <span className="cell-muted">Deleted</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="btn-row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={closeReferrals}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView({ deposits, withdrawals, stats: apiStats }) {
  const totalDepositsLocal = deposits.filter((d) => d.status === 'approved').reduce((s, d) => s + d.amount, 0);
  const totalWithdrawalsLocal = withdrawals.filter((w) => w.status === 'approved').reduce((s, w) => s + w.amount, 0);
  const pendingCount = (apiStats
    ? apiStats.deposits.pending + apiStats.withdrawals.pending
    : withdrawals.filter((w) => w.status === 'pending').length + deposits.filter((d) => d.status === 'pending').length);

  const stats = [
    { label: 'Total deposits', value: fmt(apiStats ? apiStats.deposits.totalAmount : totalDepositsLocal), icon: 'download', trend: apiStats ? `${apiStats.deposits.total} deposits` : 'No data yet', up: null, accent: 'gold' },
    { label: 'Total withdrawals', value: fmt(apiStats ? apiStats.withdrawals.totalAmount : totalWithdrawalsLocal), icon: 'upload', trend: apiStats ? `${apiStats.withdrawals.total} withdrawals` : 'No data yet', up: null, accent: 'danger' },
    { label: 'Active members', value: apiStats ? apiStats.users.active : '0', icon: 'users', trend: apiStats ? `${apiStats.users.total} total members` : 'No data yet', up: null, accent: 'info' },
    { label: 'Pending requests', value: pendingCount, icon: 'wallet', trend: pendingCount > 0 ? 'Needs review' : 'All clear', up: pendingCount === 0, accent: pendingCount > 0 ? 'warning' : 'gold' },
    { label: 'Members who deposited', value: apiStats ? apiStats.users.deposited : '0', icon: 'download', trend: apiStats ? `of ${apiStats.users.total} total` : 'No data yet', up: null, accent: 'gold' },
    { label: 'Playing right now', value: apiStats ? apiStats.games.currentlyPlaying : '0', icon: 'dice', trend: 'active in the last 5 min', up: null, accent: 'info' },
  ];

  return (
    <>
      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-top">
              <div className={`stat-icon icon-${s.accent}`}><Icon name={s.icon} /></div>
              <span className={`stat-trend ${s.up === null ? 'neutral' : s.up ? 'up' : 'down'}`}>{s.trend}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Recent deposits</div>
        </div>
        <div className="panel-body">
          {deposits.length === 0 ? (
            <EmptyState icon="empty" title="No deposits yet" sub="Deposit requests from members will appear here as they come in." />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Order ID</th><th>Member</th><th>Amount</th><th>Method</th><th>Status</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {deposits.slice(0, 5).map((d) => (
                    <tr key={d.id}>
                      <td className="cell-muted">{d.id}</td>
                      <td>{d.user}</td>
                      <td className="cell-strong">{fmt(d.amount)}</td>
                      <td className="cell-muted">{d.method}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td className="cell-muted">{d.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }) {
  const labels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
  return <span className={`badge ${status}`}><span className="badge-dot" />{labels[status] || status}</span>;
}

/* ============================================================ DEPOSITS */
function DepositsView({ dTab, setDTab, dCounts, rows, onAccept, onReject, onBulkApprove }) {
  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  // Bulk-select — only meaningful on the Pending tab, and only for rows
  // that aren't flagged (flagged ones are excluded from selection entirely
  // so they can never be swept up in a bulk approve by accident).
  const [selected, setSelected] = useState([]);
  useEffect(() => { setSelected([]); }, [dTab]);

  const selectableRows = rows.filter((d) => !d.flagged);
  const allSelectableSelected = selectableRows.length > 0 && selectableRows.every((d) => selected.includes(d.id));

  const toggleOne = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelected(allSelectableSelected ? [] : selectableRows.map((d) => d.id));
  };
  const runBulkApprove = () => {
    if (selected.length === 0) return;
    onBulkApprove(selected);
    setSelected([]);
  };

  return (
    <div className="panel">
      <div className="tab-row">
        {tabs.map((t) => (
          <button key={t.key} className={`tab-btn${dTab === t.key ? ' active' : ''}`} onClick={() => setDTab(t.key)}>
            {t.label} <span className="tab-count">{dCounts[t.key]}</span>
          </button>
        ))}
        {dTab === 'pending' && selected.length > 0 && (
          <button className="btn btn-success btn-sm bulk-approve-btn" onClick={runBulkApprove}>
            Approve selected ({selected.length})
          </button>
        )}
      </div>
      <div className="panel-body">
        {rows.length === 0 ? (
          <EmptyState icon="empty" title={`No ${dTab} deposits`} sub="This list fills up automatically once members submit deposit requests." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {dTab === 'pending' && (
                    <th style={{ width: 32 }}>
                      <input type="checkbox" checked={allSelectableSelected} onChange={toggleAll} title="Select all safe (non-flagged) deposits" />
                    </th>
                  )}
                  <th>Order ID</th><th>Member</th><th>Amount</th><th>Method</th><th>Receipt</th><th>Time</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className={d.flagged ? 'row-flagged' : ''}>
                    {dTab === 'pending' && (
                      <td>
                        {!d.flagged && (
                          <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggleOne(d.id)} />
                        )}
                      </td>
                    )}
                    <td className="cell-muted">
                      {d.id}
                      {d.flagged && (
                        <div className="flag-badge" title={d.flagReason}>⚠️ Duplicate screenshot</div>
                      )}
                    </td>
                    <td>{d.user}<div className="cell-muted">UID {d.uid}</div></td>
                    <td className="cell-strong">{fmt(d.amount)}</td>
                    <td className="cell-muted">{d.method}</td>
                    <td>
                      {d.screenshot ? (
                        <a href={d.screenshot} target="_blank" rel="noopener noreferrer">
                          <img src={d.screenshot} alt="Receipt" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: d.flagged ? '2px solid #e05252' : '1px solid var(--border)' }} />
                        </a>
                      ) : (
                        <span className="cell-muted">No receipt</span>
                      )}
                    </td>
                    <td className="cell-muted">{d.time}</td>
                    <td>
                      {dTab === 'pending' ? (
                        <div className="btn-row">
                          <button className="btn btn-success btn-sm" onClick={() => onAccept(d.id)}>Accept</button>
                          <button className="btn btn-danger btn-sm" onClick={() => onReject(d.id)}>Reject</button>
                        </div>
                      ) : (
                        <span className="cell-muted">{dTab === 'approved' ? 'Completed' : 'Rejected'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================ WITHDRAWALS */
function WithdrawalsView({ wTab, setWTab, wCounts, rows, onApprove, onReject }) {
  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="panel">
      <div className="tab-row">
        {tabs.map((t) => (
          <button key={t.key} className={`tab-btn${wTab === t.key ? ' active' : ''}`} onClick={() => setWTab(t.key)}>
            {t.label} <span className="tab-count">{wCounts[t.key]}</span>
          </button>
        ))}
      </div>
      <div className="panel-body">
        {rows.length === 0 ? (
          <EmptyState icon="empty" title={`No ${wTab} withdrawals`} sub="This list fills up automatically once members submit withdrawal requests." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Order ID</th><th>Member</th><th>Amount</th><th>Method</th><th>Account</th><th>Time</th><th>Action</th></tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id}>
                    <td className="cell-muted">{w.id}</td>
                    <td>{w.user}<div className="cell-muted">UID {w.uid}</div></td>
                    <td className="cell-strong">{fmt(w.amount)}</td>
                    <td className="cell-muted">{w.method}</td>
                    <td className="cell-muted">{w.account}</td>
                    <td className="cell-muted">{w.time}</td>
                    <td>
                      {wTab === 'pending' ? (
                        <div className="btn-row">
                          <button className="btn btn-success btn-sm" onClick={() => onApprove(w.id)}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => onReject(w.id)}>Reject</button>
                        </div>
                      ) : (
                        <span className="cell-muted">{wTab === 'approved' ? 'Completed' : 'Rejected'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================ NOTIFICATIONS */
function NotificationsView({ notifications, onOpen, onClear }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">All activity</div>
        {notifications.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={onClear}>Clear all</button>
        )}
      </div>
      <div className="panel-body padded">
        {notifications.length === 0 ? (
          <EmptyState
            icon="bell-empty"
            title="Nothing here yet"
            sub="Whenever a member submits a deposit or withdrawal request, it will show up here in real time."
          />
        ) : (
          <div className="code-list">
            {notifications.map((n) => (
              <div className="code-row" key={n.id} onClick={() => onOpen(n.id)} style={{ cursor: 'pointer' }}>
                <span className="code-user-tag"><Icon name={n.type === 'deposit' ? 'download' : 'upload'} />{n.type === 'deposit' ? 'Deposit' : 'Withdrawal'}</span>
                <div className="code-meta">
                  <span>{n.message}</span>
                  <span className="cell-muted">{n.time}</span>
                </div>
                {!n.read && <span className="badge pending">New</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================ AI CHATS */
function ChatsView({ logs, selectedId, onSelect }) {
  const selected = logs.find((l) => l._id === selectedId) || logs[0] || null;
  // On mobile there's only room for one column at a time — show the list
  // until a conversation is picked, then show that conversation full-width
  // with a back button. On desktop (>= 860px, see AdminPanel.css) both
  // columns show side by side and this state is ignored.
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const handleSelect = (id) => {
    onSelect(id);
    setMobileShowChat(true);
  };
  const handleBack = () => setMobileShowChat(false);

  return (
    <div className={`chats-view ${mobileShowChat ? 'chats-view--chat-open' : ''}`}>
      {/* conversation list */}
      <div className="chats-view-list">
        {logs.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState icon="empty" title="No chats yet" sub="Conversations from the self-service chat widget will show up here as members use it." />
          </div>
        ) : (
          logs.map((l) => {
            const last = l.messages[l.messages.length - 1];
            const isActive = selected && selected._id === l._id;
            return (
              <div
                key={l._id}
                onClick={() => handleSelect(l._id)}
                className={`chats-view-item ${isActive ? 'active' : ''}`}
              >
                <div className="chats-view-item-name">
                  {l.userId?.name || 'Guest'}
                  {l.userId?._id ? <span className="cell-muted" style={{ fontWeight: 400 }}> · UID {l.userId._id.toString().slice(-6)}</span> : null}
                </div>
                <div className="cell-muted chats-view-item-preview">
                  {last ? last.content : 'No messages yet'}
                </div>
                <div className="cell-muted" style={{ fontSize: 11, marginTop: 4 }}>
                  {new Date(l.updatedAt).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* selected conversation */}
      <div className="chats-view-detail">
        {!selected ? (
          <EmptyState icon="empty" title="Select a conversation" sub="Pick a chat from the list to see the full conversation." />
        ) : (
          <>
            <div className="chats-view-detail-header">
              <button type="button" className="chats-view-back-btn" onClick={handleBack} aria-label="Back to conversation list">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div>
                {selected.userId?.name || 'Guest'}
                {selected.userId?._id ? ` · UID ${selected.userId._id.toString().slice(-6)}` : ' · Not logged in'}
              </div>
            </div>
            <div className="chats-view-messages">
              {selected.messages.map((m, i) => (
                <div
                  key={i}
                  className={`chats-view-bubble ${m.role === 'user' ? 'chats-view-bubble--user' : 'chats-view-bubble--assistant'}`}
                >
                  <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</div>
                  <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4 }}>{new Date(m.at).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================ BONUSES */
function BonusesView({ bonuses, updateBonus, saveBonus }) {
  return (
    <div className="card-grid">
      {bonuses.map((b) => (
        <div className="item-card" key={b.key}>
          <div className="item-card-top">
            <div>
              <div className="item-card-title">{b.title}</div>
              <div className="item-card-desc">{b.desc}</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={b.enabled} onChange={(e) => updateBonus(b.key, 'enabled', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
          <div className="item-card-body">
            <div className="form-grid" style={{ marginBottom: 0 }}>
              <div className="field">
                <label>Value ({b.unit})</label>
                <input
                  type="number"
                  value={b.value}
                  onChange={(e) => updateBonus(b.key, 'value', e.target.value)}
                />
              </div>
              {b.cap > 0 || b.key === 'deposit' || b.key === 'rebate' ? (
                <div className="field">
                  <label>Max cap (Rs)</label>
                  <input
                    type="number"
                    value={b.cap}
                    onChange={(e) => updateBonus(b.key, 'cap', e.target.value)}
                  />
                </div>
              ) : null}
            </div>
            <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-gold btn-sm" onClick={() => saveBonus(b.key)}>Save changes</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================ GIFTS */
function PointsView({ pointsForm, setPointsForm, lookupUser, givePoints, foundUser, pointsMsg, pointsLoading }) {
  return (
    <div className="panel">
      <div className="panel-header"><div className="panel-title">Give points to a member</div></div>
      <div className="panel-body padded">
        <div className="form-grid">
          <div className="field">
            <label>Member user ID</label>
            <input
              type="text"
              placeholder="Paste the user's ID"
              value={pointsForm.userId}
              onChange={(e) => setPointsForm({ ...pointsForm, userId: e.target.value })}
              onBlur={lookupUser}
            />
          </div>
          <div className="field">
            <label>Point type</label>
            <select
              value={pointsForm.pointType}
              onChange={(e) => setPointsForm({ ...pointsForm, pointType: e.target.value })}
            >
              <option value="balance">Wallet balance (Rs)</option>
              <option value="vipExp">VIP EXP</option>
            </select>
          </div>
          <div className="field">
            <label>Mode</label>
            <select
              value={pointsForm.mode}
              onChange={(e) => setPointsForm({ ...pointsForm, mode: e.target.value })}
            >
              <option value="add">Add / Deduct (use negative to deduct)</option>
              <option value="set">Set to exact value (e.g. reset to 0)</option>
            </select>
          </div>
          <div className="field">
            <label>Amount</label>
            <input
              type="number"
              placeholder={pointsForm.mode === 'set' ? 'e.g. 0' : 'e.g. 500 (negative to deduct)'}
              value={pointsForm.amount}
              onChange={(e) => setPointsForm({ ...pointsForm, amount: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Reason (optional)</label>
            <input
              type="text"
              placeholder="e.g. Compensation for delayed withdrawal"
              value={pointsForm.reason}
              onChange={(e) => setPointsForm({ ...pointsForm, reason: e.target.value })}
            />
          </div>
        </div>

        {foundUser && (
          <div className="code-row" style={{ marginBottom: 14 }}>
            <span className="code-user-tag"><Icon name="users" />{foundUser.name || foundUser.email}</span>
            <div className="code-meta">
              <span>Balance <b>{fmt(foundUser.balance)}</b></span>
              <span>VIP EXP <b>{foundUser.vipExp}</b></span>
            </div>
          </div>
        )}
        {pointsMsg && <p className="field-hint" style={{ marginBottom: 14 }}>{pointsMsg}</p>}

        <button className="btn btn-gold" onClick={givePoints} disabled={pointsLoading}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" />{pointsLoading ? 'Sending…' : 'Done — give points'}
          </span>
        </button>
      </div>
    </div>
  );
}

function GiftsView({ codes, codeForm, setCodeForm, generateCode, copyCode, toggleClaimed, deleteCode }) {
  return (
    <>
      <div className="panel">
        <div className="panel-header"><div className="panel-title">Generate a gift code for a member</div></div>
        <div className="panel-body padded">
          <div className="form-grid">
            <div className="field">
              <label>Member user ID</label>
              <input type="text" placeholder="e.g. 1184061" value={codeForm.userId} onChange={(e) => setCodeForm({ ...codeForm, userId: e.target.value })} />
            </div>
            <div className="field">
              <label>Amount (Rs)</label>
              <input type="number" placeholder="500" value={codeForm.amount} onChange={(e) => setCodeForm({ ...codeForm, amount: e.target.value })} />
            </div>
            <div className="field">
              <label>Expiry date</label>
              <input type="date" value={codeForm.expiry} onChange={(e) => setCodeForm({ ...codeForm, expiry: e.target.value })} />
            </div>
          </div>
          <p className="field-hint" style={{ marginBottom: 14 }}>The code that's generated can only be claimed by this user ID — nobody else will be able to redeem it.</p>
          <button className="btn btn-gold" onClick={generateCode}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="plus" />Generate code</span>
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><div className="panel-title">Active codes</div></div>
        <div className="panel-body padded">
          {codes.length === 0 ? (
            <EmptyState icon="gift-empty" title="No gift codes yet" sub="Codes you generate for members will be listed here until claimed." />
          ) : (
            <div className="code-list">
              {codes.map((c) => (
                <div className="code-row" key={c.code}>
                  <span className="code-pill">{c.code}</span>
                  <span className="code-user-tag"><Icon name="users" />UID {c.userId}</span>
                  <div className="code-meta">
                    <span>Amount <b>{fmt(c.amount)}</b></span>
                    <span>Expires <b>{c.expiry}</b></span>
                  </div>
                  <span className={`badge ${c.claimed ? 'claimed' : 'unclaimed'}`}>
                    <span className="badge-dot" />{c.claimed ? 'Claimed' : 'Unclaimed'}
                  </span>
                  <div className="btn-row">
                    <button className="admin-icon-btn" style={{ width: 34, height: 34 }} onClick={() => copyCode(c.code)} title="Copy code">
                      <Icon name="copy" />
                    </button>
                    <button
                      className="admin-icon-btn"
                      style={{ width: 34, height: 34, opacity: c.claimed ? 0.4 : 1, cursor: c.claimed ? 'not-allowed' : 'pointer' }}
                      onClick={() => { if (!c.claimed) toggleClaimed(c.code); }}
                      disabled={c.claimed}
                      title={c.claimed ? 'Already claimed — delete instead to void it' : 'Mark as claimed'}
                    >
                      <Icon name="check" />
                    </button>
                    <button className="admin-icon-btn" style={{ width: 34, height: 34 }} onClick={() => deleteCode(c.code)} title="Delete code">
                      <Icon name="trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Boom Mines' source image (Booms.png) has its own solid blue background,
// so inside the dark card it looked like a flat box instead of a floating
// icon like the other three games' transparent PNGs. This inline SVG
// mirrors their transparent, floating-icon style instead.
function BoomThumbIcon() {
  return (
    <svg viewBox="0 0 120 120" width="72" height="72">
      <defs>
        <radialGradient id="boomThumbGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#5b5b5b" />
          <stop offset="100%" stopColor="#161616" />
        </radialGradient>
        <linearGradient id="boomThumbStar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="100%" stopColor="#e0a112" />
        </linearGradient>
      </defs>
      <circle cx="72" cy="70" r="30" fill="url(#boomThumbGlow)" />
      <rect x="69" y="26" width="6" height="12" rx="3" fill="#8a8a8a" transform="rotate(28 72 32)" />
      <circle cx="86" cy="24" r="5" fill="#ffcf5c" />
      <path d="M38 44 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4 z" fill="url(#boomThumbStar)" />
      <path d="M22 30 l2.4 6.4 6.4 2.4 -6.4 2.4 -2.4 6.4 -2.4 -6.4 -6.4 -2.4 6.4 -2.4 z" fill="url(#boomThumbStar)" opacity="0.85" />
    </svg>
  );
}

/* ============================================================ GAMES */
function GamesView({ games, updateGame, saveGame }) {
  return (
    <div className="card-grid">
      {games.map((g) => (
        <div className="item-card" key={g.key}>
          <div className="game-thumb">
            {g.key === 'boom'
              ? <BoomThumbIcon />
              : <img src={g.img} alt={g.name} onError={(e) => { e.target.style.display = 'none'; }} />}
            <span className={`game-status-pill ${g.enabled ? 'on' : 'off'}`}>{g.enabled ? 'Live' : 'Disabled'}</span>
          </div>
          <div className="item-card-top">
            <div className="item-card-title">{g.name}</div>
            <label className="switch">
              <input type="checkbox" checked={g.enabled} onChange={(e) => updateGame(g.key, 'enabled', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
          <div className="item-card-body">
            <div className="row-between">
              <span className="row-label">Win rate</span>
              <span className="row-value">{g.winRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={g.winRate}
              onChange={(e) => updateGame(g.key, 'winRate', Number(e.target.value))}
            />

            <div className="row-between">
              <span className="row-label">Maintenance mode</span>
              <label className="switch">
                <input type="checkbox" checked={g.maintenance} onChange={(e) => updateGame(g.key, 'maintenance', e.target.checked)} />
                <span className="slider" />
              </label>
            </div>

            <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-gold btn-sm" onClick={() => saveGame(g.name)}>Save changes</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}