import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import './InvitationRecord.css';

function InvitationRecord() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiFetch('/promotion/invitation-record')
      .then((data) => setRecords(data.records || []))
      .catch(() => setRecords([]))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="invitation-record-page">
      <div className="page-wrapper">
        {/* HEADER */}
        <div className="top-bar">
          <div className="back-btn" onClick={() => navigate(-1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>
          <span className="top-title">Invitation record</span>
        </div>

        {/* EMPTY STATE */}
        {loaded && records.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="url(#eg2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="url(#eg2)" strokeWidth="1.4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="url(#eg2)" strokeWidth="1.4" strokeLinecap="round" />
                <defs>
                  <linearGradient id="eg2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5A4020" />
                    <stop offset="100%" stopColor="#3A2812" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="empty-label">No invitation</div>
            <div className="empty-sub">Members you invite will show up here</div>
          </div>
        )}

        {/* LIST (populated state) */}
        {records.length > 0 && (
          <div className="record-list">
            {records.map((r) => (
              <div className="record-card" key={r.id}>
                <div className="record-card-head">
                  <span className="record-card-name">{r.name}</span>
                  <span className="record-card-uid">UID:{r.uid}</span>
                </div>

                <div className="record-row">
                  <span className="record-row-label">Registration time</span>
                  <span className="record-row-value">{new Date(r.registeredAt).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}</span>
                </div>
                <div className="record-row">
                  <span className="record-row-label">1st deposit amount</span>
                  <span className={`record-row-value ${r.firstDepositAmount > 0 ? 'green' : 'red'}`}>Rs{r.firstDepositAmount.toFixed(2)}</span>
                </div>
                <div className="record-row">
                  <span className="record-row-label">2nd deposit amount</span>
                  <span className={`record-row-value ${r.secondDepositAmount > 0 ? 'green' : 'red'}`}>Rs{r.secondDepositAmount.toFixed(2)}</span>
                </div>
                <div className="record-row">
                  <span className="record-row-label">3rd deposit amount</span>
                  <span className={`record-row-value ${r.thirdDepositAmount > 0 ? 'green' : 'red'}`}>Rs{r.thirdDepositAmount.toFixed(2)}</span>
                </div>
                <div className="record-row">
                  <span className="record-row-label">Turnover</span>
                  <span className="record-row-value gold">Rs{r.turnover.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bottom-spacer"></div>
      </div>
    </div>
  );
}

export default InvitationRecord;