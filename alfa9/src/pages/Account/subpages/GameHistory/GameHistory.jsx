import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import './GameHistory.css';

const ICON_GRID = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const TAB_DATA = {
  lottery: {
    label: 'Lottery', defaultGame: 'wingo', tabIcon: '/image/8.png',
    games: [
      { id: 'wingo', label: 'Win Go', img: 'https://basantimages.com/basantclub/lotterycategory/lotterycategory_20240223183228dj93.png' },
      { id: 'k3', label: 'K3', img: 'https://basantimages.com/basantclub/lotterycategory/lotterycategory_20240223183132wbbx.png' },
      { id: '5d', label: '5D', img: 'https://basantimages.com/basantclub/lotterycategory/lotterycategory_20240223183146owmo.png' },
    ],
  },
  casino: {
    label: 'Casino', defaultGame: 'all', tabIcon: '/image/222222.png',
    games: [
      { id: 'all', label: 'All', isAll: true },
      { id: 'sexy', label: 'SEXY_Video', img: 'https://basantgames.biz/assets/png/27-ly6Ed3V0.png' },
      { id: 'evo_video', label: 'EVO_Video', img: 'https://basantgames.biz/assets/png/16-Bqh26tBy.png' },
    ],
  },
  fishing: {
    label: 'Fishing', defaultGame: 'all', tabIcon: '/image/8.png',
    games: [
      { id: 'all', label: 'All', isAll: true },
      { id: 'jili', label: 'JILI', img: 'https://basantgames.biz/assets/png/18-BKP_YFcz.png' },
      { id: 'jdb', label: 'JDB', img: 'https://basantgames.biz/assets/png/6-D5ne0Vsg.png' },
    ],
  },
  rummy: {
    label: 'Rummy', defaultGame: 'all', tabIcon: '/image/spade-token.png',
    games: [
      { id: 'all', label: 'All', isAll: true },
      { id: 'koolbet', label: 'KoolBet', img: 'https://basantgames.biz/assets/png/44-CSQAtKPP.png' },
      { id: 'card365', label: 'Card365', img: 'https://basantgames.biz/assets/png/19-C8CIVB_D.png' },
    ],
  },
  original: {
    label: 'Original', defaultGame: 'all', tabIcon: '/image/jame.png',
    games: [
      { id: 'all', label: 'All', isAll: true },
      { id: 'tbchess', label: 'TB_Chess', img: 'https://basantgames.biz/assets/png/23-BG9uqoyt.png' },
      { id: 'jili', label: 'JILI', img: 'https://basantgames.biz/assets/png/18-BKP_YFcz.png' },
      { id: 'spribe', label: 'SPRIBE', img: 'https://basantgames.biz/assets/png/20-CUSug46t.png' },
      { id: 'jdb', label: 'JDB', img: 'https://basantgames.biz/assets/png/6-D5ne0Vsg.png' },
      { id: 'inout', label: 'INOUT', img: 'https://basantgames.biz/assets/png/45-BushSPPj.png' },
      { id: 'bgaming', label: 'BGAMING', img: 'https://basantgames.biz/assets/png/46-ZLdHly5M.png' },
      { id: 'turbo', label: 'TURBO', img: 'https://basantgames.biz/assets/png/47-AiP_47UJ.png' },
    ],
  },
  slots: {
    label: 'Slots', defaultGame: 'all', tabIcon: '/image/777.png',
    games: [
      { id: 'all', label: 'All', isAll: true },
      { id: 'jili', label: 'JILI', img: 'https://basantgames.biz/assets/png/18-BKP_YFcz.png' },
      { id: 'mg', label: 'MG', img: 'https://basantgames.biz/assets/png/4-BT64VIem.png' },
      { id: 'pg', label: 'PG', img: 'https://basantgames.biz/assets/png/5-D1IfXRLG.png' },
      { id: 'jdb', label: 'JDB', img: 'https://basantgames.biz/assets/png/6-D5ne0Vsg.png' },
      { id: 'pp', label: 'PP', img: 'https://basantgames.biz/assets/png/22-DvLB2wfi.png' },
      { id: '9g', label: '9G', img: 'https://basantgames.biz/assets/png/41-Cb5KTZio.png' },
      { id: 'inout', label: 'INOUT', img: 'https://basantgames.biz/assets/png/45-BushSPPj.png' },
      { id: 'bgaming', label: 'BGAMING', img: 'https://basantgames.biz/assets/png/46-ZLdHly5M.png' },
      { id: 'turbo', label: 'TURBO', img: 'https://basantgames.biz/assets/png/47-AiP_47UJ.png' },
      { id: 'evo_elec', label: 'EVO_Electronic', img: 'https://basantgames.biz/assets/png/16-Bqh26tBy.png' },
    ],
  },
};

