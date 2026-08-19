// ============================================================
// ADMIN DEMO MODE — self-contained mock "backend"
// ============================================================
// Everything in this file lives purely in browser memory. It never reads
// or writes the real `alfa9_admin_token`, never calls the real API, and
// never touches the real database. It exists so a client/buyer can be
// handed a link and explore the ENTIRE admin panel — click around, approve
// a deposit, generate a gift code — with zero login and zero risk of ever
// seeing (or corrupting) a single byte of real member data.
//
// Data resets every time the page is reloaded. That's intentional: a demo
// session is meant to be a fresh, disposable sandbox every time.

const DEMO_FLAG_KEY = 'alfa9_admin_demo';

export function isAdminDemoMode() {
  return localStorage.getItem(DEMO_FLAG_KEY) === 'true';
}

export function startAdminDemo() {
  // Never let a real token and demo mode coexist — demo always wins if both
  // are somehow present, so clearing the real token here is a safety net.
  localStorage.removeItem('alfa9_admin_token');
  localStorage.setItem(DEMO_FLAG_KEY, 'true');
}

export function endAdminDemo() {
  localStorage.removeItem(DEMO_FLAG_KEY);
}

// ---------- seed data ----------

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

const PLACEHOLDER_RECEIPT =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjExNjA4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiNENEFGMzciIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EZW1vIHJlY2VpcHQ8L3RleHQ+PC9zdmc+';

