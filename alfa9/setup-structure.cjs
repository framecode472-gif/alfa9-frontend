/**
 * ALFA9 REACT — AUTO STRUCTURE GENERATOR
 * ----------------------------------------
 * Ye script poora folder + file skeleton bana deti hai:
 * - Har page ki .jsx aur .css file alag alag
 * - Sirf structure + boilerplate, content baad me daalenge
 *
 * USAGE: project root me ye file rakho, phir terminal me:
 *   node setup-structure.js
 */

const fs = require('fs');
const path = require('path');

// ---------- HELPERS ----------
function toKebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function writeIfMissing(filePath, content) {
  if (fs.existsSync(filePath)) {
    console.log('  SKIP (already exists): ' + filePath);
    return;
  }
  fs.writeFileSync(filePath, content);
  console.log('  CREATED: ' + filePath);
}

function jsxBoilerplate(name, cssImportPath) {
  return `import './${path.basename(cssImportPath)}';

function ${name}() {
  return (
    <div className="${toKebab(name)}-page">
      <h2>${name} Page</h2>
      {/* TODO: convert original HTML content here */}
    </div>
  );
}

export default ${name};
`;
}

function cssBoilerplate(name) {
  return `/* ===== ${name} Page Styles ===== */
.${toKebab(name)}-page {
  /* TODO: move original page CSS here */
}
`;
}

// Creates a page folder with ComponentName.jsx + ComponentName.css inside it
function createPage(basePath, name) {
  const dir = path.join(basePath, name);
  ensureDir(dir);
  const jsxPath = path.join(dir, `${name}.jsx`);
  const cssPath = path.join(dir, `${name}.css`);
  writeIfMissing(jsxPath, jsxBoilerplate(name, cssPath));
  writeIfMissing(cssPath, cssBoilerplate(name));
  return { name, route: '/' + toKebab(name) };
}

// ---------- STRUCTURE DEFINITION ----------
const SRC = path.join(__dirname, 'src');

const MAIN_PAGES = ['Auth', 'Home', 'Activity', 'Spin', 'Promotion', 'Account'];

const SHARED_PAGES = ['Notification', 'Gifts', 'CustomerService'];

const ACTIVITY_SUB = [
  'ActivityAward', 'InvitationBonus', 'BettingRebate', 'SuperJackpot',
  'SpinWheel', 'AttendanceBonus', 'NewMemberDeposit', 'OtherPlatform',
  'VipRewards', 'AviatorAward', 'WinStreak', 'CreativeVideo',
  'Lucky10Days', 'AdditionalRewards',
];

const PROMOTION_SUB = [
  'NewSubordinates', 'PartnerRewards', 'SubordinateData',
  'CommissionDetail', 'InvitationRules', 'RebateRatio',
];

const ACCOUNT_SUB = [
  'Wallet', 'Deposit', 'Withdraw', 'Vip', 'Safe',
  'GameHistory', 'Transaction', 'DepositHistory', 'WithdrawHistory',
  'GameStats', 'Settings', 'Feedback', 'BeginnerGuide', 'AboutUs',
];

console.log('\n== Creating main pages ==');
const mainRoutes = MAIN_PAGES.map(name => createPage(path.join(SRC, 'pages'), name));

console.log('\n== Creating shared pages ==');
const sharedRoutes = SHARED_PAGES.map(name => createPage(path.join(SRC, 'pages', 'Shared'), name));

console.log('\n== Creating Activity sub-pages ==');
const activityRoutes = ACTIVITY_SUB.map(name => createPage(path.join(SRC, 'pages', 'Activity', 'subpages'), name));

console.log('\n== Creating Promotion sub-pages ==');
const promotionRoutes = PROMOTION_SUB.map(name => createPage(path.join(SRC, 'pages', 'Promotion', 'subpages'), name));

console.log('\n== Creating Account sub-pages ==');
const accountRoutes = ACCOUNT_SUB.map(name => createPage(path.join(SRC, 'pages', 'Account', 'subpages'), name));

// ---------- SHARED COMPONENTS ----------
console.log('\n== Creating shared components ==');
ensureDir(path.join(SRC, 'components', 'Footer'));
writeIfMissing(
  path.join(SRC, 'components', 'Footer', 'Footer.jsx'),
  `import './Footer.css';\n\nfunction Footer() {\n  return (\n    <div className="footer-placeholder">{/* TODO: bottom nav bar */}</div>\n  );\n}\n\nexport default Footer;\n`
);
// Footer.css already created earlier — skip if exists

ensureDir(path.join(SRC, 'styles'));
writeIfMissing(
  path.join(SRC, 'styles', 'theme.css'),
  `/* ===== Global theme variables (from account.html :root) ===== */\n:root {\n  --gold: #D4AF37;\n  --gold-light: #F3DA95;\n  --gold-mid: #C9971F;\n  --gold-dark: #7A581C;\n  --gold-deep: #AA7C11;\n  --bg: rgb(30, 26, 9);\n  --bg-card: #1C1109;\n  --bg-card2: #150D05;\n  --bg-input: #211608;\n  --border: rgba(212,175,55,0.18);\n  --border-soft: rgba(212,175,55,0.09);\n  --text: #F5E6C8;\n  --text-muted: #8B7355;\n  --text-dim: #5A4020;\n}\n`
);

// ---------- GENERATE App.jsx WITH ALL ROUTES WIRED ----------
console.log('\n== Generating App.jsx with all routes ==');

function importLine(name, subfolder) {
  return `import ${name} from './pages/${subfolder ? subfolder + '/' : ''}${name}/${name}.jsx';`;
}

const allImports = [
  ...MAIN_PAGES.map(n => importLine(n)),
  ...SHARED_PAGES.map(n => importLine(n, 'Shared')),
  ...ACTIVITY_SUB.map(n => importLine(n, 'Activity/subpages')),
  ...PROMOTION_SUB.map(n => importLine(n, 'Promotion/subpages')),
  ...ACCOUNT_SUB.map(n => importLine(n, 'Account/subpages')),
].join('\n');

function routeLine(name, routePrefix) {
  return `        <Route path="${routePrefix}${toKebab(name)}" element={<${name} />} />`;
}

const allRoutes = [
  routeLine('Auth', '/'),
  ...MAIN_PAGES.filter(n => n !== 'Auth').map(n => routeLine(n, '/')),
  ...SHARED_PAGES.map(n => routeLine(n, '/')),
  ...ACTIVITY_SUB.map(n => routeLine(n, '/activity/')),
  ...PROMOTION_SUB.map(n => routeLine(n, '/promotion/')),
  ...ACCOUNT_SUB.map(n => routeLine(n, '/account/')),
].join('\n');

const appContent = `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/theme.css';

${allImports}

function App() {
  return (
    <BrowserRouter>
      <Routes>
${allRoutes}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
`;

fs.writeFileSync(path.join(SRC, 'App.jsx'), appContent);
console.log('  CREATED/UPDATED: ' + path.join(SRC, 'App.jsx'));

console.log('\n✅ DONE! Total pages created:', MAIN_PAGES.length + SHARED_PAGES.length + ACTIVITY_SUB.length + PROMOTION_SUB.length + ACCOUNT_SUB.length);
console.log('Ab "npm run dev" chala kar check karo — sab routes empty page dikhayenge, koi error nahi aayega.\n');
