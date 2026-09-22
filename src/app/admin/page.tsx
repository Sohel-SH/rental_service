'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminNotificationManager from '@/components/AdminNotificationManager';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('financials');

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>({
    totalCollected: 0,
    totalPending: 0,
    totalDepositsHeld: 0,
    totalBrokerageEarned: 0,
    overdueCount: 0,
  });
  const [leases, setLeases] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sub-states
  const [leadFilter, setLeadFilter] = useState('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dealFilter, setDealFilter] = useState('all');
  const [occupancyFilter, setOccupancyFilter] = useState('all');

  // Modals state
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    propertyId: '',
    userId: '',
    title: 'Monthly Rent',
    amount: '',
    type: 'RENT',
    dueDate: '',
  });

  // Protect client route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Helper to update list state seamlessly without destroying DOM references if data has not changed
  const updateIfChanged = <T extends Record<string, any>>(prevList: T[], newList: T[]): T[] => {
    if (!newList) return prevList;
    if (!prevList || prevList.length === 0) return newList;

    if (JSON.stringify(prevList) === JSON.stringify(newList)) {
      return prevList; // Keeps the exact same memory reference so React skips re-rendering entirely
    }

    const prevMap = new Map<string, T>();
    prevList.forEach((item) => {
      const key = item.id || item._id;
      if (key) prevMap.set(key, item);
    });

    let hasChanged = prevList.length !== newList.length;
    const merged = newList.map((newItem) => {
      const key = newItem.id || newItem._id;
      if (!key) {
        hasChanged = true;
        return newItem;
      }
      const prevItem = prevMap.get(key);
      if (prevItem && JSON.stringify(prevItem) === JSON.stringify(newItem)) {
        return prevItem; // Preserve existing object reference
      }
      hasChanged = true;
      return newItem;
    });

    return hasChanged ? merged : prevList;
  };

  // Fetch administrative data
  const fetchData = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    try {
      const [leadsRes, docsRes, ticketsRes, usersRes, paymentsRes, leasesRes, dealsRes, propsRes] =
        await Promise.all([
          fetch('/api/leads'),
          fetch('/api/documents'),
          fetch('/api/tickets'),
          fetch('/api/admin/users'),
          fetch('/api/payments'),
          fetch('/api/leases'),
          fetch('/api/deals'),
          fetch('/api/properties'),
        ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads((prev) => updateIfChanged(prev, data.leads || []));
      }
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments((prev) => updateIfChanged(prev, data.documents || []));
      }
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets((prev) => updateIfChanged(prev, data.tickets || []));
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers((prev) => updateIfChanged(prev, data.users || []));
      }
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments((prev) => updateIfChanged(prev, data.payments || []));
        if (data.stats) {
          setPaymentStats((prev: any) => {
            if (JSON.stringify(prev) === JSON.stringify(data.stats)) return prev;
            return data.stats;
          });
        }
      }
      if (leasesRes.ok) {
        const data = await leasesRes.json();
        setLeases((prev) => updateIfChanged(prev, data.leases || []));
      }
      if (dealsRes.ok) {
        const data = await dealsRes.json();
        setDeals((prev) => updateIfChanged(prev, data.deals || []));
      }
      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties((prev) => updateIfChanged(prev, data.properties || []));
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData(false); // Initial load with loading skeleton
      // Silent background polling every 12 seconds: only updates if new/changed records arrive
      const interval = setInterval(() => {
        fetchData(true);
      }, 12000);
      return () => clearInterval(interval);
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
      fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Error updating document status');
    }
  };

  // Handle Lead Status updates
  const handleLeadStatusChange = async (leadId: string, status: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status }),
      });
      if (res.ok) fetchData(true);
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  // Handle Payment Status updates (Mark Paid / Refund)
  const handlePaymentStatusChange = async (paymentId: string, status: string) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status }),
      });
      if (res.ok) fetchData(true);
    } catch (err) {
      console.error('Failed to update payment status:', err);
    }
  };

  // Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceForm),
      });
      if (res.ok) {
        setShowCreateInvoiceModal(false);
        setInvoiceForm({ propertyId: '', userId: '', title: 'Monthly Rent', amount: '', type: 'RENT', dueDate: '' });
        fetchData(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create invoice');
      }
    } catch (err) {
      console.error('Failed to create invoice:', err);
    }
  };

  // Handle Lease Termination / Conclusion
  const handleConcludeLease = async (leaseId: string) => {
    if (!confirm('Are you sure you want to conclude this lease and mark the property as available?')) return;
    try {
      const res = await fetch('/api/leases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId, action: 'terminate_or_complete' }),
      });
      if (res.ok) fetchData(true);
    } catch (err) {
      console.error('Failed to conclude lease:', err);
    }
  };

  // Handle Ticket Status updates
  const handleTicketStatusChange = async (ticketId: string, status: string) => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status }),
      });
      if (res.ok) fetchData(true);
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  if (authLoading || !user) {
    return <div className="dashboard-loading-screen">Verifying session...</div>;
  }

  const newLeads = leads.filter((l: any) => l.status === 'new');
  const latestNewLead = newLeads[0];

  // Filtered lists
  const filteredLeads = leads.filter((l: any) => {
    const matchesFilter = leadFilter === 'all' || l.status === leadFilter;
    const matchesSearch =
      !leadSearch ||
      l.name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.phone?.includes(leadSearch) ||
      l.propertyId?.title?.toLowerCase().includes(leadSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredPayments = payments.filter((p: any) => {
    if (paymentFilter === 'all') return true;
    if (paymentFilter === 'PAID') return p.status === 'PAID';
    if (paymentFilter === 'PENDING') return p.status === 'PENDING';
    if (paymentFilter === 'OVERDUE') return p.status === 'OVERDUE';
    if (paymentFilter === 'SECURITY_DEPOSIT') return p.type === 'SECURITY_DEPOSIT';
    if (paymentFilter === 'BROKERAGE') return p.type === 'BROKERAGE';
    return true;
  });

  const filteredDeals = deals.filter((d: any) => {
    if (dealFilter === 'all') return true;
    return d.dealType === dealFilter;
  });

  const filteredLeases = leases.filter((l: any) => {
    if (occupancyFilter === 'all') return true;
    return l.status === occupancyFilter;
  });

  const vacatingLeases = leases.filter((l: any) => l.status === 'NOTICE_PERIOD');

  return (
    <div className="dashboard-wrapper">
      <div className="container dashboard-container-box">
        
        {/* Welcome Section */}
        <div className="dashboard-header-block card glass">
          <div>
            <span className="user-role-tag">Admin Command Center</span>
            <h2>Welcome, {user.name}</h2>
            <p>Financial ledger, closed deals & sales tracking, occupancy & vacancies radar, and lead management.</p>
          </div>
          <div className="user-meta-info">
            <p>📧 {user.email}</p>
            <p>🔑 System Role: Administrator</p>
          </div>
        </div>
        
        {/* Real-Time Phone & Device Push Alert Manager */}
        <AdminNotificationManager leads={leads} />

        {/* Live Enquiry Alert Bar if new leads exist */}
        {newLeads.length > 0 && (
          <div className="card animate-fadeIn" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.6rem' }}>🚨</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#92400e' }}>
                  Real-time Lead Notification: {newLeads.length} New {newLeads.length === 1 ? 'Enquiry' : 'Enquiries'} Received!
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#b45309' }}>
                  Latest: <strong>{latestNewLead?.name}</strong> ({latestNewLead?.phone}) enquired about <strong>{latestNewLead?.propertyId?.title}</strong>
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {latestNewLead && (
                <a
                  href={`https://wa.me/917218661327?text=${encodeURIComponent(
                    `🚨 *NEW LEAD NOTIFICATION*\n━━━━━━━━━━━━━━━━━━━━\n🏠 Property: ${latestNewLead.propertyId?.title}\n💰 Rent: ₹${(latestNewLead.propertyId?.price || 0).toLocaleString()}/mo\n📍 Location: ${latestNewLead.propertyId?.location}\n👤 Client: ${latestNewLead.name} (${latestNewLead.phone})\n✉️ Email: ${latestNewLead.email}\n📝 Note: ${latestNewLead.message}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                  style={{ backgroundColor: '#25D366', color: '#ffffff', padding: '0.4rem 0.8rem', fontSize: '0.775rem' }}
                >
                  📲 WhatsApp Admin Alert
                </a>
              )}
              <button
                type="button"
                onClick={() => { setActiveTab('leads'); setLeadFilter('new'); }}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.775rem', backgroundColor: '#d97706' }}
              >
                Review Leads CRM
              </button>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="dashboard-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button 
            className={`tab-btn ${activeTab === 'financials' ? 'active' : ''}`}
            onClick={() => setActiveTab('financials')}
          >
            💰 Financials & Invoices ({payments.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'deals' ? 'active' : ''}`}
            onClick={() => setActiveTab('deals')}
          >
            🤝 Closed Deals & Sales ({deals.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'occupancy' ? 'active' : ''}`}
            onClick={() => setActiveTab('occupancy')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            📅 Vacancy & Tenancy Radar ({leases.length})
            {vacatingLeases.length > 0 && (
              <span style={{ backgroundColor: '#d97706', color: '#fff', fontSize: '0.675rem', fontWeight: '700', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                {vacatingLeases.length} VACATING
              </span>
            )}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            📩 Enquiries & CRM ({leads.length})
            {newLeads.length > 0 && (
              <span style={{ backgroundColor: '#ef4444', color: '#ffffff', fontSize: '0.675rem', fontWeight: '700', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                {newLeads.length} NEW
              </span>
            )}
          </button>
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
              {/* 1. FINANCIALS & INVOICES TAB */}
              {activeTab === 'financials' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>Platform Financial Ledger & Invoices</h3>
                    <button
                      type="button"
                      onClick={() => setShowCreateInvoiceModal(true)}
                      className="btn btn-primary btn-sm"
                    >
                      ➕ Generate Rent/Fee Invoice
                    </button>
                  </div>

                  {/* Financial KPI Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                      <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: '600' }}>💵 Total Rent Collected</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#065f46', fontSize: '1.5rem', fontWeight: '800' }}>
                        ₹{paymentStats.totalCollected?.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                      <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: '600' }}>⏳ Pending / Overdue Dues</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#92400e', fontSize: '1.5rem', fontWeight: '800' }}>
                        ₹{paymentStats.totalPending?.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: '600' }}>🔒 Deposits in Escrow</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#075985', fontSize: '1.5rem', fontWeight: '800' }}>
                        ₹{paymentStats.totalDepositsHeld?.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                      <span style={{ fontSize: '0.8rem', color: '#7e22ce', fontWeight: '600' }}>🏢 S.R Brokerage Commission</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#6b21a8', fontSize: '1.5rem', fontWeight: '800' }}>
                        ₹{paymentStats.totalBrokerageEarned?.toLocaleString('en-IN')}
                      </h3>
                    </div>
                  </div>

                  {/* Payment Filters */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {['all', 'PAID', 'PENDING', 'OVERDUE', 'SECURITY_DEPOSIT', 'BROKERAGE'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setPaymentFilter(f)}
                        className={`btn btn-sm ${paymentFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
                      >
                        {f.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Payments Table */}
                  {filteredPayments.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Invoice / Purpose</th>
                            <th>Payer (Tenant / Buyer)</th>
                            <th>Property</th>
                            <th>Amount</th>
                            <th>Mode</th>
                            <th>Status</th>
                            <th>Receipt / Transaction</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.map((p: any) => (
                            <tr key={p._id}>
                              <td>
                                <strong>{p.title}</strong>
                                <span className="table-sub-detail">
                                  Type: <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>{p.type}</span>
                                </span>
                              </td>
                              <td>
                                <strong>{p.user?.name || 'User'}</strong>
                                <span className="table-sub-detail">📞 {p.user?.phone || p.user?.email}</span>
                              </td>
                              <td>
                                <strong>{p.property?.title || 'Property'}</strong>
                                <span className="table-sub-detail">📍 {p.property?.location}</span>
                              </td>
                              <td>
                                <strong style={{ color: p.status === 'PAID' ? '#059669' : '#d97706', fontSize: '0.95rem' }}>
                                  ₹{p.amount?.toLocaleString('en-IN')}
                                </strong>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.8rem', color: '#475569' }}>{p.paymentMethod}</span>
                              </td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: p.status === 'PAID' ? '#dcfce7' : p.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                                    color: p.status === 'PAID' ? '#15803d' : p.status === 'PENDING' ? '#b45309' : '#b91c1c',
                                  }}
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td>
                                {p.receiptNumber ? (
                                  <div>
                                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0284c7' }}>{p.receiptNumber}</span>
                                    {p.transactionId && <span className="table-sub-detail">{p.transactionId}</span>}
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Due: {p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  {p.status === 'PENDING' && (
                                    <button
                                      type="button"
                                      onClick={() => handlePaymentStatusChange(p._id, 'PAID')}
                                      className="btn btn-sm"
                                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.725rem', backgroundColor: '#059669', color: '#fff' }}
                                    >
                                      ✓ Mark Paid
                                    </button>
                                  )}
                                  {p.receiptNumber && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedReceipt(p)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.725rem' }}
                                    >
                                      📄 Receipt
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>No payment records matching the selected filter.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. CLOSED DEALS & SALES TAB */}
              {activeTab === 'deals' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 className="panel-title" style={{ margin: 0 }}>Closed Properties, Sales & Lease Deals</h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                        Complete audit record of properties bought, sold, or leased through S.R Rental Services.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['all', 'SALE', 'RENTAL_LEASE'].map((df) => (
                        <button
                          key={df}
                          type="button"
                          onClick={() => setDealFilter(df)}
                          className={`btn btn-sm ${dealFilter === df ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {df === 'all' ? 'All Transactions' : df === 'SALE' ? 'Outright Sales' : 'Rental Leases'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredDeals.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Transaction Type</th>
                            <th>Buyer / Tenant</th>
                            <th>Seller / Owner</th>
                            <th>Final Value</th>
                            <th>Brokerage Fee</th>
                            <th>Closing Date</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDeals.map((d: any) => (
                            <tr key={d._id}>
                              <td>
                                <strong>{d.property?.title || 'Property'}</strong>
                                <span className="table-sub-detail">📍 {d.property?.location}</span>
                              </td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: d.dealType === 'SALE' ? '#dbeafe' : '#fef3c7',
                                    color: d.dealType === 'SALE' ? '#1d4ed8' : '#b45309',
                                    fontWeight: '700',
                                  }}
                                >
                                  {d.dealType === 'SALE' ? '🏠 SOLD OUTRIGHT' : '🔑 RENTAL LEASE'}
                                </span>
                              </td>
                              <td>
                                <strong>{d.buyer?.name || 'Buyer'}</strong>
                                <span className="table-sub-detail">📞 {d.buyer?.phone || d.buyer?.email}</span>
                              </td>
                              <td>
                                <strong>{d.seller?.name || 'Seller'}</strong>
                                <span className="table-sub-detail">📞 {d.seller?.phone || d.seller?.email}</span>
                              </td>
                              <td>
                                <strong style={{ color: '#0f172a', fontSize: '1rem' }}>
                                  ₹{d.finalPrice?.toLocaleString('en-IN')}
                                  {d.dealType === 'RENTAL_LEASE' && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/mo</span>}
                                </strong>
                              </td>
                              <td>
                                <strong style={{ color: '#059669' }}>₹{d.brokerageFee?.toLocaleString('en-IN')}</strong>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                                  {new Date(d.closingDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.notes || '—'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>No closed deals recorded yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. OCCUPANCY & VACANCY RADAR TAB */}
              {activeTab === 'occupancy' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 className="panel-title" style={{ margin: 0 }}>Tenancy Lifecycle & Upcoming Vacancies Radar</h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                        Track occupied flats, active notice periods (tenants leaving in 7 days/1 month), and zero-vacancy pre-bookings.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['all', 'ACTIVE', 'NOTICE_PERIOD', 'COMPLETED'].map((of) => (
                        <button
                          key={of}
                          type="button"
                          onClick={() => setOccupancyFilter(of)}
                          className={`btn btn-sm ${occupancyFilter === of ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {of === 'all' ? 'All Leases' : of.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vacating Alert Banner if any notice submitted */}
                  {vacatingLeases.length > 0 && (
                    <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>⏳</span>
                      <div>
                        <strong style={{ color: '#92400e', fontSize: '0.9rem' }}>
                          Upcoming Vacancy Alert: {vacatingLeases.length} {vacatingLeases.length === 1 ? 'property is' : 'properties are'} vacating soon!
                        </strong>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.775rem', color: '#b45309' }}>
                          Pre-booking badges are active on public property listings so new tenants can schedule visits in advance.
                        </p>
                      </div>
                    </div>
                  )}

                  {filteredLeases.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Current Tenant</th>
                            <th>Landlord</th>
                            <th>Monthly Rent</th>
                            <th>Lease Period</th>
                            <th>Occupancy Status</th>
                            <th>Move-Out / Notice Info</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeases.map((l: any) => (
                            <tr key={l._id}>
                              <td>
                                <strong>{l.property?.title || 'Property'}</strong>
                                <span className="table-sub-detail">📍 {l.property?.location}</span>
                              </td>
                              <td>
                                <strong>{l.tenant?.name || 'Tenant'}</strong>
                                <span className="table-sub-detail">📞 {l.tenant?.phone || l.tenant?.email}</span>
                              </td>
                              <td>
                                <strong>{l.owner?.name || 'Owner'}</strong>
                                <span className="table-sub-detail">📞 {l.owner?.phone}</span>
                              </td>
                              <td>
                                <strong style={{ color: '#0f172a' }}>₹{l.monthlyRent?.toLocaleString('en-IN')}/mo</strong>
                                <span className="table-sub-detail">Deposit: ₹{l.securityDeposit?.toLocaleString('en-IN')}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.8rem', color: '#334155' }}>
                                  {new Date(l.startDate).toLocaleDateString('en-IN')} &rarr; {new Date(l.endDate).toLocaleDateString('en-IN')}
                                </span>
                                <span className="table-sub-detail">{l.durationMonths} Months Agreement</span>
                              </td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: l.status === 'ACTIVE' ? '#dcfce7' : l.status === 'NOTICE_PERIOD' ? '#fef3c7' : '#f1f5f9',
                                    color: l.status === 'ACTIVE' ? '#15803d' : l.status === 'NOTICE_PERIOD' ? '#b45309' : '#475569',
                                    fontWeight: '700',
                                  }}
                                >
                                  {l.status === 'NOTICE_PERIOD' ? '⚠️ NOTICE SUBMITTED' : l.status}
                                </span>
                              </td>
                              <td>
                                {l.status === 'NOTICE_PERIOD' && l.vacatingDate ? (
                                  <div>
                                    <strong style={{ color: '#b45309', fontSize: '0.8rem' }}>
                                      Vacating: {new Date(l.vacatingDate).toLocaleDateString('en-IN')}
                                    </strong>
                                    <span className="table-sub-detail">&ldquo;{l.noticeReason}&rdquo;</span>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Normal Stay</span>
                                )}
                              </td>
                              <td>
                                {l.status !== 'COMPLETED' && (
                                  <button
                                    type="button"
                                    onClick={() => handleConcludeLease(l._id)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
                                  >
                                    Conclude & Relist
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
                      <p>No leases found for the selected filter.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. ENQUIRIES & LEADS CRM TAB */}
              {activeTab === 'leads' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>Property Enquiries & Central CRM</h3>
                    <input
                      type="text"
                      className="form-input"
                      style={{ maxWidth: '280px', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                      placeholder="Search by client, phone, property..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {['all', 'new', 'contacted', 'negotiating', 'closed', 'rejected'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setLeadFilter(st)}
                        className={`btn btn-sm ${leadFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {filteredLeads.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Interested Tenant</th>
                            <th>Owner Contact</th>
                            <th>Requirement / Note</th>
                            <th>Status</th>
                            <th>CRM Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeads.map((l: any) => (
                            <tr key={l._id}>
                              <td>
                                <strong>{l.propertyId?.title || 'Property'}</strong>
                                <span className="table-sub-detail">
                                  ₹{(l.propertyId?.price || 0).toLocaleString()}/mo • {l.propertyId?.location}
                                </span>
                              </td>
                              <td>
                                <strong>{l.name}</strong>
                                <span className="table-sub-detail">📞 {l.phone}</span>
                                <span className="table-sub-detail">✉️ {l.email}</span>
                              </td>
                              <td>
                                <strong>{l.propertyId?.owner?.name || 'Owner'}</strong>
                                <span className="table-sub-detail">📞 {l.propertyId?.owner?.phone || 'N/A'}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.8rem', color: '#475569' }}>"{l.message}"</span>
                              </td>
                              <td>
                                <span className={`badge badge-${l.status}`}>{l.status}</span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  <a
                                    href={`https://wa.me/${(l.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                      `Hello ${l.name}, thank you for your enquiry regarding ${l.propertyId?.title} on S.R Rental Services. We are available to assist you with visit scheduling.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm"
                                    style={{ backgroundColor: '#25D366', color: '#fff', padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
                                  >
                                    💬 Client
                                  </a>
                                  <select
                                    className="form-input"
                                    style={{ padding: '0.3rem', fontSize: '0.725rem', width: '110px' }}
                                    value={l.status}
                                    onChange={(e) => handleLeadStatusChange(l._id, e.target.value)}
                                  >
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="negotiating">Negotiating</option>
                                    <option value="closed">Closed Deal</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>No leads matching the selected filter.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 5. USERS TAB */}
              {activeTab === 'users' && (
                <div className="tab-panel animate-fadeIn">
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
                              <td>{usr.phone || 'N/A'}</td>
                              <td><span className={`badge badge-${usr.role}`}>{usr.role}</span></td>
                              <td>{new Date(usr.createdAt).toLocaleDateString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state"><p>No users registered yet.</p></div>
                  )}
                </div>
              )}

              {/* 6. VERIFICATION TAB */}
              {activeTab === 'documents' && (
                <div className="tab-panel animate-fadeIn">
                  <h3 className="panel-title">Document Verification</h3>
                  {documents.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Document Type</th>
                            <th>File</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((d: any) => (
                            <tr key={d._id}>
                              <td><strong>{d.userId?.name || 'User'}</strong><span className="table-sub-detail">{d.userId?.email}</span></td>
                              <td><span className="badge">{d.documentType}</span></td>
                              <td><a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>View File</a></td>
                              <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  {d.status !== 'verified' && (
                                    <button type="button" onClick={() => handleDocStatusChange(d._id, 'verified')} className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', backgroundColor: '#059669' }}>Approve</button>
                                  )}
                                  {d.status !== 'rejected' && (
                                    <button type="button" onClick={() => handleDocStatusChange(d._id, 'rejected')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', color: '#dc2626' }}>Reject</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state"><p>No documents submitted for review.</p></div>
                  )}
                </div>
              )}

              {/* 7. TICKETS TAB */}
              {activeTab === 'tickets' && (
                <div className="tab-panel animate-fadeIn">
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
                              <td><strong>{t.propertyId?.title || 'Property'}</strong></td>
                              <td><strong>{t.tenantId?.name || 'Tenant'}</strong><span className="table-sub-detail">📞 {t.tenantId?.phone}</span></td>
                              <td><span className={`badge badge-priority ${t.priority}`}>{t.priority}</span></td>
                              <td><strong>{t.title}</strong><span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>"{t.description}"</span></td>
                              <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                              <td>
                                <select className="form-input" style={{ padding: '0.35rem', fontSize: '0.75rem', width: '110px' }} value={t.status} onChange={(e) => handleTicketStatusChange(t._id, e.target.value)}>
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
                    <div className="empty-tab-state"><p>No maintenance tickets raised yet.</p></div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* RECEIPT MODAL */}
      {selectedReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>S.R RENTAL SERVICES</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Official Electronic Payment Receipt</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.825rem' }}>
                <span style={{ color: '#64748b' }}>Receipt No:</span>
                <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{selectedReceipt.receiptNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.825rem' }}>
                <span style={{ color: '#64748b' }}>Transaction ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>{selectedReceipt.transactionId || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.825rem' }}>
                <span style={{ color: '#64748b' }}>Payment Date:</span>
                <span>{selectedReceipt.paidAt ? new Date(selectedReceipt.paidAt).toLocaleString('en-IN') : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                <span style={{ color: '#64748b' }}>Payment Mode:</span>
                <strong>{selectedReceipt.paymentMethod}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Payer Name:</span>
                <strong>{selectedReceipt.user?.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Property:</span>
                <span style={{ textAlign: 'right', maxWidth: '240px', fontWeight: '500' }}>{selectedReceipt.property?.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Purpose:</span>
                <strong>{selectedReceipt.title} ({selectedReceipt.type})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0 0', fontSize: '1.15rem' }}>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>Amount Paid:</span>
                <strong style={{ color: '#059669' }}>₹{selectedReceipt.amount?.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.65rem' }}
              >
                🖨️ Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.65rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showCreateInvoiceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', color: '#0f172a' }}>Generate Rent or Fee Invoice</h3>
            <form onSubmit={handleCreateInvoice}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Select Property *</label>
                <select
                  className="form-input"
                  required
                  value={invoiceForm.propertyId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, propertyId: e.target.value })}
                >
                  <option value="">-- Choose Property --</option>
                  {properties.map((p: any) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.title} (₹{p.price?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Select Payer (Tenant) *</label>
                <select
                  className="form-input"
                  required
                  value={invoiceForm.userId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, userId: e.target.value })}
                >
                  <option value="">-- Choose Tenant --</option>
                  {users.filter((u) => u.role === 'tenant').map((u: any) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Invoice Type</label>
                  <select
                    className="form-input"
                    value={invoiceForm.type}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, type: e.target.value })}
                  >
                    <option value="RENT">Monthly Rent</option>
                    <option value="SECURITY_DEPOSIT">Security Deposit</option>
                    <option value="BROKERAGE">Brokerage Fee</option>
                    <option value="MAINTENANCE">Maintenance Fee</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    placeholder="e.g. 22000"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Invoice Title / Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Monthly Rent - October 2026"
                  value={invoiceForm.title}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.65rem' }}>
                  Create & Issue Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.65rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
