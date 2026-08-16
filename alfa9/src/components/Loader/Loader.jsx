import React, { useState, useEffect } from 'react';
import './Loader.css';

const LOGO_URL = "https://alfa9.vercel.app/image/ultraalf9.png";
const INITIAL_LOAD_MS = 3500; // 3-4 sec first load / register ke waqt

const Loader = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Pehli baar app open/register hone par 3-4 sec loader
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), INITIAL_LOAD_MS);
    return () => clearTimeout(timer);
  }, []);

  // Net issue detect karo — offline aate hi loader aa jaye, online hote hi hat jaye
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const visible = initialLoading || isOffline;

  if (!visible) return null;

  return (
    <div className="a9-loader-overlay">
      <div className="a9-loader-center">
        <div className="a9-loader-stage">
          <div className="a9-loader-glow"></div>
          <div className="a9-loader-ring-outer"></div>
          <div className="a9-loader-ring-track"></div>

          <div className="a9-loader-orbit"><div className="a9-loader-orbit-dot"></div></div>
          <div className="a9-loader-orbit2"><div className="a9-loader-orbit2-dot"></div></div>

          <div className="a9-loader-coin">
            <div className="a9-loader-coin-face">
              <img src={LOGO_URL} alt="Alfa9" />
            </div>
            <div className="a9-loader-coin-face a9-loader-coin-back">
              <img src={LOGO_URL} alt="Alfa9" />
            </div>
          </div>
        </div>

        <div className="a9-loader-status">
          <span>{isOffline ? 'RECONNECTING' : 'LOADING'}</span>
          <span className="a9-loader-dot"></span>
          <span className="a9-loader-dot"></span>
          <span className="a9-loader-dot"></span>
        </div>
        <div className="a9-loader-bar"><div className="a9-loader-bar-fill"></div></div>
      </div>
    </div>
  );
};

export default Loader;