const TAB_ORDER = ['lottery', 'casino', 'fishing', 'rummy', 'original', 'slots'];

function GameHistory() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('lottery');
  const [selectedGame, setSelectedGame] = useState(() => {
    const init = {};
    TAB_ORDER.forEach((t) => { init[t] = TAB_DATA[t].defaultGame; });
    return init;
  });

  const [gameSheetOpen, setGameSheetOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);

  const now = new Date();
  const [selectedDate, setSelectedDate] = useState({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
  const [dateLabel, setDateLabel] = useState('Choose a date');

  const yearColRef = useRef(null);
  const monthColRef = useRef(null);
  const dayColRef = useRef(null);

  const [toast, setToast] = useState({ msg: '', show: false });
  const toastTimerRef = useRef(null);

  const [bets, setBets] = useState([]);
  const [betsLoading, setBetsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedBetId, setExpandedBetId] = useState(null);
  const [betDetails, setBetDetails] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  // Only the lottery games (WinGo/K3/5D) are wired to a real backend right
  // now — other categories (Casino/Fishing/etc) have no data source yet.
  const gameFilterParam = () => {
    const g = selectedGame.lottery;
    if (g === 'wingo') return 'wingo';
    if (g === 'k3') return 'k3';
    if (g === '5d') return '5d';
    return 'all';
  };

  useEffect(() => {
    if (currentTab !== 'lottery') { setBets([]); return; }
    setBetsLoading(true);
    apiFetch(`/game-stats/my-history?page=${page}&game=${gameFilterParam()}`)
      .then((data) => { setBets(data.bets || []); setTotalPages(data.totalPages || 1); })
      .catch(() => { setBets([]); setTotalPages(1); })
      .finally(() => setBetsLoading(false));
  }, [currentTab, page, selectedGame.lottery]);

  // Reset to page 1 whenever the game filter changes so we don't land on a
  // page number that no longer has data.
  useEffect(() => { setPage(1); }, [selectedGame.lottery]);

  const toggleBetDetail = (betId, gameName) => {
    if (expandedBetId === betId) { setExpandedBetId(null); return; }
    setExpandedBetId(betId);
    if (!betDetails[betId]) {
      setDetailLoadingId(betId);
      apiFetch(`/game-round/bet-detail/${betId}`)
        .then((data) => setBetDetails((prev) => ({ ...prev, [betId]: data })))
        .catch(() => setBetDetails((prev) => ({ ...prev, [betId]: { error: true } })))
        .finally(() => setDetailLoadingId(null));
    }
  };

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000);
  };

  const currentGameLabel = () => {
    const data = TAB_DATA[currentTab];
    const g = data.games.find((x) => x.id === selectedGame[currentTab]) || data.games[0];
    return g.label;
  };

  const openGameFilter = () => setGameSheetOpen(true);
  const selectGame = (g) => {
    setSelectedGame((prev) => ({ ...prev, [currentTab]: g.id }));
    setGameSheetOpen(false);
    showToast(g.label + ' selected');
  };

  const openDateFilter = () => setDateSheetOpen(true);

  const YEARS = Array.from({ length: 6 }, (_, i) => 2023 + i);
  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate();
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function getCenter(colEl) {
    if (!colEl) return null;
    const items = colEl.querySelectorAll('.dp-item');
    const mid = colEl.scrollTop + colEl.offsetHeight / 2;
    let closest = null, minDist = Infinity;
    items.forEach((item) => {
      const dist = Math.abs(item.offsetTop + item.offsetHeight / 2 - mid);
      if (dist < minDist) { minDist = dist; closest = item; }
    });
    return closest;
  }

  const confirmDate = () => {
    const yItem = getCenter(yearColRef.current);
    const mItem = getCenter(monthColRef.current);
    const dItem = getCenter(dayColRef.current);
    const next = { ...selectedDate };
    if (yItem) next.year = parseInt(yItem.dataset.val, 10);
    if (mItem) next.month = parseInt(mItem.dataset.val, 10);
    if (dItem) next.day = parseInt(dItem.dataset.val, 10);
    setSelectedDate(next);
    setDateLabel(`${next.year}-${String(next.month).padStart(2, '0')}-${String(next.day).padStart(2, '0')}`);
    setDateSheetOpen(false);
  };

  return (
    <div className="game-history-page">
      <div className="top-bar">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </div>
        <div className="page-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
          Game History
        </div>
        <div style={{ width: 36 }}></div>
      </div>

      <div className="tabs-wrap">
        <div className="tabs-scroll">
          {TAB_ORDER.map((tab) => (
            <div
              key={tab}
              className={`tab-item${currentTab === tab ? ' active' : ''}`}
              onClick={(e) => {
                setCurrentTab(tab);
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }}
            >
              <span className="tab-icon"><img src={TAB_DATA[tab].tabIcon} alt={TAB_DATA[tab].label} /></span>
              <span className="tab-label">{TAB_DATA[tab].label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-btn" onClick={openGameFilter}>
          <span className="filter-btn-text">{currentGameLabel()}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
        <div className="filter-btn" onClick={openDateFilter}>
          <span className="filter-btn-text">{dateLabel}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>

      <div className="content-area">
        {betsLoading ? (
          <div className="empty-state">
            <div className="empty-text">Loading…</div>
          </div>
        ) : bets.length > 0 ? (
          <>
            <div className="history-list">
              {bets.map((b) => {
                const isOpen = expandedBetId === b.id;
                const detail = betDetails[b.id];
                const won = b.status === 'Succeed';
                return (
                  <div className={`hist-card${isOpen ? ' open' : ''}`} key={b.id}>
                    <div className="hist-row" onClick={() => toggleBetDetail(b.id, b.game)}>
                      <div className={`hist-badge ${won ? 'win' : 'lose'}`}>{won ? 'Win' : 'Loss'}</div>
                      <div className="hist-row-main">
                        <div className="hist-row-period">{b.game?.toUpperCase()} · {b.period}</div>
                        <div className="hist-row-date">{new Date(b.createdAt).toLocaleString()}</div>
                      </div>
                      <div className={`hist-row-amount ${won ? 'win' : 'lose'}`}>
                        {b.winLose >= 0 ? '+' : '-'}Rs{Math.abs(b.winLose).toFixed(2)}
                      </div>
                      <svg className={`hist-chevron${isOpen ? ' open' : ''}`} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                    {isOpen && (
                      <div className="hist-detail">
                        {detailLoadingId === b.id ? (
                          <div className="hist-detail-loading">Loading…</div>
                        ) : detail && !detail.error ? (
                          <>
                            <div className="hist-detail-row"><span>Type</span><span>{b.game?.toUpperCase()} {b.duration}</span></div>
                            <div className="hist-detail-row"><span>Period</span><span>{detail.period}</span></div>
                            <div className="hist-detail-row"><span>Order number</span><span className="mono">{detail.orderNumber}</span></div>
                            <div className="hist-detail-row"><span>Select</span><span style={{ textTransform: 'capitalize' }}>{detail.select?.value}</span></div>
                            <div className="hist-detail-row"><span>Total bet</span><span>Rs{detail.purchaseAmount?.toFixed(2)}</span></div>
                            {detail.result && (
                              <div className="hist-detail-result">
                                <span className="hist-detail-result-label">Lottery results</span>
                                <span className="hist-detail-result-value">
                                  {detail.result.digits ? detail.result.digits.join(' ')
                                    : detail.result.dice ? detail.result.dice.join(' ')
                                    : detail.result.number}
                                  {detail.result.big ? ` · ${detail.result.big}` : ''}
                                  {detail.result.colors ? ` · ${detail.result.colors.join('/')}` : ''}
                                </span>
                              </div>
                            )}
                            <div className="hist-detail-grid">
                              <div className="hist-detail-box">
                                <div className="hist-detail-box-label">Actual amount</div>
                                <div className="hist-detail-box-value">Rs{detail.amountAfterTax?.toFixed(2)}</div>
                              </div>
                              <div className="hist-detail-box">
                                <div className="hist-detail-box-label">Winnings</div>
                                <div className="hist-detail-box-value">Rs{Math.max(0, detail.winLose).toFixed(2)}</div>
                              </div>
                              <div className="hist-detail-box">
                                <div className="hist-detail-box-label">Handling fee</div>
                                <div className="hist-detail-box-value">Rs{detail.tax?.toFixed(2)}</div>
                              </div>
                              <div className="hist-detail-box">
                                <div className="hist-detail-box-label">Profit/loss</div>
                                <div className={`hist-detail-box-value ${detail.winLose >= 0 ? 'win' : 'lose'}`}>
                                  {detail.winLose >= 0 ? '+' : ''}Rs{detail.winLose.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="hist-detail-loading">Could not load details.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="hist-pagination">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <span>{page}/{totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.35)" strokeWidth="1.3">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /><path d="M7 8h2M7 11h5" />
              </svg>
            </div>
            <div className="empty-text">No data</div>
            <div className="empty-sub">No records found for selected filters</div>
          </div>
        )}
      </div>

      {/* GAME FILTER SHEET */}
      {gameSheetOpen && (
        <div className="sheet-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setGameSheetOpen(false); }}>
          <div className="bottom-sheet">
            <div className="sheet-handle"></div>
            <div className="sheet-title">{TAB_DATA[currentTab].label} Games</div>
            <div className="provider-grid">
              {TAB_DATA[currentTab].games.map((g) => (
                <div
                  key={g.id}
                  className={`provider-item${selectedGame[currentTab] === g.id ? ' active' : ''}`}
                  onClick={() => selectGame(g)}
                >
                  <div className="provider-icon-badge">
                    {g.img ? (
                      <img src={g.img} alt={g.label} onError={(e) => { e.target.replaceWith(document.createTextNode('')); }} />
                    ) : (
                      ICON_GRID
                    )}
                  </div>
                  <span className="provider-name">{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DATE FILTER SHEET */}
      {dateSheetOpen && (
        <div className="sheet-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setDateSheetOpen(false); }}>
          <div className="datepicker-sheet">
            <div className="dp-top">
              <span className="dp-cancel" onClick={() => setDateSheetOpen(false)}>Cancel</span>
              <span className="dp-title">Choose a date</span>
              <span className="dp-confirm" onClick={confirmDate}>Confirm</span>
            </div>
            <div className="dp-columns">
              <div className="dp-highlight"></div>
              <div className="dp-col" ref={yearColRef}>
                {YEARS.map((y) => (
                  <div key={y} className={`dp-item${y === selectedDate.year ? ' selected' : ''}`} data-val={y}>{y}</div>
                ))}
              </div>
              <div className="dp-col" ref={monthColRef}>
                {MONTHS.map((m) => (
                  <div key={m} className={`dp-item${m === selectedDate.month ? ' selected' : ''}`} data-val={m}>{String(m).padStart(2, '0')}</div>
                ))}
              </div>
              <div className="dp-col" ref={dayColRef}>
                {DAYS.map((d) => (
                  <div key={d} className={`dp-item${d === selectedDate.day ? ' selected' : ''}`} data-val={d}>{String(d).padStart(2, '0')}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default GameHistory;