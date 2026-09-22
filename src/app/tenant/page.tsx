'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function TenantDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('rent');
  
  // Data states
  const [leads, setLeads] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Document Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('id_proof');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Ticket Form state
  const [ticketForm, setTicketForm] = useState({
    propertyId: '',
    title: '',
    description: '',
    priority: 'medium',
  });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState('');
  const [ticketError, setTicketError] = useState('');

  // Pay Modal State
  const [payModalItem, setPayModalItem] = useState<any>(null);
  const [payMethod, setPayMethod] = useState('UPI');
  const [payProcessing, setPayProcessing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Protect client route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && user.role !== 'tenant') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch tenant data
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [leadsRes, docsRes, ticketsRes, paymentsRes, leasesRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/documents'),
        fetch('/api/tickets'),
        fetch('/api/payments'),
        fetch('/api/leases'),
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
        if (data.leads && data.leads.length > 0 && !ticketForm.propertyId) {
          setTicketForm((prev) => ({
            ...prev,
            propertyId: data.leads[0].propertyId?._id || '',
          }));
        }
      }
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data.documents || []);
      }
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data.tickets || []);
      }
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data.payments || []);
      }
      if (leasesRes.ok) {
        const data = await leasesRes.json();
        setLeases(data.leases || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle Document Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('documentType', docType);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadSuccess('Document uploaded successfully. Verification in progress.');
      setUploadFile(null);
      fetchData();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle Maintenance Ticket Submission
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.propertyId || !ticketForm.title || !ticketForm.description) {
      setTicketError('Please fill in all fields.');
      return;
    }

    setTicketSubmitting(true);
    setTicketError('');
    setTicketSuccess('');

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setTicketSuccess('Ticket submitted. Property manager notified.');
      setTicketForm({
        propertyId: leads[0]?.propertyId?._id || '',
        title: '',
        description: '',
        priority: 'medium',
      });
      fetchData();
    } catch (err: any) {
      setTicketError(err.message);
    } finally {
      setTicketSubmitting(false);
    }
  };

  // Handle Rent Payment
  const handleCompletePayment = async () => {
    if (!payModalItem) return;
    setPayProcessing(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payModalItem._id || payModalItem.id,
          status: 'PAID',
          paymentMethod: payMethod,
        }),
      });
      if (res.ok) {
        setPayModalItem(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setPayProcessing(false);
    }
  };

  if (authLoading || !user) {
    return <div className="dashboard-loading-screen">Loading tenant workspace...</div>;
  }

  const activeLease = leases.find((l: any) => l.status === 'ACTIVE' || l.status === 'NOTICE_PERIOD');
  const pendingPayments = payments.filter((p: any) => p.status === 'PENDING' || p.status === 'OVERDUE');

  return (
    <div className="dashboard-wrapper">
      <div className="container dashboard-container-box">
        
        {/* Welcome Section */}
        <div className="dashboard-header-block card glass">
          <div>
            <span className="user-role-tag">Tenant Portal</span>
            <h2>Welcome, {user.name}</h2>
            <p>Pay rent dues, download official receipts, and view active tenancy agreement.</p>
          </div>
          <div className="user-meta-info">
            <p>📧 {user.email}</p>
            <p>📱 Phone: {user.phone || 'N/A'}</p>
          </div>
        </div>

        {/* Pending Rent Alert Bar */}
        {pendingPayments.length > 0 && (
          <div className="card animate-fadeIn" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💳</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#92400e' }}>
                  Rent Payment Due: ₹{pendingPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString('en-IN')}
                </h4>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#b45309' }}>
                  {pendingPayments[0]?.title} for {pendingPayments[0]?.property?.title}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setActiveTab('rent'); setPayModalItem(pendingPayments[0]); }}
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: '#059669', padding: '0.45rem 1rem' }}
            >
              Pay Now (Instant UPI)
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="dashboard-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button 
            className={`tab-btn ${activeTab === 'rent' ? 'active' : ''}`}
            onClick={() => setActiveTab('rent')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            💰 Rent & Invoices ({payments.length})
            {pendingPayments.length > 0 && (
              <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '0.675rem', fontWeight: '700', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                {pendingPayments.length} DUE
              </span>
            )}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tenancy' ? 'active' : ''}`}
            onClick={() => setActiveTab('tenancy')}
          >
            📅 My Tenancy Agreement
          </button>
          <button 
            className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            📩 Visit Enquiries ({leads.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            🛡️ KYC Documents ({documents.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            🛠️ Maintenance Requests ({tickets.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="dashboard-tab-content">
          {loading ? (
            <div className="tab-loading-state">Loading tenant records...</div>
          ) : (
            <>
              {/* 1. RENT & INVOICES TAB */}
              {activeTab === 'rent' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>Rent Dues & Official Payment Receipts</h3>
                  </div>

                  {payments.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Invoice / Description</th>
                            <th>Property</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment Date / Due</th>
                            <th>Receipt / Transaction</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p: any) => (
                            <tr key={p._id}>
                              <td>
                                <strong>{p.title}</strong>
                                <span className="table-sub-detail">Type: {p.type}</span>
                              </td>
                              <td>
                                <strong>{p.property?.title || 'Property'}</strong>
                                <span className="table-sub-detail">📍 {p.property?.location}</span>
                              </td>
                              <td>
                                <strong style={{ color: p.status === 'PAID' ? '#059669' : '#d97706', fontSize: '1rem' }}>
                                  ₹{p.amount?.toLocaleString('en-IN')}
                                </strong>
                              </td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: p.status === 'PAID' ? '#dcfce7' : '#fef3c7',
                                    color: p.status === 'PAID' ? '#15803d' : '#b45309',
                                    fontWeight: '700',
                                  }}
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                                  {p.paidAt
                                    ? `Paid: ${new Date(p.paidAt).toLocaleDateString('en-IN')}`
                                    : `Due: ${p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : 'Immediate'}`}
                                </span>
                              </td>
                              <td>
                                {p.receiptNumber ? (
                                  <div>
                                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0284c7' }}>{p.receiptNumber}</span>
                                    {p.transactionId && <span className="table-sub-detail">{p.transactionId}</span>}
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Awaiting payment</span>
                                )}
                              </td>
                              <td>
                                {p.status === 'PENDING' ? (
                                  <button
                                    type="button"
                                    onClick={() => setPayModalItem(p)}
                                    className="btn btn-primary btn-sm"
                                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#059669' }}
                                  >
                                    💳 Pay Now
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReceipt(p)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                                  >
                                    📄 Receipt
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>No payment invoices generated for your account yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. MY TENANCY TAB */}
              {activeTab === 'tenancy' && (
                <div className="tab-panel animate-fadeIn">
                  <h3 className="panel-title">My Active Tenancy Agreement</h3>

                  {activeLease ? (
                    <div style={{ maxWidth: '650px', marginTop: '1rem' }}>
                      {/* Active Lease Info Card */}
                      <div className="card" style={{ padding: '1.75rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>Current Registered Lease</h4>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: activeLease.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7',
                              color: activeLease.status === 'ACTIVE' ? '#15803d' : '#b45309',
                              fontWeight: '700',
                            }}
                          >
                            {activeLease.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.9rem', lineHeight: 2.2 }}>
                          <div><strong>🏠 Rented Property:</strong> {activeLease.property?.title}</div>
                          <div><strong>📍 Locality & Address:</strong> {activeLease.property?.location}</div>
                          <div><strong>💰 Monthly Rent:</strong> ₹{activeLease.monthlyRent?.toLocaleString('en-IN')} / month</div>
                          <div><strong>🔒 Security Deposit (Escrow):</strong> ₹{activeLease.securityDeposit?.toLocaleString('en-IN')}</div>
                          <div><strong>📅 Agreement Term:</strong> {new Date(activeLease.startDate).toLocaleDateString('en-IN')} &rarr; {new Date(activeLease.endDate).toLocaleDateString('en-IN')} ({activeLease.durationMonths} Months)</div>
                          <div><strong>👤 Property Owner / Landlord:</strong> {activeLease.owner?.name} {activeLease.owner?.phone ? `(📞 ${activeLease.owner.phone})` : ''}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>You do not have an active tenancy agreement linked to your account currently.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. APPLICATIONS & ENQUIRIES TAB */}
              {activeTab === 'applications' && (
                <div className="tab-panel animate-fadeIn">
                  <h3 className="panel-title">My Visit Enquiries & Applications</h3>
                  {leads.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Date Requested</th>
                            <th>Requirement Note</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map((lead: any) => (
                            <tr key={lead._id}>
                              <td>
                                <strong>{lead.propertyId?.title || 'Property'}</strong>
                                <span className="table-sub-detail">📍 {lead.propertyId?.location}</span>
                              </td>
                              <td>{new Date(lead.createdAt).toLocaleDateString('en-IN')}</td>
                              <td><span style={{ fontSize: '0.8rem', color: '#475569' }}>"{lead.message}"</span></td>
                              <td><span className={`badge badge-${lead.status}`}>{lead.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state"><p>You haven't enquired about any properties yet.</p></div>
                  )}
                </div>
              )}

              {/* 4. KYC DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <div className="tab-panel animate-fadeIn">
                  <div className="panel-header-flex">
                    <h3 className="panel-title">Identity & Verification Documents</h3>
                  </div>

                  <form onSubmit={handleUploadSubmit} className="upload-form-box card glass" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Upload Verification Document</h4>
                    {uploadSuccess && <div className="alert alert-success">{uploadSuccess}</div>}
                    {uploadError && <div className="alert alert-error">{uploadError}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                      <div className="form-group">
                        <label className="form-label">Document Type</label>
                        <select className="form-input" value={docType} onChange={(e) => setDocType(e.target.value)}>
                          <option value="id_proof">Govt ID Proof (Aadhaar / Passport)</option>
                          <option value="agreement">Signed Rental Agreement</option>
                          <option value="employment_proof">Employment / Salary Slip</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Choose File</label>
                        <input type="file" className="form-input" onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)} />
                      </div>
                      <button type="submit" disabled={uploading} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </form>

                  {documents.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Document Type</th>
                            <th>Uploaded On</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc: any) => (
                            <tr key={doc._id}>
                              <td><strong>{doc.documentType}</strong></td>
                              <td>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                              <td><span className={`badge badge-${doc.status}`}>{doc.status}</span></td>
                              <td><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>View</a></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state"><p>No documents uploaded yet.</p></div>
                  )}
                </div>
              )}

              {/* 5. MAINTENANCE TICKETS TAB */}
              {activeTab === 'tickets' && (
                <div className="tab-panel animate-fadeIn">
                  <h3 className="panel-title">Maintenance & Service Requests</h3>

                  <form onSubmit={handleTicketSubmit} className="card glass" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Raise a New Maintenance Request</h4>
                    {ticketSuccess && <div className="alert alert-success">{ticketSuccess}</div>}
                    {ticketError && <div className="alert alert-error">{ticketError}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Property *</label>
                        <select className="form-input" value={ticketForm.propertyId} onChange={(e) => setTicketForm({ ...ticketForm, propertyId: e.target.value })}>
                          <option value="">-- Select Property --</option>
                          {leads.map((l: any) => (
                            <option key={l.propertyId?._id} value={l.propertyId?._id}>{l.propertyId?.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select className="form-input" value={ticketForm.priority} onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}>
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">Urgent / High</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Issue Title *</label>
                      <input type="text" className="form-input" placeholder="e.g. Water leak in bathroom, AC not cooling" value={ticketForm.title} onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Detailed Description *</label>
                      <textarea className="form-input" rows={2} placeholder="Describe the maintenance issue..." value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} />
                    </div>
                    <button type="submit" disabled={ticketSubmitting} className="btn btn-primary">
                      {ticketSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </form>

                  {tickets.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Issue</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Created Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((t: any) => (
                            <tr key={t._id}>
                              <td><strong>{t.title}</strong><span className="table-sub-detail">"{t.description}"</span></td>
                              <td><span className={`badge badge-priority ${t.priority}`}>{t.priority}</span></td>
                              <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                              <td>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state"><p>No maintenance tickets raised.</p></div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* PAY RENT MODAL */}
      {payModalItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#0f172a' }}>Pay Rent / Dues</h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
              Instant payment with automated receipt generation.
            </p>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>{payModalItem.title}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#059669' }}>
                ₹{payModalItem.amount?.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Property: {payModalItem.property?.title}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Select Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {['UPI', 'Card', 'NetBanking'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayMethod(m)}
                    className={`btn btn-sm ${payMethod === m ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.775rem' }}
                  >
                    {m === 'UPI' ? '📱 UPI' : m === 'Card' ? '💳 Card' : '🏦 NetBanking'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                disabled={payProcessing}
                onClick={handleCompletePayment}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.65rem', backgroundColor: '#059669' }}
              >
                {payProcessing ? 'Processing...' : `Pay ₹${payModalItem.amount?.toLocaleString('en-IN')}`}
              </button>
              <button
                type="button"
                onClick={() => setPayModalItem(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.65rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {selectedReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>S.R RENTAL SERVICES</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Official Payment Receipt</span>
              </div>
              <button type="button" onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0', fontSize: '0.825rem', lineHeight: 1.8 }}>
              <div><strong>Receipt No:</strong> <span style={{ color: '#0284c7', fontFamily: 'monospace' }}>{selectedReceipt.receiptNumber}</span></div>
              <div><strong>Transaction ID:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedReceipt.transactionId || 'N/A'}</span></div>
              <div><strong>Paid On:</strong> {selectedReceipt.paidAt ? new Date(selectedReceipt.paidAt).toLocaleString('en-IN') : 'N/A'}</div>
              <div><strong>Payment Mode:</strong> {selectedReceipt.paymentMethod}</div>
              <div><strong>Purpose:</strong> {selectedReceipt.title}</div>
              <div style={{ fontSize: '1.15rem', color: '#059669', fontWeight: '800', marginTop: '0.5rem' }}>
                Amount: ₹{selectedReceipt.amount?.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1, padding: '0.65rem' }}>🖨️ Print</button>
              <button type="button" onClick={() => setSelectedReceipt(null)} className="btn btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
