import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerService.css';

const FAQS = [
  {
    q: "How long does a withdrawal take?",
    a: "Most withdrawals are processed within 5–30 minutes depending on your bank or wallet provider.",
  },
  {
    q: "I forgot my password, what do I do?",
    a: "Contact our support team via Telegram or WhatsApp with your registered phone number and we'll help you reset it securely.",
  },
  {
    q: "My bonus hasn't been credited yet",
    a: "Bonuses are usually credited instantly. If it's been over 10 minutes, message us with your UID and we'll check right away.",
  },
];

function CustomerService() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className="customer-service-page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="header-title">Customer Service</div>
        <div className="header-sub">We&apos;re here to help you 24/7</div>
      </div>

      {/* TEAM AVATARS */}
      <div className="team-wrap">
        <div className="avatar-stack">
          <img src="https://i.pravatar.cc/150?img=32" alt="Support agent" />
          <img src="https://i.pravatar.cc/150?img=47" alt="Support agent" />
          <div className="online-badge-wrap">
            <img src="https://i.pravatar.cc/150?img=12" alt="Support agent" />
            <div className="online-dot"></div>
          </div>
        </div>
        <div className="hero-title">Support Team</div>
        <div className="hero-desc">Our real support agents are online and ready to help with any question or issue.</div>
      </div>

      <div className="status-row">
        <div className="rating-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#F3DA95">
            <path d="M12 2.5l2.9 6.3 6.8.6-5.2 4.6 1.6 6.7L12 17.1l-6.1 3.6 1.6-6.7-5.2-4.6 6.8-.6z" />
          </svg>
          4.9 / 5 Rating
        </div>
        <div className="status-pill"><div className="status-dot"></div>Online Now</div>
        <div className="resp-pill">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          Reply in ~5 min
        </div>
      </div>

      <div className="section-label">Choose Contact Method</div>
      <div className="contact-list">
        <a className="contact-card telegram" href="https://t.me/Saifmarko" target="_blank" rel="noreferrer">
          <div className="cc-icon tg">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', zIndex: 1 }}>
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </div>
          <div className="cc-info">
            <div className="cc-title-row">
              <div className="cc-title">Telegram</div>
              <div className="cc-fastest-badge">FASTEST</div>
            </div>
            <div className="cc-sub">Chat with us on Telegram</div>
            <div className="cc-num">@Saifmarko</div>
          </div>
          <div className="cc-arrow tg-arr">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#29B6F6" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        </a>

        <a className="contact-card whatsapp" href="https://wa.me/923163533206" target="_blank" rel="noreferrer">
          <div className="cc-icon wa">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', zIndex: 1 }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
          </div>
          <div className="cc-info">
            <div className="cc-title">WhatsApp</div>
            <div className="cc-sub">Chat with us on WhatsApp</div>
            <div className="cc-num">+92 316 3533206</div>
          </div>
          <div className="cc-arrow wa-arr">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        </a>
      </div>

      {/* QUICK FAQ */}
      <div className="section-label" style={{ marginTop: '22px' }}>Quick Answers</div>
      <div className="faq-list">
        {FAQS.map((item, i) => (
          <div
            key={item.q}
            className={`faq-item${openFaq === i ? ' open' : ''}`}
            onClick={() => toggleFaq(i)}
          >
            <div className="faq-q">
              {item.q}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <div className="faq-a"><div className="faq-a-inner">{item.a}</div></div>
          </div>
        ))}
      </div>

      <div className="info-box">
        <div className="info-box-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9971F" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          Before Contacting Us
        </div>
        <div className="info-row"><div className="info-dot"></div><div className="info-text">Have your UID ready for faster support</div></div>
        <div className="info-row"><div className="info-dot"></div><div className="info-text">For deposit/withdraw issues, include transaction ID</div></div>
        <div className="info-row"><div className="info-dot"></div><div className="info-text">Our team responds within 5 minutes during business hours</div></div>
        <div className="info-row"><div className="info-dot"></div><div className="info-text">Available 24/7 for urgent matters</div></div>
      </div>

      <div className="footer-note">Alfa9 &middot; Play Smart, Play Fair</div>
    </div>
  );
}

export default CustomerService;