import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import EnquiryForm from '@/components/EnquiryForm';
import PropertyGallery from '@/components/PropertyGallery';
import PropertyMapWrapper from '@/components/PropertyMapWrapper';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;

  let property = null;
  let dbError = false;

  try {
    const rawProperty = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: { name: true, email: true, phone: true },
        },
      },
    });
    
    if (rawProperty) {
      property = {
        ...rawProperty,
        id: rawProperty.id,
        ownerId: rawProperty.owner ? {
          ...rawProperty.owner,
          id: rawProperty.ownerId,
        } : null,
        images: rawProperty.images ? rawProperty.images.split(',') : [],
      };
    }
  } catch (error) {
    console.error('Failed to load property details:', error);
    dbError = true;
  }

  if (dbError) {
    return (
      <div className="container" style={{ marginTop: '4rem', marginBottom: '6rem' }}>
        <div className="card" style={{ borderColor: 'var(--danger)', padding: '2.5rem', backgroundColor: '#fef2f2' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Database Connection Offline
          </h2>
          <p style={{ color: '#7f1d1d', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            S.R Rental Services is unable to connect to the database to retrieve this property's details.
          </p>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #fee2e2', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem', color: '#991b1b' }}>How to resolve this:</h4>
            <ol style={{ fontSize: '0.85rem', paddingLeft: '1.25rem', color: '#571c1c', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>
                <strong>Option A: Start MySQL locally:</strong> If you are using XAMPP or WampServer, start the MySQL module. If MySQL is installed locally as a standalone service, make sure the service daemon is active.
              </li>
              <li>
                <strong>Option B: Configure database connection:</strong> Open your <a href="file:///c:/Users/sheik/Freelancing%20Project/Atj_Projects/.env.local">.env.local</a> file and verify that the <code>DATABASE_URL</code> connection string matches your MySQL server login credentials.
              </li>
            </ol>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
            <em>Note: Once active, refresh this page to view details.</em>
          </p>
        </div>
      </div>
    );
  }

  if (!property) {
    notFound();
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Default images fallback
  const getFallbackImage = (type: string) => {
    switch (type) {
      case 'pg':
        return 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&auto=format&fit=crop&q=80';
      case 'house':
        return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80';
      case 'commercial':
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80';
      default:
        return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&auto=format&fit=crop&q=80';
    }
  };

  const images = property.images && property.images.length > 0
    ? property.images
    : [getFallbackImage(property.propertyType)];

  // Single property item array for the Leaflet Map
  const mapProperties = [
    {
      id: property.id.toString(),
      title: property.title,
      price: property.price,
      location: property.location,
      latitude: property.latitude,
      longitude: property.longitude,
    }
  ];

  return (
    <div className="property-detail-page">
      <div className="container detail-container">
        
        {/* Back Link */}
        <div className="back-link-wrapper">
          <Link href="/listings" className="back-link">&larr; Back to Listings</Link>
        </div>

        {/* Title Block */}
        <div className="detail-header-block flex-between">
          <div className="title-area">
            <div className="badges-row">
              <span className={`property-badge type-badge ${property.propertyType}`}>{property.propertyType}</span>
              <span className="property-badge bhk-badge">{property.bhk} BHK</span>
              {property.occupancyStatus === 'vacating_soon' ? (
                <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontWeight: '700', padding: '0.25rem 0.65rem' }}>
                  ⏳ Available {property.vacantFromDate ? `from ${new Date(property.vacantFromDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Soon'} (Vacating Soon - Pre-Book Now!)
                </span>
              ) : property.occupancyStatus === 'sold' ? (
                <span className="badge badge-rejected" style={{ fontWeight: '700' }}>🔒 Sold Out</span>
              ) : property.isAvailable ? (
                <span className="badge badge-verified">Available Now</span>
              ) : (
                <span className="badge badge-rejected">Currently Occupied</span>
              )}
            </div>
            <h1 className="detail-title">{property.title}</h1>
            <p className="detail-location">📍 {property.location}</p>
          </div>
          
          <div className="price-area">
            <span className="price-label">Monthly Rent</span>
            <h2 className="detail-price">{formatPrice(property.price)}<span>/month</span></h2>
          </div>
        </div>

        {/* Main Content Split: Left (Gallery + Specs + Map) & Right Sticky Sidebar (Assisted Viewing + Enquiry Form) */}
        <div className="detail-content-split">
          
          {/* LEFT CONTENT COLUMN */}
          <div className="detail-info-side">
            
            {/* 1. Property Photo Gallery without blank spaces */}
            <PropertyGallery images={images} title={property.title} />

            {/* 2. Description */}
            <div className="info-section">
              <h3>Description</h3>
              <p className="detail-description">{property.description}</p>
            </div>

            {/* 3. Key Details Specs */}
            <div className="info-section">
              <h3>Key Details</h3>
              <div className="details-grid-specs">
                <div className="spec-card">
                  <span className="spec-icon">🏠</span>
                  <div>
                    <span className="spec-title">Property Type</span>
                    <span className="spec-val">{property.propertyType}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🛏️</span>
                  <div>
                    <span className="spec-title">Size</span>
                    <span className="spec-val">{property.bhk} BHK</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">📍</span>
                  <div>
                    <span className="spec-title">Location</span>
                    <span className="spec-val">{property.location}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🛡️</span>
                  <div>
                    <span className="spec-title">Verification</span>
                    <span className="spec-val">S.R Verified Listing</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">🛋️</span>
                  <div>
                    <span className="spec-title">Furnishing</span>
                    <span className="spec-val">{property.furnishingType || 'Semi Furnished'}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">📐</span>
                  <div>
                    <span className="spec-title">Carpet Area</span>
                    <span className="spec-val">{property.carpetArea ? `${property.carpetArea} sq.ft` : '1,200 sq.ft'}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">👥</span>
                  <div>
                    <span className="spec-title">Available For</span>
                    <span className="spec-val">{property.availableFor || 'Family / Bachelors'}</span>
                  </div>
                </div>
                <div className="spec-card">
                  <span className="spec-icon">⚡</span>
                  <div>
                    <span className="spec-title">Move-in</span>
                    <span className="spec-val">{property.availability || 'Immediate'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Location Map */}
            <div className="info-section">
              <h3>Location Map</h3>
              <div className="detail-map-box">
                <PropertyMapWrapper properties={mapProperties} />
              </div>
            </div>
          </div>

          {/* RIGHT STICKY SIDEBAR */}
          <div className="detail-actions-side">
            <div className="sticky-action-cards">
              
              {/* S.R Assisted Viewing Trust Card */}
              <div className="card trust-guarantee-card" style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.75rem' }}>🤝</span>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#166534', margin: 0 }}>S.R Assisted Viewing</h4>
                    <p style={{ fontSize: '0.8rem', color: '#15803d', margin: '0.2rem 0 0 0' }}>Our dedicated property manager will coordinate with the owner and assist your free property visit.</p>
                  </div>
                </div>
              </div>

              {/* Lead Capture & Tour Booking Form */}
              <EnquiryForm 
                propertyId={property.id.toString()}
                propertyTitle={property.title}
                propertyPrice={property.price}
                propertyLocation={property.location}
              />

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
