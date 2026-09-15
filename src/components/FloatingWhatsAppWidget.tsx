'use client';

import React, { useState } from 'react';

export default function FloatingWhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [quickMsg, setQuickMsg] = useState('');
  const helplineWhatsAppNumber = '917218661327';

  const handleQuickSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickMsg.trim() || 'Hi S.R Rental Services, I have a quick enquiry regarding rental houses.';
    const encoded = encodeURIComponent(`💬 *Quick Enquiry - S.R Rental Services*\n${text}`);
    const url = `https://wa.me/${helplineWhatsAppNumber}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    setQuickMsg('');
  };

  const handleDirectChat = () => {
    const defaultText = encodeURIComponent('Hi S.R Rental Services, I would like to enquire about rental properties.');
    const url = `https://wa.me/${helplineWhatsAppNumber}?text=${defaultText}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="floating-wa-container">
      {/* Mini Popup Box if Opened */}
      {isOpen && (
        <div className="floating-wa-popup card animate-fadeIn">
          <div className="wa-popup-header">
            <div className="wa-avatar-box">
              <span className="wa-icon-online"></span>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
              </svg>
            </div>
            <div>
              <h4 className="wa-popup-title">S.R Rentals Support</h4>
              <p className="wa-popup-subtitle">Typically replies within 10 mins</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="wa-close-btn"
              aria-label="Close WhatsApp chat popup"
            >
              ✕
            </button>
          </div>

          <div className="wa-popup-body">
            <div className="wa-chat-bubble">
              👋 Hi there! Need help finding the perfect rental house or listing your property? Type a message below to chat on WhatsApp!
            </div>

            <form onSubmit={handleQuickSend} className="wa-quick-form">
              <input
                type="text"
                className="wa-quick-input"
                placeholder="Type your question or requirement..."
                value={quickMsg}
                onChange={(e) => setQuickMsg(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-wa-send">
                Send
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="floating-wa-btn"
        aria-label="Chat with S.R Rental Services on WhatsApp"
        title="Chat on WhatsApp"
      >
        <span className="wa-pulse-ring"></span>
        <svg viewBox="0 0 24 24" width="30" height="30" fill="#ffffff">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
        </svg>
        <span className="floating-wa-label">WhatsApp Us</span>
      </button>
    </div>
  );
}
