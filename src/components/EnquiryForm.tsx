'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface EnquiryFormProps {
  propertyId: string;
  propertyTitle?: string;
  propertyPrice?: number;
  propertyLocation?: string;
  ownerName?: string;
  ownerPhone?: string;
}

export default function EnquiryForm({
  propertyId,
  propertyTitle = 'Rental Property',
  propertyPrice,
  propertyLocation = 'Pune',
  ownerName = 'Landlord',
  ownerPhone = '+917218661327',
}: EnquiryFormProps) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    moveInDate: 'Immediate',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [generatedWhatsAppUrl, setGeneratedWhatsAppUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-fill user details if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Build formatted WhatsApp message
  const buildWhatsAppMessage = () => {
    const formattedPrice = propertyPrice
      ? `₹${propertyPrice.toLocaleString('en-IN')}/mo`
      : 'Price on request';

    const text =
      `🏠 *Property Enquiry - S.R Rental Services*
━━━━━━━━━━━━━━━━━━
📍 *Property:* ${propertyTitle}
💰 *Rent:* ${formattedPrice}
📌 *Location:* ${propertyLocation}

👤 *Interested Tenant:* ${formData.name.trim()}
📞 *Phone:* ${formData.phone.trim()}
✉️ *Email:* ${formData.email.trim()}
🗓️ *Move-in Plan:* ${formData.moveInDate}

💬 *Message:* 
"${formData.message.trim() || 'Hi, I would like to schedule a visit to view this property.'}"
━━━━━━━━━━━━━━━━━━
_Sent via S.R Rental Services Platform_`;

    return text;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Save lead to backend database
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `[Move-in: ${formData.moveInDate}] ${formData.message || 'Interested in property visit.'}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry');
      }

      // 2. Prepare WhatsApp URL
      const cleanPhone = (ownerPhone || '917218661327').replace(/\D/g, '');
      const rawText = buildWhatsAppMessage();
      const encodedMsg = encodeURIComponent(rawText);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

      setGeneratedWhatsAppUrl(waUrl);
      setSuccess(true);

      // 3. Automatically trigger WhatsApp in a new tab
      if (typeof window !== 'undefined') {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      console.error('Enquiry error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = () => {
    const text = buildWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="card enquiry-card-box glass">
      <div className="enquiry-card-header">
        <div className="enquiry-icon-badge">💬</div>
        <div>
          <h3>Send Property Enquiry</h3>
          <p className="enquiry-subtitle-text">Connect directly with {ownerName} via WhatsApp and save your visit enquiry.</p>
        </div>
      </div>

      {success ? (
        <div className="enquiry-success-box animate-fadeIn">
          <div className="wa-success-icon">✅</div>
          <h4>Enquiry Submitted Successfully!</h4>
          <p className="wa-success-desc">
            Your enquiry has been saved and forwarded to <strong>{ownerName}</strong> on WhatsApp.
          </p>

          <div className="wa-success-actions">
            <a
              href={generatedWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp-direct"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
              </svg>
              Open WhatsApp Chat
            </a>

            <button
              type="button"
              onClick={handleCopyMessage}
              className="btn btn-outline-copy"
            >
              {copied ? '✓ Message Copied!' : '📋 Copy Message Text'}
            </button>

            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="btn-send-another"
            >
              ← Send Another Message
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="enquiry-form-element">
          {error && <div className="alert-message error-alert">⚠️ {error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="enq-name">Your Full Name <span className="req">*</span></label>
            <input
              type="text"
              id="enq-name"
              name="name"
              className="form-input"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="grid-2 form-row-gap">
            <div className="form-group">
              <label className="form-label" htmlFor="enq-phone">Phone Number <span className="req">*</span></label>
              <input
                type="tel"
                id="enq-phone"
                name="phone"
                className="form-input"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="enq-email">Email Address <span className="req">*</span></label>
              <input
                type="email"
                id="enq-email"
                name="email"
                className="form-input"
                placeholder="e.g. rahul@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="enq-movein">Preferred Move-in Timeline</label>
            <select
              id="enq-movein"
              name="moveInDate"
              className="form-input custom-select"
              value={formData.moveInDate}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="Immediate">⚡ Immediate (Within 3 Days)</option>
              <option value="Within 7 Days">📅 Within 7 Days</option>
              <option value="Within 15 Days">📅 Within 15 Days</option>
              <option value="Next Month">🗓️ Next Month</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="enq-msg">Message / Visit Preference</label>
            <textarea
              id="enq-msg"
              name="message"
              className="form-input text-area-input"
              rows={3}
              placeholder="Hi, I am interested in renting this property. Let me know when I can visit."
              value={formData.message}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-whatsapp-submit w-full ${loading ? 'btn-disabled' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span>Submitting Enquiry...</span>
            ) : (
              <span className="btn-wa-content">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="wa-btn-icon">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
                </svg>
                Send Enquiry via WhatsApp
              </span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
