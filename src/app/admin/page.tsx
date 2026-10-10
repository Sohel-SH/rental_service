'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminNotificationManager from '@/components/AdminNotificationManager';
import SweetAlertModal, { AlertOptions } from '@/components/SweetAlertModal';

// Curated high quality interior room presets
const SAMPLE_ROOM_IMAGES = [
  { label: '🛋️ Living Hall', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
  { label: '🛏️ Master Bedroom', url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80' },
  { label: '🍳 Modular Kitchen', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80' },
  { label: '🚿 Luxury Bathroom', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80' },
  { label: '🌇 Balcony View', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80' },
];

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isTelecaller = user?.role === 'telecaller';
  const [activeTab, setActiveTab] = useState(isTelecaller ? 'leads' : 'financials');

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

  // Settings state
  const [settings, setSettings] = useState({
    companyName: 'S.R RENTAL SERVICES',
    email: 'info@srrentals.com',
    phone: '+91 72186 61327',
    address: 'Hinjawadi Phase 1, Pune, Maharashtra 411057',
    instagramUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    whatsappNumber: '917218661327',
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Filters & Sub-states
  const [leadFilter, setLeadFilter] = useState('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dealFilter, setDealFilter] = useState('all');
  const [occupancyFilter, setOccupancyFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [propertySearch, setPropertySearch] = useState('');

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

  // Post Property Modal State
  const [showCreatePropertyModal, setShowCreatePropertyModal] = useState(false);
  const [propertySubmitting, setPropertySubmitting] = useState(false);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [imageCompressionActive, setImageCompressionActive] = useState(false);
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    description: '',
    price: '',
    deposit: '',
    location: '',
    address: '',
    type: 'apartment',
    bedrooms: '2',
    bathrooms: '2',
    area: '950',
    furnishing: 'Semi-Furnished',
    amenities: 'Parking, Lift, 24/7 Security, Water Supply',
  });

  // Staff Creation Modal State
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'telecaller',
  });
  const [staffSubmitting, setStaffSubmitting] = useState(false);

  // Tenancy Agreement Creation Modal State (Admin)
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
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [searchedTenants, setSearchedTenants] = useState<any[]>([]);
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
    } else if (!authLoading && user && user.role !== 'admin' && user.role !== 'telecaller') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Adjust active tab for telecaller
  useEffect(() => {
    if (user?.role === 'telecaller') {
      setActiveTab('leads');
    }
  }, [user]);

  // Helper to update list state seamlessly without destroying DOM references if data has not changed
  const updateIfChanged = <T extends Record<string, any>>(prevList: T[], newList: T[]): T[] => {
    if (!newList) return prevList;
    if (!prevList || prevList.length === 0) return newList;

    if (JSON.stringify(prevList) === JSON.stringify(newList)) {
      return prevList;
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
        return prevItem;
      }
      hasChanged = true;
      return newItem;
    });

    return hasChanged ? merged : prevList;
  };

  // Fast client-side image compression
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
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
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            resolve(dataUrl);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageCompressionActive(true);
    try {
      const promises = Array.from(files).map((file) => compressImageFile(file));
      const compressedResults = await Promise.all(promises);
      setPropertyImages((prev) => [...prev, ...compressedResults]);
    } catch (err) {
      console.error('Error compressing images:', err);
      showAlert({
        title: 'Image Compression Failed',
        text: 'Failed to process image files. Please try again with smaller photo sizes.',
        type: 'error',
      });
    } finally {
      setImageCompressionActive(false);
      e.target.value = '';
    }
  };

  const addPresetImage = (url: string) => {
    if (!propertyImages.includes(url)) {
      setPropertyImages((prev) => [...prev, url]);
    }
  };

  const removePropertyImage = (index: number) => {
    setPropertyImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Fetch administrative data
  const fetchData = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    try {
      if (user.role === 'telecaller') {
        const leadsRes = await fetch('/api/leads');
        if (leadsRes.ok) {
          const data = await leadsRes.json();
          setLeads((prev) => updateIfChanged(prev, data.leads || []));
        }
        setLoading(false);
        return;
      }

      const [leadsRes, docsRes, ticketsRes, usersRes, paymentsRes, leasesRes, dealsRes, propsRes, settingsRes] =
        await Promise.all([
          fetch('/api/leads'),
          fetch('/api/documents'),
          fetch('/api/tickets'),
          fetch('/api/admin/users'),
          fetch('/api/payments'),
          fetch('/api/leases'),
          fetch('/api/deals'),
          fetch('/api/properties?scope=admin'),
          fetch('/api/settings'),
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
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData(false);
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
      showAlert({
        title: status === 'verified' ? 'Document Approved' : 'Document Rejected',
        text: `The verification document has been marked as ${status}.`,
        type: status === 'verified' ? 'success' : 'info',
      });
      fetchData(true);
    } catch (err: any) {
      showAlert({
        title: 'Document Update Failed',
        text: err.message || 'Error updating document status',
        type: 'error',
      });
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

  // Handle Payment Status updates
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
        showAlert({
          title: 'Invoice Created',
          text: 'Payment invoice generated and published to tenant passbook.',
          type: 'success',
        });
        fetchData(true);
      } else {
        const data = await res.json();
        showAlert({
          title: 'Invoice Error',
          text: data.error || 'Failed to create invoice',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Failed to create invoice:', err);
    }
  };

  // Create Property
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropertySubmitting(true);
    try {
      const amenitiesArray = propertyForm.amenities.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...propertyForm,
          price: Number(propertyForm.price),
          deposit: Number(propertyForm.deposit || 0),
          bedrooms: Number(propertyForm.bedrooms),
          bathrooms: Number(propertyForm.bathrooms),
          area: Number(propertyForm.area),
          amenities: amenitiesArray,
          images: propertyImages.length > 0 ? propertyImages : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'],
        }),
      });
      if (res.ok) {
        setShowCreatePropertyModal(false);
        setPropertyImages([]);
        setPropertyForm({
          title: '',
          description: '',
          price: '',
          deposit: '',
          location: '',
          address: '',
          type: 'apartment',
          bedrooms: '2',
          bathrooms: '2',
          area: '950',
          furnishing: 'Semi-Furnished',
          amenities: 'Parking, Lift, 24/7 Security, Water Supply',
        });
        showAlert({
          title: 'Property Listed',
          text: 'Property has been added successfully and is now active on the platform.',
          type: 'success',
        });
        fetchData(true);
      } else {
        const data = await res.json();
        showAlert({
          title: 'Listing Error',
          text: data.error || 'Failed to post property',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Failed to create property:', err);
    } finally {
      setPropertySubmitting(false);
    }
  };

  // Create Staff / Telecaller
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateStaffModal(false);
        setStaffForm({ name: '', email: '', password: '', phone: '', role: 'telecaller' });
        showAlert({
          title: 'Staff Member Added',
          text: 'Staff account has been created successfully!',
          type: 'success',
        });
        fetchData(true);
      } else {
        showAlert({
          title: 'Account Creation Failed',
          text: data.error || 'Failed to create staff member',
          type: 'error',
        });
      }
    } catch (err: any) {
      showAlert({
        title: 'Error',
        text: err.message || 'Error creating staff member',
        type: 'error',
      });
    } finally {
      setStaffSubmitting(false);
    }
  };

  // Search registered users for tenancy (Admin - only tenants)
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

  // Select a tenant from search / user list
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

  // Open Tenancy Creation Modal (Admin)
  const openCreateLeaseModal = (propId?: string) => {
    const defaultProp = propId ? properties.find((p) => p._id === propId || p.id === propId) : properties[0];
    setLeaseForm({
      propertyId: propId || (properties[0]?.id || properties[0]?._id || ''),
      tenantId: '',
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
      monthlyRent: defaultProp?.price ? String(defaultProp.price) : '',
      securityDeposit: defaultProp?.price ? String(defaultProp.price * 2) : '',
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
  };

  // Create Tenancy Agreement (Admin)
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
      fetchData(true);
      showAlert({
        title: 'Tenancy Agreement Registered',
        text: 'Tenancy agreement registered successfully! The property is now marked as OCCUPIED and invoices have been generated.',
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

  // Change User Role
  const handleRoleChange = (userId: string, newRole: string) => {
    showAlert({
      title: 'Change User Role',
      text: `Are you sure you want to change this user's platform role to ${newRole.toUpperCase()}?`,
      type: 'warning',
      showCancelButton: true,
      confirmText: 'Yes, Change Role',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role: newRole }),
          });
          const data = await res.json();
          if (res.ok) {
            showAlert({
              title: 'Role Updated',
              text: `User role successfully updated to ${newRole.toUpperCase()}.`,
              type: 'success',
            });
            fetchData(true);
          } else {
            showAlert({
              title: 'Update Failed',
              text: data.error || 'Failed to update user role',
              type: 'error',
            });
          }
        } catch (err: any) {
          showAlert({
            title: 'Error',
            text: err.message || 'Error updating user role',
            type: 'error',
          });
        }
      },
    });
  };

  // Handle Lease Termination
  const handleConcludeLease = (leaseId: string) => {
    showAlert({
      title: 'Conclude Tenancy Agreement?',
      text: 'Are you sure you want to conclude this lease and mark the property as AVAILABLE on the platform?',
      type: 'warning',
      showCancelButton: true,
      confirmText: 'Yes, Conclude Lease',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/leases', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leaseId, action: 'terminate_or_complete' }),
          });
          if (res.ok) {
            showAlert({
              title: 'Lease Concluded',
              text: 'Tenancy concluded and property is now marked as AVAILABLE.',
              type: 'success',
            });
            fetchData(true);
          }
        } catch (err) {
          console.error('Failed to conclude lease:', err);
        }
      },
    });
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
      if (!res.ok) throw new Error(data.error || 'Failed to renew lease');
      showAlert({
        title: 'Agreement Renewed',
        text: `Tenancy agreement renewed successfully! New end date: ${new Date(data.lease.endDate).toLocaleDateString('en-IN')}`,
        type: 'success',
      });
      setRenewModal({ show: false, lease: null, renewalMonths: 11, monthlyRent: '', loading: false });
      fetchData(true);
    } catch (err: any) {
      showAlert({
        title: 'Renewal Failed',
        text: err.message || 'Error renewing lease',
        type: 'error',
      });
      setRenewModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccess('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsSuccess('✅ Site settings & social links saved successfully!');
        showAlert({
          title: 'Settings Saved',
          text: 'Site contact information and social handles updated successfully.',
          type: 'success',
        });
        setTimeout(() => setSettingsSuccess(''), 4000);
      } else {
        showAlert({
          title: 'Save Failed',
          text: data.error || 'Failed to save settings',
          type: 'error',
        });
      }
    } catch (err: any) {
      showAlert({
        title: 'Error',
        text: err.message || 'Error saving settings',
        type: 'error',
      });
    } finally {
      setSettingsSaving(false);
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

  // Expiring leases (within 45 days)
  const expiringLeases = leases.filter((l: any) => {
    if (l.status !== 'ACTIVE' && l.status !== 'active') return false;
    const end = new Date(l.endDate).getTime();
    const now = new Date().getTime();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return days >= -10 && days <= 45;
  });

  // Filtered lists
  const filteredLeads = leads.filter((l: any) => {
    const matchesFilter = leadFilter === 'all' || l.status === leadFilter;
    const matchesSearch =
      !leadSearch ||
      l.name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.phone?.includes(leadSearch) ||
      l.propertyId?.title?.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.property?.title?.toLowerCase().includes(leadSearch.toLowerCase());
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

  const filteredProperties = properties.filter((p: any) => {
    const matchesFilter =
      propertyFilter === 'all' ||
      (propertyFilter === 'available' && (p.isAvailable || p.occupancyStatus === 'available')) ||
      (propertyFilter === 'occupied' && (!p.isAvailable || p.occupancyStatus === 'occupied')) ||
      (propertyFilter === 'vacating' && p.occupancyStatus === 'vacating_soon');

    const matchesSearch =
      !propertySearch ||
      p.title?.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.location?.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.address?.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.owner?.name?.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.owner?.phone?.includes(propertySearch) ||
      p.owner?.email?.toLowerCase().includes(propertySearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="dashboard-wrapper">
      <div className="container dashboard-container-box">

        {/* Welcome Section */}
        <div className="dashboard-header-block card glass">
          <div>
            <span className="user-role-tag">
              {isTelecaller ? '📞 Telecaller & CRM Desk' : 'Admin Command Center'}
            </span>
            <h2>Welcome, {user.name}</h2>
            <p>
              {isTelecaller
                ? 'Central Lead Management, Client Follow-ups & Calling Desk.'
                : 'Financial ledger, closed deals, occupancy radar, settings, and lead management.'}
            </p>
          </div>
          <div className="user-meta-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
            <p style={{ margin: 0 }}>📧 {user.email}</p>
            <p style={{ margin: 0 }}>🔑 Role: {isTelecaller ? 'Staff / Telecaller' : 'Administrator'}</p>
            {!isTelecaller && (
              <Link
                href="/list-property"
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.5rem' }}
              >
                ➕ Post New Property
              </Link>
            )}
          </div>
        </div>

        {/* Real-Time Alert Manager */}
        <AdminNotificationManager leads={leads} />

        {/* Live Enquiry Alert Bar */}
        {newLeads.length > 0 && (
          <div className="card animate-fadeIn" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.6rem' }}>🚨</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#92400e' }}>
                  Real-time Lead Alert: {newLeads.length} New {newLeads.length === 1 ? 'Enquiry' : 'Enquiries'} Received!
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#b45309' }}>
                  Latest: <strong>{latestNewLead?.name}</strong> ({latestNewLead?.phone}) enquired about <strong>{latestNewLead?.propertyId?.title || latestNewLead?.property?.title || 'Property'}</strong>
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {latestNewLead && (
                <a
                  href={`https://wa.me/917218661327?text=${encodeURIComponent(
                    `🚨 *NEW LEAD NOTIFICATION*\n━━━━━━━━━━━━━━━━━━━━\n🏠 Property: ${latestNewLead.propertyId?.title || latestNewLead.property?.title || 'Listing'}\n💰 Rent: ₹${(latestNewLead.propertyId?.price || latestNewLead.property?.price || 0).toLocaleString()}/mo\n📍 Location: ${latestNewLead.propertyId?.location || latestNewLead.property?.location || 'Pune'}\n👤 Client: ${latestNewLead.name} (${latestNewLead.phone})\n✉️ Email: ${latestNewLead.email}\n📝 Note: ${latestNewLead.message}`
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
          {/* Telecaller Only Sees Leads */}
          {isTelecaller ? (
            <button
              className={`tab-btn active`}
              onClick={() => setActiveTab('leads')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              📩 Enquiries & Leads Calling Desk ({leads.length})
              {newLeads.length > 0 && (
                <span style={{ backgroundColor: '#ef4444', color: '#ffffff', fontSize: '0.675rem', fontWeight: '700', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                  {newLeads.length} NEW
                </span>
              )}
            </button>
          ) : (
            <>
              <button
                className={`tab-btn ${activeTab === 'financials' ? 'active' : ''}`}
                onClick={() => setActiveTab('financials')}
              >
                💰 Financials & Invoices ({payments.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
                onClick={() => setActiveTab('properties')}
              >
                🏢 Total Properties ({properties.length})
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
                {expiringLeases.length > 0 && (
                  <span style={{ backgroundColor: '#3b82f6', color: '#fff', fontSize: '0.675rem', fontWeight: '700', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                    {expiringLeases.length} RENEW
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
                👥 Users & Staff ({users.length})
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
              <button
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                ⚙️ Site & Social Links
              </button>
            </>
          )}
        </div>

        {/* Tab Contents */}
        <div className="dashboard-tab-content">
          {loading ? (
            <div className="tab-loading-state">Loading dashboard data...</div>
          ) : (
            <>
              {/* 1. FINANCIALS & INVOICES TAB (ADMIN ONLY) */}
              {!isTelecaller && activeTab === 'financials' && (
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
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      <span style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: '600' }}>🔒 Security Deposits Held</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#1e40af', fontSize: '1.5rem', fontWeight: '800' }}>
                        ₹{paymentStats.totalDepositsHeld?.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                      <span style={{ fontSize: '0.8rem', color: '#6d28d9', fontWeight: '600' }}>🤝 Brokerage Revenue</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#5b21b6', fontSize: '1.5rem', fontWeight: '800' }}>
                        ₹{paymentStats.totalBrokerageEarned?.toLocaleString('en-IN')}
                      </h3>
                    </div>
                  </div>

                  {/* Filter Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    {['all', 'PAID', 'PENDING', 'OVERDUE', 'SECURITY_DEPOSIT', 'BROKERAGE'].map((pf) => (
                      <button
                        key={pf}
                        type="button"
                        onClick={() => setPaymentFilter(pf)}
                        className={`btn btn-sm ${paymentFilter === pf ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {pf === 'all' ? 'All Invoices' : pf.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {filteredPayments.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Invoice / Receipt</th>
                            <th>Tenant / Payer</th>
                            <th>Property</th>
                            <th>Amount & Type</th>
                            <th>Status</th>
                            <th>Due / Paid Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.map((p: any) => (
                            <tr key={p.id || p._id}>
                              <td>
                                <strong>{p.title}</strong>
                                <span className="table-sub-detail">#{p.receiptNumber || p.id?.slice(-6) || 'INV'}</span>
                              </td>
                              <td>
                                <strong>{p.user?.name || 'Tenant'}</strong>
                                <span className="table-sub-detail">📞 {p.user?.phone || p.user?.email}</span>
                              </td>
                              <td>
                                <strong>{p.property?.title || 'Property'}</strong>
                                <span className="table-sub-detail">📍 {p.property?.location}</span>
                              </td>
                              <td>
                                <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>₹{p.amount?.toLocaleString('en-IN')}</strong>
                                <span className="table-sub-detail">{p.type}</span>
                              </td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: p.status === 'PAID' ? '#dcfce7' : p.status === 'OVERDUE' ? '#fee2e2' : '#fef3c7',
                                    color: p.status === 'PAID' ? '#15803d' : p.status === 'OVERDUE' ? '#b91c1c' : '#b45309',
                                    fontWeight: '700',
                                  }}
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td>
                                {p.status === 'PAID' && p.paidAt ? (
                                  <span style={{ fontSize: '0.8rem', color: '#15803d' }}>
                                    Paid: {new Date(p.paidAt).toLocaleDateString('en-IN')}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: p.status === 'OVERDUE' ? '#b91c1c' : '#475569' }}>
                                    Due: {new Date(p.dueDate).toLocaleDateString('en-IN')}
                                  </span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  {p.status === 'PAID' ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedReceipt(p)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
                                    >
                                      🧾 Receipt
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handlePaymentStatusChange(p.id || p._id, 'PAID')}
                                      className="btn btn-primary btn-sm"
                                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem', backgroundColor: '#059669' }}
                                    >
                                      Mark Paid
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
                      <p>No invoices or payments matching this filter.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TOTAL PROPERTIES TAB (ADMIN ONLY) */}
              {!isTelecaller && activeTab === 'properties' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 className="panel-title" style={{ margin: 0 }}>Platform Property Inventory</h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                        Master directory of all registered rental flats, occupancies, landlord contacts, and listing statuses.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => openCreateLeaseModal()}
                        className="btn btn-secondary btn-sm"
                      >
                        🔑 Add Tenancy Agreement
                      </button>
                      <Link href="/list-property" className="btn btn-primary btn-sm">
                        ➕ Post New Property
                      </Link>
                    </div>
                  </div>

                  {/* Property KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>🏢 Total Properties</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: '800' }}>
                        {properties.length}
                      </h3>
                    </div>
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                      <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: '600' }}>🟢 Available for Rent</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#065f46', fontSize: '1.5rem', fontWeight: '800' }}>
                        {properties.filter((p: any) => p.isAvailable || p.occupancyStatus === 'available').length}
                      </h3>
                    </div>
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      <span style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: '600' }}>🟠 Occupied / Leased</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#1e40af', fontSize: '1.5rem', fontWeight: '800' }}>
                        {properties.filter((p: any) => !p.isAvailable || p.occupancyStatus === 'occupied').length}
                      </h3>
                    </div>
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                      <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: '600' }}>🟡 Vacating Soon</span>
                      <h3 style={{ margin: '0.35rem 0 0 0', color: '#92400e', fontSize: '1.5rem', fontWeight: '800' }}>
                        {properties.filter((p: any) => p.occupancyStatus === 'vacating_soon').length}
                      </h3>
                    </div>
                  </div>

                  {/* Search & Filter Controls */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[
                        { id: 'all', label: `All (${properties.length})` },
                        { id: 'available', label: `🟢 Available (${properties.filter((p: any) => p.isAvailable || p.occupancyStatus === 'available').length})` },
                        { id: 'occupied', label: `🟠 Occupied (${properties.filter((p: any) => !p.isAvailable || p.occupancyStatus === 'occupied').length})` },
                        { id: 'vacating', label: `🟡 Vacating (${properties.filter((p: any) => p.occupancyStatus === 'vacating_soon').length})` },
                      ].map((pf) => (
                        <button
                          key={pf.id}
                          type="button"
                          onClick={() => setPropertyFilter(pf.id)}
                          className={`btn btn-sm ${propertyFilter === pf.id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {pf.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ minWidth: '260px', flex: '1', maxWidth: '380px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="🔍 Search title, locality, or owner..."
                        value={propertySearch}
                        onChange={(e) => setPropertySearch(e.target.value)}
                        style={{ padding: '0.45rem 0.8rem', fontSize: '0.825rem' }}
                      />
                    </div>
                  </div>

                  {filteredProperties.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property</th>
                            <th>Type & Size</th>
                            <th>Rent & Deposit</th>
                            <th>Landlord / Owner</th>
                            <th>Occupancy Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProperties.map((p: any) => {
                            const isOcc = !p.isAvailable || p.occupancyStatus === 'occupied';
                            const isVac = p.occupancyStatus === 'vacating_soon';
                            const mainImg = (Array.isArray(p.images) ? p.images[0] : (p.images ? p.images.split(',')[0] : '')) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

                            return (
                              <tr key={p.id || p._id}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <img
                                      src={mainImg}
                                      alt={p.title}
                                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                    <div>
                                      <strong>{p.title}</strong>
                                      <span className="table-sub-detail">📍 {p.location || p.address}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <strong>{p.bedrooms || p.bhk || 2} BHK {p.type || p.propertyType || 'Apartment'}</strong>
                                  <span className="table-sub-detail">{p.furnishing || 'Semi-Furnished'} • {p.area ? `${p.area} sq.ft` : 'Standard'}</span>
                                </td>
                                <td>
                                  <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>₹{p.price?.toLocaleString('en-IN')}/mo</strong>
                                  <span className="table-sub-detail">Dep: ₹{(p.deposit || p.price * 2)?.toLocaleString('en-IN')}</span>
                                </td>
                                <td>
                                  <strong>{p.owner?.name || 'Landlord'}</strong>
                                  <span className="table-sub-detail">📞 {p.owner?.phone || p.owner?.email || 'N/A'}</span>
                                </td>
                                <td>
                                  <span
                                    className="badge"
                                    style={{
                                      backgroundColor: isVac ? '#fef3c7' : isOcc ? '#fee2e2' : '#dcfce7',
                                      color: isVac ? '#b45309' : isOcc ? '#b91c1c' : '#15803d',
                                      fontWeight: '700',
                                    }}
                                  >
                                    {isVac ? '🟡 VACATING SOON' : isOcc ? '🟠 OCCUPIED' : '🟢 AVAILABLE'}
                                  </span>
                                  {isVac && p.vacantFromDate && (
                                    <span style={{ display: 'block', fontSize: '0.725rem', color: '#b45309', marginTop: '0.2rem' }}>
                                      Vacant from: {new Date(p.vacantFromDate).toLocaleDateString('en-IN')}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    <Link
                                      href={`/properties/${p.id || p._id}`}
                                      target="_blank"
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
                                    >
                                      👁️ View Listing
                                    </Link>
                                    {!isOcc && (
                                      <button
                                        type="button"
                                        onClick={() => openCreateLeaseModal(p.id || p._id)}
                                        className="btn btn-primary btn-sm"
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem', backgroundColor: '#059669' }}
                                      >
                                        🔑 Add Tenancy
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>No properties match your filter criteria.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. CLOSED DEALS & SALES TAB (ADMIN ONLY) */}
              {!isTelecaller && activeTab === 'deals' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 className="panel-title" style={{ margin: 0 }}>Closed Deals & Commission Registry</h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                        Track finalized rental leases and outright property sales with full commission bookkeeping.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['all', 'RENTAL_LEASE', 'SALE'].map((df) => (
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
                            <tr key={d._id || d.id}>
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

              {/* 3. OCCUPANCY & VACANCY RADAR TAB (ADMIN ONLY) */}
              {!isTelecaller && activeTab === 'occupancy' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 className="panel-title" style={{ margin: 0 }}>Tenancy Lifecycle, Renewals & Vacancy Radar</h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                        Track occupied flats, 11-month agreement renewal alerts, and vacating move-out notices.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => openCreateLeaseModal()}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', backgroundColor: '#059669' }}
                      >
                        ➕ Register Tenancy Agreement
                      </button>
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

                  {/* Lease Renewal Alert Banner */}
                  {expiringLeases.length > 0 && (
                    <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🔄</span>
                        <div>
                          <strong style={{ color: '#1e40af', fontSize: '0.9rem' }}>
                            Agreement Renewal Reminder: {expiringLeases.length} {expiringLeases.length === 1 ? 'tenancy agreement is' : 'tenancy agreements are'} approaching expiry (45-day window)!
                          </strong>
                          <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.775rem', color: '#1d4ed8' }}>
                            Reach out to the landlord and tenant to prepare the renewed registered agreement.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vacating Alert Banner */}
                  {vacatingLeases.length > 0 && (
                    <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>⏳</span>
                      <div>
                        <strong style={{ color: '#92400e', fontSize: '0.9rem' }}>
                          Upcoming Vacancy Alert: {vacatingLeases.length} {vacatingLeases.length === 1 ? 'property is' : 'properties are'} vacating soon!
                        </strong>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.775rem', color: '#b45309' }}>
                          Zero-vacancy pre-booking is open so prospective tenants can tour and lock in their move-in date.
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
                            <th>Move-Out / Renewal Info</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeases.map((l: any) => {
                            const end = new Date(l.endDate).getTime();
                            const now = new Date().getTime();
                            const daysUntilExpiry = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                            const isExpiringSoon = daysUntilExpiry <= 45 && daysUntilExpiry >= -15;

                            return (
                              <tr key={l.id || l._id}>
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
                                  <span className="table-sub-detail">{l.durationMonths} Months Term</span>
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
                                  ) : isExpiringSoon ? (
                                    <div>
                                      <strong style={{ color: '#2563eb', fontSize: '0.8rem' }}>
                                        {daysUntilExpiry <= 0 ? 'Expired / Ending Now' : `Expires in ${daysUntilExpiry} days`}
                                      </strong>
                                      <span className="table-sub-detail">Renewal window open</span>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active Stay</span>
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    {l.status !== 'COMPLETED' && (
                                      <button
                                        type="button"
                                        onClick={() => openRenewalModal(l)}
                                        className="btn btn-primary btn-sm"
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', backgroundColor: '#2563eb' }}
                                        title="Renew tenancy agreement with customizable duration"
                                      >
                                        🔄 Renew Agreement
                                      </button>
                                    )}
                                    {l.status !== 'COMPLETED' && (
                                      <button
                                        type="button"
                                        onClick={() => handleConcludeLease(l.id || l._id)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem' }}
                                      >
                                        Conclude
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
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

              {/* 4. ENQUIRIES & LEADS CRM TAB (ACCESSIBLE TO ADMIN & TELECALLER) */}
              {activeTab === 'leads' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 className="panel-title" style={{ margin: 0 }}>
                        {isTelecaller ? '📞 Calling Desk & Follow-up Queue' : 'Property Enquiries & Central CRM'}
                      </h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                        View client phone numbers, send instant WhatsApp messages, and update deal pipelines.
                      </p>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ maxWidth: '280px', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                      placeholder="Search client, phone, locality..."
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
                            <th>Lead Status</th>
                            <th>CRM & Calling Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeads.map((l: any) => {
                            const propTitle = l.propertyId?.title || l.property?.title || 'Property Listing';
                            const propPrice = l.propertyId?.price || l.property?.price || 0;
                            const propLoc = l.propertyId?.location || l.property?.location || 'Pune';
                            const ownerName = l.propertyId?.owner?.name || l.property?.owner?.name || 'Owner';
                            const ownerPhone = l.propertyId?.owner?.phone || l.property?.owner?.phone || 'N/A';

                            return (
                              <tr key={l.id || l._id}>
                                <td>
                                  <strong>{propTitle}</strong>
                                  <span className="table-sub-detail">
                                    ₹{propPrice.toLocaleString()}/mo • {propLoc}
                                  </span>
                                </td>
                                <td>
                                  <strong>{l.name}</strong>
                                  <span className="table-sub-detail">📞 {l.phone}</span>
                                  <span className="table-sub-detail">✉️ {l.email}</span>
                                </td>
                                <td>
                                  <strong>{ownerName}</strong>
                                  <span className="table-sub-detail">📞 {ownerPhone}</span>
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>"{l.message}"</span>
                                </td>
                                <td>
                                  <span className={`badge badge-${l.status}`}>{l.status}</span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <a
                                      href={`https://wa.me/${(l.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                        `Hello ${l.name}, thank you for your enquiry regarding ${propTitle} on S.R Rental Services. I am calling from the team to assist you with visit scheduling and pricing details.`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-sm"
                                      style={{ backgroundColor: '#25D366', color: '#fff', padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
                                    >
                                      💬 Client
                                    </a>
                                    <a
                                      href={`tel:${l.phone}`}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.725rem' }}
                                    >
                                      📞 Call
                                    </a>
                                    <select
                                      className="form-input"
                                      style={{ padding: '0.3rem', fontSize: '0.725rem', width: '110px' }}
                                      value={l.status}
                                      onChange={(e) => handleLeadStatusChange(l.id || l._id, e.target.value)}
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
                            );
                          })}
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

              {/* 5. USERS & STAFF TAB (ADMIN ONLY) */}
              {!isTelecaller && activeTab === 'users' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 className="panel-title" style={{ margin: 0 }}>System Users & Staff Roles</h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                        Manage user permissions, create staff/telecaller accounts, and assign role privileges.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreateStaffModal(true)}
                      className="btn btn-primary btn-sm"
                    >
                      ➕ Add Staff / Telecaller
                    </button>
                  </div>

                  {users.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>User Name</th>
                            <th>Email Address</th>
                            <th>Phone Number</th>
                            <th>Assigned Role</th>
                            <th>Joined Date</th>
                            <th>Manage Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((usr: any) => (
                            <tr key={usr.id || usr._id}>
                              <td><strong>{usr.name}</strong></td>
                              <td>{usr.email}</td>
                              <td>{usr.phone || 'N/A'}</td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor:
                                      usr.role === 'admin'
                                        ? '#fee2e2'
                                        : usr.role === 'telecaller'
                                          ? '#e0e7ff'
                                          : usr.role === 'owner'
                                            ? '#fef3c7'
                                            : '#dcfce7',
                                    color:
                                      usr.role === 'admin'
                                        ? '#b91c1c'
                                        : usr.role === 'telecaller'
                                          ? '#4338ca'
                                          : usr.role === 'owner'
                                            ? '#b45309'
                                            : '#15803d',
                                    fontWeight: '700',
                                  }}
                                >
                                  {usr.role.toUpperCase()}
                                </span>
                              </td>
                              <td>{new Date(usr.createdAt).toLocaleDateString('en-IN')}</td>
                              <td>
                                <select
                                  className="form-input"
                                  style={{ padding: '0.3rem', fontSize: '0.725rem', width: '120px' }}
                                  value={usr.role}
                                  onChange={(e) => handleRoleChange(usr.id || usr._id, e.target.value)}
                                  disabled={usr.id === user.id || usr._id === user.id}
                                >
                                  <option value="tenant">Tenant</option>
                                  <option value="owner">Landlord / Owner</option>
                                  <option value="telecaller">Telecaller / Staff</option>
                                  <option value="admin">Administrator</option>
                                </select>
                              </td>
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

              {/* 6. VERIFICATION TAB (ADMIN ONLY) */}
              {!isTelecaller && activeTab === 'documents' && (
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
                            <tr key={d.id || d._id}>
                              <td><strong>{d.userId?.name || d.user?.name || 'User'}</strong><span className="table-sub-detail">{d.userId?.email || d.user?.email}</span></td>
                              <td><span className="badge">{d.documentType}</span></td>
                              <td><a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>View File</a></td>
                              <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  {d.status !== 'verified' && (
                                    <button type="button" onClick={() => handleDocStatusChange(d.id || d._id, 'verified')} className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', backgroundColor: '#059669' }}>Approve</button>
                                  )}
                                  {d.status !== 'rejected' && (
                                    <button type="button" onClick={() => handleDocStatusChange(d.id || d._id, 'rejected')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', color: '#dc2626' }}>Reject</button>
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

              {/* 7. TICKETS TAB (ADMIN ONLY) */}
              {!isTelecaller && activeTab === 'tickets' && (
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
                            <tr key={t.id || t._id}>
                              <td><strong>{t.property?.title || t.propertyId?.title || 'Property'}</strong></td>
                              <td><strong>{t.tenant?.name || t.tenantId?.name || 'Tenant'}</strong><span className="table-sub-detail">📞 {t.tenant?.phone || t.tenantId?.phone}</span></td>
                              <td><span className={`badge badge-priority ${t.priority}`}>{t.priority}</span></td>
                              <td><strong>{t.title}</strong><span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>"{t.description}"</span></td>
                              <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                              <td>
                                <select className="form-input" style={{ padding: '0.35rem', fontSize: '0.75rem', width: '110px' }} value={t.status} onChange={(e) => handleTicketStatusChange(t.id || t._id, e.target.value)}>
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

              {/* 8. SITE SETTINGS & SOCIAL LINKS TAB (ADMIN ONLY) */}
              {!isTelecaller && activeTab === 'settings' && (
                <div className="tab-panel animate-fadeIn">
                  <div style={{ maxWidth: '720px' }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h3 className="panel-title" style={{ margin: 0 }}>Site Settings & Social Media Handles</h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                        Configure the official company contact info and social media profile URLs displayed across the website footer and navbar.
                      </p>
                    </div>

                    {settingsSuccess && (
                      <div className="card" style={{ padding: '0.75rem 1rem', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', marginBottom: '1.25rem', fontWeight: '600', fontSize: '0.85rem' }}>
                        {settingsSuccess}
                      </div>
                    )}

                    <form onSubmit={handleSaveSettings} className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                        🏢 Company Profile & Contact Info
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Brand / Company Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settings.companyName}
                            onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Primary Email</label>
                          <input
                            type="email"
                            className="form-input"
                            value={settings.email}
                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Support Phone</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settings.phone}
                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">WhatsApp Helpline Number (Without +)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 917218661327"
                            value={settings.whatsappNumber}
                            onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Office Address</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settings.address}
                          onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        />
                      </div>

                      <h4 style={{ margin: '1.5rem 0 1rem 0', fontSize: '1rem', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                        🌐 Official Social Media Profiles
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">📸 Instagram URL</label>
                          <input
                            type="url"
                            className="form-input"
                            placeholder="https://instagram.com/yourhandle"
                            value={settings.instagramUrl}
                            onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">👍 Facebook URL</label>
                          <input
                            type="url"
                            className="form-input"
                            placeholder="https://facebook.com/yourpage"
                            value={settings.facebookUrl}
                            onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">💼 LinkedIn Profile / Page</label>
                          <input
                            type="url"
                            className="form-input"
                            placeholder="https://linkedin.com/company/yourhandle"
                            value={settings.linkedinUrl}
                            onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">🐦 Twitter / X Profile</label>
                          <input
                            type="url"
                            className="form-input"
                            placeholder="https://x.com/yourhandle"
                            value={settings.twitterUrl}
                            onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">📺 YouTube Channel URL</label>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://youtube.com/@yourchannel"
                          value={settings.youtubeUrl}
                          onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={settingsSaving}
                        style={{ padding: '0.7rem 1.5rem', fontWeight: '600' }}
                      >
                        {settingsSaving ? 'Saving...' : '💾 Save Settings & Update Live Site'}
                      </button>
                    </form>
                  </div>
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
                <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{selectedReceipt.receiptNumber || 'REC-' + selectedReceipt.id?.slice(-6)}</strong>
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
                <strong>{selectedReceipt.paymentMethod || 'Online / Direct'}</strong>
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

      {/* CREATE STAFF / TELECALLER MODAL */}
      {showCreateStaffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>➕ Add Staff / Telecaller Account</h3>
              <button
                type="button"
                onClick={() => setShowCreateStaffModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateStaff}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Staff Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email Address (Login ID) *</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  placeholder="e.g. rahul.staff@srrentals.com"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    required
                    placeholder="e.g. 9876543210"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">System Role *</label>
                  <select
                    className="form-input"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  >
                    <option value="telecaller">Telecaller / Calling Desk</option>
                    <option value="admin">Administrator</option>
                    <option value="owner">Landlord / Owner</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Initial Password *</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  placeholder="Minimum 6 characters"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={staffSubmitting}
                  style={{ flex: 1, padding: '0.65rem' }}
                >
                  {staffSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
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

      {/* POST PROPERTY MODAL WITH PHOTO UPLOAD & PRESETS */}
      {showCreatePropertyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', overflowY: 'auto' }}>
          <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>➕ Post New Property Listing</h3>
              <button
                type="button"
                onClick={() => setShowCreatePropertyModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProperty}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    placeholder="e.g. 24000"
                    value={propertyForm.price}
                    onChange={(e) => setPropertyForm({ ...propertyForm, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Security Deposit (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 50000"
                    value={propertyForm.deposit}
                    onChange={(e) => setPropertyForm({ ...propertyForm, deposit: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Locality / Area (Pune) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Hinjawadi Phase 1, Pune"
                    value={propertyForm.location}
                    onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Property Type</label>
                  <select
                    className="form-input"
                    value={propertyForm.type}
                    onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}
                  >
                    <option value="apartment">Apartment / Flat</option>
                    <option value="independent_house">Independent House / Villa</option>
                    <option value="co_living">Co-Living / Shared Flat</option>
                    <option value="commercial">Commercial / Office</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Bedrooms</label>
                  <input
                    type="number"
                    className="form-input"
                    value={propertyForm.bedrooms}
                    onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bathrooms</label>
                  <input
                    type="number"
                    className="form-input"
                    value={propertyForm.bathrooms}
                    onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Furnishing</label>
                  <select
                    className="form-input"
                    value={propertyForm.furnishing}
                    onChange={(e) => setPropertyForm({ ...propertyForm, furnishing: e.target.value })}
                  >
                    <option value="Fully Furnished">Fully Furnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload & Presets Section */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: '700' }}>
                  📸 Property Photos ({propertyImages.length} Selected)
                </label>

                {/* Preset quick buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', alignSelf: 'center' }}>Add Room Preset:</span>
                  {SAMPLE_ROOM_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addPresetImage(preset.url)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.725rem' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* File picker */}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="form-input"
                  style={{ padding: '0.4rem' }}
                  disabled={imageCompressionActive}
                />
                {imageCompressionActive && (
                  <span style={{ fontSize: '0.75rem', color: '#2563eb', display: 'block', marginTop: '0.25rem' }}>
                    ⚡ Optimizing and compressing uploaded images...
                  </span>
                )}

                {/* Image Previews */}
                {propertyImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    {propertyImages.map((imgUrl, i) => (
                      <div key={i} style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <img src={imgUrl} alt={`preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => removePropertyImage(i)}
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Property Description</label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="Describe amenities, connectivity, society rules..."
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={propertySubmitting || imageCompressionActive}
                  style={{ flex: 1, padding: '0.65rem' }}
                >
                  {propertySubmitting ? 'Publishing...' : 'Publish Property Listing'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePropertyModal(false)}
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

      {/* CREATE TENANCY AGREEMENT MODAL (ADMIN) */}
      {showCreateLeaseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '560px', width: '100%', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>Register Active Tenancy Agreement</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Link any platform property with a tenant and initialize tenancy ledger</span>
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
                    const selProp = properties.find((p) => (p._id || p.id) === e.target.value);
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
                  <option value="">-- Choose Platform Property --</option>
                  {properties.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.title} ({p.location || p.address}) - ₹{p.price?.toLocaleString('en-IN')}/mo [{p.owner?.name ? `Owner: ${p.owner.name}` : 'Listed'}]
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
                      {isNewTenantManual ? '🔍 Search Registered Users' : '➕ Register New / Unregistered Tenant'}
                    </button>
                  )}
                </div>

                {/* Case 1: A Tenant is Selected */}
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
                  /* Case 3: Live Search with Quick Registered User Chips */
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

                    {/* Platform Registered Tenants Quick Chips (Shown when query is empty) */}
                    {!tenantSearchQuery && users.length > 0 && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                          💡 Registered Tenants (Quick Select):
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '110px', overflowY: 'auto' }}>
                          {users
                            .filter((u: any) => !['admin', 'owner', 'telecaller'].includes(u.role))
                            .slice(0, 20)
                            .map((st: any) => (
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
                            No registered tenant matches "{tenantSearchQuery}".
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
                <button type="submit" disabled={leaseLoading} className="btn btn-primary" style={{ flex: 1, backgroundColor: '#059669' }}>
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

      {/* CUSTOMIZABLE LEASE RENEWAL MODAL */}
      {renewModal.show && renewModal.lease && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card animate-fadeIn" style={{ maxWidth: '480px', width: '100%', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>🔄 Renew Tenancy Agreement</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Custom renewal duration & monthly rent</span>
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
