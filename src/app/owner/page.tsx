'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface PropertyItem {
  _id: string;
  title: string;
  price: number;
  location: string;
  propertyType: string;
  bhk: number;
  isAvailable: boolean;
}

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('properties');

  // Data states
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [leads, setLeads] = useState([]);
  const [documents, setDocuments] = useState([]);
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
      // 1. Fetch leads (role-aware: returns leads on this owner's properties)
      const leadsRes = await fetch('/api/leads');
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || []);
      }

      // 2. Fetch documents (returns this owner's uploads)
      const docsRes = await fetch('/api/documents');
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }

      // 3. Fetch properties (we filter local properties by fetching all and filtering, or we can fetch a customized subset. Let's filter in state by ownerId or let the backend return them. Wait, since the search API returns all, we can fetch from a custom search parameter or filter all properties by ownerId. Wait, let's fetch properties where ownerId === current owner. The search endpoint `/api/properties` returns all, but we can update it or fetch all and filter in state! Let's fetch all and filter in state for simplicity, or query the API. Wait, filtering in state is super easy! Let's filter in state since the number of properties is small, or we can fetch. Let's do it).
      const propsRes = await fetch('/api/properties');
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        const myProps = propsData.properties.filter(
          (p: any) => p.ownerId === user?.id
        );
        setProperties(myProps);
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

  // Handle Property Creation Form
  const handlePropertyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setPropertyForm({ ...propertyForm, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handlePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    // Preload image matching type for mockup preview
    let seededImg = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60';
    if (propertyForm.propertyType === 'house') {
      seededImg = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=60';
    } else if (propertyForm.propertyType === 'pg') {
      seededImg = 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=60';
    } else if (propertyForm.propertyType === 'commercial') {
      seededImg = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=60';
    }

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...propertyForm,
          images: [seededImg],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list property');

      setFormSuccess('Property listing created successfully!');
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

      // Refresh properties list
      const propsRes = await fetch('/api/properties');
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        const myProps = propsData.properties.filter(
          (p: any) => p.ownerId === user?.id
        );
        setProperties(myProps);
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Property
  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property listing?')) return;

    try {
      const res = await fetch(`/api/properties?propertyId=${propertyId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Refresh properties list
        setProperties(properties.filter((p) => p._id !== propertyId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete listing');
      }
    } catch (err) {
      console.error('Delete property error:', err);
    }
  };

  // Update Lead Status (e.g. Landlord contacts tenant or closes negotiations)
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      // Refresh leads list
      const leadsRes = await fetch('/api/leads');
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || []);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  // Document Upload Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('documentType', 'property_papers'); // Landlords upload property papers

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadSuccess('Property ownership papers uploaded successfully!');
      setUploadFile(null);

      const fileInput = document.getElementById('doc-file-owner') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reload owner documents
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

  if (authLoading || !user) {
    return <div className="dashboard-loading-screen">Verifying session...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <div className="container dashboard-container-box">
        
        {/* Welcome Block */}
        <div className="dashboard-header-block card glass">
          <div>
            <span className="user-role-tag">Landlord Portal</span>
            <h2>Welcome back, {user.name}</h2>
            <p>Manage your rental listings, track incoming enquiries, and upload proof of property ownership.</p>
          </div>
          <div className="user-meta-info">
            <p>📧 {user.email}</p>
            {user.phone && <p>📞 {user.phone}</p>}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            🏠 My Properties ({properties.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            📩 Enquiries ({leads.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            📜 Property Papers ({documents.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="dashboard-tab-content">
          {loading ? (
            <div className="tab-loading-state">Loading dashboard data...</div>
          ) : (
            <>
              {/* PROPERTIES TAB */}
              {activeTab === 'properties' && (
                <div className="tab-panel grid-2">
                  
                  {/* Create Property Form */}
                  <div className="card property-form-card">
                    <h3>List a New Property</h3>
                    <p className="form-sub-text">Fill out details to publish a rental listing in S.R Rental Services.</p>

                    {formSuccess && <div className="alert-message success-alert">{formSuccess}</div>}
                    {formError && <div className="alert-message error-alert">{formError}</div>}

                    <form onSubmit={handlePropertySubmit} className="dashboard-form">
                      <div className="form-group">
                        <label className="form-label" htmlFor="prop-title">Listing Title</label>
                        <input
                          type="text"
                          id="prop-title"
                          name="title"
                          className="form-input"
                          placeholder="e.g. Modern 2 BHK near Wipro Phase 1"
                          value={propertyForm.title}
                          onChange={handlePropertyChange}
                          required
                          disabled={formLoading}
                        />
                      </div>

                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label" htmlFor="prop-price">Monthly Rent (₹)</label>
                          <input
                            type="number"
                            id="prop-price"
                            name="price"
                            className="form-input"
                            placeholder="e.g. 20000"
                            value={propertyForm.price}
                            onChange={handlePropertyChange}
                            required
                            disabled={formLoading}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="prop-loc">Location</label>
                          <select
                            id="prop-loc"
                            name="location"
                            className="form-input"
                            value={propertyForm.location}
                            onChange={handlePropertyChange}
                          >
                            <option value="Hinjawadi Phase 1">Hinjawadi Phase 1</option>
                            <option value="Hinjawadi Phase 2">Hinjawadi Phase 2</option>
                            <option value="Hinjawadi Phase 3">Hinjawadi Phase 3</option>
                            <option value="Hinjawadi Hills">Hinjawadi Hills</option>
                            <option value="Hinjawadi Chowk">Hinjawadi Chowk</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label" htmlFor="prop-type">Property Type</label>
                          <select
                            id="prop-type"
                            name="propertyType"
                            className="form-input"
                            value={propertyForm.propertyType}
                            onChange={handlePropertyChange}
                          >
                            <option value="apartment">Apartment</option>
                            <option value="house">House / Villa</option>
                            <option value="pg">PG / Single Room</option>
                            <option value="commercial">Commercial Space</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="prop-bhk">BHK Size</label>
                          <select
                            id="prop-bhk"
                            name="bhk"
                            className="form-input"
                            value={propertyForm.bhk}
                            onChange={handlePropertyChange}
                          >
                            <option value="1">1 BHK</option>
                            <option value="2">2 BHK</option>
                            <option value="3">3 BHK</option>
                            <option value="4">4 BHK</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label" htmlFor="prop-lat">Latitude (Map pin)</label>
                          <input
                            type="text"
                            id="prop-lat"
                            name="latitude"
                            className="form-input"
                            placeholder="18.5913"
                            value={propertyForm.latitude}
                            onChange={handlePropertyChange}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="prop-long">Longitude (Map pin)</label>
                          <input
                            type="text"
                            id="prop-long"
                            name="longitude"
                            className="form-input"
                            placeholder="73.7389"
                            value={propertyForm.longitude}
                            onChange={handlePropertyChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="prop-desc">Description</label>
                        <textarea
                          id="prop-desc"
                          name="description"
                          className="form-input text-area-input"
                          rows={4}
                          placeholder="Describe amenities, furnishing state, availability, security details, policies..."
                          value={propertyForm.description}
                          onChange={handlePropertyChange}
                          required
                          disabled={formLoading}
                        />
                      </div>

                      <button 
                        type="submit" 
                        className={`btn btn-primary w-full ${formLoading ? 'btn-disabled' : ''}`}
                        disabled={formLoading}
                      >
                        {formLoading ? 'Listing Property...' : 'Publish Listing'}
                      </button>
                    </form>
                  </div>

                  {/* Listings List */}
                  <div className="listings-list-side-owner">
                    <h3 className="panel-title">Active Listings</h3>

                    {properties.length > 0 ? (
                      <div className="owner-props-grid">
                        {properties.map((prop) => (
                          <div key={prop._id} className="card owner-prop-card flex-between">
                            <div>
                              <span className="owner-prop-type">{prop.propertyType} &bull; {prop.bhk} BHK</span>
                              <h4 className="owner-prop-title">{prop.title}</h4>
                              <p className="owner-prop-details">📍 {prop.location} &bull; <strong>₹{prop.price.toLocaleString('en-IN')}/mo</strong></p>
                            </div>
                            <div className="owner-prop-actions">
                              <span className={`badge badge-${prop.isAvailable ? 'verified' : 'rejected'}`}>
                                {prop.isAvailable ? 'Active' : 'Unavail'}
                              </span>
                              <div className="actions-buttons-row">
                                <a href={`/properties/${prop._id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}>
                                  View
                                </a>
                                <button 
                                  onClick={() => handleDeleteProperty(prop._id)}
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-tab-state">
                        <p>You haven't listed any properties yet.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* LEADS TAB */}
              {activeTab === 'leads' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Received Enquiries</h3>

                  {leads.length > 0 ? (
                    <div className="dashboard-table-wrapper">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Property Name</th>
                            <th>Tenant Name</th>
                            <th>Contact Info</th>
                            <th>Message</th>
                            <th>Lead Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map((lead: any) => (
                            <tr key={lead._id}>
                              <td>
                                <strong>{lead.propertyId?.title || 'Deleted Property'}</strong>
                                <span className="table-sub-detail">Rent: ₹{(lead.propertyId?.price || 0).toLocaleString('en-IN')}/mo</span>
                              </td>
                              <td>{lead.name}</td>
                              <td>
                                <span style={{ display: 'block' }}>✉️ {lead.email}</span>
                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📞 {lead.phone}</span>
                              </td>
                              <td style={{ maxWidth: '300px', fontSize: '0.8rem' }}>"{lead.message}"</td>
                              <td>
                                <select
                                  className="form-input"
                                  style={{ padding: '0.4rem', fontSize: '0.8rem', width: '130px' }}
                                  value={lead.status}
                                  onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                                >
                                  <option value="new">Submitted</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="negotiating">Negotiating</option>
                                  <option value="closed">Closed / Rented</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-tab-state">
                      <p>No enquiries received for your listings yet. Try optimizing your listing details.</p>
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <div className="tab-panel grid-2">
                  
                  {/* Upload Form */}
                  <div className="card upload-doc-form-card">
                    <h3>Upload Property Ownership Papers</h3>
                    <p className="form-sub-text">Please upload property ownership proof (Index 2, taxes) for admin verification.</p>

                    {uploadSuccess && <div className="alert-message success-alert">{uploadSuccess}</div>}
                    {uploadError && <div className="alert-message error-alert">{uploadError}</div>}

                    <form onSubmit={handleUploadSubmit} className="dashboard-form">
                      <div className="form-group">
                        <label className="form-label" htmlFor="doc-file-owner">Select Ownership PDF</label>
                        <input
                          type="file"
                          id="doc-file-owner"
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
                        {uploading ? 'Uploading...' : 'Upload Papers'}
                      </button>
                    </form>
                  </div>

                  {/* List of uploaded documents */}
                  <div className="doc-list-side">
                    <h3 className="panel-title">Uploaded Verification Papers</h3>

                    {documents.length > 0 ? (
                      <div className="doc-grid-list">
                        {documents.map((doc: any) => (
                          <div key={doc._id} className="card doc-item-card flex-between">
                            <div>
                              <span className="doc-type-tag">Property Papers</span>
                              <h4 className="doc-name">{doc.fileName}</h4>
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
                        <p>No property papers uploaded yet. Upload ownership proofs to get verified status badge on listings.</p>
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
