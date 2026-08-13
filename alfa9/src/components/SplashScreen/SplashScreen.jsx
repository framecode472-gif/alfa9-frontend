import { useEffect, useRef, useState } from 'react';
import './SplashScreen.css';

function SplashScreen({ onFinish }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const rafRef = useRef(null);
  const [exiting, setExiting] = useState(false);

  // Show for 3s, then play exit animation, then tell parent we're done
  useEffect(() => {
    const showTimer = setTimeout(() => setExiting(true), 3000);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const exitTimer = setTimeout(() => {
      onFinish?.();
    }, 700); // matches CSS exit animation duration
    return () => clearTimeout(exitTimer);
  }, [exiting, onFinish]);

  // Golden wave + dust particle animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = frame.clientWidth;
      canvas.height = frame.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let angle = 0;
    const numParticles = 30;
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.5,
      speedY: -(Math.random() * 0.15 + 0.05),
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // main flowing wave
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, 'rgba(218, 165, 32, 0)');
      gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.08)');
      gradient.addColorStop(1, 'rgba(218, 165, 32, 0)');
      ctx.strokeStyle = gradient;

      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height * 0.72 + Math.sin(x * 0.007 + angle) * 35 + Math.cos(x * 0.004 + angle * 0.8) * 15;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // overlay wave
      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 0.8;
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height * 0.75 + Math.sin(x * 0.005 - angle * 0.7) * 25;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // floating dust
      particles.forEach((p) => {
        p.y += p.speedY;
        if (p.y < 0) p.y = canvas.height;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#ffd700';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      angle += 0.003;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    // Outer shell: fills the whole browser window, shows the grey backdrop
    // on desktop (exactly like the Home page screenshot) and holds the
    // centered 430px frame.
    <div className={`splash-outer ${exiting ? 'splash-exit' : ''}`}>
      <div className="splash-screen" ref={frameRef}>
        <canvas ref={canvasRef} className="splash-canvas" />

        <div className="splash-hero-container">
          <div className="splash-hero-section">
            <img src="/image/first-image.png" alt="ALFA 9 Premium Play" className="splash-hero-image" />
          </div>

          <div className="splash-text-section">
            <h1 className="splash-headline">FASTEST WITHDRAWALS • ULTIMATE TRUST</h1>
          </div>
        </div>

        <div className="splash-logo-section">
          <img src="/image/ultraalf9.png" alt="ALFA 9 Logo" className="splash-logo-image" />
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;