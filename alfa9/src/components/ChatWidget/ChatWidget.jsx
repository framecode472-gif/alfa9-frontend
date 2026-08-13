import React, { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import './ChatWidget.css';

/* ══════════════════════════════════════════════════
   ALFA9 SELF-SERVICE CHAT WIDGET
   Static UI only — no backend/API wired up yet.
   Drop <ChatWidget /> once near the root of your app
   (e.g. in App.jsx) so the floating icon shows on
   every page.

   NOTE: all screen components are declared at module
   level (outside ChatWidget) on purpose — declaring
   them inside the component body causes React to
   remount them on every re-render, which breaks text
   inputs (feels laggy / loses characters while typing).
   ══════════════════════════════════════════════════ */

/* ---------- small inline icon set ---------- */
const Icon = {
    chat: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
    ),
    chatLive: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5FFF8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
    ),
    back: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
        </svg>
    ),
    home: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
    ),
    close: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
    ),
    chevron: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
        </svg>
    ),
    wallet: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
        </svg>
    ),
    card: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
    ),
    key: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
            <circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5L18 10l3-3-2.5-2.5"/>
        </svg>
    ),
    ewallet: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/><circle cx="17" cy="14" r="1.5"/>
        </svg>
    ),
    usdt: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v12"/>
            <path d="M15.5 9a2.5 2.5 0 0 0-2.5-1.5h-1a2.25 2.25 0 0 0 0 4.5h1a2.25 2.25 0 0 1 0 4.5h-1A2.5 2.5 0 0 1 9.5 15"/>
        </svg>
    ),
    headset: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
        </svg>
    ),
    upload: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9A8567" strokeWidth="1.8">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h4l2 3h4a2 2 0 0 1 2 2z"/>
        </svg>
    ),
    photo: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9A8567" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
        </svg>
    ),
    empty: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
    ),
    dots: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>
        </svg>
    ),
    send: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
    ),
    thumbsUp: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
        </svg>
    ),
    thumbsDown: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
        </svg>
    ),
    plus: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
    ),
    file: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
    ),
    screenshot: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="8" y="8" width="8" height="8" rx="1"/>
        </svg>
    ),
    checkDouble: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 12 6 17 17 4"/><polyline points="7 12 12 17 23 4"/>
        </svg>
    ),
};

/* ---------- reusable field pieces ---------- */
const Field = ({ label, required, children, hint, count }) => (
    <div className="cw-field">
        {label && <label className="cw-field-label">{label}{required && <span className="req">*</span>}</label>}
        {children}
        {count && <div className="cw-char-count">{count}</div>}
        {hint && <div className="cw-char-count" style={{ textAlign: 'left' }}>{hint}</div>}
    </div>
);

const UploadBox = ({ label, icon = 'photo', onFile }) => {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const handleChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        onFile && onFile(file);
    };
    return (
        <div className="cw-upload" onClick={() => inputRef.current?.click()}>
            {preview ? (
                <img src={preview} alt={label} />
            ) : (
                <>
                    {icon === 'upload' ? Icon.upload : Icon.photo}
                    <span>{label}</span>
                </>
            )}
            <input ref={inputRef} type="file" accept="image/*,video/*" onChange={handleChange} />
        </div>
    );
};

const Radio = ({ checked, label, onClick }) => (
    <div className="cw-radio" onClick={onClick}>
        <div className={`cw-radio-dot${checked ? ' checked' : ''}`} />
        <span>{label}</span>
    </div>
);

