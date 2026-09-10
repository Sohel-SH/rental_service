'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function TenantDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('applications');
  
  // Data states
  const [leads, setLeads] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tickets, setTickets] = useState([]);
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
      // Parallel fetches for efficiency
      const [leadsRes, docsRes, ticketsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/documents'),
        fetch('/api/tickets'),
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
        
        // Auto-select first property for the ticket form if available
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

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('documentType', docType);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadSuccess('Document uploaded successfully!');
      setUploadFile(null);
      
      // Clear file input on UI
      const fileInput = document.getElementById('doc-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reload document list
      const docsRes = await fetch('/api/documents');
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during file upload.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Ticket Submission
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.propertyId) {
      setTicketError('Please select a property.');
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
      if (!res.ok) throw new Error(data.error || 'Failed to submit ticket');

      setTicketSuccess('Maintenance ticket raised successfully!');
      setTicketForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        priority: 'medium',
      }));

      // Reload tickets
      const ticketsRes = await fetch('/api/tickets');
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData.tickets || []);
      }
    } catch (err: any) {
      setTicketError(err.message || 'An error occurred.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  // Close ticket (Update status to 'closed')
  const handleCloseTicket = async (ticketId: string) => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: 'closed' }),
      });

      if (res.ok) {
        // Refresh ticket list
        const ticketsRes = await fetch('/api/tickets');
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setTickets(ticketsData.tickets || []);
        }
      }
    } catch (err) {
      console.error('Failed to close ticket:', err);
    }
  };

  if (authLoading || !user) {
    return <div className="dashboard-loading-screen">Verifying session...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <div className="container dashboard-container-box">
        
        {/* Welcome Section */}
        <div className="dashboard-header-block card glass">
          <div>
            <span className="user-role-tag">Tenant Portal</span>
            <h2>Welcome back, {user.name}</h2>
            <p>Track your applications, upload lease documents, and raise maintenance tickets.</p>
          </div>
          <div className="user-meta-info">
            <p>📧 {user.email}</p>
            {user.phone && <p>📞 {user.phone}</p>}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            📋 Applications ({leads.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            📁 My Documents ({documents.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            🛠️ Maintenance ({tickets.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="dashboard-tab-content">
          {loading ? (
            <div className="tab-loading-state">Loading dashboard data...</div>
          ) : (
            <>
              {/* APPLICATIONS TAB */}
              {activeTab === 'applications' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Your Property Applications</h3>
                  
                  {leads.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property Name</th>
                            <th>Monthly Rent</th>
                            <th>Enquiry Date</th>
                            <th>Application Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map((lead: any) => (
                            <tr key={lead._id}>
                              <td>
                                <strong>{lead.propertyId?.title || 'Unknown Property'}</strong>
                                <span className="table-sub-detail">📍 {lead.propertyId?.location || 'Pune'}</span>
                              </td>
                              <td>₹{(lead.propertyId?.price || 0).toLocaleString('en-IN')}/mo</td>
                              <td>{new Date(lead.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                              <td>
                                <span className={`badge badge-${lead.status}`}>
                                  {lead.status === 'new' ? 'submitted' : lead.status}
                                </span>
                              </td>
                              <td>
                                <a href={`/properties/${lead.propertyId?._id}`} className="btn btn-secondary btn-sm">
                                  View Property
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>You haven't applied to any properties yet.</p>
                      <button onClick={() => router.push('/listings')} className="btn btn-primary">
                        Browse Listings
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <div className="tab-panel grid-2">
                  
                  {/* Upload Form */}
                  <div className="card upload-doc-form-card">
                    <h3>Upload Lease Documents</h3>
                    <p className="form-sub-text">Please upload your ID Proof (Aadhaar/PAN) or Tenancy Agreement for verification.</p>

                    {uploadSuccess && <div className="alert-message success-alert">{uploadSuccess}</div>}
                    {uploadError && <div className="alert-message error-alert">{uploadError}</div>}

                    <form onSubmit={handleUploadSubmit} className="dashboard-form">
                      <div className="form-group">
                        <label className="form-label" htmlFor="doc-type">Document Type</label>
                        <select
                          id="doc-type"
                          className="form-input"
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                        >
                          <option value="id_proof">KYC ID Proof (Aadhaar, Passport, PAN)</option>
                          <option value="agreement">Tenancy Lease Agreement</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="doc-file">Select File</label>
                        <input
                          type="file"
                          id="doc-file"
                          className="form-input"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                          required
                        />
                      </div>

                      <button 
                        type="submit" 
                        className={`btn btn-primary w-full ${uploading ? 'btn-disabled' : ''}`}
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading...' : 'Upload Document'}
                      </button>
                    </form>
                  </div>

                  {/* Document List */}
                  <div className="doc-list-side">
                    <h3 className="panel-title">Uploaded Files</h3>
                    
                    {documents.length > 0 ? (
                      <div className="doc-grid-list">
                        {documents.map((doc: any) => (
                          <div key={doc._id} className="card doc-item-card flex-between">
                            <div>
                              <span className="doc-type-tag">
                                {doc.documentType === 'id_proof' ? 'ID Proof' : 'Agreement'}
                              </span>
                              <h4 className="doc-name">{doc.fileName || 'file_upload.pdf'}</h4>
                              <span className="doc-date">Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="doc-status-col">
                              <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                              <a 
                                href={doc.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="doc-view-link"
                              >
                                View File &rarr;
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-tab-state">
                        <p>No documents uploaded yet. Upload your KYC to speed up agreements.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* MAINTENANCE TAB */}
              {activeTab === 'tickets' && (
                <div className="tab-panel grid-2">
                  
                  {/* Create Ticket Form */}
                  <div className="card ticket-form-card">
                    <h3>Raise Maintenance Request</h3>
                    <p className="form-sub-text">Notice any issues in your rental? Describe the problem to notify your landlord.</p>

                    {ticketSuccess && <div className="alert-message success-alert">{ticketSuccess}</div>}
                    {ticketError && <div className="alert-message error-alert">{ticketError}</div>}

                    {leads.length > 0 ? (
                      <form onSubmit={handleTicketSubmit} className="dashboard-form">
                        <div className="form-group">
                          <label className="form-label" htmlFor="ticket-prop">Property</label>
                          <select
                            id="ticket-prop"
                            className="form-input"
                            name="propertyId"
                            value={ticketForm.propertyId}
                            onChange={(e) => setTicketForm({ ...ticketForm, propertyId: e.target.value })}
                            required
                          >
                            <option value="">Select Property</option>
                            {leads.map((lead: any) => (
                              <option key={lead._id} value={lead.propertyId?._id}>
                                {lead.propertyId?.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="ticket-title">Issue Summary</label>
                          <input
                            type="text"
                            id="ticket-title"
                            className="form-input"
                            placeholder="e.g. Water leakage in bathroom"
                            value={ticketForm.title}
                            onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                            required
                            disabled={ticketSubmitting}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="ticket-priority">Priority</label>
                          <select
                            id="ticket-priority"
                            className="form-input"
                            value={ticketForm.priority}
                            onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                          >
                            <option value="low">Low (General inquiries, checks)</option>
                            <option value="medium">Medium (Repair, replacements)</option>
                            <option value="high">High (Urgent leakage, power failure)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="ticket-desc">Describe the Problem</label>
                          <textarea
                            id="ticket-desc"
                            className="form-input text-area-input"
                            rows={4}
                            placeholder="Provide details about the issue, location, and when it started..."
                            value={ticketForm.description}
                            onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                            required
                            disabled={ticketSubmitting}
                          />
                        </div>

                        <button 
                          type="submit" 
                          className={`btn btn-primary w-full ${ticketSubmitting ? 'btn-disabled' : ''}`}
                          disabled={ticketSubmitting}
                        >
                          {ticketSubmitting ? 'Submitting...' : 'Submit Ticket'}
                        </button>
                      </form>
                    ) : (
                      <div className="empty-form-fallback">
                        <p>You can only raise maintenance requests for properties you have enquired about.</p>
                      </div>
                    )}
                  </div>

                  {/* Ticket List */}
                  <div className="ticket-list-side">
                    <h3 className="panel-title">Your Requests</h3>
                    
                    {tickets.length > 0 ? (
                      <div className="ticket-grid-list">
                        {tickets.map((ticket: any) => (
                          <div key={ticket._id} className="card ticket-item-card">
                            <div className="flex-between ticket-item-header">
                              <div>
                                <span className={`badge badge-priority ${ticket.priority}`}>
                                  {ticket.priority} priority
                                </span>
                                <h4 className="ticket-title">{ticket.title}</h4>
                                <span className="ticket-prop-name">📍 {ticket.propertyId?.title}</span>
                              </div>
                              <span className={`badge badge-${ticket.status}`}>{ticket.status}</span>
                            </div>
                            <p className="ticket-description">{ticket.description}</p>
                            <div className="flex-between ticket-footer">
                              <span className="ticket-date">Raised: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                              {ticket.status !== 'closed' && (
                                <button 
                                  onClick={() => handleCloseTicket(ticket._id)}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Close Ticket
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-tab-state">
                        <p>No maintenance tickets raised yet.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
