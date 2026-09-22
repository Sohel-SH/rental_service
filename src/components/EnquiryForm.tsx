'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface EnquiryFormProps {
  propertyId: string;
  propertyTitle?: string;
  propertyPrice?: number;
  propertyLocation?: string;
}

export default function EnquiryForm({
  propertyId,
  propertyTitle = 'Rental Property',
  propertyPrice,
  propertyLocation = 'Pune',
}: EnquiryFormProps) {
  const { user } = useAuth();
  const adminWhatsAppNumber = '917218661327';

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

  // Build formatted WhatsApp message for Admin Lead Desk
  const buildWhatsAppMessage = () => {
    const formattedPrice = propertyPrice
      ? `₹${propertyPrice.toLocaleString('en-IN')}/mo`
      : 'Price on request';

    const text =
      `🏠 *New Visit Lead - S.R Rental Services*
━━━━━━━━━━━━━━━━━━
📍 *Property:* ${propertyTitle}
💰 *Rent:* ${formattedPrice}
📌 *Location:* ${propertyLocation}

👤 *Interested Client:* ${formData.name.trim()}
📞 *Phone:* ${formData.phone.trim()}
✉️ *Email:* ${formData.email.trim()}
🗓️ *Move-in Timeline:* ${formData.moveInDate}

💬 *Requirement Note:* 
"${formData.message.trim() || 'Please schedule a verified property visit with the landlord.'}"
━━━━━━━━━━━━━━━━━━
_Captured on S.R Rental Services Portal_`;

    return text;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Save lead to backend database for Admin CRM
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `[Move-in: ${formData.moveInDate}] ${formData.message || 'Interested in scheduled property visit.'}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry');
      }

      // 2. Prepare WhatsApp URL routing to Admin Lead Desk
      const rawText = buildWhatsAppMessage();
      const encodedMsg = encodeURIComponent(rawText);
      const waUrl = data.adminWhatsAppUrl || `https://wa.me/${adminWhatsAppNumber}?text=${encodedMsg}`;

      setGeneratedWhatsAppUrl(data.adminWhatsAppUrl || '');
      setSuccess(true);
    } catch (err: any) {
      console.error('Enquiry error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card enquiry-card-box glass">
      <div className="enquiry-card-header">
        <div className="enquiry-icon-badge">📅</div>
        <div>
          <h3>Book a Free Property Visit</h3>
          <p className="enquiry-subtitle-text">Direct visits coordinated by S.R Rental Advisors. Zero spam, verified pricing.</p>
        </div>
      </div>

      {success ? (
        <div className="enquiry-success-box animate-fadeIn" style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
          <div className="wa-success-icon" style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
          <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#15803d', marginBottom: '0.5rem' }}>
            Enquiry Submitted Successfully!
          </h4>
          <p style={{ fontSize: '0.9rem', color: '#166534', lineHeight: '1.6', marginBottom: '1.25rem' }}>
            Thank you, <strong>{formData.name}</strong>! Your visit enquiry for <strong>"{propertyTitle}"</strong> has been received by our central team. <strong>Our property advisor will reach out to you in a short while</strong> on <strong>{formData.phone}</strong> to confirm your visit slot.
          </p>

          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#166534', fontWeight: '600' }}>📍 Property:</span>
              <span style={{ color: '#14532d', fontWeight: '700' }}>{propertyTitle}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#166534', fontWeight: '600' }}>🗓️ Move-in Plan:</span>
              <span style={{ color: '#14532d' }}>{formData.moveInDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#166534', fontWeight: '600' }}>📞 Your Contact:</span>
              <span style={{ color: '#14532d' }}>{formData.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#166534', fontWeight: '600' }}>⚡ Status:</span>
              <span style={{ color: '#15803d', fontWeight: '700' }}>● Lead Generated in Admin CRM</span>
            </div>
          </div>

          <div className="wa-success-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setFormData({
                  name: user?.name || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                  moveInDate: 'Immediate',
                  message: '',
                });
              }}
              className="btn btn-primary w-full"
              style={{ padding: '0.75rem', fontSize: '0.9rem' }}
            >
              ← Book Another Property Visit
            </button>

            {generatedWhatsAppUrl && (
              <a
                href={generatedWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.8rem', color: '#15803d', textDecoration: 'underline', marginTop: '0.25rem', display: 'inline-block' }}
              >
                💬 Need instant help? Chat with S.R Helpline on WhatsApp
              </a>
            )}
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
