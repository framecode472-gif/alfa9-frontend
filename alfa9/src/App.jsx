'use client'

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './styles/theme.css';
import ChatWidget from './components/ChatWidget/ChatWidget.jsx';
import ScrollToTop from './components/ScrollToTop/ScrollToTop.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';
import Loader from './components/Loader/Loader.jsx';
import Landing from './pages/Landing/Landing.jsx';
import Auth from './pages/Auth/Auth.jsx';
import Home from './pages/Home/Home.jsx';
import Activity from './pages/Activity/Activity.jsx';
import Spin from './pages/Spin/Spin.jsx';
import Promotion from './pages/Promotion/Promotion.jsx';
import Account from './pages/Account/Account.jsx';
import Notification from './pages/Shared/Notification/Notification.jsx';
import Gifts from './pages/Shared/Gifts/Gifts.jsx';
import CustomerService from './pages/Shared/CustomerService/CustomerService.jsx';
import ActivityAward from './pages/Activity/subpages/ActivityAward/ActivityAward.jsx';
import InvitationBonus from './pages/Activity/subpages/InvitationBonus/InvitationBonus.jsx';
import BettingRebate from './pages/Activity/subpages/BettingRebate/BettingRebate.jsx';
import SuperJackpot from './pages/Activity/subpages/SuperJackpot/SuperJackpot.jsx';
import SpinWheel from './pages/Activity/subpages/SpinWheel/SpinWheel.jsx';
import AttendanceBonus from './pages/Activity/subpages/AttendanceBonus/AttendanceBonus.jsx';
import NewMemberDeposit from './pages/Activity/subpages/NewMemberDeposit/NewMemberDeposit.jsx';
import OtherPlatform from './pages/Activity/subpages/OtherPlatform/OtherPlatform.jsx';
import VipRewards from './pages/Activity/subpages/VipRewards/VipRewards.jsx';
import AviatorAward from './pages/Activity/subpages/AviatorAward/AviatorAward.jsx';
import Boom from './pages/Games/Boom/Boom.jsx';
import WinStreak from './pages/Activity/subpages/WinStreak/WinStreak.jsx';
import CreativeVideo from './pages/Activity/subpages/CreativeVideo/CreativeVideo.jsx';
import Lucky10Days from './pages/Activity/subpages/Lucky10Days/Lucky10Days.jsx';
import AdditionalRewards from './pages/Activity/subpages/AdditionalRewards/AdditionalRewards.jsx';
import BonusDetails from './pages/Activity/subpages/BonusDetails/BonusDetails.jsx';
import NewSubordinates from './pages/Promotion/subpages/NewSubordinates/NewSubordinates.jsx';
import PartnerRewards from './pages/Promotion/subpages/PartnerRewards/PartnerRewards.jsx';
import InvitationRecord from './pages/Promotion/subpages/InvitationRecord/InvitationRecord.jsx';
import SubordinateData from './pages/Promotion/subpages/SubordinateData/SubordinateData.jsx';
import CommissionDetail from './pages/Promotion/subpages/CommissionDetail/CommissionDetail.jsx';
import InvitationRules from './pages/Promotion/subpages/InvitationRules/InvitationRules.jsx';
import RebateRatio from './pages/Promotion/subpages/RebateRatio/RebateRatio.jsx';
import Wallet from './pages/Account/subpages/Wallet/Wallet.jsx';
import Deposit from './pages/Account/subpages/Deposit/Deposit.jsx';
import Withdraw from './pages/Account/subpages/Withdraw/Withdraw.jsx';
import Vip from './pages/Account/subpages/Vip/Vip.jsx';
import MyBenefits from './pages/Account/subpages/MyBenefits/MyBenefits.jsx';
import Safe from './pages/Account/subpages/Safe/Safe.jsx';
import GameHistory from './pages/Account/subpages/GameHistory/GameHistory.jsx';
import Transaction from './pages/Account/subpages/Transaction/Transaction.jsx';
import DepositHistory from './pages/Account/subpages/DepositHistory/DepositHistory.jsx';
import WithdrawHistory from './pages/Account/subpages/WithdrawHistory/WithdrawHistory.jsx';
import GameStats from './pages/Account/subpages/GameStats/GameStats.jsx';
import Settings from './pages/Account/subpages/Settings/Settings.jsx';
import Feedback from './pages/Account/subpages/Feedback/Feedback.jsx';
import BeginnerGuide from './pages/Account/subpages/BeginnerGuide/BeginnerGuide.jsx';
import AboutUs from './pages/Account/subpages/AboutUs/AboutUs.jsx';

// Lottery games
import WinGo from './pages/Lottery/WinGo/WinGo.jsx';
import K3 from './pages/Lottery/K3/K3.jsx';
import FiveD from './pages/Lottery/FiveD/FiveD.jsx';

// Admin
import AdminLogin from './pages/Admin/AdminLogin.jsx';
import AdminPanel from './pages/Admin/AdminPanel.jsx';
import AdminRoute from './pages/Admin/AdminRoute.jsx';

