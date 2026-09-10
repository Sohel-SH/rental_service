'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PropertyProps {
  property: {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    propertyType: string;
    bhk: number;
    images: string[];
    listingOption?: string;
    livingExperience?: string;
    lookingFor?: string;
    availableFor?: string;
    furnishingType?: string;
    carpetArea?: number;
    parking?: string;
    availability?: string;
  };
  variant?: 'vertical' | 'horizontal';
}

export default function PropertyCard({ property, variant = 'vertical' }: PropertyProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const isBuy = property.listingOption === 'buy';

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹ ${(price / 10000000).toFixed(2)} Cr`;
    }
    if (price >= 100000) {
      return `₹ ${(price / 100000).toFixed(2)} Lakh`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getFallbackImage = (type: string) => {
    switch (type) {
      case 'pg':
        return 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=60';
      case 'house':
        return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=60';
      case 'commercial':
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=60';
      default:
        return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=60';
    }
  };

  const images = property.images && property.images.length > 0 
    ? property.images 
    : [getFallbackImage(property.propertyType)];

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Badges & Labels matching reference
  const topBadgeText = property.livingExperience || (isBuy ? 'Managed by Owner' : 'Managed by Nestaway');

  const features = property.propertyType === 'pg'
    ? ['Single/Shared', 'Wi-Fi Included', 'Bachelors']
    : [`${property.bhk} BHK`, property.furnishingType || 'Semi Furnished', 'Families/Bachelors'];

  // Pricing calculations
  const primaryLabel = isBuy ? 'Price' : 'Rent /month';
  const secondaryLabel = isBuy ? 'Down Payment' : 'Security Deposit';
  const secondaryVal = isBuy ? property.price * 0.2 : property.price * 2;
  const tertiaryLabel = isBuy ? 'Reg. Fee' : 'Area';

  if (variant === 'horizontal') {
    const propertyTitleText = `${property.bhk} BHK ${property.furnishingType || 'Semi Furnished'} Flat for Rent in ${property.title.split(',')[0]}`;
    const subtitleText = `${property.title.split(',')[0]} Apartment`;

    return (
      <div className="nestaway-property-card-horizontal">
        <div className="card-image-box-horizontal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={images[currentIdx]} 
            alt={property.title} 
            className="card-main-image"
          />
          
          {/* Slider Controls if multiple images */}
          {images.length > 1 && (
            <>
              <button 
                type="button" 
                className="slider-arrow prev-arrow" 
                onClick={handlePrev}
                aria-label="Previous image"
              >
                &#8249;
              </button>
              <button 
                type="button" 
                className="slider-arrow next-arrow" 
                onClick={handleNext}
                aria-label="Next image"
              >
                &#8250;
              </button>
              
              {/* Dots Indicator */}
              <div className="slider-dots">
                {images.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`slider-dot ${idx === currentIdx ? 'active' : ''}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Top Floating Badge matching exact Nestaway mockup */}
          <span className="card-top-badge-exact">{topBadgeText}</span>
        </div>

        <div className="card-body-box-horizontal-exact">
          {/* Title Row */}
          <h4 className="card-title-text-exact" title={propertyTitleText}>
            {propertyTitleText.length > 60 ? `${propertyTitleText.slice(0, 60)}...` : propertyTitleText}
          </h4>

          {/* Subtitle with external link and Action Icons row */}
          <div className="card-subtitle-row-exact">
            <span className="card-subtitle-link-exact">
              {subtitleText} | 10 Houses &nbsp;
              <svg className="external-link-icon-exact" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </span>
            
            <div className="card-action-icons-row-exact">
              <button type="button" className="action-circle-btn-exact heart-exact" aria-label="Favorite">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <button type="button" className="action-circle-btn-exact share-exact" aria-label="Share">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8.59 13.51l6.83 3.98m-.02-10.98l-6.79 3.96M21 12a3 3 0 11-6 0 3 3 0 016 0zm-12 0a3 3 0 11-6 0 3 3 0 016 0zm12-7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Availability/Tenant Target Audience Tag */}
          <p className="card-audience-text-exact">
            For {property.availableFor || 'Boys, Girls, Family'}
          </p>

          {/* 3-Column Pricing Details Strip */}
          <div className="card-pricing-strip-exact">
            <div className="price-column-exact">
              <span className="price-val-exact">{formatPrice(property.price)}</span>
              <span className="price-lbl-exact">{primaryLabel}</span>
            </div>
            <div className="price-column-exact">
              <span className="price-val-exact">{formatPrice(secondaryVal)}</span>
              <span className="price-lbl-exact">{secondaryLabel}</span>
            </div>
            <div className="price-column-exact">
              <span className="price-val-exact">{property.carpetArea ? `${property.carpetArea.toLocaleString('en-IN')} sq.ft` : '1,200 sq.ft'}</span>
              <span className="price-lbl-exact">{tertiaryLabel}</span>
            </div>
          </div>

          {/* Full-width Action Link Button */}
          <Link href={`/properties/${property.id}`} className="card-visit-btn-exact">
            Visit For FREE
          </Link>
        </div>
      </div>
    );
  }

  // Default Vertical Card layout
  return (
    <div className="nestaway-property-card">
      <div className="card-image-box">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={images[currentIdx]} 
          alt={property.title} 
          className="card-main-image"
        />
        
        {/* Slider Controls if multiple images */}
        {images.length > 1 && (
          <>
            <button 
              type="button" 
              className="slider-arrow prev-arrow" 
              onClick={handlePrev}
              aria-label="Previous image"
            >
              &#8249;
            </button>
            <button 
              type="button" 
              className="slider-arrow next-arrow" 
              onClick={handleNext}
              aria-label="Next image"
            >
              &#8250;
            </button>
            
            {/* Dots Indicator */}
            <div className="slider-dots">
              {images.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`slider-dot ${idx === currentIdx ? 'active' : ''}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Top Floating Badge */}
        <span className="card-top-badge">{topBadgeText}</span>

        {/* Share & Heart Action Buttons */}
        <div className="card-top-actions">
          <button type="button" className="action-circle-btn" aria-label="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-svg">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </button>
          <button type="button" className="action-circle-btn" aria-label="Favorite">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-svg">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="card-body-box">
        <div className="card-main-info-group">
          <h4 className="card-title-text" title={property.title}>
            {property.title}
          </h4>
          <p className="card-location-text">📍 {property.location}</p>

          {/* Inline Grey Badge Badges */}
          <div className="card-badges-row">
            {features.map((feat, i) => (
              <span key={i} className="grey-badge-pill">{feat}</span>
            ))}
          </div>
        </div>

        <div className="card-price-action-group">
          {/* Pricing Breakdown Row */}
          <div className="card-pricing-table">
            <div className="price-col">
              <span className="price-label">{primaryLabel}</span>
              <span className="price-value font-bold">{formatPrice(property.price)}</span>
            </div>
            <div className="price-col">
              <span className="price-label">{secondaryLabel}</span>
              <span className="price-value">{formatPrice(secondaryVal)}</span>
            </div>
            <div className="price-col">
              <span className="price-label">{tertiaryLabel}</span>
              <span className="price-value text-accent font-semibold">
                {property.carpetArea ? `${property.carpetArea.toLocaleString('en-IN')} sq.ft` : '1,200 sq.ft'}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="card-footer-box">
            <Link href={`/properties/${property.id}`} className="card-details-btn">
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
