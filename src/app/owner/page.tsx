'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface PropertyItem {
  _id: string;
  id?: string;
  title: string;
  price: number;
  location: string;
  propertyType: string;
  bhk: number;
  isAvailable: boolean;
  occupancyStatus?: string;
  vacantFromDate?: string;
}

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('properties');

  // Data states
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>({
    totalCollected: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(true);

  // Property Form state
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    description: '',
    price: '',
    location: 'Hinjawadi Phase 1',
    propertyType: 'apartment',
    bhk: '2',
    latitude: '18.5913',
    longitude: '73.7389',
    images: [] as string[],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Document Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Tenancy Agreement Modal State
  const [showCreateLeaseModal, setShowCreateLeaseModal] = useState(false);
  const [leaseForm, setLeaseForm] = useState({
    propertyId: '',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    monthlyRent: '',
    securityDeposit: '',
    durationMonths: '11',
    startDate: '',
  });
  const [leaseLoading, setLeaseLoading] = useState(false);
  const [leaseError, setLeaseError] = useState('');

  // Protect client route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && user.role !== 'owner') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch landlord data
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [leadsRes, docsRes, propsRes, paymentsRes, leasesRes, dealsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/documents'),
        fetch('/api/properties'),
        fetch('/api/payments'),
        fetch('/api/leases'),
        fetch('/api/deals'),
      ]);

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || []);
      }
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        const myProps = (propsData.properties || []).filter(
          (p: any) => p.ownerId === user?.id
        );
        setProperties(myProps);
      }
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
        if (paymentsData.stats) setPaymentStats(paymentsData.stats);
      }
      if (leasesRes.ok) {
        const leasesData = await leasesRes.json();
        setLeases(leasesData.leases || []);
      }
      if (dealsRes.ok) {
        const dealsData = await dealsRes.json();
        setDeals(dealsData.deals || []);
      }
    } catch (err) {
      console.error('Failed to load owner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle Property Creation
  const handlePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...propertyForm,
          price: Number(propertyForm.price),
          bhk: Number(propertyForm.bhk),
          latitude: Number(propertyForm.latitude),
          longitude: Number(propertyForm.longitude),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list property');

      setFormSuccess('Property listed successfully! Verification in progress.');
      setPropertyForm({
        title: '',
        description: '',
        price: '',
        location: 'Hinjawadi Phase 1',
        propertyType: 'apartment',
        bhk: '2',
        latitude: '18.5913',
        longitude: '73.7389',
        images: [],
      });
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

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
      formData.append('documentType', 'property_papers');

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadSuccess('Ownership paper uploaded successfully. Verification in progress.');
      setUploadFile(null);
      fetchData();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Create Tenancy Agreement
  const handleCreateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaseLoading(true);
    setLeaseError('');
    try {
      const res = await fetch('/api/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leaseForm,
          monthlyRent: Number(leaseForm.monthlyRent),
          securityDeposit: Number(leaseForm.securityDeposit || Number(leaseForm.monthlyRent) * 2),
          durationMonths: Number(leaseForm.durationMonths),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register tenancy agreement');
      setShowCreateLeaseModal(false);
      setLeaseForm({
        propertyId: '',
        tenantName: '',
        tenantPhone: '',
        tenantEmail: '',
        monthlyRent: '',
        securityDeposit: '',
        durationMonths: '11',
        startDate: '',
      });
      fetchData();
      alert('✅ Tenancy agreement registered successfully! The property is now marked as Occupied.');
    } catch (err: any) {
      setLeaseError(err.message || 'Error registering tenancy agreement');
    } finally {
      setLeaseLoading(false);
    }
  };

  // Handle Mark Tenant Moved Out & Set Property Available
  const handleMarkMovedOut = async (propertyId: string, propertyTitle?: string) => {
    const confirmMsg = propertyTitle 
      ? `Confirm that tenant has moved out from "${propertyTitle}"?\n\nThis will mark the property as AVAILABLE on the platform for new tenants.`
      : 'Confirm that tenant has moved out?\n\nThis will mark the property as AVAILABLE on the platform for new tenants.';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          action: 'mark_moved_out',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update property status');

      fetchData();
      alert('✅ Tenant departure recorded! The property is now marked as AVAILABLE.');
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  if (authLoading || !user) {
    return <div className="dashboard-loading-screen">Loading landlord workspace...</div>;
  }

  const vacatingLeases = leases.filter((l: any) => l.status === 'NOTICE_PERIOD');

  return (
    <div className="dashboard-wrapper">
      <div className="container dashboard-container-box">
        
        {/* Welcome Section */}
        <div className="dashboard-header-block card glass">
          <div>
            <span className="user-role-tag">Owner & Landlord Portal</span>
            <h2>Welcome, {user.name}</h2>
            <p>Manage rental properties, track tenant monthly rent ledger, inspect active leases, and monitor move-out notices.</p>
          </div>
          <div className="user-meta-info">
            <p>📧 {user.email}</p>
            <p>🏢 Listed Properties: {properties.length}</p>
          </div>
        </div>

        {/* Vacating Tenant Alert Banner if any notice is submitted */}
        {vacatingLeases.length > 0 && (
          <div className="card animate-fadeIn" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '1.6rem' }}>⏳</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#92400e' }}>
                Tenant Departure Notice: {vacatingLeases.length} property vacating soon!
              </h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#b45309' }}>
                Tenant for <strong>{vacatingLeases[0]?.property?.title}</strong> is scheduled to leave on <strong>{new Date(vacatingLeases[0]?.vacatingDate).toLocaleDateString('en-IN')}</strong>. Pre-booking is active on the website to ensure zero vacancy turnover.
              </p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="dashboard-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button 
            className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            🏡 My Properties ({properties.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => setActiveTab('income')}
          >
            💰 Rental Income & Ledger ({payments.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tenants' ? 'active' : ''}`}
            onClick={() => setActiveTab('tenants')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            📅 Tenants & Lease Tracking ({leases.length})
            {vacatingLeases.length > 0 && (
              <span style={{ backgroundColor: '#d97706', color: '#fff', fontSize: '0.675rem', fontWeight: '700', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                {vacatingLeases.length} VACATING
              </span>
            )}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            📩 Enquiries & Leads ({leads.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            🛡️ Ownership Papers ({documents.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="dashboard-tab-content">
          {loading ? (
            <div className="tab-loading-state">Loading landlord records...</div>
          ) : (
            <>
              {/* 1. PROPERTIES TAB */}
              {activeTab === 'properties' && (
                <div className="tab-panel animate-fadeIn">
                  <div className="panel-header-flex">
                    <h3 className="panel-title">My Properties</h3>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const el = document.getElementById('list-property-form-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      ➕ List New Property
                    </button>
                  </div>

                  {properties.length > 0 ? (
                    <div className="property-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                      {properties.map((p) => (
                        <div key={p._id || p.id} className="card property-item-card" style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>{p.title}</h4>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: p.occupancyStatus === 'occupied' ? '#fee2e2' : p.occupancyStatus === 'vacating_soon' ? '#fef3c7' : '#dcfce7',
                                  color: p.occupancyStatus === 'occupied' ? '#b91c1c' : p.occupancyStatus === 'vacating_soon' ? '#b45309' : '#15803d',
                                  fontWeight: '700',
                                  whiteSpace: 'nowrap',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {p.occupancyStatus === 'vacating_soon' ? '⏳ Vacating Soon' : p.occupancyStatus === 'occupied' ? '🔒 Occupied' : '✓ Available'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                              <div>📍 {p.location}</div>
                              <div>🏷️ ₹{p.price?.toLocaleString('en-IN')}/month • {p.bhk} BHK {p.propertyType}</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {(p.occupancyStatus === 'occupied' || p.occupancyStatus === 'vacating_soon') ? (
                              <button
                                type="button"
                                onClick={() => handleMarkMovedOut(p._id || p.id || '', p.title)}
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: '#059669',
                                  color: '#ffffff',
                                  fontWeight: '700',
                                  padding: '0.45rem',
                                  textAlign: 'center',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.825rem',
                                }}
                              >
                                🚪 Tenant Moved Out (Set Available)
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setLeaseError('');
                                  setLeaseForm((prev) => ({
                                    ...prev,
                                    propertyId: p._id || p.id || '',
                                    monthlyRent: p.price ? String(p.price) : '',
                                    securityDeposit: p.price ? String(p.price * 2) : '',
                                  }));
                                  setShowCreateLeaseModal(true);
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  fontWeight: '600',
                                  padding: '0.45rem',
                                  textAlign: 'center',
                                  fontSize: '0.825rem',
                                }}
                              >
                                🔑 Mark Occupied / Add Tenancy
                              </button>
                            )}

                            <Link href={`/properties/${p._id || p.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center', display: 'block', fontSize: '0.8rem' }}>
                              View Property Page
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-tab-state" style={{ marginBottom: '2rem' }}>
                      <p>You have not listed any properties yet.</p>
                    </div>
                  )}

                  {/* List Property Form */}
                  <div id="list-property-form-section" className="card glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>List a New Property</h3>
                    {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
                    {formError && <div className="alert alert-error">{formError}</div>}

                    <form onSubmit={handlePropertySubmit}>
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Property Title *</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          placeholder="e.g. Spacious 2 BHK Flat in Hinjawadi Phase 1"
                          value={propertyForm.title}
                          onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Monthly Rent (₹) *</label>
                          <input
                            type="number"
                            className="form-input"
                            required
                            placeholder="e.g. 20000"
                            value={propertyForm.price}
                            onChange={(e) => setPropertyForm({ ...propertyForm, price: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">BHK</label>
                          <select
                            className="form-input"
                            value={propertyForm.bhk}
                            onChange={(e) => setPropertyForm({ ...propertyForm, bhk: e.target.value })}
                          >
                            <option value="1">1 BHK</option>
                            <option value="2">2 BHK</option>
                            <option value="3">3 BHK</option>
                            <option value="4">4+ BHK</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Property Type</label>
                          <select
                            className="form-input"
                            value={propertyForm.propertyType}
                            onChange={(e) => setPropertyForm({ ...propertyForm, propertyType: e.target.value })}
                          >
                            <option value="apartment">Apartment</option>
                            <option value="house">Independent House / Villa</option>
                            <option value="pg">Co-Living / PG</option>
                            <option value="commercial">Commercial</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-input"
                          rows={3}
                          placeholder="Describe the amenities, nearby landmarks, furnishing..."
                          value={propertyForm.description}
                          onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                        />
                      </div>

                      <button type="submit" disabled={formLoading} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                        {formLoading ? 'Submitting Property...' : 'List Property'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 2. RENTAL INCOME & LEDGER TAB */}
              {activeTab === 'income' && (
                <div className="tab-panel animate-fadeIn">
                  <h3 className="panel-title">Rental Income, Collections & Dues Ledger</h3>

                  {/* Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                      <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: '600' }}>💵 Total Rent Collected</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#065f46', fontSize: '1.5rem', fontWeight: '800' }}>
                        ₹{paymentStats.totalCollected?.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                      <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: '600' }}>⏳ Pending Tenant Dues</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#92400e', fontSize: '1.5rem', fontWeight: '800' }}>
                        ₹{paymentStats.totalPending?.toLocaleString('en-IN')}
                      </h3>
                    </div>
                  </div>

                  {payments.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Invoice / Description</th>
                            <th>Tenant</th>
                            <th>Property</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment Date</th>
                            <th>Receipt</th>
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
                                <strong>{p.user?.name || 'Tenant'}</strong>
                                <span className="table-sub-detail">📞 {p.user?.phone}</span>
                              </td>
                              <td>
                                <strong>{p.property?.title}</strong>
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
                                <span style={{ fontSize: '0.8rem' }}>
                                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : 'Pending'}
                                </span>
                              </td>
                              <td>
                                {p.receiptNumber && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReceipt(p)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem' }}
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
                    <div className="empty-tab-state"><p>No payment records found for your properties.</p></div>
                  )}
                </div>
              )}

              {/* 3. TENANTS & LEASE TRACKING TAB */}
              {activeTab === 'tenants' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 className="panel-title" style={{ margin: 0 }}>Active Tenants, Lease Durations & Move-Out Schedule</h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                        Track tenant agreements, monthly rent collections, and move-out notices for your properties.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLeaseError('');
                        setLeaseForm((prev) => ({
                          ...prev,
                          propertyId: properties[0]?._id || properties[0]?.id || '',
                          monthlyRent: properties[0]?.price ? String(properties[0].price) : '',
                          securityDeposit: properties[0]?.price ? String(properties[0].price * 2) : '',
                          durationMonths: '11',
                        }));
                        setShowCreateLeaseModal(true);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      ➕ Register Active Tenancy
                    </button>
                  </div>

                  {leases.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Active Tenant</th>
                            <th>Monthly Rent</th>
                            <th>Agreement Term</th>
                            <th>Status</th>
                            <th>Departure / Notice Info</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leases.map((l: any) => (
                            <tr key={l._id}>
                              <td>
                                <strong>{l.property?.title}</strong>
                                <span className="table-sub-detail">📍 {l.property?.location}</span>
                              </td>
                              <td>
                                <strong>{l.tenant?.name || 'Tenant'}</strong>
                                <span className="table-sub-detail">📞 {l.tenant?.phone || l.tenant?.email}</span>
                              </td>
                              <td>
                                <strong style={{ color: '#0f172a' }}>₹{l.monthlyRent?.toLocaleString('en-IN')}/mo</strong>
                                <span className="table-sub-detail">Deposit: ₹{l.securityDeposit?.toLocaleString('en-IN')}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.8rem' }}>
                                  {new Date(l.startDate).toLocaleDateString('en-IN')} &rarr; {new Date(l.endDate).toLocaleDateString('en-IN')}
                                </span>
                                <span className="table-sub-detail">{l.durationMonths} Months</span>
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
                                      Vacating on: {new Date(l.vacatingDate).toLocaleDateString('en-IN')}
                                    </strong>
                                    <span className="table-sub-detail">Reason: {l.noticeReason}</span>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active tenancy in progress</span>
                                )}
                              </td>
                              <td>
                                {l.status !== 'COMPLETED' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkMovedOut(l.propertyId || l.property?.id || l.property?._id, l.property?.title)}
                                    className="btn btn-sm"
                                    style={{
                                      padding: '0.3rem 0.65rem',
                                      fontSize: '0.75rem',
                                      backgroundColor: '#059669',
                                      color: '#ffffff',
                                      whiteSpace: 'nowrap',
                                      fontWeight: '600',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    🚪 Mark Moved Out
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Completed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>No active tenant leases on your properties yet.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setLeaseError('');
                          setLeaseForm((prev) => ({
                            ...prev,
                            propertyId: properties[0]?._id || properties[0]?.id || '',
                            monthlyRent: properties[0]?.price ? String(properties[0].price) : '',
                            securityDeposit: properties[0]?.price ? String(properties[0].price * 2) : '',
                          }));
                          setShowCreateLeaseModal(true);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '0.75rem' }}
                      >
                        ➕ Register First Tenancy Agreement
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 4. ENQUIRIES TAB */}
              {activeTab === 'leads' && (
                <div className="tab-panel animate-fadeIn">
                  <h3 className="panel-title">Visit Enquiries & Prospective Leads</h3>
                  {leads.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Prospective Tenant</th>
                            <th>Requirement Note</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map((lead: any) => (
                            <tr key={lead._id}>
                              <td>
                                <strong>{lead.propertyId?.title}</strong>
                                <span className="table-sub-detail">📍 {lead.propertyId?.location}</span>
                              </td>
                              <td>
                                <strong>{lead.name}</strong>
                                <span className="table-sub-detail">📞 {lead.phone} | ✉️ {lead.email}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.85rem' }}>{lead.message || 'No note provided.'}</span>
                                <span className="table-sub-detail">📅 {new Date(lead.createdAt).toLocaleDateString('en-IN')}</span>
                              </td>
                              <td>
                                <span className="badge" style={{ backgroundColor: lead.status === 'new' ? '#fee2e2' : '#ecfdf5', color: lead.status === 'new' ? '#b91c1c' : '#047857' }}>
                                  {lead.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state"><p>No visitor enquiries received yet.</p></div>
                  )}
                </div>
              )}

              {/* 5. CLOSED DEALS TAB */}
              {activeTab === 'deals' && (
                <div className="tab-panel animate-fadeIn">
                  <h3 className="panel-title">Closed Rental Leases & Property Deals</h3>
                  {deals.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Tenant / Buyer</th>
                            <th>Deal Type</th>
                            <th>Final Amount</th>
                            <th>Brokerage Fee</th>
                            <th>Closing Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deals.map((d: any) => (
                            <tr key={d._id}>
                              <td>
                                <strong>{d.property?.title || 'Property'}</strong>
                                <span className="table-sub-detail">📍 {d.property?.location}</span>
                              </td>
                              <td>
                                <strong>{d.buyer?.name || 'Tenant'}</strong>
                                <span className="table-sub-detail">📞 {d.buyer?.phone || d.buyer?.email}</span>
                              </td>
                              <td>
                                <span className="badge" style={{ backgroundColor: d.dealType === 'SALE' ? '#e0f2fe' : '#fef3c7', color: d.dealType === 'SALE' ? '#0369a1' : '#b45309' }}>
                                  {d.dealType === 'SALE' ? 'Outright Sale' : '11-Mo Rental Lease'}
                                </span>
                              </td>
                              <td>
                                <strong style={{ color: '#0f172a' }}>₹{d.finalPrice?.toLocaleString('en-IN')}</strong>
                              </td>
                              <td>
                                <strong style={{ color: '#059669' }}>₹{d.brokerageFee?.toLocaleString('en-IN')}</strong>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.8rem' }}>
                                  {new Date(d.closingDate).toLocaleDateString('en-IN')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state"><p>No closed lease or sale records found.</p></div>
                  )}
                </div>
              )}

              {/* 6. VERIFICATION PAPERS TAB */}
              {activeTab === 'documents' && (
                <div className="tab-panel animate-fadeIn">
                  <h3 className="panel-title">Property Ownership & Verification Deeds</h3>
                  
                  <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>📤 Upload Ownership Proof / Tax Receipt</h4>
                    <form onSubmit={handleUploadSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                        className="form-input"
                        style={{ maxWidth: '320px', padding: '0.35rem' }}
                      />
                      <button type="submit" disabled={uploading || !uploadFile} className="btn btn-primary btn-sm">
                        {uploading ? 'Uploading...' : 'Upload Paper'}
                      </button>
                    </form>
                    {uploadSuccess && <p style={{ color: '#059669', fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>{uploadSuccess}</p>}
                    {uploadError && <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>{uploadError}</p>}
                  </div>

                  {documents.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Document</th>
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
                    <div className="empty-tab-state"><p>No verification papers uploaded yet.</p></div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* CREATE TENANCY AGREEMENT MODAL */}
      {showCreateLeaseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>Register Active Tenancy Agreement</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Link a tenant to your property and initiate the rental ledger</span>
              </div>
              <button type="button" onClick={() => setShowCreateLeaseModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {leaseError && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '0.825rem', marginBottom: '1rem' }}>
                {leaseError}
              </div>
            )}

            <form onSubmit={handleCreateLease} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>Select Property *</label>
                <select
                  value={leaseForm.propertyId}
                  onChange={(e) => {
                    const selProp = properties.find((p) => p._id === e.target.value || p.id === e.target.value);
                    setLeaseForm({
                      ...leaseForm,
                      propertyId: e.target.value,
                      monthlyRent: selProp?.price ? String(selProp.price) : leaseForm.monthlyRent,
                      securityDeposit: selProp?.price ? String(selProp.price * 2) : leaseForm.securityDeposit,
                    });
                  }}
                  className="form-input"
                  required
                >
                  <option value="">-- Choose your property --</option>
                  {properties.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.title} ({p.location}) - ₹{p.price?.toLocaleString()}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>Tenant Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Deshmukh"
                    value={leaseForm.tenantName}
                    onChange={(e) => setLeaseForm({ ...leaseForm, tenantName: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>Tenant Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={leaseForm.tenantPhone}
                    onChange={(e) => setLeaseForm({ ...leaseForm, tenantPhone: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>Tenant Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. rahul@gmail.com"
                  value={leaseForm.tenantEmail}
                  onChange={(e) => setLeaseForm({ ...leaseForm, tenantEmail: e.target.value })}
                  className="form-input"
                />
                <span style={{ fontSize: '0.725rem', color: '#059669', display: 'block', marginTop: '0.25rem' }}>
                  ✨ Tenant does not need to have an existing account on the platform.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    placeholder="22000"
                    value={leaseForm.monthlyRent}
                    onChange={(e) => setLeaseForm({ ...leaseForm, monthlyRent: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>Security Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="44000"
                    value={leaseForm.securityDeposit}
                    onChange={(e) => setLeaseForm({ ...leaseForm, securityDeposit: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>Duration (Months)</label>
                  <select
                    value={leaseForm.durationMonths}
                    onChange={(e) => setLeaseForm({ ...leaseForm, durationMonths: e.target.value })}
                    className="form-input"
                  >
                    <option value="6">6 Months</option>
                    <option value="11">11 Months (Standard)</option>
                    <option value="24">24 Months (2 Years)</option>
                    <option value="36">36 Months (3 Years)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>Agreement Start Date</label>
                  <input
                    type="date"
                    value={leaseForm.startDate}
                    onChange={(e) => setLeaseForm({ ...leaseForm, startDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={leaseLoading} className="btn btn-primary" style={{ flex: 1 }}>
                  {leaseLoading ? 'Registering...' : '✓ Confirm & Register Tenancy'}
                </button>
                <button type="button" onClick={() => setShowCreateLeaseModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
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
              <div><strong>Tenant:</strong> {selectedReceipt.user?.name}</div>
              <div><strong>Property:</strong> {selectedReceipt.property?.title}</div>
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
