import { useEffect, useRef } from 'react';

/* ══════════════════════════════════════════════════
   Animated gold AI avatar for the chat FAB button.
   Eyes follow the cursor anywhere on the page, blink
   naturally, and glance around on their own when idle.
   Replaces the static /image/chat-bot-image.png icon.
   ══════════════════════════════════════════════════ */
const AnimatedFabAvatar = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let isUserActive = false;
        let userActiveTimer = null;

        let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
        let lastLookTime = Date.now();
        let nextLookInterval = 1000 + Math.random() * 2000;

        let blinkProgress = 0;
        let isBlinking = false;
        let blinkStart = null;
        let blinkTimeoutId = null;
        let rafId = null;
        let blinkRafId = null;

        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            isUserActive = true;
            clearTimeout(userActiveTimer);
            userActiveTimer = setTimeout(() => { isUserActive = false; }, 3000);
        };
        document.addEventListener('mousemove', handleMouseMove);

        const animateBlink = () => {
            const duration = 160;
            const elapsed = Date.now() - blinkStart;
            if (elapsed < duration / 2) {
                blinkProgress = elapsed / (duration / 2);
            } else if (elapsed < duration) {
                blinkProgress = 1 - (elapsed - duration / 2) / (duration / 2);
            } else {
                blinkProgress = 0;
                isBlinking = false;
                return;
            }
            blinkRafId = requestAnimationFrame(animateBlink);
        };

        const triggerBlink = () => {
            if (isBlinking) return;
            isBlinking = true;
            blinkStart = Date.now();
            animateBlink();
        };

        const scheduleBlink = () => {
            blinkTimeoutId = setTimeout(() => {
                triggerBlink();
                scheduleBlink();
            }, 2000 + Math.random() * 4000);
        };
        scheduleBlink();

        const renderEyes = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const rect = canvas.getBoundingClientRect();
            const eyeCenterX = rect.left + rect.width / 2;
            const eyeCenterY = rect.top + rect.height / 2;

            if (isUserActive) {
                const dx = mouseX - eyeCenterX;
                const dy = mouseY - eyeCenterY;
                const angle = Math.atan2(dy, dx);
                const dist = Math.min(7, Math.hypot(dx, dy) / 30);
                targetX = Math.cos(angle) * dist;
                targetY = Math.sin(angle) * dist;
            } else {
                const now = Date.now();
                if (now - lastLookTime > nextLookInterval) {
                    lastLookTime = now;
                    nextLookInterval = 1200 + Math.random() * 2800;
                    const directions = [
                        { x: 0, y: 0 }, { x: -5, y: -1 }, { x: 5, y: -1 },
                        { x: -3, y: 3 }, { x: 3, y: 3 }, { x: 0, y: -4 },
                    ];
                    const choice = directions[Math.floor(Math.random() * directions.length)];
                    targetX = choice.x;
                    targetY = choice.y;
                }
            }

            currentX += (targetX - currentX) * 0.12;
            currentY += (targetY - currentY) * 0.12;

            const eyePositions = [{ x: 38, y: 35 }, { x: 82, y: 35 }];
            eyePositions.forEach((pos) => {
                ctx.save();
                ctx.translate(pos.x, pos.y);
                const scaleY = 1 - blinkProgress;
                ctx.scale(1, Math.max(0.05, scaleY));

                ctx.beginPath();
                ctx.ellipse(0, 0, 14, 24, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.4)';
                ctx.shadowBlur = 6;
                ctx.shadowOffsetY = 3;
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.save();
                ctx.beginPath();
                ctx.ellipse(0, 0, 13.5, 23.5, 0, 0, Math.PI * 2);
                ctx.clip();

                const pupilX = currentX;
                const pupilY = currentY;
                const irisGrad = ctx.createRadialGradient(pupilX, pupilY - 2, 2, pupilX, pupilY, 10);
                irisGrad.addColorStop(0, '#111111');
                irisGrad.addColorStop(0.55, '#523808');
                irisGrad.addColorStop(1, '#e6c265');

                ctx.beginPath();
                ctx.ellipse(pupilX, pupilY, 8.5, 13.5, 0, 0, Math.PI * 2);
                ctx.fillStyle = irisGrad;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(pupilX - 3, pupilY - 5, 2.8, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(pupilX + 2, pupilY + 3, 1.2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.fill();

                ctx.restore();
                ctx.restore();
            });

            rafId = requestAnimationFrame(renderEyes);
        };
        renderEyes();

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(userActiveTimer);
            clearTimeout(blinkTimeoutId);
            if (rafId) cancelAnimationFrame(rafId);
            if (blinkRafId) cancelAnimationFrame(blinkRafId);
        };
    }, []);

    return (
        <div className="cw-avatar">
            <div className="cw-avatar-glow" />
            <div className="cw-avatar-badge">
                <div className="cw-avatar-core">
                    <div className="cw-avatar-orb">
                        <div className="cw-avatar-ring" />
                        <canvas ref={canvasRef} width="120" height="70" className="cw-avatar-eyes" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimatedFabAvatar;