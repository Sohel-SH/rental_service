'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('users');

  // Data states
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Protect client route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch administrative data
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch leads (role-aware: returns all leads for admin)
      const leadsRes = await fetch('/api/leads');
      // 2. Fetch documents (role-aware: returns all docs for admin)
      const docsRes = await fetch('/api/documents');
      // 3. Fetch tickets (role-aware: returns all tickets for admin)
      const ticketsRes = await fetch('/api/tickets');
      
      // 4. Fetch all users from database
      const usersRes = await fetch('/api/admin/users');

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads || []);
      }
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data.documents || []);
      }
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data.tickets || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle Document Approval / Rejection
  const handleDocStatusChange = async (documentId: string, status: string) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      // Refresh documents
      const docsRes = await fetch('/api/documents');
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating document status');
    }
  };

  // Handle Ticket Status updates (Admins can resolve/close tickets globally)
  const handleTicketStatusChange = async (ticketId: string, status: string) => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status }),
      });

      if (res.ok) {
        // Refresh tickets
        const ticketsRes = await fetch('/api/tickets');
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setTickets(ticketsData.tickets || []);
        }
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
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
            <span className="user-role-tag">Admin Command Center</span>
            <h2>Welcome, {user.name}</h2>
            <p>Monitor user registration, verify leasing documents, audit enquiries, and track maintenance issues.</p>
          </div>
          <div className="user-meta-info">
            <p>📧 {user.email}</p>
            <p>🔑 System Role: Administrator</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users ({users.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            🛡️ Verification ({documents.filter((d: any) => d.status === 'pending').length} Pending)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            📩 All Enquiries ({leads.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            🛠️ All Tickets ({tickets.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="dashboard-tab-content">
          {loading ? (
            <div className="tab-loading-state">Loading administration metrics...</div>
          ) : (
            <>
              {/* USERS MANAGER TAB */}
              {activeTab === 'users' && (
                <div className="tab-panel">
                  <h3 className="panel-title">System Users</h3>
                  
                  {users.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>User Name</th>
                            <th>Email Address</th>
                            <th>Phone Number</th>
                            <th>System Role</th>
                            <th>Joined Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((usr: any) => (
                            <tr key={usr._id}>
                              <td><strong>{usr.name}</strong></td>
                              <td>{usr.email}</td>
                              <td>{usr.phone || 'Not provided'}</td>
                              <td>
                                <span className={`user-role-tag`} style={{
                                  backgroundColor: usr.role === 'admin' ? '#fee2e2' : usr.role === 'owner' ? '#d1fae5' : '#e0e7ff',
                                  color: usr.role === 'admin' ? '#dc2626' : usr.role === 'owner' ? '#059669' : '#4f46e5',
                                  margin: 0
                                }}>
                                  {usr.role}
                                </span>
                              </td>
                              <td>{new Date(usr.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>No users found in the system database.</p>
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENT VERIFICATION TAB */}
              {activeTab === 'documents' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Pending Document Approvals</h3>
                  
                  {documents.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Document Type</th>
                            <th>File Name</th>
                            <th>Upload Date</th>
                            <th>Status Badge</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc: any) => (
                            <tr key={doc._id}>
                              <td>
                                <strong>{doc.userId?.name || 'Deleted User'}</strong>
                                <span className="table-sub-detail">{doc.userId?.email} &bull; ({doc.userId?.role})</span>
                              </td>
                              <td style={{ textTransform: 'capitalize' }}>
                                {doc.documentType.replace('_', ' ')}
                              </td>
                              <td>
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="doc-view-link" style={{ fontSize: '0.85rem' }}>
                                  📄 {doc.fileName || 'file_doc.pdf'}
                                </a>
                              </td>
                              <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                              <td>
                                <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                              </td>
                              <td>
                                {doc.status === 'pending' ? (
                                  <div className="actions-buttons-row">
                                    <button 
                                      onClick={() => handleDocStatusChange(doc._id, 'verified')}
                                      className="btn btn-primary btn-sm"
                                      style={{ backgroundColor: 'var(--success)', padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                    >
                                      Verify
                                    </button>
                                    <button 
                                      onClick={() => handleDocStatusChange(doc._id, 'rejected')}
                                      className="btn btn-danger btn-sm"
                                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => handleDocStatusChange(doc._id, 'pending')}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                  >
                                    Reset to Pending
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
                      <p>All documents verified. No pending items.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ENQUIRIES PIPELINE TAB */}
              {activeTab === 'leads' && (
                <div className="tab-panel">
                  <h3 className="panel-title">System Enquiries log</h3>
                  
                  {leads.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Sender</th>
                            <th>Contact Phone</th>
                            <th>Enquiry Message</th>
                            <th>Status Badge</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map((lead: any) => (
                            <tr key={lead._id}>
                              <td>
                                <strong>{lead.propertyId?.title || 'Deleted Property'}</strong>
                                <span className="table-sub-detail">Rent: ₹{(lead.propertyId?.price || 0).toLocaleString()}/mo</span>
                              </td>
                              <td>
                                <strong>{lead.name}</strong>
                                <span className="table-sub-detail">{lead.email}</span>
                              </td>
                              <td>{lead.phone}</td>
                              <td style={{ maxWidth: '350px', fontSize: '0.8rem' }}>"{lead.message}"</td>
                              <td>
                                <span className={`badge badge-${lead.status}`}>{lead.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>No enquiries raised yet in S.R Rental Services.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TICKETS TRACKER TAB */}
              {activeTab === 'tickets' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Global Maintenance Tickets</h3>
                  
                  {tickets.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Tenant Details</th>
                            <th>Priority</th>
                            <th>Issue Summary</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((t: any) => (
                            <tr key={t._id}>
                              <td>
                                <strong>{t.propertyId?.title || 'Deleted Property'}</strong>
                                <span className="table-sub-detail">📍 {t.propertyId?.location}</span>
                              </td>
                              <td>
                                <strong>{t.tenantId?.name || 'Deleted Tenant'}</strong>
                                <span className="table-sub-detail">📞 {t.tenantId?.phone}</span>
                              </td>
                              <td>
                                <span className={`badge badge-priority ${t.priority}`}>{t.priority}</span>
                              </td>
                              <td>
                                <strong>{t.title}</strong>
                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                  "{t.description}"
                                </span>
                              </td>
                              <td>
                                <span className={`badge badge-${t.status}`}>{t.status}</span>
                              </td>
                              <td>
                                <select
                                  className="form-input"
                                  style={{ padding: '0.4rem', fontSize: '0.75rem', width: '120px' }}
                                  value={t.status}
                                  onChange={(e) => handleTicketStatusChange(t._id, e.target.value)}
                                >
                                  <option value="open">Open</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>No maintenance tickets raised yet.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