let store = {
  users: [
    { _id: 'demo_u1', uid: '204118', name: 'Ahmed Raza', email: 'ahmed.raza@example.com', phone: '03001234567', balance: 12500, status: 'active', referralCount: 3, wagering: { required: 5000, completed: 5000 }, createdAt: daysAgo(40) },
    { _id: 'demo_u2', uid: '204119', name: 'Bilal Khan', email: 'bilal.khan@example.com', phone: '03011234567', balance: 3200, status: 'active', referralCount: 0, wagering: { required: 2000, completed: 800 }, createdAt: daysAgo(21) },
    { _id: 'demo_u3', uid: '204120', name: 'Fatima Noor', email: 'fatima.noor@example.com', phone: '03021234567', balance: 45800, status: 'active', referralCount: 7, wagering: { required: 0, completed: 0 }, createdAt: daysAgo(65) },
    { _id: 'demo_u4', uid: '204121', name: 'Usman Tariq', email: 'usman.tariq@example.com', phone: '03031234567', balance: 0, status: 'blocked', referralCount: 1, wagering: { required: 1500, completed: 200 }, createdAt: daysAgo(10) },
    { _id: 'demo_u5', uid: '204122', name: 'Ayesha Malik', email: 'ayesha.malik@example.com', phone: '03041234567', balance: 890, status: 'active', referralCount: 0, wagering: { required: 0, completed: 0 }, createdAt: daysAgo(2) },
  ],

  deposits: [
    { _id: 'demo_d1', userId: { _id: 'demo_u2', name: 'Bilal Khan', uid: '204119' }, amount: 2000, method: 'Easypaisa', status: 'pending', createdAt: daysAgo(0), hasScreenshot: true, flagged: false },
    { _id: 'demo_d2', userId: { _id: 'demo_u5', name: 'Ayesha Malik', uid: '204122' }, amount: 500, method: 'JazzCash', status: 'pending', createdAt: daysAgo(0), hasScreenshot: true, flagged: false },
    { _id: 'demo_d3', userId: { _id: 'demo_u4', name: 'Usman Tariq', uid: '204121' }, amount: 1000, method: 'Easypaisa', status: 'pending', createdAt: daysAgo(1), hasScreenshot: true, flagged: true, flagReason: 'Same screenshot used in a previous deposit' },
    { _id: 'demo_d4', userId: { _id: 'demo_u1', name: 'Ahmed Raza', uid: '204118' }, amount: 5000, method: 'JazzCash', status: 'approved', createdAt: daysAgo(3), hasScreenshot: true, flagged: false },
    { _id: 'demo_d5', userId: { _id: 'demo_u3', name: 'Fatima Noor', uid: '204120' }, amount: 10000, method: 'Easypaisa', status: 'approved', createdAt: daysAgo(6), hasScreenshot: true, flagged: false },
    { _id: 'demo_d6', userId: { _id: 'demo_u2', name: 'Bilal Khan', uid: '204119' }, amount: 300, method: 'JazzCash', status: 'rejected', createdAt: daysAgo(8), hasScreenshot: true, flagged: false },
  ],

  withdrawals: [
    { _id: 'demo_w1', userId: { _id: 'demo_u3', name: 'Fatima Noor', uid: '204120', wagering: { required: 0, completed: 0 } }, amount: 8000, method: 'Easypaisa', upiId: '03021234567', status: 'pending', createdAt: daysAgo(0) },
    { _id: 'demo_w2', userId: { _id: 'demo_u1', name: 'Ahmed Raza', uid: '204118', wagering: { required: 5000, completed: 5000 } }, amount: 3000, method: 'JazzCash', upiId: '03001234567', status: 'pending', createdAt: daysAgo(1) },
    { _id: 'demo_w3', userId: { _id: 'demo_u3', name: 'Fatima Noor', uid: '204120', wagering: { required: 0, completed: 0 } }, amount: 4000, method: 'Easypaisa', upiId: '03021234567', status: 'approved', createdAt: daysAgo(5) },
    { _id: 'demo_w4', userId: { _id: 'demo_u2', name: 'Bilal Khan', uid: '204119', wagering: { required: 2000, completed: 800 } }, amount: 1500, method: 'JazzCash', upiId: '03011234567', status: 'rejected', createdAt: daysAgo(9) },
  ],

  notifications: [
    { _id: 'demo_n1', type: 'deposit', message: 'New deposit request of Rs2000 from Bilal Khan', createdAt: daysAgo(0), read: false },
    { _id: 'demo_n2', type: 'withdrawal', message: 'New withdrawal request of Rs8000 from Fatima Noor', createdAt: daysAgo(0), read: false },
    { _id: 'demo_n3', type: 'chat', message: 'New support message from Usman Tariq', createdAt: daysAgo(0), read: false },
    { _id: 'demo_n4', type: 'deposit', message: 'New deposit request of Rs500 from Ayesha Malik', createdAt: daysAgo(1), read: true },
  ],

  chatLogs: [
    {
      _id: 'demo_c1', sessionId: 'demo_session_1', userId: { _id: 'demo_u4', name: 'Usman Tariq' },
      updatedAt: daysAgo(0),
      messages: [
        { role: 'user', content: 'My withdrawal is still pending, can you check?', seen: true, at: daysAgo(0) },
        { role: 'assistant', content: 'Thanks for reaching out — your withdrawal is in the queue and will be reviewed shortly by our team.', seen: true, at: daysAgo(0) },
        { role: 'user', content: "It's been 2 hours already", seen: false, at: daysAgo(0) },
      ],
    },
    {
      _id: 'demo_c2', sessionId: 'demo_session_2', userId: { _id: 'demo_u5', name: 'Ayesha Malik' },
      updatedAt: daysAgo(1),
      messages: [
        { role: 'user', content: 'How do I claim the attendance bonus?', seen: true, at: daysAgo(1) },
        { role: 'assistant', content: 'You can claim it daily from the Activity tab — Attendance Bonus section — as long as you log in each day.', seen: true, at: daysAgo(1) },
      ],
    },
  ],

  bonuses: [
    { key: 'deposit', title: 'New member 1st deposit', desc: 'Bonus applied automatically on a member\u2019s first successful deposit.', enabled: true, value: 100, unit: '%', cap: 5000 },
    { key: 'invite', title: 'Invitation bonus', desc: 'Paid to the referrer once an invited member completes their first deposit.', enabled: true, value: 500, unit: 'Rs', cap: 0 },
    { key: 'attendance', title: 'Attendance bonus', desc: 'Reward increases with consecutive daily sign-ins.', enabled: true, value: 50, unit: 'Rs', cap: 0 },
    { key: 'rebate', title: 'Betting rebate', desc: 'Percentage of daily turnover returned as bonus balance.', enabled: false, value: 1.5, unit: '%', cap: 2000 },
  ],

  gameSettings: [
    { gameName: 'wingo', isActive: true, profitPercentage: 50, maintenance: false, minBet: 1, maxBet: 100000 },
    { gameName: 'k3', isActive: true, profitPercentage: 55, maintenance: false, minBet: 1, maxBet: 100000 },
    { gameName: '5d', isActive: true, profitPercentage: 50, maintenance: false, minBet: 1, maxBet: 100000 },
    { gameName: 'boom', isActive: true, profitPercentage: 60, maintenance: false, minBet: 1, maxBet: 100000 },
  ],

  giftCodes: [
    { code: 'ALFA9-7K2M9Q', userId: '204118', userName: 'Ahmed Raza', amount: 500, expiry: '\u2014', claimed: false },
    { code: 'ALFA9-X4R8ZP', userId: '204120', userName: 'Fatima Noor', amount: 1000, expiry: '\u2014', claimed: true },
  ],

  referrals: {
    demo_u1: [
      { _id: 'demo_r1', invitedUser: { _id: 'demo_u4', name: 'Usman Tariq', uid: '204121', joinedAt: daysAgo(10), totalDeposited: 1000, totalWithdrawn: 0, status: 'blocked' } },
      { _id: 'demo_r2', invitedUser: { _id: 'demo_u5', name: 'Ayesha Malik', uid: '204122', joinedAt: daysAgo(2), totalDeposited: 500, totalWithdrawn: 0, status: 'active' } },
    ],
    demo_u3: [
      { _id: 'demo_r3', invitedUser: { _id: 'demo_u2', name: 'Bilal Khan', uid: '204119', joinedAt: daysAgo(21), totalDeposited: 2300, totalWithdrawn: 1500, status: 'active' } },
    ],
  },
};

