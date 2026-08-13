// Shared notification helpers.
// Call the relevant one right after the matching event succeeds:
//   - addLoginNotif()            -> after a successful login (once per day per session)
//   - addRegisterNotif(username) -> after a new account is created
//   - addWithdrawNotif(amount)   -> after a withdrawal request is placed
//   - addDepositNotif(amount)    -> after a deposit is confirmed

function pad2(n) { return String(n).padStart(2, '0'); }

export function loadNotifs() {
  try {
    return JSON.parse(localStorage.getItem('alfa9_notifs') || '[]');
  } catch {
    return [];
  }
}

export function saveNotifs(arr) {
  localStorage.setItem('alfa9_notifs', JSON.stringify(arr));
}

function nowStr() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

function pushNotif(title, body) {
  const dateStr = nowStr();
  const notifs = loadNotifs();
  notifs.unshift({
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    title,
    body,
    date: dateStr,
    ts: Date.now(),
  });
  saveNotifs(notifs);
  return notifs;
}

// LOGIN — once per calendar day per browser session, so it doesn't spam on every refresh
export function addLoginNotif() {
  const key = 'alfa9_login_' + new Date().toDateString();
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  pushNotif('LOGIN NOTIFICATION', 'Your account is logged in ' + nowStr());
}

// REGISTER — call once, right after a new account is successfully created
export function addRegisterNotif(username) {
  pushNotif(
    'REGISTRATION SUCCESSFUL',
    (username ? `Welcome, ${username}! ` : 'Welcome! ') +
      'Your account has been registered successfully on Alfa9.'
  );
}

// WITHDRAWAL — call after a withdrawal request is placed
export function addWithdrawNotif(amount, currency = '') {
  const amt = amount != null ? `${amount}${currency ? ' ' + currency : ''} ` : '';
  pushNotif(
    'WITHDRAWAL NOTIFICATION',
    `Your withdrawal request of ${amt}has been submitted and is being processed.`
  );
}

// DEPOSIT — call after a deposit is confirmed
export function addDepositNotif(amount, currency = '') {
  const amt = amount != null ? `${amount}${currency ? ' ' + currency : ''} ` : '';
  pushNotif(
    'DEPOSIT NOTIFICATION',
    `Your deposit of ${amt}has been received successfully.`
  );
}

// LOGOUT — call when user confirms logout
export function addLogoutNotif() {
  pushNotif('LOGOUT NOTIFICATION', 'Your account was logged out ' + nowStr());
}