function App() {
  // Global fallback: any <img> anywhere in the app that fails to load
  // (e.g. no internet, broken url) will automatically swap to the
  // theme-matched placeholder. No need to touch individual img tags.
  useEffect(() => {
    const handleImgError = (e) => {
      if (e.target.tagName === 'IMG' && !e.target.dataset.fallback) {
        e.target.dataset.fallback = 'true';
        e.target.src = '/image/avatar-placeholder.svg';
      }
    };
    document.addEventListener('error', handleImgError, true);
    return () => document.removeEventListener('error', handleImgError, true);
  }, []);

  return (
    <BrowserRouter>
      <Loader />
      <ScrollToTop />
      <Routes>
        {/* Public routes - accessible without login */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

        {/* Protected routes - require login */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
        <Route path="/spin" element={<ProtectedRoute><Spin /></ProtectedRoute>} />
        <Route path="/promotion" element={<ProtectedRoute><Promotion /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/notification" element={<ProtectedRoute><Notification /></ProtectedRoute>} />
        <Route path="/gifts" element={<ProtectedRoute><Gifts /></ProtectedRoute>} />
        <Route path="/customer-service" element={<ProtectedRoute><CustomerService /></ProtectedRoute>} />
        <Route path="/activity/activity-award" element={<ProtectedRoute><ActivityAward /></ProtectedRoute>} />
        <Route path="/activity/invitation-bonus" element={<ProtectedRoute><InvitationBonus /></ProtectedRoute>} />
        <Route path="/activity/betting-rebate" element={<ProtectedRoute><BettingRebate /></ProtectedRoute>} />
        <Route path="/activity/super-jackpot" element={<ProtectedRoute><SuperJackpot /></ProtectedRoute>} />
        <Route path="/activity/spin-wheel" element={<ProtectedRoute><SpinWheel /></ProtectedRoute>} />
        <Route path="/activity/attendance-bonus" element={<ProtectedRoute><AttendanceBonus /></ProtectedRoute>} />
        <Route path="/activity/new-member-deposit" element={<ProtectedRoute><NewMemberDeposit /></ProtectedRoute>} />
        <Route path="/activity/other-platform" element={<ProtectedRoute><OtherPlatform /></ProtectedRoute>} />
        <Route path="/activity/vip-rewards" element={<ProtectedRoute><VipRewards /></ProtectedRoute>} />
        <Route path="/activity/aviator-award" element={<ProtectedRoute><AviatorAward /></ProtectedRoute>} />
        <Route path="/activity/win-streak" element={<ProtectedRoute><WinStreak /></ProtectedRoute>} />
        <Route path="/activity/creative-video" element={<ProtectedRoute><CreativeVideo /></ProtectedRoute>} />
        <Route path="/activity/lucky10-days" element={<ProtectedRoute><Lucky10Days /></ProtectedRoute>} />
        <Route path="/activity/additional-rewards" element={<ProtectedRoute><AdditionalRewards /></ProtectedRoute>} />
        <Route path="/activity/bonus-details" element={<ProtectedRoute><BonusDetails /></ProtectedRoute>} />
        <Route path="/promotion/new-subordinates" element={<ProtectedRoute><NewSubordinates /></ProtectedRoute>} />
        <Route path="/promotion/partner-rewards" element={<ProtectedRoute><PartnerRewards /></ProtectedRoute>} />
        <Route path="/promotion/invitation-record" element={<ProtectedRoute><InvitationRecord /></ProtectedRoute>} />
        <Route path="/promotion/subordinate-data" element={<ProtectedRoute><SubordinateData /></ProtectedRoute>} />
        <Route path="/promotion/commission-detail" element={<ProtectedRoute><CommissionDetail /></ProtectedRoute>} />
        <Route path="/promotion/invitation-rules" element={<ProtectedRoute><InvitationRules /></ProtectedRoute>} />
        <Route path="/promotion/rebate-ratio" element={<ProtectedRoute><RebateRatio /></ProtectedRoute>} />
        <Route path="/account/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/account/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
        <Route path="/account/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
        <Route path="/account/vip" element={<ProtectedRoute><Vip /></ProtectedRoute>} />
        <Route path="/account/my-benefits" element={<ProtectedRoute><MyBenefits /></ProtectedRoute>} />
        <Route path="/account/safe" element={<ProtectedRoute><Safe /></ProtectedRoute>} />
        <Route path="/account/game-history" element={<ProtectedRoute><GameHistory /></ProtectedRoute>} />
        <Route path="/account/transaction" element={<ProtectedRoute><Transaction /></ProtectedRoute>} />
        <Route path="/account/deposit-history" element={<ProtectedRoute><DepositHistory /></ProtectedRoute>} />
        <Route path="/account/withdraw-history" element={<ProtectedRoute><WithdrawHistory /></ProtectedRoute>} />
        <Route path="/account/game-stats" element={<ProtectedRoute><GameStats /></ProtectedRoute>} />
        <Route path="/account/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/account/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
        <Route path="/account/beginner-guide" element={<ProtectedRoute><BeginnerGuide /></ProtectedRoute>} />
        <Route path="/account/about-us" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />

        {/* Lottery games */}
        <Route path="/lottery/wingo" element={<ProtectedRoute><WinGo /></ProtectedRoute>} />
        <Route path="/lottery/k3" element={<ProtectedRoute><K3 /></ProtectedRoute>} />
        <Route path="/lottery/5d" element={<ProtectedRoute><FiveD /></ProtectedRoute>} />

        {/* Games */}
        <Route path="/games/boom" element={<ProtectedRoute><Boom /></ProtectedRoute>} />

        {/* Admin — /admin-login is the gate, /admin is guarded by AdminRoute */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      </Routes>

      <ChatWidgetGate />
    </BrowserRouter>
  );
}

// Renders the floating chat widget on every page EXCEPT the admin panel/login
// and the games (e.g. Boom Mines), where its floating icon overlaps the
// game's own UI (menu button, bet bar, etc).
function ChatWidgetGate() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isGamePage = location.pathname.startsWith('/games/');
  if (isAdminPage || isGamePage) return null;
  return <ChatWidget />;
}

export default App;