/* Alfa9 logo avatar — falls back to the chat glyph if the image is missing */
const AgentAvatar = () => {
    const [failed, setFailed] = useState(false);
    if (failed) return Icon.chat;
    return (
        <img
            src="/image/ALFA_9_LOGO.png"
            alt="Alfa9"
            onError={() => setFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
    );
};

/* formats a Date (or timestamp) as e.g. "4:32 PM" */
const formatTime = (ts) => {
    try {
        return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
        return '';
    }
};

/* ---------- static data ---------- */
const MENU_ITEMS = [
    { key: 'deposit-history', label: 'Deposit Not Received', sub: 'Track a missing recharge', icon: Icon.wallet },
    { key: 'withdraw-history', label: 'Withdrawal problem', sub: 'Check a pending payout', icon: Icon.card },
    { key: 'password-choice', label: 'Change ID Login Password', sub: 'Reset your account access', icon: Icon.key },
    { key: 'ewallet-form', label: 'Modify E-Wallet Information', sub: 'Update payout details', icon: Icon.ewallet },
    { key: 'usdt-address', label: 'Add USDT Address', sub: 'Link a crypto wallet', icon: Icon.usdt },
    { key: 'customer-service', label: 'Online service', sub: 'Chat with our team', icon: Icon.headset },
];

const SCREEN_TITLES = {
    menu: 'Self Service Center',
    'deposit-history': 'Recharge History',
    'withdraw-history': 'Withdrawal History',
    'password-can': 'Self-service Change Password',
    'password-cannot': 'Change ID Login Password',
    'ewallet-form': 'Modify E-Wallet Information',
    'usdt-address': 'Add USDT Address',
    'customer-service': 'Customer Service',
    livechat: 'Live Chat',
    'livechat-chat': 'Alfa9 Support',
};

const EWALLET_CATEGORIES = ['Change new bank', 'Wrong beneficiary name', 'Wrong bank number'];

/* canned replies for the live-chat preview — swap this for a real API call later */
const AGENT_REPLIES = [
    "Thanks for the details — let me look into that for you.",
    "Got it, one moment please while I check your account.",
    "Sure thing! I'll get that sorted for you right away.",
];

/* ══════════════════════════════════════════════════
   SCREEN COMPONENTS — all declared at module level
   so React never remounts them on parent re-render.
   ══════════════════════════════════════════════════ */

function MenuScreen({ onItemClick, onProgressQuery }) {
    return (
        <>
            <div className="cw-banner">
              
            </div>

            <div className="cw-section-label">Self Service</div>
            <div className="cw-list">
                {MENU_ITEMS.map((item) => (
                    <div className="cw-list-item" key={item.key} onClick={() => onItemClick(item.key)}>
                        <div className="cw-list-icon">{item.icon}</div>
                        <span className="cw-list-label">
                            {item.label}
                            <span className="cw-list-sub">{item.sub}</span>
                        </span>
                        <span className="cw-list-arrow">{Icon.chevron}</span>
                    </div>
                ))}
            </div>

            <div className="cw-section-label">Kind Tips</div>
            <div className="cw-tips-card">
                <div className="cw-tips-row">
                    <div className="cw-tips-num">1</div>
                    <p>Select the matching issue and submit it for review. After successful submission, our team will handle it within <b>10 minutes</b>.</p>
                </div>
                <div className="cw-tips-row">
                    <div className="cw-tips-num">2</div>
                    <p>15 minutes after submitting, use <b>Progress Query</b> to check the status of your request.</p>
                </div>
                <div className="cw-tips-row">
                    <div className="cw-tips-num">3</div>
                    <p>Always confirm you're on the official Alfa9 domain before entering any account details.</p>
                </div>
            </div>

            <button className="cw-btn-primary" onClick={onProgressQuery}>Progress Query</button>
        </>
    );
}

function EmptyHistoryScreen() {
    return (
        <div className="cw-empty">
            <div className="cw-empty-icon">{Icon.empty}</div>
            <div className="cw-empty-text">No Data</div>
            <div className="cw-empty-sub">Once you submit a request here, you'll be able to track its status on this screen.</div>
        </div>
    );
}

function PasswordCanReceive({ otpSent, onSendOtp, onConfirm }) {
    return (
        <>
            <Field label="New Password" required>
                <input className="cw-input" type="password" placeholder="Please enter a new password" />
            </Field>
            <Field label="Register phone number to receive OTP" required>
                <div className="cw-input-row">
                    <input className="cw-input" type="text" placeholder="Please enter email / phone" />
                    <button className="cw-btn-inline" disabled={otpSent} onClick={onSendOtp}>
                        {otpSent ? 'Sent' : 'Send Verification Code'}
                    </button>
                </div>
            </Field>
            <button className="cw-btn-primary" onClick={onConfirm}>Confirm</button>
        </>
    );
}

function PasswordCannotReceive({ onConfirm }) {
    return (
        <>
            <Field label="New Password" required>
                <input className="cw-input" type="password" placeholder="Please enter content" />
            </Field>
            <Field label="Register Phone Number" required>
                <input className="cw-input" type="text" placeholder="Please enter content" />
            </Field>
            <Field label="Video holding: Identity Card, E-Wallet Account, Piece of paper with today's date written on it" required>
                <UploadBox label="Upload" icon="upload" />
            </Field>
            <Field label="Identity Card" required>
                <UploadBox label="photo" />
            </Field>
            <Field label="E-Wallet Account Detail" required>
                <UploadBox label="photo" />
            </Field>
            <Field label="Latest Deposit Receipt Proof 1" required>
                <UploadBox label="photo" />
            </Field>
            <Field label="Latest Deposit Receipt Proof 2">
                <UploadBox label="photo" />
            </Field>
            <button className="cw-btn-primary" onClick={onConfirm}>Confirm</button>
        </>
    );
}

function EwalletForm({ category, onOpenCategorySheet, onConfirm }) {
    return (
        <>
            <Field label="Select modification" required>
                <div className={`cw-select${category ? ' filled' : ''}`} onClick={onOpenCategorySheet}>
                    <span>{category || 'Category Selection'}</span>
                    {Icon.chevron}
                </div>
            </Field>

            {category && (
                <>
                    <Field label="OLD E-Wallet ( Easypaisa or Jazzcash )" required>
                        <input className="cw-input" placeholder="Please enter content" />
                    </Field>
                    <Field label="OLD Beneficiary Name" required count="0/500">
                        <textarea className="cw-textarea" placeholder="Please enter content" />
                    </Field>
                    <Field label="OLD Account No" required>
                        <input className="cw-input" placeholder="Please enter Bank Card Number" />
                    </Field>
                    <Field label="NEW E-Wallet ( Easypaisa or Jazzcash )" required>
                        <input className="cw-input" placeholder="Please enter content" />
                    </Field>
                    <Field label="NEW Beneficiary Name" required count="0/500">
                        <textarea className="cw-textarea" placeholder="Please enter content" />
                    </Field>
                    <Field label="NEW Account No" required>
                        <input className="cw-input" placeholder="Please enter Bank Card Number" />
                    </Field>
                    <Field label="Identity Card" required>
                        <UploadBox label="photo" />
                    </Field>
                    <Field label="NEW Identity Card *for change wallet with different beneficiary name">
                        <UploadBox label="photo" />
                    </Field>
                    <Field label="OLD E-Wallet" required>
                        <UploadBox label="photo" />
                    </Field>
                    <Field label="NEW E-Wallet">
                        <UploadBox label="photo" />
                    </Field>
                    <Field label="Latest Deposit Receipt Proof 1" required>
                        <UploadBox label="photo" />
                    </Field>
                    <Field label="Latest Deposit Receipt Proof 2">
                        <UploadBox label="photo" />
                    </Field>
                    <Field label="Video holding: Identity Card, E-Wallet Account, Piece of paper with today's date written on it" required>
                        <UploadBox label="Upload" icon="upload" />
                    </Field>
                    <button className="cw-btn-primary" onClick={onConfirm}>Confirm</button>
                </>
            )}
        </>
    );
}

function UsdtForm({ onConfirm }) {
    return (
        <>
            <Field label="Alfa9 ID" required>
                <input className="cw-input" placeholder="Please enter User ID" />
            </Field>
            <Field label="USDT Address" required>
                <input className="cw-input" placeholder="Please enter USDT address" />
            </Field>
            <Field label="USDT Address Screenshot" required>
                <UploadBox label="photo" />
            </Field>
            <Field label="Identity Card" required>
                <UploadBox label="photo" />
            </Field>
            <Field label="E-Wallet Account Detail" required>
                <UploadBox label="photo" />
            </Field>
            <Field label="Latest Deposit Receipt 1" required>
                <UploadBox label="photo" />
            </Field>
            <Field label="Latest Deposit Receipt 2">
                <UploadBox label="photo" />
            </Field>
            <Field label="Video holding: Identity Card, E-Wallet Account, Piece of paper with today's date written on it" required>
                <UploadBox label="Upload" icon="upload" />
            </Field>
            <button className="cw-btn-primary" onClick={onConfirm}>Confirm</button>
        </>
    );
}

function CustomerServiceScreen({ onOpenLiveChat }) {
    return (
        <>
            <div className="cw-banner">
                <div className="cw-banner-text">
                
                </div>
            </div>
            <div className="cw-list">
                <div className="cw-list-item" onClick={onOpenLiveChat}>
                    <div className="cw-list-icon cw-list-icon-live">
                        {Icon.chatLive}
                        <span className="cw-live-dot" />
                    </div>
                    <span className="cw-list-label">
                        LiveChat
                        <span className="cw-list-sub">Online now</span>
                    </span>
                    <span className="cw-list-arrow">{Icon.chevron}</span>
                </div>
            </div>
        </>
    );
}

function LiveChatScreen({ alfa9Id, onAlfa9IdChange, helpType, onHelpTypeChange, onStartChat }) {
    return (
        <>
            <div className="cw-agent-card">
                <div className="cw-agent-avatar"><AgentAvatar /></div>
                <div>
                    <div className="cw-agent-name">Alfa9 Support</div>
                    <div className="cw-agent-role">Product Expert · Online</div>
                </div>
            </div>
            <div className="cw-chat-bubble">
                Welcome to Alfa9! Please fill in the form below before starting the chat.
            </div>
            <Field label="Alfa9 ID" required>
                <input
                    className="cw-input"
                    placeholder="Enter your User ID"
                    value={alfa9Id}
                    onChange={(e) => onAlfa9IdChange(e.target.value)}
                />
            </Field>
            <Field label="I need help in:">
                <div className="cw-radio-group">
                    {['Claim bonus', 'Technical & Game Issues', 'Other'].map((opt) => (
                        <Radio key={opt} label={opt} checked={helpType === opt} onClick={() => onHelpTypeChange(opt)} />
                    ))}
                </div>
            </Field>
            <button className="cw-btn-primary" onClick={onStartChat}>Start the chat</button>
        </>
    );
}

function ChatConversationScreen({
    messages, isTyping, chatInput, onChatInputChange, onSend, onRate, rating,
    messagesEndRef, attachOpen, onToggleAttach, onAttachFile,
}) {
    const fileInputRef = useRef(null);
    const pickFile = () => {
        onToggleAttach(); // close the menu
        fileInputRef.current?.click();
    };
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // reset so picking the same file again still fires onChange
        if (file) onAttachFile(file);
    };
    return (
        <div className="cw-chat-screen">
            <div className="cw-chat-header-card">
                <div className="cw-agent-avatar"><AgentAvatar /></div>
                <div className="cw-chat-header-info">
                    <div className="cw-agent-name">Alfa9 Support</div>
                    <div className="cw-agent-status"><span className="dot" />Online now</div>
                </div>
                <div className="cw-chat-rate">
                    <div className={`cw-chat-rate-btn${rating === 'up' ? ' active' : ''}`} onClick={() => onRate('up')}>{Icon.thumbsUp}</div>
                    <div className={`cw-chat-rate-btn${rating === 'down' ? ' active' : ''}`} onClick={() => onRate('down')}>{Icon.thumbsDown}</div>
                </div>
            </div>

            <div className="cw-messages">
                {messages.map((m) => {
                    if (m.type === 'info') {
                        return (
                            <div className="cw-msg-info" key={m.id}>
                                <div className="cw-msg-info-head">
                                    <div className="cw-msg-avatar"><AgentAvatar /></div>
                                    <span>Request Details</span>
                                </div>
                                <div><b>Alfa9 ID:</b> {m.alfa9Id}</div>
                                <div><b>I need help in:</b> {m.helpType}</div>
                            </div>
                        );
                    }
                    return (
                        <div className="cw-msg-group" key={m.id}>
                            <div className={`cw-msg-row ${m.type}`}>
                                {m.type === 'agent' && <div className="cw-msg-avatar-sm"><AgentAvatar /></div>}
                                <div className="cw-msg-bubble">
                                    {m.image && (
                                        <img
                                            src={m.image}
                                            alt="attachment"
                                            style={{ maxWidth: '100%', borderRadius: 8, display: 'block', opacity: m.uploading ? 0.5 : 1, marginBottom: m.text ? 6 : 0 }}
                                        />
                                    )}
                                    {m.text}
                                    {m.uploading && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Uploading…</div>}
                                    {m.failed && <div style={{ fontSize: 11, color: '#ff5876', marginTop: 4 }}>Upload failed</div>}
                                </div>
                            </div>
                            <div className="cw-msg-meta">
                                {formatTime(m.time || Date.now())}
                                {m.type === 'user' && <span className="cw-msg-ticks">{Icon.checkDouble}</span>}
                            </div>
                        </div>
                    );
                })}
                {isTyping && (
                    <div className="cw-msg-row agent">
                        <div className="cw-msg-avatar-sm"><AgentAvatar /></div>
                    </div>
                )}
                {isTyping && <div className="cw-typing"><span /><span /><span /></div>}
                <div ref={messagesEndRef} />
            </div>

            <div className="cw-chat-input-bar">
                <div className="cw-attach-wrap">
                    {attachOpen && (
                        <>
                            <div className="cw-attach-catcher" onClick={onToggleAttach} />
                            <div className="cw-attach-menu">
                                <div className="cw-attach-option" onClick={pickFile}>
                                    {Icon.file}
                                    <span>Send a file</span>
                                </div>
                                <div className="cw-attach-option" onClick={pickFile}>
                                    {Icon.screenshot}
                                    <span>Add screenshot</span>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="cw-icon-btn cw-attach-btn" onClick={onToggleAttach}>{Icon.plus}</div>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>
                <input
                    className="cw-chat-input"
                    placeholder="Write a message…"
                    value={chatInput}
                    onChange={(e) => onChatInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                />
                <button className="cw-chat-send" disabled={!chatInput.trim()} onClick={onSend}>{Icon.send}</button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   PERSISTENCE — keeps the widget open on the same
   screen across a page refresh instead of resetting.
   ══════════════════════════════════════════════════ */
const STORAGE_KEY = 'alfa9_chatwidget_state';

function loadPersistedState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/* ══════════════════════════════════════════════════
   MAIN WIDGET
   ══════════════════════════════════════════════════ */
export default function ChatWidget() {
    const initial = typeof window !== 'undefined' ? loadPersistedState() : null;

    const [isOpen, setIsOpen] = useState(initial?.isOpen ?? false);
    const [stack, setStack] = useState(initial?.stack ?? ['menu']);
    const [verifyChoiceOpen, setVerifyChoiceOpen] = useState(false);
    const [categorySheetOpen, setCategorySheetOpen] = useState(false);
    const [category, setCategory] = useState(initial?.category ?? '');
    const [tempCategory, setTempCategory] = useState('');
    const [helpType, setHelpType] = useState(initial?.helpType ?? '');
    const [toast, setToast] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [fabImgFailed, setFabImgFailed] = useState(false);
    const [attachOpen, setAttachOpen] = useState(false);
    const [rating, setRating] = useState(initial?.rating ?? '');

    /* live chat conversation */
    const [alfa9Id, setAlfa9Id] = useState(initial?.alfa9Id ?? '');
    const [messages, setMessages] = useState(initial?.messages ?? []);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    // Stable per-browser session id so /chatbot/message can thread the
    // conversation server-side (ChatLog.sessionId). Generated once and
    // persisted, not per-open, so history survives closing/reopening the widget.
    const sessionIdRef = useRef(
        initial?.sessionId ||
        (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cw-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    );

    const screen = stack[stack.length - 1];

    /* Persist the important bits whenever they change */
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                isOpen, stack, category, helpType, alfa9Id, messages, rating,
                sessionId: sessionIdRef.current,
            }));
        } catch {
            /* storage unavailable — fail silently, widget still works */
        }
    }, [isOpen, stack, category, helpType, alfa9Id, messages, rating]);

    const open = () => {
        setIsOpen(true);
        setStack(['menu']);
        setMessages([]);
        setChatInput('');
        setIsTyping(false);
        setAttachOpen(false);
        setRating('');
    };
    const close = () => setIsOpen(false);
    const push = (s) => setStack((prev) => [...prev, s]);
    const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    const goHome = () => setStack(['menu']);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2200);
    };

    const handleMenuClick = (key) => {
        if (key === 'password-choice') {
            setVerifyChoiceOpen(true);
        } else {
            push(key);
        }
    };

    const handleConfirm = (label) => {
        showToast(`${label} submitted for review`);
    };

    /* ---------- live chat conversation logic ---------- */
    // Shared greeting used whether the chat is auto-started (logged-in user)
    // or started manually via the ID/help-type form.
    const beginChat = (id, help) => {
        setAlfa9Id(id);
        setMessages([
            { id: 'info-' + Date.now(), type: 'info', alfa9Id: id, helpType: help || 'General', time: Date.now() },
        ]);
        push('livechat-chat');
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [...prev, { id: 'a-' + Date.now(), type: 'agent', text: 'Hi! How can I help you today? What issue are you facing?', time: Date.now() }]);
        }, 700);
    };

    // Called when the user taps "LiveChat" from the Customer Service menu.
    // If they're logged in, their account UID is auto-detected (same value
    // shown on the Account page: last 6 chars of their _id) and the chat
    // opens straight into the conversation — no manual ID/help-type form.
    // Guests still see the form (we have no ID to catch for them).
    const openLiveChat = () => {
        apiFetch('/user/profile')
            .then((data) => {
                const uid = data.user?._id ? data.user._id.slice(-6) : null;
                if (uid) beginChat(uid, 'General');
                else push('livechat');
            })
            .catch(() => push('livechat')); // not logged in / no token — fall back to manual form
    };

    const startChat = () => {
        if (!alfa9Id.trim()) { showToast('Please enter your Alfa9 ID'); return; }
        if (!helpType) { showToast('Please select what you need help with'); return; }
        beginChat(alfa9Id, helpType);
    };

    const sendChatMessage = () => {
        const text = chatInput.trim();
        if (!text) return;
        setMessages((prev) => [...prev, { id: 'u-' + Date.now(), type: 'user', text, time: Date.now() }]);
        setChatInput('');
        setIsTyping(true);

        apiFetch('/chatbot/message', {
            method: 'POST',
            body: { message: text, sessionId: sessionIdRef.current },
        })
            .then((data) => {
                setIsTyping(false);
                setMessages((prev) => [...prev, { id: 'a-' + Date.now(), type: 'agent', text: data.reply, time: Date.now() }]);
            })
            .catch(() => {
                // Backend/Groq unreachable — fall back to a canned line instead of leaving the user stuck
                setIsTyping(false);
                const reply = AGENT_REPLIES[Math.floor(Math.random() * AGENT_REPLIES.length)];
                setMessages((prev) => [...prev, { id: 'a-' + Date.now(), type: 'agent', text: reply, time: Date.now() }]);
            });
    };

    // Uploads a picked file/screenshot, shows it in the chat immediately (with
    // an "Uploading…" state), then tells the assistant it arrived so it can
    // acknowledge it (matches the "ask for a screenshot" support-prompt rule).
    const handleAttachFile = (file) => {
        if (!file) return;
        setAttachOpen(false);

        const previewUrl = URL.createObjectURL(file);
        const localId = 'u-' + Date.now();
        setMessages((prev) => [...prev, { id: localId, type: 'user', image: previewUrl, text: '', time: Date.now(), uploading: true }]);
        setIsTyping(true);

        const formData = new FormData();
        formData.append('image', file);

        apiFetch('/chatbot/upload', { method: 'POST', body: formData })
            .then((res) => {
                setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, uploading: false, image: res.url } : m)));
                return apiFetch('/chatbot/message', {
                    method: 'POST',
                    body: { message: `[User attached a screenshot: ${res.url}]`, sessionId: sessionIdRef.current },
                });
            })
            .then((data) => {
                setIsTyping(false);
                if (data?.reply) {
                    setMessages((prev) => [...prev, { id: 'a-' + Date.now(), type: 'agent', text: data.reply, time: Date.now() }]);
                }
            })
            .catch((err) => {
                setIsTyping(false);
                setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, uploading: false, failed: true } : m)));
                showToast(err?.message || 'Upload failed — please try again');
            });
    };

    const handleRate = (value) => {
        setRating((prev) => (prev === value ? '' : value));
        showToast('Thanks for your feedback!');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    return (
        <div className="cw-root">
            {/* Floating icon — always visible */}
            {!isOpen && (
                <div className="cw-fab" onClick={open} title="Support">
                    {fabImgFailed ? (
                        <div className="cw-fab-fallback">{Icon.chat}</div>
                    ) : (
                        <img
                            src="/image/chat-bot-image.png"
                            alt="Support"
                            className="cw-fab-img"
                            onError={() => setFabImgFailed(true)}
                        />
                    )}
                    <span className="cw-fab-dot" />
                </div>
            )}

            {isOpen && (
                <div className="cw-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
                    <div className="cw-panel">
                        {/* Header */}
                        <div className="cw-header">
                            {screen === 'menu' ? (
                                <div className="cw-icon-btn" onClick={close}>{Icon.close}</div>
                            ) : (
                                <div className="cw-icon-btn" onClick={pop}>{Icon.back}</div>
                            )}
                            <div className="cw-header-titlewrap">
                                <div className="cw-header-title">{SCREEN_TITLES[screen]}</div>
                                {(screen === 'livechat' || screen === 'livechat-chat') && (
                                    <div className="cw-header-sub"><span className="dot" />Agents online</div>
                                )}
                            </div>
                            {screen === 'menu' ? (
                                <div style={{ width: 36 }} />
                            ) : screen === 'livechat' || screen === 'livechat-chat' ? (
                                <div className="cw-icon-btn" onClick={close}>{Icon.close}</div>
                            ) : (
                                <div className="cw-icon-btn" onClick={goHome}>{Icon.home}</div>
                            )}
                        </div>

                        {/* Body */}
                        <div className={`cw-body${screen === 'livechat-chat' ? ' cw-body-chat' : ''}`}>
                            <div className="cw-screen" key={screen}>
                                {screen === 'menu' && (
                                    <MenuScreen
                                        onItemClick={handleMenuClick}
                                        onProgressQuery={() => showToast('No pending requests found')}
                                    />
                                )}
                                {(screen === 'deposit-history' || screen === 'withdraw-history') && <EmptyHistoryScreen />}
                                {screen === 'password-can' && (
                                    <PasswordCanReceive
                                        otpSent={otpSent}
                                        onSendOtp={() => { setOtpSent(true); showToast('Verification code sent'); }}
                                        onConfirm={() => handleConfirm('Password change')}
                                    />
                                )}
                                {screen === 'password-cannot' && (
                                    <PasswordCannotReceive onConfirm={() => handleConfirm('Password change')} />
                                )}
                                {screen === 'ewallet-form' && (
                                    <EwalletForm
                                        category={category}
                                        onOpenCategorySheet={() => { setTempCategory(category); setCategorySheetOpen(true); }}
                                        onConfirm={() => handleConfirm('E-wallet update')}
                                    />
                                )}
                                {screen === 'usdt-address' && (
                                    <UsdtForm onConfirm={() => handleConfirm('USDT address')} />
                                )}
                                {screen === 'customer-service' && (
                                    <CustomerServiceScreen onOpenLiveChat={openLiveChat} />
                                )}
                                {screen === 'livechat' && (
                                    <LiveChatScreen
                                        alfa9Id={alfa9Id}
                                        onAlfa9IdChange={setAlfa9Id}
                                        helpType={helpType}
                                        onHelpTypeChange={setHelpType}
                                        onStartChat={startChat}
                                    />
                                )}
                                {screen === 'livechat-chat' && (
                                    <ChatConversationScreen
                                        messages={messages}
                                        isTyping={isTyping}
                                        chatInput={chatInput}
                                        onChatInputChange={setChatInput}
                                        onSend={sendChatMessage}
                                        onRate={handleRate}
                                        rating={rating}
                                        messagesEndRef={messagesEndRef}
                                        attachOpen={attachOpen}
                                        onToggleAttach={() => setAttachOpen((v) => !v)}
                                        onAttachFile={handleAttachFile}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Toast */}
                        <div className={`cw-toast${toast ? ' show' : ''}`}>{toast}</div>

                        {/* Verification choice overlay (Change ID Login Password entry point) */}
                        {verifyChoiceOpen && (
                            <div className="cw-dialog-overlay" onClick={(e) => e.target === e.currentTarget && setVerifyChoiceOpen(false)}>
                                <div className="cw-dialog">
                                    <div className="cw-choice-title">Cannot receive verification code?</div>
                                    <div className="cw-choice-row">
                                        <div
                                            className="cw-choice-btn"
                                            onClick={() => { setVerifyChoiceOpen(false); push('password-can'); }}
                                        >
                                            Can Receive
                                        </div>
                                        <div
                                            className="cw-choice-btn"
                                            onClick={() => { setVerifyChoiceOpen(false); push('password-cannot'); }}
                                        >
                                            Cannot Receive
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Category bottom sheet (Modify E-Wallet Information) */}
                        {categorySheetOpen && (
                            <div className="cw-sheet-overlay" onClick={(e) => e.target === e.currentTarget && setCategorySheetOpen(false)}>
                                <div className="cw-sheet">
                                    <div className="cw-sheet-head">
                                        <button className="cw-sheet-cancel" onClick={() => setCategorySheetOpen(false)}>Cancel</button>
                                        <button
                                            className="cw-sheet-confirm"
                                            onClick={() => { setCategory(tempCategory); setCategorySheetOpen(false); }}
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                    {EWALLET_CATEGORIES.map((opt) => (
                                        <div
                                            key={opt}
                                            className={`cw-sheet-option${tempCategory === opt ? ' selected' : ''}`}
                                            onClick={() => setTempCategory(opt)}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}