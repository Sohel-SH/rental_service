'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import PropertyCard from '@/components/PropertyCard';

// Dynamically import the map view with SSR disabled since Leaflet requires window
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="map-loading">Loading Map View...</div>
});

interface PropertyItem {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  propertyType: string;
  bhk: number;
  images: string[];
  latitude: number;
  longitude: number;
  listingOption?: string;
  livingExperience?: string;
  lookingFor?: string;
  availableFor?: string;
  furnishingType?: string;
  carpetArea?: number;
  parking?: string;
  availability?: string;
}

function ListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load initial filters from URL query parameters
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    city: searchParams.get('city') || 'Hyderabad',
    propertyType: searchParams.get('propertyType') || 'all',
    bhk: searchParams.get('bhk') || 'all',
    maxPrice: searchParams.get('maxPrice') || 'all',
    purchaseMode: searchParams.get('purchaseMode') || 'rent',
    sortBy: searchParams.get('sortBy') || 'newest',
    tenantType: searchParams.get('tenantType') || 'all',
    
    // Modal Custom filters
    livingExperience: searchParams.get('livingExperience') || 'all',
    lookingFor: searchParams.get('lookingFor') || 'all',
    availableFor: searchParams.get('availableFor') || 'all',
    budgetRange: searchParams.get('budgetRange') || 'all',
    furnishingType: searchParams.get('furnishingType') || 'all',
    carpetArea: searchParams.get('carpetArea') || 'all',
    parking: searchParams.get('parking') || 'all',
    availability: searchParams.get('availability') || 'all',
  });

  // Toggling list vs split map view mode
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

  // Temp state for modal configuration
  const [tempFilters, setTempFilters] = useState({ ...filters });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Filter dropdown state switches
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isPropOpen, setIsPropOpen] = useState(false);
  const [isBhkOpen, setIsBhkOpen] = useState(false);
  const [isTenantOpen, setIsTenantOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Sync tempFilters when filters change or when modal is opened
  useEffect(() => {
    setTempFilters({ ...filters });
  }, [filters, isModalOpen]);

  // Monument line-art SVGs for the city grid selector
  const cities = [
    {
      name: 'Bangalore',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 48h40M18 48V32h28v16M24 32v-8h16v8M32 24v-6M28 18c0-3 8-3 8 0M12 48l6-6M52 48l-6-6" />
          <circle cx="32" cy="14" r="2" />
        </svg>
      )
    },
    {
      name: 'Delhi',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16 48h32M20 48V20h24v28M26 48V36c0-3 6-3 6 0v12M20 28h24M20 24h24M24 20v-4h16v4" />
        </svg>
      )
    },
    {
      name: 'Faridabad',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 48h36M18 48V30h28v18M32 30c0-6 0-6 4-10h-8c4 4 4 4 4 10" />
          <circle cx="32" cy="16" r="2" />
        </svg>
      )
    },
    {
      name: 'Ghaziabad',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 48h44M16 48V32l8-8 8 8v16M32 48V34l8-6 8 6v14M24 48V38h4v10M40 40h4v8" />
        </svg>
      )
    },
    {
      name: 'Greater Noida',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 48h44M16 48V20h8v28M28 48V12h10v36M42 48V28h6v20" />
        </svg>
      )
    },
    {
      name: 'Gurgaon',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 48h40M22 48V16l12 16h8v16M22 24h4M22 30h4M38 36h2M38 42h2" />
        </svg>
      )
    },
    {
      name: 'Hyderabad',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 48h36M18 48V16h4v32M42 48V16h4v32M22 32h20M22 44h20M28 44V38c0-3 8-3 8 0v6" />
          <path d="M16 16c0-2 8-2 8 0M40 16c0-2 8-2 8 0" />
        </svg>
      )
    },
    {
      name: 'Indore',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 48h40M16 48V22h32v26M16 40h32M16 32h32M26 48V42c0-2 6-2 6 0v6" />
        </svg>
      )
    },
    {
      name: 'Mumbai',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 48h44M16 48V24h32v28M26 48V34c0-4 12-4 12 0v14M22 24c0-5 6-5 6 0M36 24c0-5 6-5 6 0" />
        </svg>
      )
    },
    {
      name: 'Navi Mumbai',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 48h40M18 48C18 30 46 30 46 48" />
          <circle cx="32" cy="24" r="4" />
        </svg>
      )
    },
    {
      name: 'Noida',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 48h44M18 48V14l10 6v28M34 48V22h10v26" />
        </svg>
      )
    },
    {
      name: 'Pune',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 48h44M16 48V26h12v6h8v-6h12v26M24 48V36c0-3 6-3 6 0v12M38 48V42h4v6" />
          <path d="M14 26h36M24 20h16M32 20v-6" />
        </svg>
      )
    },
    {
      name: 'Thane',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 48h40M20 48V24l6-6 6 6v24M38 48V32h8v16" />
        </svg>
      )
    }
  ];

  // Fetch properties matching filters
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.location) query.append('location', filters.location);
      if (filters.city) query.append('city', filters.city);
      if (filters.propertyType && filters.propertyType !== 'all') query.append('propertyType', filters.propertyType);
      if (filters.bhk && filters.bhk !== 'all') query.append('bhk', filters.bhk);
      if (filters.maxPrice && filters.maxPrice !== 'all') query.append('maxPrice', filters.maxPrice);
      if (filters.purchaseMode) query.append('purchaseMode', filters.purchaseMode);
      if (filters.sortBy) query.append('sortBy', filters.sortBy);
      if (filters.tenantType && filters.tenantType !== 'all') query.append('tenantType', filters.tenantType);

      // Custom pop-up filters
      if (filters.livingExperience && filters.livingExperience !== 'all') query.append('livingExperience', filters.livingExperience);
      if (filters.lookingFor && filters.lookingFor !== 'all') query.append('lookingFor', filters.lookingFor);
      if (filters.availableFor && filters.availableFor !== 'all') query.append('availableFor', filters.availableFor);
      if (filters.budgetRange && filters.budgetRange !== 'all') query.append('budgetRange', filters.budgetRange);
      if (filters.furnishingType && filters.furnishingType !== 'all') query.append('furnishingType', filters.furnishingType);
      if (filters.carpetArea && filters.carpetArea !== 'all') query.append('carpetArea', filters.carpetArea);
      if (filters.parking && filters.parking !== 'all') query.append('parking', filters.parking);
      if (filters.availability && filters.availability !== 'all') query.append('availability', filters.availability);

      const res = await fetch(`/api/properties?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search when filters state changes
  useEffect(() => {
    fetchProperties();
  }, [filters]);

  // Sync URL changes back to filter states dynamically
  useEffect(() => {
    setFilters({
      location: searchParams.get('location') || '',
      city: searchParams.get('city') || 'Hyderabad',
      propertyType: searchParams.get('propertyType') || 'all',
      bhk: searchParams.get('bhk') || 'all',
      maxPrice: searchParams.get('maxPrice') || 'all',
      purchaseMode: searchParams.get('purchaseMode') || 'rent',
      sortBy: searchParams.get('sortBy') || 'newest',
      tenantType: searchParams.get('tenantType') || 'all',
      
      livingExperience: searchParams.get('livingExperience') || 'all',
      lookingFor: searchParams.get('lookingFor') || 'all',
      availableFor: searchParams.get('availableFor') || 'all',
      budgetRange: searchParams.get('budgetRange') || 'all',
      furnishingType: searchParams.get('furnishingType') || 'all',
      carpetArea: searchParams.get('carpetArea') || 'all',
      parking: searchParams.get('parking') || 'all',
      availability: searchParams.get('availability') || 'all',
    });
  }, [searchParams]);

  // Unified helper to apply a filter state change and update the URL params
  const updateFilter = (key: string, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);

    const query = new URLSearchParams();
    if (updated.location) query.append('location', updated.location);
    if (updated.city) query.append('city', updated.city);
    if (updated.propertyType && updated.propertyType !== 'all') query.append('propertyType', updated.propertyType);
    if (updated.bhk && updated.bhk !== 'all') query.append('bhk', updated.bhk);
    if (updated.maxPrice && updated.maxPrice !== 'all') query.append('maxPrice', updated.maxPrice);
    if (updated.purchaseMode) query.append('purchaseMode', updated.purchaseMode);
    if (updated.sortBy) query.append('sortBy', updated.sortBy);
    if (updated.tenantType && updated.tenantType !== 'all') query.append('tenantType', updated.tenantType);

    // Modal parameters
    if (updated.livingExperience && updated.livingExperience !== 'all') query.append('livingExperience', updated.livingExperience);
    if (updated.lookingFor && updated.lookingFor !== 'all') query.append('lookingFor', updated.lookingFor);
    if (updated.availableFor && updated.availableFor !== 'all') query.append('availableFor', updated.availableFor);
    if (updated.budgetRange && updated.budgetRange !== 'all') query.append('budgetRange', updated.budgetRange);
    if (updated.furnishingType && updated.furnishingType !== 'all') query.append('furnishingType', updated.furnishingType);
    if (updated.carpetArea && updated.carpetArea !== 'all') query.append('carpetArea', updated.carpetArea);
    if (updated.parking && updated.parking !== 'all') query.append('parking', updated.parking);
    if (updated.availability && updated.availability !== 'all') query.append('availability', updated.availability);

    router.push(`/listings?${query.toString()}`);
  };

  // Temp changes handler for modal selections
  const handleTempFilterChange = (key: string, value: string) => {
    setTempFilters((prev) => ({
      ...prev,
      [key]: prev[key as keyof typeof prev] === value ? 'all' : value // toggle off if clicked twice
    }));
  };

  const handleApplyTempFilters = () => {
    setFilters(tempFilters);
    setIsModalOpen(false);

    const query = new URLSearchParams();
    if (tempFilters.location) query.append('location', tempFilters.location);
    if (tempFilters.city) query.append('city', tempFilters.city);
    if (tempFilters.propertyType && tempFilters.propertyType !== 'all') query.append('propertyType', tempFilters.propertyType);
    if (tempFilters.bhk && tempFilters.bhk !== 'all') query.append('bhk', tempFilters.bhk);
    if (tempFilters.maxPrice && tempFilters.maxPrice !== 'all') query.append('maxPrice', tempFilters.maxPrice);
    if (tempFilters.purchaseMode) query.append('purchaseMode', tempFilters.purchaseMode);
    if (tempFilters.sortBy) query.append('sortBy', tempFilters.sortBy);
    if (tempFilters.tenantType && tempFilters.tenantType !== 'all') query.append('tenantType', tempFilters.tenantType);

    // Modal filters
    if (tempFilters.livingExperience && tempFilters.livingExperience !== 'all') query.append('livingExperience', tempFilters.livingExperience);
    if (tempFilters.lookingFor && tempFilters.lookingFor !== 'all') query.append('lookingFor', tempFilters.lookingFor);
    if (tempFilters.availableFor && tempFilters.availableFor !== 'all') query.append('availableFor', tempFilters.availableFor);
    if (tempFilters.budgetRange && tempFilters.budgetRange !== 'all') query.append('budgetRange', tempFilters.budgetRange);
    if (tempFilters.furnishingType && tempFilters.furnishingType !== 'all') query.append('furnishingType', tempFilters.furnishingType);
    if (tempFilters.carpetArea && tempFilters.carpetArea !== 'all') query.append('carpetArea', tempFilters.carpetArea);
    if (tempFilters.parking && tempFilters.parking !== 'all') query.append('parking', tempFilters.parking);
    if (tempFilters.availability && tempFilters.availability !== 'all') query.append('availability', tempFilters.availability);

    router.push(`/listings?${query.toString()}`);
  };

  const handleClearTempFilters = () => {
    setTempFilters({
      location: '',
      city: 'Hyderabad',
      propertyType: 'all',
      bhk: 'all',
      maxPrice: 'all',
      purchaseMode: 'rent',
      sortBy: 'newest',
      tenantType: 'all',
      livingExperience: 'all',
      lookingFor: 'all',
      availableFor: 'all',
      budgetRange: 'all',
      furnishingType: 'all',
      carpetArea: 'all',
      parking: 'all',
      availability: 'all',
    });
  };

  return (
    <div className="listings-page-container">
      
      {/* 1. White Filter Header Strip - Exact replica of the reference image */}
      <section className="listings-filter-header-strip-exact">
        
        {/* Breadcrumbs Row */}
        <div className="listings-breadcrumbs container">
          <span>Home</span>
          <span className="bc-separator">/</span>
          <span>{filters.city}</span>
          <span className="bc-separator">/</span>
          <span className="bc-active">Properties for Rent in {filters.city}</span>
        </div>

        <div className="filter-strip-inner container">
          
          {/* Custom Search Box Pill (City + Locality Search combined) */}
          <div className="search-bar-inline-exact">
            
            {/* Inline City Selector */}
            <div className="city-inline-selector">
              <div className="city-inline-trigger" onClick={() => setIsCityOpen(!isCityOpen)}>
                <span className="trigger-text">{filters.city}</span>
                <span className="arrow-down-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="chevron-svg-inline">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </div>
              
              {isCityOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setIsCityOpen(false)} />
                  <div className="city-popup-panel">
                    <div className="city-grid-inline">
                      {cities.map((c) => (
                        <div 
                          key={c.name} 
                          className={`city-grid-cell ${filters.city === c.name ? 'active' : ''}`}
                          onClick={() => {
                            updateFilter('city', c.name);
                            setIsCityOpen(false);
                          }}
                        >
                          <div className="monument-icon-sm">{c.icon}</div>
                          <span>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="inline-divider"></div>

            {/* Locality Search Field */}
            <div className="locality-inline-search">
              <input 
                type="text" 
                placeholder="Search Locality, Landmark or Tech Park"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                className="locality-input-field"
              />
            </div>
            
            <button type="button" className="inline-search-btn-exact" aria-label="Submit Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="search-svg-icon-sm">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>

          {/* Selector pills row */}
          <div className="filter-dropdown-pills-exact">
            
            {/* Property Type Dropdown */}
            <div className="filter-pill-wrapper">
              <button 
                type="button" 
                className={`filter-pill-btn-exact ${filters.propertyType !== 'all' ? 'active' : ''}`}
                onClick={() => setIsPropOpen(!isPropOpen)}
              >
                Property Type
                <span className="chevron-icon">&#9662;</span>
              </button>
              {isPropOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setIsPropOpen(false)} />
                  <div className="pill-dropdown-menu">
                    <div className="menu-item" onClick={() => { updateFilter('propertyType', 'all'); setIsPropOpen(false); }}>All Types</div>
                    <div className="menu-item" onClick={() => { updateFilter('propertyType', 'apartment'); setIsPropOpen(false); }}>Apartment</div>
                    <div className="menu-item" onClick={() => { updateFilter('propertyType', 'house'); setIsPropOpen(false); }}>House</div>
                    <div className="menu-item" onClick={() => { updateFilter('propertyType', 'pg'); setIsPropOpen(false); }}>PG / Co-living</div>
                  </div>
                </>
              )}
            </div>

            {/* Looking For Dropdown (BHK) */}
            <div className="filter-pill-wrapper">
              <button 
                type="button" 
                className={`filter-pill-btn-exact ${filters.bhk !== 'all' ? 'active' : ''}`}
                onClick={() => setIsBhkOpen(!isBhkOpen)}
              >
                Looking For
                <span className="chevron-icon">&#9662;</span>
              </button>
              {isBhkOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setIsBhkOpen(false)} />
                  <div className="pill-dropdown-menu">
                    <div className="menu-item" onClick={() => { updateFilter('bhk', 'all'); setIsBhkOpen(false); }}>All Options</div>
                    <div className="menu-item" onClick={() => { updateFilter('bhk', '1'); setIsBhkOpen(false); }}>1 BHK / Bed</div>
                    <div className="menu-item" onClick={() => { updateFilter('bhk', '2'); setIsBhkOpen(false); }}>2 BHK / Bed</div>
                    <div className="menu-item" onClick={() => { updateFilter('bhk', '3'); setIsBhkOpen(false); }}>3 BHK / Bed</div>
                  </div>
                </>
              )}
            </div>

            {/* Tenant Type Dropdown */}
            <div className="filter-pill-wrapper">
              <button 
                type="button" 
                className={`filter-pill-btn-exact ${filters.tenantType !== 'all' ? 'active' : ''}`}
                onClick={() => setIsTenantOpen(!isTenantOpen)}
              >
                Tenant Type
                <span className="chevron-icon">&#9662;</span>
              </button>
              {isTenantOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setIsTenantOpen(false)} />
                  <div className="pill-dropdown-menu">
                    <div className="menu-item" onClick={() => { updateFilter('tenantType', 'all'); setIsTenantOpen(false); }}>All Tenants</div>
                    <div className="menu-item" onClick={() => { updateFilter('tenantType', 'Bachelors'); setIsTenantOpen(false); }}>Bachelors</div>
                    <div className="menu-item" onClick={() => { updateFilter('tenantType', 'Families'); setIsTenantOpen(false); }}>Families</div>
                    <div className="menu-item" onClick={() => { updateFilter('tenantType', 'Boys'); setIsTenantOpen(false); }}>Boys</div>
                    <div className="menu-item" onClick={() => { updateFilter('tenantType', 'Girls'); setIsTenantOpen(false); }}>Girls</div>
                  </div>
                </>
              )}
            </div>

            <div className="inline-vertical-bar"></div>

            {/* Sort Button */}
            <div className="filter-pill-wrapper">
              <button 
                type="button" 
                className="filter-pill-btn-exact btn-sort"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                Sort &nbsp;
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sort-icon-svg">
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </button>
              {isSortOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setIsSortOpen(false)} />
                  <div className="pill-dropdown-menu dropdown-right">
                    <div className="menu-item" onClick={() => { updateFilter('sortBy', 'newest'); setIsSortOpen(false); }}>Newest</div>
                    <div className="menu-item" onClick={() => { updateFilter('sortBy', 'price_asc'); setIsSortOpen(false); }}>Price: Low to High</div>
                    <div className="menu-item" onClick={() => { updateFilter('sortBy', 'price_desc'); setIsSortOpen(false); }}>Price: High to Low</div>
                  </div>
                </>
              )}
            </div>

            {/* Filters Button (Clicking this opens the custom popup modal) */}
            <button 
              type="button" 
              className="filter-pill-btn-exact btn-filters"
              onClick={() => setIsModalOpen(true)}
            >
              Filters &nbsp;
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="filters-icon-svg">
                <path d="M4 6h16M4 12h10M4 18h7" />
              </svg>
            </button>

          </div>

        </div>

        {/* 2. Active filter tags strip (Renders below search filters bar, color-coded as shown in reference) */}
        <div className="active-tags-strip-exact container">
          {filters.propertyType !== 'all' && (
            <span className="active-tag-pill tag-blue">
              {filters.propertyType === 'apartment' ? 'Apartment' : filters.propertyType === 'pg' ? 'PG/Co-living' : 'House'}
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('propertyType', 'all')}>&times;</button>
            </span>
          )}
          {filters.bhk !== 'all' && (
            <span className="active-tag-pill tag-purple">
              {filters.bhk} BHK
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('bhk', 'all')}>&times;</button>
            </span>
          )}
          {filters.tenantType !== 'all' && (
            <span className="active-tag-pill tag-orange">
              {filters.tenantType}
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('tenantType', 'all')}>&times;</button>
            </span>
          )}
          {filters.livingExperience !== 'all' && (
            <span className="active-tag-pill tag-blue">
              {filters.livingExperience}
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('livingExperience', 'all')}>&times;</button>
            </span>
          )}
          {filters.lookingFor !== 'all' && (
            <span className="active-tag-pill tag-purple">
              {filters.lookingFor}
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('lookingFor', 'all')}>&times;</button>
            </span>
          )}
          {filters.availableFor !== 'all' && (
            <span className="active-tag-pill tag-orange">
              {filters.availableFor}
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('availableFor', 'all')}>&times;</button>
            </span>
          )}
          {filters.budgetRange !== 'all' && (
            <span className="active-tag-pill tag-grey">
              {filters.budgetRange}
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('budgetRange', 'all')}>&times;</button>
            </span>
          )}
          {filters.furnishingType !== 'all' && (
            <span className="active-tag-pill tag-grey">
              {filters.furnishingType}
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('furnishingType', 'all')}>&times;</button>
            </span>
          )}
          {filters.carpetArea !== 'all' && (
            <span className="active-tag-pill tag-grey">
              {filters.carpetArea} sqft
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('carpetArea', 'all')}>&times;</button>
            </span>
          )}
          {filters.parking !== 'all' && (
            <span className="active-tag-pill tag-grey">
              Parking: {filters.parking}
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('parking', 'all')}>&times;</button>
            </span>
          )}
          {filters.availability !== 'all' && (
            <span className="active-tag-pill tag-grey">
              Available: {filters.availability}
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('availability', 'all')}>&times;</button>
            </span>
          )}
          {filters.location !== '' && (
            <span className="active-tag-pill tag-grey">
              "{filters.location}"
              <button type="button" className="close-tag-btn" onClick={() => updateFilter('location', '')}>&times;</button>
            </span>
          )}
        </div>

      </section>

      {/* 3. Split listings & Map */}
      <section className={`listings-split-section ${viewMode === 'list' ? 'list-view-mode' : 'map-view-mode'}`}>
        
        {/* Left Map Side */}
        {viewMode === 'map' && (
          <div className="listings-map-side">
            <div className="listings-map-sticky">
              <MapView properties={properties} highlightedId={highlightedId} />
            </div>
          </div>
        )}

        {/* Right Listings Side */}
        <div className="listings-list-side">
          <div className="listings-count-strip">
            <h3>{loading ? 'Searching...' : `${properties.length} - Apartments and House for Rent in ${filters.city}`}</h3>
            
            <div className="count-strip-right-controls">
              {/* List / Map Toggle Buttons */}
              <div className="view-toggle-tabs">
                <button 
                  type="button" 
                  className={`view-tab-btn btn-list-tab ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="tab-svg-icon">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  List
                </button>
                <button 
                  type="button" 
                  className={`view-tab-btn btn-map-tab ${viewMode === 'map' ? 'active' : ''}`}
                  onClick={() => setViewMode('map')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="tab-svg-icon">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Map
                </button>
              </div>

              {/* Wishlist Pill */}
              <button type="button" className="wishlist-btn-pill-exact">
                My Wishlist &nbsp;
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="heart-svg-icon">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="listings-skeleton-grid">
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
            </div>
          ) : properties.length > 0 ? (
            <div className={viewMode === 'list' ? 'listings-grid-list-view' : 'listings-grid-vertical'}>
              {properties.map((prop) => (
                <div 
                  key={prop.id} 
                  onMouseEnter={() => setHighlightedId(prop.id)}
                  onMouseLeave={() => setHighlightedId(null)}
                  className="listing-card-hover-wrapper"
                >
                  <PropertyCard property={prop} variant="horizontal" />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-listings-box">
              <div className="no-listings-icon">🏠</div>
              <h4>No Properties Match Your Search</h4>
              <p>Try expanding your search criteria or resetting filters to see available homes in {filters.city}.</p>
              <button 
                onClick={() => setFilters({ location: '', city: filters.city, propertyType: 'all', bhk: 'all', maxPrice: 'all', purchaseMode: 'rent', sortBy: 'newest', tenantType: 'all', livingExperience: 'all', lookingFor: 'all', availableFor: 'all', budgetRange: 'all', furnishingType: 'all', carpetArea: 'all', parking: 'all', availability: 'all' })} 
                className="btn btn-primary"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Full Filter Options Customization Modal Pop-up */}
      {isModalOpen && (
        <div className="filter-modal-overlay">
          <div className="filter-modal-container">
            
            {/* Modal Header */}
            <div className="filter-modal-header">
              <h3>Explore different home vibes with our customization options.</h3>
              <button 
                type="button" 
                className="close-modal-btn" 
                onClick={() => setIsModalOpen(false)}
                aria-label="Close filters modal"
              >
                &times;
              </button>
            </div>
            
            {/* Modal Body (Scrollable filter lists) */}
            <div className="filter-modal-body">
              
              {/* Living Experience */}
              <div className="modal-filter-section">
                <h4>Living Experience</h4>
                <div className="modal-pills-row">
                  {['Select (Premium Furnished)', 'Managed by S.R Rentals', 'Managed by Owner'].map((opt) => (
                    <button 
                      key={opt}
                      type="button" 
                      className={`modal-pill-btn ${tempFilters.livingExperience === opt ? 'active' : ''}`}
                      onClick={() => handleTempFilterChange('livingExperience', opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Type */}
              <div className="modal-filter-section">
                <h4>Property Type</h4>
                <div className="modal-pills-row">
                  {[
                    { label: 'Apartment', value: 'apartment' },
                    { label: 'Independent House', value: 'house' },
                    { label: 'Co-Living', value: 'pg' }
                  ].map((opt) => (
                    <button 
                      key={opt.value}
                      type="button" 
                      className={`modal-pill-btn ${tempFilters.propertyType === opt.value ? 'active' : ''}`}
                      onClick={() => handleTempFilterChange('propertyType', opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Looking For */}
              <div className="modal-filter-section">
                <h4>Looking For</h4>
                <div className="modal-pills-row">
                  {['House', 'Bed', 'Room'].map((opt) => (
                    <button 
                      key={opt}
                      type="button" 
                      className={`modal-pill-btn ${tempFilters.lookingFor === opt ? 'active' : ''}`}
                      onClick={() => handleTempFilterChange('lookingFor', opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available For */}
              <div className="modal-filter-section">
                <h4>Available For</h4>
                <div className="modal-pills-row">
                  {['Family', 'Boys', 'Girls'].map((opt) => (
                    <button 
                      key={opt}
                      type="button" 
                      className={`modal-pill-btn ${tempFilters.availableFor === opt ? 'active' : ''}`}
                      onClick={() => handleTempFilterChange('availableFor', opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* BHK Type */}
              <div className="modal-filter-section">
                <h4>BHK Type</h4>
                <div className="modal-pills-row">
                  {[
                    { label: '2 BHK', value: '2' },
                    { label: '1 RK / Studio / 1 BHK', value: '1' },
                    { label: '3 BHK', value: '3' },
                    { label: '4 BHK', value: '4' }
                  ].map((opt) => (
                    <button 
                      key={opt.value}
                      type="button" 
                      className={`modal-pill-btn ${tempFilters.bhk === opt.value ? 'active' : ''}`}
                      onClick={() => handleTempFilterChange('bhk', opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="modal-filter-section">
                <h4>Budget</h4>
                <div className="modal-pills-row">
                  {['Below 5K', '5K - 10K', '10K - 15K', '15K - 20K', '20K - 30K', '30K - 40K', '40K - 50K', 'Above 50K+'].map((opt) => (
                    <button 
                      key={opt}
                      type="button" 
                      className={`modal-pill-btn ${tempFilters.budgetRange === opt ? 'active' : ''}`}
                      onClick={() => handleTempFilterChange('budgetRange', opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Furnishing Type */}
              <div className="modal-filter-section">
                <h4>Furnishing Type</h4>
                <div className="modal-pills-row">
                  {['Semi Furnished', 'Fully Furnished', 'Unfurnished'].map((opt) => (
                    <button 
                      key={opt}
                      type="button" 
                      className={`modal-pill-btn ${tempFilters.furnishingType === opt ? 'active' : ''}`}
                      onClick={() => handleTempFilterChange('furnishingType', opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carpet Area */}
              <div className="modal-filter-section">
                <h4>Carpet Area</h4>
                <div className="modal-pills-row">
                  {['Below 500', '500 - 1000', '1000 - 1500', '1500 - 2000', '2000 - 3000', 'Above 3000+'].map((opt) => (
                    <button 
                      key={opt}
                      type="button" 
                      className={`modal-pill-btn ${tempFilters.carpetArea === opt ? 'active' : ''}`}
                      onClick={() => handleTempFilterChange('carpetArea', opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parking */}
              <div className="modal-filter-section">
                <h4>Parking</h4>
                <div className="modal-pills-row">
                  {['Four Wheeler', 'Two Wheeler'].map((opt) => (
                    <button 
                      key={opt}
                      type="button" 
                      className={`modal-pill-btn ${tempFilters.parking === opt ? 'active' : ''}`}
                      onClick={() => handleTempFilterChange('parking', opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="modal-filter-section">
                <h4>Availability</h4>
                <div className="modal-pills-row">
                  {['Immediate', 'Within 7 Days', 'Within 15 Days', 'More than 15 Days'].map((opt) => (
                    <button 
                      key={opt}
                      type="button" 
                      className={`modal-pill-btn ${tempFilters.availability === opt ? 'active' : ''}`}
                      onClick={() => handleTempFilterChange('availability', opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Sticky Footer */}
            <div className="filter-modal-footer">
              <button type="button" className="modal-clear-link-btn" onClick={handleClearTempFilters}>Clear All</button>
              <button type="button" className="modal-apply-btn-solid" onClick={handleApplyTempFilters}>Apply Filters</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="map-loading">Loading listings...</div>}>
      <ListingsContent />
    </Suspense>
  );
}
