'use client';

import React, { useState } from 'react';
import PropertyMapWrapper from '@/components/PropertyMapWrapper';
import { useAuth } from '@/context/AuthContext';

export default function ContactPage() {
  const { user } = useAuth();
  const helplinePhone = '+917218661327';
  const helplineWhatsAppNumber = '917218661327';

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    inquiryType: 'Tenant Looking for Home',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [waUrl, setWaUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // S.R Rental Services office coordinates in Hinjawadi Phase 1
  const officeLocation = [
    {
      id: 'sr_office',
      title: 'S.R Rental Services (Head Office)',
      price: 0,
      location: 'Hinjawadi Phase 1, Pune, MH 411057',
      latitude: 18.5925,
      longitude: 73.7412,
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const buildWhatsAppMessage = () => {
    return `🏢 *General Enquiry - S.R Rental Services*
━━━━━━━━━━━━━━━━━━
📋 *Topic:* ${formData.inquiryType}
👤 *Name:* ${formData.name.trim()}
📞 *Phone:* ${formData.phone.trim()}
✉️ *Email:* ${formData.email.trim()}

💬 *Message:*
"${formData.message.trim() || 'Hi S.R Rental Services, I would like to get more details about your rental services.'}"
━━━━━━━━━━━━━━━━━━
_Sent from S.R Rental Services Contact Portal_`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    const rawMessage = buildWhatsAppMessage();
    const encoded = encodeURIComponent(rawMessage);
    const targetUrl = `https://wa.me/${helplineWhatsAppNumber}?text=${encoded}`;

    setWaUrl(targetUrl);
    setSubmitted(true);

    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopy = () => {
    const text = buildWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="contact-page">
      <div className="container contact-container">

        {/* Header Block */}
        <div className="contact-header text-center">
          <span className="user-role-tag">Get in Touch</span>
          <h1>Contact S.R Rental Services</h1>
          <p className="max-w-600">Have questions about properties, landlord packages, or tenancy policies? Fill out our enquiry form to chat on WhatsApp or visit our Pune office.</p>
        </div>

        {/* 2-Column Split: Enquiry Form + Contact Info */}
        <div className="grid-2 contact-split-layout">

          {/* LEFT: ENQUIRY FORM */}
          <div className="card contact-form-card glass">
            <div className="enquiry-card-header">
              <div className="enquiry-icon-badge">💬</div>
              <div>
                <h2>Send Us an Enquiry</h2>
                <p className="enquiry-subtitle-text">Fill out this quick form to initiate an instant WhatsApp chat with our support staff.</p>
              </div>
            </div>

            {submitted ? (
              <div className="enquiry-success-box animate-fadeIn">
                <div className="wa-success-icon">✅</div>
                <h3>Enquiry Generated!</h3>
                <p className="wa-success-desc">
                  Your WhatsApp message has been prepared for our team at <strong>+91 98765 43210</strong>.
                </p>

                <div className="wa-success-actions">
                  <a
                    href={waUrl}
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
                    onClick={handleCopy}
                    className="btn btn-outline-copy"
                  >
                    {copied ? '✓ Message Copied!' : '📋 Copy Message Text'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="btn-send-another"
                  >
                    ← Send Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="enquiry-form-element">
                <div className="form-group">
                  <label className="form-label" htmlFor="cnt-name">Your Full Name <span className="req">*</span></label>
                  <input
                    type="text"
                    id="cnt-name"
                    name="name"
                    className="form-input"
                    placeholder="e.g. Anand Kulkarni"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid-2 form-row-gap">
                  <div className="form-group">
                    <label className="form-label" htmlFor="cnt-phone">Phone Number <span className="req">*</span></label>
                    <input
                      type="tel"
                      id="cnt-phone"
                      name="phone"
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="cnt-email">Email Address <span className="req">*</span></label>
                    <input
                      type="email"
                      id="cnt-email"
                      name="email"
                      className="form-input"
                      placeholder="e.g. anand@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cnt-type">Inquiry Topic</label>
                  <select
                    id="cnt-type"
                    name="inquiryType"
                    className="form-input custom-select"
                    value={formData.inquiryType}
                    onChange={handleChange}
                  >
                    <option value="Tenant Looking for Home">🏠 Tenant Looking for Rental Home</option>
                    <option value="Landlord Wanting to List Property">🔑 Property Owner / Landlord Listing</option>
                    <option value="Maintenance or Support Ticket">🔧 Maintenance or Tenant Support</option>
                    <option value="Rental Agreement & Police Verification">📜 Rental Agreement Assistance</option>
                    <option value="Corporate / Partnership Query">💼 Corporate / Business Partnership</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cnt-msg">Message / Query Details</label>
                  <textarea
                    id="cnt-msg"
                    name="message"
                    className="form-input text-area-input"
                    rows={4}
                    placeholder="Describe what you are looking for or any specific questions you have..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-whatsapp-submit w-full"
                >
                  <span className="btn-wa-content">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="wa-btn-icon">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
                    </svg>
                    Submit & Send via WhatsApp
                  </span>
                </button>
              </form>
            )}
          </div>

          {/* RIGHT: CONTACT DETAILS & MAP */}
          <div className="contact-details-column">

            {/* Direct Cards */}
            <div className="contact-info-cards">

              <div className="card contact-item" style={{ borderColor: '#10b981' }}>
                <span className="contact-icon" style={{ color: '#10b981' }}>💬</span>
                <div>
                  <h3 style={{ color: '#047857' }}>WhatsApp Helpdesk</h3>
                  <p>Chat directly with our leasing and customer support team on WhatsApp.</p>
                  <a
                    href={`https://wa.me/${helplineWhatsAppNumber}?text=${encodeURIComponent('Hi S.R Rental Services, I have some questions about rental properties.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary contact-wa-btn"
                  >
                    Chat on WhatsApp: +91 98765 43210
                  </a>
                </div>
              </div>

              <div className="card contact-item">
                <span className="contact-icon">📞</span>
                <div>
                  <h3>Phone Support</h3>
                  <p>Monday - Sunday (9:00 AM - 7:30 PM)</p>
                  <a href={`tel:${helplinePhone}`} className="contact-action-link">Call +91 98765 43210</a>
                </div>
              </div>

              <div className="card contact-item">
                <span className="contact-icon">✉️</span>
                <div>
                  <h3>Email Support</h3>
                  <p>For official inquiries, partnerships, and legal queries.</p>
                  <a href="mailto:support@srrentals.com" className="contact-action-link">support@srrentals.com</a>
                </div>
              </div>

              <div className="card contact-item">
                <span className="contact-icon">📍</span>
                <div>
                  <h3>Headquarters</h3>
                  <p>SR Complex, Hinjawadi Phase 1 Rd, Opp. Wipro Gate 2, Hinjawadi, Pune, MH 411057</p>
                </div>
              </div>

            </div>

            {/* Map Card */}
            <div className="contact-map-card card">
              <h3>Office Location Map</h3>
              <p className="form-sub-text">Visit us in Hinjawadi for personal consultations.</p>
              <div className="contact-map-box">
                <PropertyMapWrapper properties={officeLocation} />
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
