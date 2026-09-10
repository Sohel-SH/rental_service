import React from 'react';
import PropertyMapWrapper from '@/components/PropertyMapWrapper';

export default function ContactPage() {
  const helplinePhone = '+919876543210';
  const helplineWhatsApp = `https://wa.me/919876543210?text=${encodeURIComponent('Hi S.R Rental Services, I have some enquiries regarding leasing a property.')}`;

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

  return (
    <div className="contact-page">
      <div className="container contact-container">
        
        <div className="contact-header text-center">
          <span className="user-role-tag">Get in Touch</span>
          <h1>Contact S.R Rental Services</h1>
          <p className="max-w-600">Have questions about listings, document verification, or landlord packages? Contact our Pune head office or chat with us instantly.</p>
        </div>

        <div className="grid-2 contact-split">
          
          {/* Info Side */}
          <div className="contact-info-cards">
            
            <div className="card contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <h3>Phone Call Helpline</h3>
                <p>Call our customer support team for instant queries during office hours (9 AM - 7 PM).</p>
                <a href={`tel:${helplinePhone}`} className="contact-action-link">Call +91 98765 43210</a>
              </div>
            </div>

            <div className="card contact-item" style={{ borderColor: '#10b981' }}>
              <span className="contact-icon" style={{ color: '#10b981' }}>💬</span>
              <div>
                <h3 style={{ color: '#10b981' }}>WhatsApp Helpline</h3>
                <p>Start a WhatsApp chat with our support staff. We usually reply in under 15 minutes.</p>
                <a href={helplineWhatsApp} target="_blank" rel="noopener noreferrer" className="btn btn-primary contact-wa-btn">
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            <div className="card contact-item">
              <span className="contact-icon">✉️</span>
              <div>
                <h3>Email Support</h3>
                <p>Drop us a line regarding business partnerships, feedback, or complaints.</p>
                <a href="mailto:support@srrentals.com" className="contact-action-link">support@srrentals.com</a>
              </div>
            </div>

            <div className="card contact-item">
              <span className="contact-icon">📍</span>
              <div>
                <h3>Office Address</h3>
                <p>SR Complex, Hinjawadi Phase 1 Rd, Opp. Wipro Gate 2, Hinjawadi, Pune, Maharashtra 411057</p>
              </div>
            </div>

          </div>

          {/* Map Side */}
          <div className="contact-map-card card">
            <h3>Our Office Location</h3>
            <p className="form-sub-text">Visit us for face-to-face consultations or agreement signings.</p>
            <div className="contact-map-box">
              <PropertyMapWrapper properties={officeLocation} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
