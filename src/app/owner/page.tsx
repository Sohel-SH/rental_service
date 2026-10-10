'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import SweetAlertModal, { AlertOptions } from '@/components/SweetAlertModal';

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

// Curated interior room presets for quick landlord selection
const CURATED_PROPERTY_PRESETS = [
  { label: 'Living Room', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Master Bedroom', url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Modular Kitchen', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Balcony View', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Modern Bathroom', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&auto=format&fit=crop&q=80' },
];

// Client-side image compressor for lightning-fast photo uploads
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('properties');

  // SweetAlert modal state
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    options: AlertOptions | null;
  }>({
    isOpen: false,
    options: null,
  });

  const showAlert = (options: AlertOptions) => {
    setAlertConfig({
      isOpen: true,
      options,
    });
  };

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
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&auto=format&fit=crop&q=80'
    ] as string[],
  });
  const [imageUploading, setImageUploading] = useState(false);
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

  // Record Manual Payment (Khata/Ledger) Modal State
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [recordPaymentForm, setRecordPaymentForm] = useState({
    propertyId: '',
    userId: '',
    title: 'Monthly Rent Installment',
    amount: '',
    type: 'RENT',
    paymentMethod: 'UPI',
    notes: '',
  });

  // Tenancy Agreement Modal State
  const [showCreateLeaseModal, setShowCreateLeaseModal] = useState(false);
  const [leaseForm, setLeaseForm] = useState({
    propertyId: '',
    tenantId: '',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    monthlyRent: '',
    securityDeposit: '',
    durationMonths: '11',
    startDate: '',
    tenancyType: 'entire_flat', // 'entire_flat' | 'shared_flat'
    roomOrBed: '',
  });
  const [leaseLoading, setLeaseLoading] = useState(false);
  const [leaseError, setLeaseError] = useState('');

  // Tenant Search & Auto-linking States
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [searchedTenants, setSearchedTenants] = useState<any[]>([]);
  const [suggestedTenants, setSuggestedTenants] = useState<any[]>([]);
  const [tenantSearchLoading, setTenantSearchLoading] = useState(false);
  const [isNewTenantManual, setIsNewTenantManual] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

  // Customizable Lease Renewal Modal State
  const [renewModal, setRenewModal] = useState<{
    show: boolean;
    lease: any;
    renewalMonths: number;
    monthlyRent: string;
    loading: boolean;
  }>({
    show: false,
    lease: null,
    renewalMonths: 11,
    monthlyRent: '',
    loading: false,
  });

  // Protect client route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
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
        fetch('/api/properties?scope=owner'),
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
        setProperties(propsData.properties || []);
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
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&auto=format&fit=crop&q=80'
        ],
      });
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Photo File Upload & Compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImageUploading(true);
    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i]);
        compressedList.push(compressed);
      }
      setPropertyForm((prev) => ({
        ...prev,
        images: [...prev.images, ...compressedList],
      }));
    } catch (err) {
      console.error('Image compression error:', err);
      showAlert({
        title: 'Compression Error',
        text: 'Could not process some images. Please try smaller photo files.',
        type: 'error',
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handleSelectPresetImage = (url: string) => {
    setPropertyForm((prev) => {
      const exists = prev.images.includes(url);
      return {
        ...prev,
        images: exists ? prev.images.filter((img) => img !== url) : [...prev.images, url],
      };
    });
  };

  const handleRemoveImage = (index: number) => {
    setPropertyForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Fetch previously rented tenants as suggestions
  const loadTenantSuggestions = async () => {
    try {
      const res = await fetch('/api/admin/users?role=tenant');
      if (res.ok) {
        const data = await res.json();
        setSuggestedTenants(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load suggested tenants:', err);
    }
  };

  // Search registered users dynamically by Phone, Name, or Email (only tenants)
  const handleTenantSearch = async (query: string) => {
    setTenantSearchQuery(query);
    if (!query.trim()) {
      setSearchedTenants([]);
      return;
    }
    setTenantSearchLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query.trim())}&role=tenant`);
      if (res.ok) {
        const data = await res.json();
        setSearchedTenants(data.users || []);
      }
    } catch (err) {
      console.error('Failed to search tenants:', err);
    } finally {
      setTenantSearchLoading(false);
    }
  };

  // Select a tenant from suggestion or search
  const handleSelectTenant = (tenantUser: any) => {
    setSelectedTenant(tenantUser);
    setIsNewTenantManual(false);
    setLeaseForm((prev) => ({
      ...prev,
      tenantId: tenantUser.id || tenantUser._id,
      tenantName: tenantUser.name,
      tenantPhone: tenantUser.phone || '',
      tenantEmail: tenantUser.email || '',
    }));
  };

  // Open Tenancy Modal and preload suggestions
  const openCreateLeaseModal = (propId?: string) => {
    const selProp = propId ? properties.find((p) => p._id === propId || p.id === propId) : null;
    setLeaseForm({
      propertyId: propId || '',
      tenantId: '',
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
      monthlyRent: selProp?.price ? String(selProp.price) : '',
      securityDeposit: selProp?.price ? String(selProp.price * 2) : '',
      durationMonths: '11',
      startDate: new Date().toISOString().split('T')[0],
      tenancyType: 'entire_flat',
      roomOrBed: '',
    });
    setSelectedTenant(null);
    setIsNewTenantManual(false);
    setTenantSearchQuery('');
    setSearchedTenants([]);
    setShowCreateLeaseModal(true);
    loadTenantSuggestions();
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
      showAlert({
        title: 'Document Uploaded',
        text: 'Ownership paper uploaded successfully. Admin verification in progress.',
        type: 'success',
      });
      setUploadFile(null);
      fetchData();
    } catch (err: any) {
      setUploadError(err.message);
      showAlert({
        title: 'Upload Failed',
        text: err.message || 'Failed to upload document',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  // Create Tenancy Agreement
  const handleCreateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaseForm.tenantName && !leaseForm.tenantId) {
      showAlert({
        title: 'Tenant Required',
        text: 'Please select a registered tenant or enter new tenant details.',
        type: 'warning',
      });
      return;
    }
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
        tenantId: '',
        tenantName: '',
        tenantPhone: '',
        tenantEmail: '',
        monthlyRent: '',
        securityDeposit: '',
        durationMonths: '11',
        startDate: '',
        tenancyType: 'entire_flat',
        roomOrBed: '',
      });
      setSelectedTenant(null);
      setIsNewTenantManual(false);
      fetchData();
      showAlert({
        title: 'Tenancy Agreement Registered',
        text: 'Tenancy agreement registered successfully! The property is now marked as OCCUPIED and rent passbook ledger has been generated.',
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'Registration Error',
        text: err.message || 'Error registering tenancy agreement',
        type: 'error',
      });
      setLeaseError(err.message || 'Error registering tenancy agreement');
    } finally {
      setLeaseLoading(false);
    }
  };

  // Open customizable renewal modal
  const openRenewalModal = (lease: any) => {
    setRenewModal({
      show: true,
      lease,
      renewalMonths: 11,
      monthlyRent: String(lease.monthlyRent || ''),
      loading: false,
    });
  };

  // Submit customizable tenancy renewal
  const handleConfirmRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewModal.lease) return;
    setRenewModal((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/leases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseId: renewModal.lease.id || renewModal.lease._id,
          action: 'renew_lease',
          renewalMonths: Number(renewModal.renewalMonths),
          monthlyRent: Number(renewModal.monthlyRent),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Renewal failed');
      showAlert({
        title: 'Tenancy Renewed',
        text: `Tenancy agreement successfully renewed for ${renewModal.renewalMonths} months!`,
        type: 'success',
      });
      setRenewModal({ show: false, lease: null, renewalMonths: 11, monthlyRent: '', loading: false });
      fetchData();
    } catch (err: any) {
      showAlert({
        title: 'Renewal Failed',
        text: err.message || 'Error renewing lease',
        type: 'error',
      });
      setRenewModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Handle Manual Payment Record Entry (Khata / Passbook)
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordPaymentForm),
      });
      if (res.ok) {
        setShowRecordPaymentModal(false);
        setRecordPaymentForm({
          propertyId: '',
          userId: '',
          title: 'Monthly Rent Installment',
          amount: '',
          type: 'RENT',
          paymentMethod: 'UPI',
          notes: '',
        });
        fetchData();
        showAlert({
          title: 'Payment Recorded',
          text: 'Payment entry recorded in tenant rental passbook ledger!',
          type: 'success',
        });
      } else {
        const data = await res.json();
        showAlert({
          title: 'Payment Record Error',
          text: data.error || 'Failed to record payment',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Record payment error:', err);
    }
  };

  // Handle Mark Tenant Moved Out & Set Property Available
  const handleMarkMovedOut = (propertyId: string, propertyTitle?: string) => {
    showAlert({
      title: 'Confirm Tenant Departure',
      text: propertyTitle
        ? `Confirm that tenant has moved out from "${propertyTitle}"?\n\nThis will mark the property as AVAILABLE on the platform for new tenant enquiries.`
        : 'Confirm that tenant has moved out?\n\nThis will mark the property as AVAILABLE on the platform for new tenant enquiries.',
      type: 'warning',
      showCancelButton: true,
      confirmText: 'Yes, Mark as Available',
      onConfirm: async () => {
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
          showAlert({
            title: 'Property Available',
            text: 'Tenant departure recorded! The property is now marked as AVAILABLE for new tenants.',
            type: 'success',
          });
        } catch (err: any) {
          showAlert({
            title: 'Error',
            text: err.message || 'Error updating status',
            type: 'error',
          });
        }
      },
    });
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
          <div className="user-meta-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
            <p style={{ margin: 0 }}>📧 {user.email}</p>
            <p style={{ margin: 0 }}>🏢 Listed Properties: {properties.length}</p>
            <Link href="/list-property" className="btn btn-primary btn-sm" style={{ marginTop: '0.4rem' }}>
              ➕ Post New Property
            </Link>
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
                    <Link
                      href="/list-property"
                      className="btn btn-primary btn-sm"
                    >
                      ➕ Post New Property
                    </Link>
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
                                onClick={() => openCreateLeaseModal(p._id || p.id)}
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

                      {/* Photo Upload Section */}
                      <div className="form-group" style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>📸 Property Photos ({propertyForm.images.length} Selected)</span>
                          {imageUploading && <span style={{ fontSize: '0.75rem', color: '#0284c7' }}>⚡ Compressing photos...</span>}
                        </label>
                        
                        {/* Device File Upload Button */}
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                          <label
                            className="btn btn-secondary btn-sm"
                            style={{
                              cursor: 'pointer',
                              backgroundColor: '#ffffff',
                              border: '1px dashed #cbd5e1',
                              padding: '0.6rem 1.2rem',
                              fontSize: '0.825rem',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                            }}
                          >
                            📁 Upload Photos from Device
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleImageUpload}
                            />
                          </label>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            (Instant auto-compression: WebP/JPEG for fast uploading)
                          </span>
                        </div>

                        {/* Quick Preset Rooms */}
                        <div style={{ marginBottom: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                            Or pick curated sample interior photos:
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {CURATED_PROPERTY_PRESETS.map((preset) => {
                              const isSelected = propertyForm.images.includes(preset.url);
                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => handleSelectPresetImage(preset.url)}
                                  className="btn btn-sm"
                                  style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.75rem',
                                    backgroundColor: isSelected ? '#dcfce7' : '#ffffff',
                                    color: isSelected ? '#166534' : '#475569',
                                    border: `1px solid ${isSelected ? '#86efac' : '#cbd5e1'}`,
                                    fontWeight: isSelected ? '700' : '500',
                                  }}
                                >
                                  {isSelected ? `✓ ${preset.label}` : `+ ${preset.label}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selected Photos Preview Grid */}
                        {propertyForm.images.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.65rem', marginTop: '0.75rem' }}>
                            {propertyForm.images.map((imgUrl, idx) => (
                              <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '70px', border: '1px solid #e2e8f0' }}>
                                <img src={imgUrl} alt={`Uploaded ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  style={{
                                    position: 'absolute',
                                    top: '3px',
                                    right: '3px',
                                    background: 'rgba(239, 68, 68, 0.85)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title="Remove photo"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>Rental Income & Tenant Passbook (Khata)</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setRecordPaymentForm({
                          propertyId: properties[0]?._id || properties[0]?.id || '',
                          userId: '',
                          title: 'Monthly Rent Installment',
                          amount: '',
                          type: 'RENT',
                          paymentMethod: 'UPI',
                          notes: '',
                        });
                        setShowRecordPaymentModal(true);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      ➕ Record Payment Entry (Cash/UPI)
                    </button>
                  </div>

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
                      <h3 className="panel-title" style={{ margin: 0 }}>Active Tenants, Lease Durations & Renewal Reminders</h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                        Track tenant agreements, upcoming expiry renewal reminders, and move-out notices for your properties.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCreateLeaseModal()}
                      className="btn btn-primary btn-sm"
                    >
                      ➕ Register Active Tenancy
                    </button>
                  </div>

                  {/* Lease Renewal Reminders (Expiring within 45 days) */}
                  {(() => {
                    const expiring = leases.filter((l: any) => {
                      if (l.status !== 'ACTIVE') return false;
                      const endDate = new Date(l.endDate);
                      const now = new Date();
                      const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return diffDays <= 45;
                    });

                    if (expiring.length === 0) return null;

                    return (
                      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '1.5rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>⏰</span>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1e40af' }}>
                            Agreement Renewal Reminders: {expiring.length} {expiring.length === 1 ? 'tenancy is' : 'tenancies are'} ending soon!
                          </h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {expiring.map((exp: any) => (
                            <div key={exp._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', backgroundColor: '#ffffff', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                              <div>
                                <strong style={{ color: '#1e293b' }}>{exp.property?.title}</strong> — Tenant: <strong>{exp.tenant?.name}</strong> (📞 {exp.tenant?.phone})
                                <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                                  Agreement ends on: <strong>{new Date(exp.endDate).toLocaleDateString('en-IN')}</strong> ({exp.durationMonths} Months)
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={() => openRenewalModal(exp)}
                                  className="btn btn-primary btn-sm"
                                  style={{ backgroundColor: '#2563eb', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                >
                                  🔄 Renew Agreement
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkMovedOut(exp.propertyId || exp.property?._id, exp.property?.title)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#dc2626' }}
                                >
                                  🚪 Tenant Vacating
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

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
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  {l.status === 'ACTIVE' && (
                                    <button
                                      type="button"
                                      onClick={() => openRenewalModal(l)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem' }}
                                    >
                                      🔄 Renew
                                    </button>
                                  )}
                                  {l.status !== 'COMPLETED' && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkMovedOut(l.propertyId || l.property?.id || l.property?._id, l.property?.title)}
                                      className="btn btn-sm"
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.725rem',
                                        backgroundColor: '#059669',
                                        color: '#ffffff',
                                        whiteSpace: 'nowrap',
                                        fontWeight: '600',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      🚪 Mark Vacant
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
                    <div className="empty-tab-state"><p>No tenancy agreements registered yet.</p></div>
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

              {/* TENANT SELECTION & SEARCH SECTION */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    👤 Tenant Assignment
                  </label>
                  {!selectedTenant && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewTenantManual(!isNewTenantManual);
                        if (!isNewTenantManual) {
                          setSelectedTenant(null);
                          setLeaseForm((prev) => ({ ...prev, tenantId: '' }));
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.775rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                    >
                      {isNewTenantManual ? '🔍 Search Registered Tenant' : '➕ Register New / Unregistered Tenant'}
                    </button>
                  )}
                </div>

                {/* Case 1: A Tenant is Already Selected */}
                {selectedTenant ? (
                  <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '0.9rem' }}>
                        ✓ {selectedTenant.name}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: '#3b82f6', marginTop: '0.15rem' }}>
                        📞 {selectedTenant.phone || 'No phone'} • ✉️ {selectedTenant.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTenant(null);
                        setLeaseForm((prev) => ({ ...prev, tenantId: '', tenantName: '', tenantPhone: '', tenantEmail: '' }));
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem' }}
                    >
                      ✕ Change
                    </button>
                  </div>
                ) : isNewTenantManual ? (
                  /* Case 2: Manual Unregistered Tenant Form */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Tenant Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Deshmukh"
                          value={leaseForm.tenantName}
                          onChange={(e) => setLeaseForm({ ...leaseForm, tenantName: e.target.value })}
                          className="form-input"
                          style={{ fontSize: '0.825rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Tenant Phone Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 9876543210"
                          value={leaseForm.tenantPhone}
                          onChange={(e) => setLeaseForm({ ...leaseForm, tenantPhone: e.target.value })}
                          className="form-input"
                          style={{ fontSize: '0.825rem' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Tenant Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="e.g. rahul@gmail.com"
                        value={leaseForm.tenantEmail}
                        onChange={(e) => setLeaseForm({ ...leaseForm, tenantEmail: e.target.value })}
                        className="form-input"
                        style={{ fontSize: '0.825rem' }}
                      />
                      <span style={{ fontSize: '0.725rem', color: '#059669', display: 'block', marginTop: '0.25rem' }}>
                        ✨ An account will be automatically created so the tenant can log in at /tenant to submit Notice to Vacate and view receipts.
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Case 3: Live Search with Quick Suggestions */
                  <div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="🔍 Type Phone Number, Name, or Email to search..."
                        value={tenantSearchQuery}
                        onChange={(e) => handleTenantSearch(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.825rem' }}
                      />
                      {tenantSearchLoading && (
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#64748b' }}>
                          Searching...
                        </span>
                      )}
                    </div>

                    {/* Previous Tenants Suggestions (Shown when search is empty) */}
                    {!tenantSearchQuery && suggestedTenants.length > 0 && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                          💡 Previously Rented on Your Properties (Quick Select):
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {suggestedTenants.map((st) => (
                            <button
                              key={st.id || st._id}
                              type="button"
                              onClick={() => handleSelectTenant(st)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                backgroundColor: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                color: '#1e293b',
                              }}
                            >
                              <span>👤</span>
                              <strong>{st.name}</strong>
                              <span style={{ color: '#64748b' }}>({st.phone || st.email})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search Results List (Shown when typing query) */}
                    {tenantSearchQuery.trim().length > 0 && (
                      <div style={{ marginTop: '0.75rem', maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                        {searchedTenants.length > 0 ? (
                          searchedTenants.map((st) => (
                            <div
                              key={st.id || st._id}
                              onClick={() => handleSelectTenant(st)}
                              style={{
                                padding: '0.6rem 0.85rem',
                                borderBottom: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'background-color 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                            >
                              <div>
                                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{st.name}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  📞 {st.phone || 'No phone'} • ✉️ {st.email}
                                </div>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: '700' }}>
                                Select &rarr;
                              </span>
                            </div>
                          ))
                        ) : !tenantSearchLoading ? (
                          <div style={{ padding: '0.85rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                            No registered user matches "{tenantSearchQuery}".
                            <div style={{ marginTop: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsNewTenantManual(true);
                                  setLeaseForm((prev) => ({ ...prev, tenantPhone: tenantSearchQuery.match(/^\d+$/) ? tenantSearchQuery : prev.tenantPhone }));
                                }}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.725rem', padding: '0.3rem 0.6rem' }}
                              >
                                ➕ Register as New Unregistered Tenant
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
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
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>Tenancy Structure</label>
                  <select
                    value={leaseForm.tenancyType}
                    onChange={(e) => setLeaseForm({ ...leaseForm, tenancyType: e.target.value })}
                    className="form-input"
                  >
                    <option value="entire_flat">Entire Flat / Independent</option>
                    <option value="shared_flat">Shared Flat (Bed / Room Split)</option>
                  </select>
                </div>
                {leaseForm.tenancyType === 'shared_flat' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>Room / Bed Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Bed 1 / Room A"
                      value={leaseForm.roomOrBed}
                      onChange={(e) => setLeaseForm({ ...leaseForm, roomOrBed: e.target.value })}
                      className="form-input"
                    />
                  </div>
                ) : (
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
                )}
              </div>

              {leaseForm.tenancyType === 'shared_flat' && (
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
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>Agreement Start Date</label>
                <input
                  type="date"
                  value={leaseForm.startDate}
                  onChange={(e) => setLeaseForm({ ...leaseForm, startDate: e.target.value })}
                  className="form-input"
                />
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

      {/* RECORD MANUAL PAYMENT / KHATA ENTRY MODAL */}
      {showRecordPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fadeIn" style={{ maxWidth: '480px', width: '100%', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.2rem', color: '#0f172a' }}>Record Payment Entry (Khata)</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>Log cash, UPI or installment rent payment into tenant passbook ledger.</p>

            <form onSubmit={handleRecordPayment}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Select Property *</label>
                <select
                  className="form-input"
                  required
                  value={recordPaymentForm.propertyId}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, propertyId: e.target.value })}
                >
                  <option value="">-- Choose Property --</option>
                  {properties.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Payment Type</label>
                <select
                  className="form-input"
                  value={recordPaymentForm.type}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, type: e.target.value })}
                >
                  <option value="RENT">Monthly Rent</option>
                  <option value="SECURITY_DEPOSIT">Security Deposit</option>
                  <option value="MAINTENANCE">Maintenance / Utility</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    placeholder="e.g. 500, 1000, 20000"
                    value={recordPaymentForm.amount}
                    onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-input"
                    value={recordPaymentForm.paymentMethod}
                    onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, paymentMethod: e.target.value })}
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="NETBANKING">Bank Transfer (NEFT/IMPS)</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Installment Description / Note</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ₹1,000 partial payment received via GPay"
                  value={recordPaymentForm.title}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.65rem', backgroundColor: '#059669' }}>
                  ✓ Save &amp; Generate Receipt
                </button>
                <button type="button" onClick={() => setShowRecordPaymentModal(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
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

      {/* CUSTOMIZABLE LEASE RENEWAL MODAL */}
      {renewModal.show && renewModal.lease && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fadeIn" style={{ maxWidth: '480px', width: '100%', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>🔄 Renew Tenancy Agreement</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Extend lease duration and update monthly rent</span>
              </div>
              <button
                type="button"
                onClick={() => setRenewModal({ show: false, lease: null, renewalMonths: 11, monthlyRent: '', loading: false })}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.825rem', border: '1px solid #e2e8f0', lineHeight: 1.6 }}>
              <div>
                <span style={{ color: '#64748b' }}>Property: </span>
                <strong>{renewModal.lease.property?.title}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Tenant: </span>
                <strong>{renewModal.lease.tenant?.name}</strong> (📞 {renewModal.lease.tenant?.phone})
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Current Expiry Date: </span>
                <strong>{new Date(renewModal.lease.endDate).toLocaleDateString('en-IN')}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmRenewal}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: '700' }}>Select Renewal Term *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  {[
                    { label: '3 Months', val: 3 },
                    { label: '6 Months', val: 6 },
                    { label: '11 Months (Std)', val: 11 },
                    { label: '12 Months (1Y)', val: 12 },
                    { label: '24 Months (2Y)', val: 24 },
                    { label: '36 Months (3Y)', val: 36 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setRenewModal({ ...renewModal, renewalMonths: opt.val })}
                      className={`btn btn-sm ${renewModal.renewalMonths === opt.val ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.725rem', padding: '0.4rem 0.2rem' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Or custom duration:</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="form-input"
                    style={{ width: '80px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                    value={renewModal.renewalMonths}
                    onChange={(e) => setRenewModal({ ...renewModal, renewalMonths: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Months</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: '700' }}>Agreed Monthly Rent (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  placeholder="e.g. 24000"
                  value={renewModal.monthlyRent}
                  onChange={(e) => setRenewModal({ ...renewModal, monthlyRent: e.target.value })}
                />
              </div>

              {/* Calculated Expiry Date Preview */}
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.825rem', color: '#065f46' }}>
                <div>
                  🗓️ <strong>New Agreement End Date:</strong>{' '}
                  {(() => {
                    const cur = new Date(renewModal.lease.endDate);
                    const next = new Date(cur);
                    next.setMonth(next.getMonth() + Number(renewModal.renewalMonths || 0));
                    return next.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
                  })()}
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  💰 <strong>Updated Rent:</strong> ₹{Number(renewModal.monthlyRent || 0).toLocaleString('en-IN')}/month
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={renewModal.loading}
                  style={{ flex: 1, padding: '0.65rem' }}
                >
                  {renewModal.loading ? 'Renewing...' : 'Confirm & Renew Agreement'}
                </button>
                <button
                  type="button"
                  onClick={() => setRenewModal({ show: false, lease: null, renewalMonths: 11, monthlyRent: '', loading: false })}
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

      {/* SweetAlert Popup / Confirmation Modal */}
      <SweetAlertModal
        isOpen={alertConfig.isOpen}
        options={alertConfig.options}
        onClose={() => setAlertConfig({ isOpen: false, options: null })}
      />
    </div>
  );
}
