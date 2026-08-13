import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePopup.css';

/**
 * Premium Alfa9 Welcome Popup — VIP membership-card style
 * The three mirror links now navigate to the app's Home route.
 */
function WelcomePopup() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const bodyRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const shouldShow = sessionStorage.getItem('alfa9_show_welcome');
    if (shouldShow) {
      const t = setTimeout(() => {
        if (!cancelled) {
          sessionStorage.removeItem('alfa9_show_welcome');
          setVisible(true);
        }
      }, 400);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
  }, []);

  const handleConfirm = () => setVisible(false);

  // Clicking any mirror link closes the popup and takes the member to
  // the Home page inside the app (no external redirect).
  const handleHomeLink = (e) => {
    e.preventDefault();
    setVisible(false);
    navigate('/');
  };

  const handleScroll = () => {
    if (!bodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = bodyRef.current;
    setShowScrollHint(scrollTop + clientHeight < scrollHeight - 15);
  };

  if (!visible) return null;

  return (
    <div className="wp-overlay">
      <div className="wp-modal">
        {/* Dynamic Light Sweep Aura */}
        <div className="wp-light-sweep" />

        {/* Premium Corner Ornaments */}
        <span className="wp-corner wp-corner-tl" />
        <span className="wp-corner wp-corner-tr" />

        {/* ── VIP BANNER ── */}
        <div className="wp-banner">
          <span className="wp-confetti c1">✦</span>
          <span className="wp-confetti c2">◆</span>
          <span className="wp-confetti c3">✦</span>
          <span className="wp-confetti c4">◆</span>
          <span className="wp-confetti c5">✦</span>
        </div>

        {/* ── MEDALLION (Rotating 3D Shield) ── */}
        <div className="wp-medallion">
          <div className="wp-medallion-ring" />
          <div className="wp-medallion-core">
            <span className="wp-medallion-star">♛</span>
          </div>
        </div>

        {/* ── HEADER TEXT ── */}
        <div className="wp-header">
          <span className="wp-eyebrow">Alfa9 Exclusive</span>
          <h2 className="wp-title">Welcome Back, Member</h2>
          <div className="wp-tier-chip">
            <span className="wp-tier-gem">◆</span>
            VIP GOLD
            <span className="wp-tier-gem">◆</span>
          </div>
        </div>

        {/* ── BODY (Ultra Glass Panels) ── */}
        <div className="wp-body" ref={bodyRef} onScroll={handleScroll}>
          <p className="wp-lead">
            Your VIP GOLD reward for this cycle is active. Log in daily to
            keep your streak alive and unlock bigger bonuses.
          </p>

          <div className="wp-divider">
            <span>◆</span>
          </div>

          <div className="wp-notice-box">
            <span className="wp-icon-avatar warn">⚠</span>
            <p>
              Before withdrawing, please confirm your wallet has been
              verified, and that the ID card and account number used for
              verification are true and valid — otherwise your withdrawal
              will not be successful.
            </p>
          </div>

          <div className="wp-announce-box">
            <div className="wp-announce-head">
              <span className="wp-icon-avatar alert">📢</span>
              <span className="wp-announce-title">Announcement</span>
            </div>
            <p>
              Some members from your region recently had trouble accessing
              our site. Our official mirror links are listed below — please
              bookmark and share with friends.
            </p>
            <div className="wp-links">
              {/* All mirror links route to the app's Home page */}
              <a href="/" onClick={handleHomeLink} className="wp-link">
                alfa9game.biz
              </a>
              <a href="/" onClick={handleHomeLink} className="wp-link">
                alfa9game.bet
              </a>
              <a href="/" onClick={handleHomeLink} className="wp-link">
                alfa9game.xyz
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Scroll Hint */}
        {showScrollHint && <div className="wp-scroll-hint">▾ Scroll for more</div>}

        {/* ── FOOTER ── */}
        <div className="wp-footer">
          <button className="wp-confirm-btn" onClick={handleConfirm}>
            <span>Confirm</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomePopup;