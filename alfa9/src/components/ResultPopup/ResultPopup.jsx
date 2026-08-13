import { useEffect, useRef, useState } from 'react';
import './ResultPopup.css';

/**
 * ResultPopup
 * Shows a premium win/loss popup after a bet round resolves.
 * Shared by all 3 games (WinGo, K3, 5D) so the win/loss moment feels
 * identical everywhere — only the "result" badges in the middle differ
 * per game (colour/number/size for WinGo, dice/sum for K3, digits/sum
 * for 5D), passed in via `resultBadges`.
 *
 * Props:
 *  - open: boolean
 *  - status: 'win' | 'loss'
 *  - amount: number            -> payout (win) or stake lost (loss)
 *  - resultBadges: string[]    -> the pill(s) shown in the "results" row,
 *                                  e.g. ['Green', '7', 'Big'] or ['3-4-6', 'Sum 13'] or ['82914', 'Sum 24']
 *  - period: string            -> period id, e.g. "20260716100052641"
 *  - durationLabel: string     -> e.g. "WinGo 30sec"
 *  - betLabel: string          -> what the player bet on, e.g. "Green" or "Big" (shown in the slip footer)
 *  - onClose: () => void
 *  - autoCloseSeconds: number  -> default 5
 *
 *  Back-compat: resultNumber/resultColors/resultBig are still accepted —
 *  if resultBadges isn't passed, they're used to build the WinGo-style badges.
 */
function ResultPopup({
  open,
  status = 'win',
  amount = 0,
  resultNumber = 0,
  resultColors = ['green'],
  resultBig = 'Big',
  resultBadges = null,
  period = '',
  durationLabel = '',
  betLabel = '',
  onClose,
  autoCloseSeconds = 5,
}) {
  const [countdown, setCountdown] = useState(autoCloseSeconds);
  const [closing, setClosing] = useState(false);
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const timerRef = useRef(null);
  const rafRef = useRef(null);

  const isWin = status === 'win';

  // Countdown + auto close
  useEffect(() => {
    if (!open) return;
    setClosing(false);
    setCountdown(autoCloseSeconds);

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          handleClose();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Gold dust particle canvas (win only, keeps loss calmer)
  useEffect(() => {
    if (!open || !isWin) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 20;
        this.size = Math.random() * 2.2 + 0.5;
        this.speedY = -(Math.random() * 0.5 + 0.2);
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.life = Math.random() * 150 + 80;
        this.alpha = 0;
        this.maxAlpha = Math.random() * 0.6 + 0.2;
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.life > 40) { if (this.alpha < this.maxAlpha) this.alpha += 0.03; }
        else { this.alpha -= 0.03; }
        this.life -= 1;
        if (this.life <= 0 || this.y < 0) this.reset();
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#b8860b';
        ctx.fill();
        ctx.restore();
      }
    }

    const pool = Array.from({ length: 26 }, () => new Particle());
    const run = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pool.forEach((p) => { p.update(); p.draw(); });
      rafRef.current = requestAnimationFrame(run);
    };
    run();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [open, isWin]);

  // Subtle 3D tilt on pointer move (desktop only, cheap no-op on touch)
  const handleMouseMove = (e) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    wrapper.style.transform = `rotateX(${-py * 10}deg) rotateY(${px * 10}deg)`;
  };
  const handleMouseLeave = () => {
    if (wrapperRef.current) wrapperRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
  };

  const handleClose = () => {
    setClosing(true);
    clearInterval(timerRef.current);
    setTimeout(() => {
      onClose && onClose();
    }, 350);
  };

  if (!open) return null;

  const numberBadgeClass = resultColors.includes('violet')
    ? 'rp-badge-violet'
    : resultColors.includes('green')
      ? 'rp-badge-green'
      : 'rp-badge-red';

  return (
    <div className="rp-backdrop" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div className="rp-wrapper" ref={wrapperRef}>
        <div className={`rp-card rp-${status} ${closing ? 'rp-closing' : ''}`}>
          {isWin && <canvas ref={canvasRef} className="rp-dust" />}

          <button className="rp-close" onClick={handleClose} aria-label="Close">
            <span>&#10006;</span>
          </button>

          <div className="rp-top">
            <h2 className="rp-headline">{isWin ? 'Congratulations' : 'Better Luck Next Time'}</h2>
            <div className="rp-results-row">
              <span className="rp-results-label">Result</span>
              {resultBadges ? (
                resultBadges.map((b, i) => (
                  <span key={i} className="rp-badge rp-badge-generic">{b}</span>
                ))
              ) : (
                <>
                  <span className={`rp-badge ${numberBadgeClass}`}>{resultColors.map(cap).join('/')}</span>
                  <span className="rp-badge rp-badge-number">{resultNumber}</span>
                  <span className="rp-badge rp-badge-size">{resultBig}</span>
                </>
              )}
            </div>
          </div>

          <div className="rp-slip">
            <div className="rp-slip-label">{isWin ? 'Bonus' : 'Loss'}</div>
            <div className="rp-slip-amount">
              {isWin ? '+' : '-'}Rs{Math.abs(amount).toFixed(2)}
            </div>
            <div className="rp-slip-period">
              {durationLabel}{betLabel ? ` · ${betLabel}` : ''}<br />
              {period}
            </div>
          </div>

          <div className="rp-bottom">
            <div className="rp-check">&#10003;</div>
            <span className="rp-autoclose-text">{countdown} seconds auto close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default ResultPopup;