function findUser(idOrUid) {
  const needle = String(idOrUid).trim();
  return store.users.find((u) => u.uid === needle || u._id === needle);
}

function counts(list) {
  return {
    pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length,
  };
}

const ok = (body) => Promise.resolve(body);
const fail = (message) => Promise.reject(new Error(message));

/**
 * Simulates apiFetch / notifFetch / chatbotFetch — same call signature
 * (endpoint, options), same "throws Error on failure" contract — so every
 * existing call site in AdminPanel.jsx works completely unchanged when
 * routed here instead of hitting the real network.
 */
export function demoFetch(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let body = {};
  try { body = options.body ? JSON.parse(options.body) : {}; } catch { /* ignore */ }

  // ----- Dashboard -----
  if (endpoint === '/dashboard') {
    const dCounts = counts(store.deposits);
    const wCounts = counts(store.withdrawals);
    return ok({
      users: {
        total: store.users.length,
        active: store.users.filter((u) => u.status === 'active').length,
        deposited: store.users.filter((u) => store.deposits.some((d) => d.userId._id === u._id && d.status === 'approved')).length,
      },
      deposits: { total: dCounts.approved, pending: dCounts.pending, totalAmount: store.deposits.filter((d) => d.status === 'approved').reduce((s, d) => s + d.amount, 0) },
      withdrawals: { total: wCounts.approved, pending: wCounts.pending, totalAmount: store.withdrawals.filter((w) => w.status === 'approved').reduce((s, w) => s + w.amount, 0) },
      games: { currentlyPlaying: 7 },
    });
  }

  // ----- Users -----
  if (endpoint.startsWith('/users?')) return ok({ users: store.users });

  if (/^\/users\/lookup\//.test(endpoint)) {
    const u = findUser(endpoint.split('/').pop());
    if (!u) return fail('User not found — check the ID');
    return ok({ user: { id: u._id, uid: u.uid, name: u.name, email: u.email, phone: u.phone, balance: u.balance, vipExp: 0, vipLevel: 0 } });
  }

  if (endpoint === '/users/give-points' && method === 'POST') {
    const u = findUser(body.userId);
    if (!u) return fail('User not found — check the ID');
    const amt = Number(body.amount);
    if (body.pointType === 'vipExp') {
      return ok({ message: `Credited ${amt} VIP EXP to user (demo)`, user: { balance: u.balance, vipExp: amt } });
    }
    u.balance = body.mode === 'set' ? Math.max(0, amt) : Math.max(0, u.balance + amt);
    return ok({ message: `${amt >= 0 ? 'Credited' : 'Debited'} Rs${Math.abs(amt)} to user (demo)`, user: { balance: u.balance, vipExp: 0 } });
  }

  if (/^\/users\/[^/]+\/wagering$/.test(endpoint) && method === 'PUT') {
    const u = store.users.find((x) => x._id === endpoint.split('/')[2]);
    if (u) {
      if (body.required !== undefined) u.wagering.required = body.required;
      if (body.completed !== undefined) u.wagering.completed = body.completed;
    }
    return ok({ message: 'Wagering updated (demo)' });
  }

  if (/^\/users\/[^/]+\/reset-password$/.test(endpoint) && method === 'POST') {
    return ok({ tempPassword: body.newPassword || Math.random().toString(36).slice(2, 10) });
  }

  if (/^\/users\/[^/]+\/referrals$/.test(endpoint)) {
    return ok({ referrals: store.referrals[endpoint.split('/')[2]] || [] });
  }

  // ----- Deposits -----
  if (endpoint.startsWith('/deposits?')) {
    const status = new URLSearchParams(endpoint.split('?')[1]).get('status') || 'pending';
    return ok({ deposits: store.deposits.filter((d) => d.status === status) });
  }

  if (/^\/deposits\/[^/]+\/screenshot$/.test(endpoint)) {
    return ok({ screenshot: PLACEHOLDER_RECEIPT });
  }

  if (endpoint === '/deposits/bulk-approve' && method === 'POST') {
    const ids = body.depositIds || [];
    let approved = 0;
    ids.forEach((depId) => {
      const d = store.deposits.find((x) => x._id === depId && !x.flagged && x.status === 'pending');
      if (d) {
        d.status = 'approved';
        approved++;
        const u = store.users.find((x) => x._id === d.userId._id);
        if (u) u.balance += d.amount;
      }
    });
    return ok({ message: `Approved ${approved} deposits (demo)`, approved: ids });
  }

  if (/^\/deposits\/[^/]+\/(approve|reject)$/.test(endpoint) && method === 'PUT') {
    const isApprove = endpoint.endsWith('approve');
    const d = store.deposits.find((x) => x._id === endpoint.split('/')[2]);
    if (d) {
      d.status = isApprove ? 'approved' : 'rejected';
      if (isApprove) {
        const u = store.users.find((x) => x._id === d.userId._id);
        if (u) u.balance += d.amount;
      }
    }
    return ok({ message: `Deposit ${isApprove ? 'approved' : 'rejected'} (demo)` });
  }

  // ----- Withdrawals -----
  if (endpoint.startsWith('/withdrawals?')) {
    const status = new URLSearchParams(endpoint.split('?')[1]).get('status') || 'pending';
    return ok({ withdrawals: store.withdrawals.filter((w) => w.status === status) });
  }

  if (/^\/withdrawals\/[^/]+\/(approve|reject)$/.test(endpoint) && method === 'PUT') {
    const isApprove = endpoint.endsWith('approve');
    const w = store.withdrawals.find((x) => x._id === endpoint.split('/')[2]);
    if (w) w.status = isApprove ? 'approved' : 'rejected';
    return ok({ message: `Withdrawal ${isApprove ? 'approved' : 'rejected'} (demo)` });
  }

  // ----- Bonuses -----
  if (endpoint === '/bonuses' && method === 'GET') return ok(store.bonuses);
  if (/^\/bonuses\/[^/]+$/.test(endpoint) && method === 'PUT') {
    const b = store.bonuses.find((x) => x.key === endpoint.split('/')[2]);
    if (b) Object.assign(b, body);
    return ok({ message: 'Saved (demo)' });
  }

  // ----- Gift codes -----
  if (endpoint === '/gift-codes' && method === 'GET') return ok({ codes: store.giftCodes });
  if (endpoint === '/gift-codes' && method === 'POST') {
    const u = findUser(body.userId);
    if (!u) return fail('User not found — check the ID');
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const gift = { code: `ALFA9-${rand}`, userId: u.uid, amount: body.amount, expiry: body.expiry || null, claimed: false };
    store.giftCodes.unshift(gift);
    return ok({ gift });
  }
  if (/^\/gift-codes\/[^/]+\/toggle-claim$/.test(endpoint) && method === 'PUT') {
    const g = store.giftCodes.find((x) => x.code === decodeURIComponent(endpoint.split('/')[2]));
    if (g) g.claimed = !g.claimed;
    return ok({ claimed: g ? g.claimed : false });
  }
  if (/^\/gift-codes\/[^/]+$/.test(endpoint) && method === 'DELETE') {
    const code = decodeURIComponent(endpoint.split('/')[2]);
    store.giftCodes = store.giftCodes.filter((x) => x.code !== code);
    return ok({ message: 'Deleted (demo)' });
  }

  // ----- Game settings -----
  if (endpoint === '/game-settings' && method === 'GET') return ok(store.gameSettings);
  if (/^\/game-settings\/[^/]+$/.test(endpoint) && method === 'PUT') {
    const g = store.gameSettings.find((x) => x.gameName === endpoint.split('/')[2]);
    if (g) Object.assign(g, body);
    return ok({ message: 'Saved (demo)' });
  }

  // ----- Notifications (notifFetch — no /admin prefix) -----
  if (endpoint === '/notifications/admin') return ok({ notifications: store.notifications });
  if (/^\/notifications\/[^/]+\/read$/.test(endpoint) && method === 'PUT') {
    const n = store.notifications.find((x) => x._id === endpoint.split('/')[2]);
    if (n) n.read = true;
    return ok({ message: 'Marked as read (demo)' });
  }

  // ----- Chatbot (chatbotFetch — relative to /chatbot, e.g. '/admin/all') -----
  if (endpoint === '/admin/all') return ok({ logs: store.chatLogs });
  if (/^\/admin\/[^/]+\/seen$/.test(endpoint) && method === 'PUT') {
    const log = store.chatLogs.find((x) => x.sessionId === endpoint.split('/')[2]);
    if (log) log.messages.forEach((m) => { if (m.role === 'user') m.seen = true; });
    return ok({ message: 'Marked seen (demo)' });
  }
  if (/^\/admin\/[^/]+\/reply$/.test(endpoint) && method === 'PUT') {
    const log = store.chatLogs.find((x) => x.sessionId === endpoint.split('/')[2]);
    const message = { role: 'admin', content: body.message, seen: true, at: new Date().toISOString() };
    if (log) log.messages.push(message);
    return ok({ message });
  }

  // Unhandled demo endpoint — fail soft instead of throwing, so an
  // unexpected call never crashes the demo session.
  return ok({});
}