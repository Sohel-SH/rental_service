'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface EnquiryFormProps {
  propertyId: string;
}

export default function EnquiryForm({ propertyId }: EnquiryFormProps) {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Auto-fill user details if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry');
      }

      setSuccess('Your enquiry has been sent to the owner! They will contact you shortly.');
      setFormData((prev) => ({ ...prev, message: '' })); // Reset message
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card enquiry-card-box">
      <h3>Enquire About Property</h3>
      <p className="enquiry-subtitle-text">Fill out this quick form and the landlord will get back to you.</p>

      {success && <div className="alert-message success-alert">{success}</div>}
      {error && <div className="alert-message error-alert">{error}</div>}

      <form onSubmit={handleSubmit} className="enquiry-form-element">
        <div className="form-group">
          <label className="form-label" htmlFor="enq-name">Your Name</label>
          <input
            type="text"
            id="enq-name"
            name="name"
            className="form-input"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="enq-email">Email Address</label>
          <input
            type="email"
            id="enq-email"
            name="email"
            className="form-input"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="enq-phone">Phone Number</label>
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
          <label className="form-label" htmlFor="enq-msg">Message</label>
          <textarea
            id="enq-msg"
            name="message"
            className="form-input text-area-input"
            rows={4}
            placeholder="I am interested in this rental property. Please let me know when we can schedule a visit..."
            value={formData.message}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className={`btn btn-primary w-full ${loading ? 'btn-disabled' : ''}`}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Send Enquiry'}
        </button>
      </form>
    </div>
  );
}
