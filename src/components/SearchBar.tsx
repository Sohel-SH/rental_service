'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();
  
  // Search filter states
  const [purchaseMode, setPurchaseMode] = useState('rent'); // 'rent' | 'buy'
  const [subCategory, setSubCategory] = useState('full_house'); // 'full_house' | 'flatmates' | 'coliving'
  const [city, setCity] = useState('Pune');
  const [location, setLocation] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Monument line-art SVGs for leading cities
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
          <path d="M10 48h44M16 48V32l8-8 8 8v16M32 48V34l8-6 8 6v14M24 48V38h4v10M40 48V40h4v8" />
        </svg>
      )
    },
    {
      name: 'Greater Noida',
      icon: (
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 48h44M16 48V20h8v28M28 48V12h10v36M42 48V28h6v20M20 26h2M32 18h2M32 24h2M32 30h2" />
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
          <path d="M10 48h44M18 48V14l10 6v28M34 48V22h10v26M22 22h2M22 28h2M38 28h2" />
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
          <path d="M12 48h40M20 48V24l6-6 6 6v24M38 48V32h8v16M26 30h2M42 38h2" />
        </svg>
      )
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    
    if (location) query.append('location', location);
    query.append('city', city);
    query.append('purchaseMode', purchaseMode);
    
    // Map Nestaway categories to backend Property Types
    if (subCategory === 'full_house') {
      query.append('propertyType', 'apartment'); // apartment / house
    } else if (subCategory === 'coliving') {
      query.append('propertyType', 'pg');
    } else if (subCategory === 'flatmates') {
      query.append('propertyType', 'house');
    }

    router.push(`/listings?${query.toString()}`);
  };

  return (
    <div className="nestaway-search-container-exact">
      
      {/* Top Filter Tabs Row */}
      <div className="search-top-filter-row">
        
        {/* Buy/Rent Toggle Container */}
        <div className="buy-rent-toggle-box">
          <button
            type="button"
            className={`toggle-pill ${purchaseMode === 'buy' ? 'active' : ''}`}
            onClick={() => setPurchaseMode('buy')}
          >
            Buy <span className="notification-dot"></span>
          </button>
          <button
            type="button"
            className={`toggle-pill ${purchaseMode === 'rent' ? 'active' : ''}`}
            onClick={() => setPurchaseMode('rent')}
          >
            Rent
          </button>
        </div>

        {/* Sub Categories Inline Links */}
        <div className="sub-categories-row">
          <button
            type="button"
            className={`sub-cat-link ${subCategory === 'full_house' ? 'active' : ''}`}
            onClick={() => setSubCategory('full_house')}
          >
            Full House
          </button>
          <button
            type="button"
            className={`sub-cat-link ${subCategory === 'flatmates' ? 'active' : ''}`}
            onClick={() => setSubCategory('flatmates')}
          >
            Flatmates
          </button>
          <button
            type="button"
            className={`sub-cat-link ${subCategory === 'coliving' ? 'active' : ''}`}
            onClick={() => setSubCategory('coliving')}
          >
            Co-Living/ PG
          </button>
        </div>

      </div>

      {/* Main Pill-Shaped Input Form */}
      <form onSubmit={handleSearch} className="main-search-pill-form">
        
        {/* Custom City Dropdown Selector */}
        <div className="city-selector-box-custom">
          <div className="city-trigger-area" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <span className="city-trigger-text">{city}</span>
            <span className={`dropdown-arrow-icon-custom ${isDropdownOpen ? 'open' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="chevron-svg">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>

          {isDropdownOpen && (
            <>
              {/* Click interceptor backdrop */}
              <div className="city-dropdown-backdrop" onClick={() => setIsDropdownOpen(false)} />
              
              {/* Dropdown Popup panel */}
              <div className="city-dropdown-popup">
                <div className="city-grid-layout">
                  {cities.map((item) => (
                    <div 
                      key={item.name} 
                      className={`city-grid-item ${city === item.name ? 'active' : ''}`}
                      onClick={() => {
                        setCity(item.name);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="city-monument-icon">
                        {item.icon}
                      </div>
                      <span className="city-grid-name">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="pill-vertical-divider"></div>

        {/* Locality Search Input */}
        <div className="locality-search-box">
          <input
            type="text"
            placeholder="Search Locality, Landmark or Tech Park"
            className="locality-text-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Search Magnifying Glass Icon Button */}
        <button type="submit" className="pill-search-submit-btn" aria-label="Search">
          <svg
            className="search-svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

      </form>
    </div>
  );
}
