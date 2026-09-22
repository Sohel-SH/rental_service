'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Curated high quality interior photos for instant selection
const CURATED_IMAGES = [
  {
    id: 'living1',
    label: 'Modern Living Room',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80',
    type: 'Living Room'
  },
  {
    id: 'living2',
    label: 'Luxury Hallway & Balcony',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&auto=format&fit=crop&q=80',
    type: 'Living Room'
  },
  {
    id: 'bed1',
    label: 'Master Bedroom Suite',
    url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&auto=format&fit=crop&q=80',
    type: 'Bedroom'
  },
  {
    id: 'kitchen1',
    label: 'Modular Kitchen',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1000&auto=format&fit=crop&q=80',
    type: 'Kitchen'
  },
  {
    id: 'bath1',
    label: 'Contemporary Bathroom',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&auto=format&fit=crop&q=80',
    type: 'Bathroom'
  },
  {
    id: 'balcony1',
    label: 'Scenic Sunset Balcony',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop&q=80',
    type: 'Balcony'
  }
];

const POPULAR_LOCALITIES: Record<string, string[]> = {
  Pune: ['Hinjawadi Phase 1', 'Hinjawadi Phase 2', 'Wakad', 'Baner', 'Balewadi', 'Kharadi', 'Viman Nagar', 'Kothrud', 'Aundh', 'Hadapsar'],
  Hyderabad: ['Gachibowli', 'Hitec City', 'Madhapur', 'Kondapur', 'Kukatpally', 'Banjara Hills', 'Jubilee Hills', 'Manikonda'],
  Bangalore: ['Whitefield', 'Electronic City', 'HSR Layout', 'Koramangala', 'Indiranagar', 'Bellandur', 'Marathahalli', 'Sarjapur Road'],
  Mumbai: ['Andheri West', 'Bandra West', 'Powai', 'Thane West', 'Navi Mumbai', 'Borivali West', 'Goregaon East'],
  'Delhi-NCR': ['Gurgaon Cyber City', 'Golf Course Road', 'Noida Sector 62', 'Noida Sector 137', 'South Extension', 'Dwarka']
};

const AMENITIES_LIST = [
  { id: 'ac', label: 'Air Conditioner', icon: '❄️' },
  { id: 'wifi', label: 'High-Speed Wi-Fi', icon: '📶' },
  { id: 'tv', label: 'Smart TV', icon: '📺' },
  { id: 'fridge', label: 'Refrigerator', icon: '🧊' },
  { id: 'washing_machine', label: 'Washing Machine', icon: '🧺' },
  { id: 'geyser', label: 'Geyser / Water Heater', icon: '♨️' },
  { id: 'power_backup', label: '100% Power Backup', icon: '⚡' },
  { id: 'lift', label: 'Elevator / Lift', icon: '🛗' },
  { id: 'security', label: '24x7 Security & CCTV', icon: '🛡️' },
  { id: 'gated', label: 'Gated Community', icon: '🏡' },
  { id: 'kitchen', label: 'Modular Kitchen', icon: '🍳' },
  { id: 'wardrobe', label: 'Spacious Wardrobes', icon: '🚪' },
  { id: 'balcony', label: 'Private Balcony', icon: '🌅' },
  { id: 'gym', label: 'Clubhouse & Gym', icon: '🏋️' },
  { id: 'pool', label: 'Swimming Pool', icon: '🏊' },
  { id: 'parking_box', label: 'Covered Parking', icon: '🚗' },
];

export default function ListPropertyPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Location & Basic Info
    city: 'Pune',
    locality: 'Hinjawadi Phase 1',
    societyName: '',
    title: '',
    propertyType: 'apartment', // apartment, house, pg, commercial
    lookingFor: 'House', // House, Room, Bed
    bhk: 2,
    carpetArea: '',
    floorNo: '',
    totalFloors: '',

    // Step 2: Rent & Availability
    price: '',
    deposit: '',
    maintenanceIncluded: true,
    availability: 'Immediate', // Immediate, Within 7 Days, Within 15 Days, More than 15 Days
    availableFor: 'Family', // Family, Boys, Girls, Anyone
    livingExperience: 'Managed by S.R Rentals', // Managed by S.R Rentals, Managed by Owner, Select (Premium Furnished)
    listingOption: 'rent',

    // Step 3: Furnishing & Amenities
    furnishingType: 'Fully Furnished', // Fully Furnished, Semi Furnished, Unfurnished
    parking: 'Two Wheeler', // Two Wheeler, Four Wheeler, Both, None
    selectedAmenities: ['ac', 'wifi', 'geyser', 'lift', 'security', 'kitchen', 'balcony'] as string[],

    // Step 4: Photos & Description
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&auto=format&fit=crop&q=80'
    ] as string[],
    customImageUrl: '',
    description: '',

    // Step 5: Landlord / Contact Info
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: '',
    agreeTerms: true,
  });

  // UI & Validation States
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [publishedPropertyId, setPublishedPropertyId] = useState<string | null>(null);

  // Rent Estimator Widget States
  const [calcCity, setCalcCity] = useState('Pune');
  const [calcBhk, setCalcBhk] = useState(2);
  const [calcFurnishing, setCalcFurnishing] = useState('Fully Furnished');

  // FAQ Open/Close Tracker
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Sync user details if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        ownerName: user.name || prev.ownerName,
        ownerEmail: user.email || prev.ownerEmail,
        ownerPhone: user.phone || prev.ownerPhone,
      }));
    }
  }, [user]);

  // Handle Input Changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage('');
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Suggest Title Helper
  const handleSuggestTitle = () => {
    const typeLabel = formData.propertyType === 'apartment' ? 'Apartment' : formData.propertyType === 'house' ? 'Independent House' : formData.propertyType === 'pg' ? 'Co-living PG' : 'Commercial Space';
    const soc = formData.societyName.trim() ? ` at ${formData.societyName.trim()}` : '';
    const suggested = `${formData.furnishingType} ${formData.bhk} BHK ${typeLabel}${soc} in ${formData.locality}, ${formData.city}`;
    handleInputChange('title', suggested);
  };

  // Toggle Amenity
  const toggleAmenity = (amenityId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedAmenities.includes(amenityId);
      return {
        ...prev,
        selectedAmenities: exists
          ? prev.selectedAmenities.filter((id) => id !== amenityId)
          : [...prev.selectedAmenities, amenityId]
      };
    });
  };

  // Toggle Curated Image
  const toggleCuratedImage = (url: string) => {
    setFormData((prev) => {
      const exists = prev.images.includes(url);
      if (exists) {
        if (prev.images.length === 1) {
          setErrorMessage('Please keep at least one property photo.');
          return prev;
        }
        return { ...prev, images: prev.images.filter((img) => img !== url) };
      } else {
        return { ...prev, images: [...prev.images, url] };
      }
    });
    if (fieldErrors.images) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.images;
        return next;
      });
    }
  };

  // Add Custom Image URL
  const handleAddCustomImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customImageUrl.trim()) return;
    if (formData.images.includes(formData.customImageUrl.trim())) {
      setErrorMessage('This image URL is already added.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, prev.customImageUrl.trim()],
      customImageUrl: ''
    }));
  };

  // AI/Auto Generate Description Helper
  const generateDescription = () => {
    const amenitiesText = formData.selectedAmenities
      .map((id) => AMENITIES_LIST.find((a) => a.id === id)?.label)
      .filter(Boolean)
      .join(', ');

    const carpetText = formData.carpetArea ? `${formData.carpetArea} sq.ft` : 'spacious';
    const socText = formData.societyName ? `in ${formData.societyName}, ` : '';

    const desc = `Exceptional ${formData.bhk} BHK ${formData.propertyType} available for rent ${socText}${formData.locality}, ${formData.city}. This ${formData.furnishingType.toLowerCase()} property spans ${carpetText} with sunlit rooms, modern modular kitchen, and private balcony. Ideal for ${formData.availableFor.toLowerCase()} looking for comfortable and secure living. 

Key Highlights & Amenities:
- ${amenitiesText || 'High-speed Wi-Fi, 24x7 Security, Power Backup, Elevator'}
- Parking: ${formData.parking}
- Ready for immediate move-in (${formData.availability})
- Managed with high quality maintenance support and transparent agreement.`;

    handleInputChange('description', desc);
  };

  // Strict Step Validation
  const validateStep = (step: number): boolean => {
    setErrorMessage('');
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.city || !formData.city.trim()) {
        errors.city = 'Please select a city.';
      }
      if (!formData.locality || !formData.locality.trim()) {
        errors.locality = 'Please select a locality or area.';
      }
      if (!formData.societyName || !formData.societyName.trim()) {
        errors.societyName = 'Please enter the Apartment, Society, or Building name.';
      }
      if (!formData.carpetArea || Number(formData.carpetArea) < 50) {
        errors.carpetArea = 'Please enter a valid carpet area in sq.ft (min 50 sq.ft).';
      }
      if (!formData.title || !formData.title.trim()) {
        errors.title = 'Please provide a listing headline (or click Suggest Headline).';
      }
    } else if (step === 2) {
      if (!formData.price || Number(formData.price) < 1000) {
        errors.price = 'Please enter expected monthly rent (min ₹1,000).';
      }
      if (formData.deposit === '' || Number(formData.deposit) < 0) {
        errors.deposit = 'Please enter the security deposit amount.';
      }
      if (!formData.availability) {
        errors.availability = 'Please select property availability.';
      }
    } else if (step === 3) {
      if (!formData.furnishingType) {
        errors.furnishingType = 'Please select furnishing status.';
      }
      if (!formData.parking) {
        errors.parking = 'Please select parking availability.';
      }
    } else if (step === 4) {
      if (!formData.images || formData.images.length === 0) {
        errors.images = 'Please select or add at least one property photo.';
      }
      if (!formData.description || !formData.description.trim()) {
        errors.description = 'Please provide a property description (or click Auto-Generate Highlights).';
      }
    } else if (step === 5) {
      if (!user) {
        if (!formData.ownerName || !formData.ownerName.trim()) {
          errors.ownerName = 'Please enter your full name.';
        }
        if (!formData.ownerPhone || !formData.ownerPhone.trim()) {
          errors.ownerPhone = 'Please enter your mobile phone number.';
        }
        if (!formData.ownerEmail || !formData.ownerEmail.trim() || !formData.ownerEmail.includes('@')) {
          errors.ownerEmail = 'Please enter a valid email address.';
        }
      }
      if (!formData.agreeTerms) {
        errors.agreeTerms = 'You must agree to the landlord terms of service.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      setErrorMessage(firstError);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  // Stepper Header Click Navigation (Checks all intermediate steps strictly)
  const handleStepClick = (targetStep: number) => {
    if (targetStep === currentStep) return;

    if (targetStep < currentStep) {
      // Allow going back to previous steps without blocking
      setErrorMessage('');
      setCurrentStep(targetStep);
      window.scrollTo({ top: 380, behavior: 'smooth' });
      return;
    }

    // To advance forward, EVERY step from 1 up to targetStep - 1 MUST be validated
    for (let s = 1; s < targetStep; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        window.scrollTo({ top: 380, behavior: 'smooth' });
        return;
      }
    }

    setCurrentStep(targetStep);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Next / Prev Step Handlers
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3 && !formData.description) {
        generateDescription();
      }
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Final Form Submission
  const handleSubmitProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        title: formData.title,
        description: formData.description || `${formData.bhk} BHK property in ${formData.locality}`,
        price: Number(formData.price),
        location: `${formData.locality}, ${formData.city}`,
        propertyType: formData.propertyType,
        bhk: Number(formData.bhk),
        images: formData.images,
        listingOption: formData.listingOption,
        livingExperience: formData.livingExperience,
        lookingFor: formData.lookingFor,
        availableFor: formData.availableFor,
        furnishingType: formData.furnishingType,
        carpetArea: Number(formData.carpetArea),
        parking: formData.parking,
        availability: formData.availability,
        latitude: formData.city === 'Hyderabad' ? 17.4401 : formData.city === 'Bangalore' ? 12.9716 : 18.5913,
        longitude: formData.city === 'Hyderabad' ? 78.3489 : formData.city === 'Bangalore' ? 77.5946 : 73.7389,
        // Landlord onboarding info if guest
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        ownerPassword: formData.ownerPassword || 'password123',
      };

      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish property listing.');
      }

      setSuccessMessage('🎉 Congratulations! Your property listing has been successfully published!');
      setPublishedPropertyId(data.property?.id || null);

      // Refresh session if guest user logged in
      if (!user && data.property) {
        const sessionRes = await fetch('/api/auth/me');
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.user) login(sessionData.user);
        }
      }
    } catch (err: any) {
      console.error('Property creation error:', err);
      setErrorMessage(err.message || 'An error occurred while submitting your listing.');
    } finally {
      setLoading(false);
    }
  };

  // Rent Estimator Logic
  const getEstimatedRent = () => {
    let base = 12000;
    if (calcCity === 'Bangalore' || calcCity === 'Mumbai') base = 16000;
    if (calcCity === 'Hyderabad' || calcCity === 'Pune') base = 13500;

    let multiplier = 1;
    if (calcBhk === 1) multiplier = 1.0;
    else if (calcBhk === 2) multiplier = 1.6;
    else if (calcBhk === 3) multiplier = 2.3;
    else if (calcBhk === 4) multiplier = 3.2;

    let furnishingBonus = 1.0;
    if (calcFurnishing === 'Semi Furnished') furnishingBonus = 1.15;
    if (calcFurnishing === 'Fully Furnished') furnishingBonus = 1.35;

    const estimated = Math.round((base * multiplier * furnishingBonus) / 500) * 500;
    return {
      monthly: estimated,
      annual: estimated * 12,
      deposit: estimated * 2,
    };
  };

  const estimatedValues = getEstimatedRent();

  return (
    <div className="list-property-page-wrapper">
      
      {/* 1. HERO BANNER */}
      <section className="list-property-hero">
        <div className="container">
          <div className="hero-badge-pill">
            <span className="badge-sparkle">✨</span> For Property Owners & Landlords
          </div>
          <h1 className="hero-main-title">
            Rent Out Your House with <span className="highlight-text">Zero Hassle</span>
          </h1>
          <p className="hero-subtitle-text">
            Get higher rental returns, verified corporate tenants, timely guaranteed payouts, and complete property management by S.R Rental Services.
          </p>

          <div className="hero-trust-metrics-row">
            <div className="metric-pill">
              <span className="metric-val">0%</span>
              <span className="metric-lbl">Brokerage</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-pill">
              <span className="metric-val">100%</span>
              <span className="metric-lbl">Verified Tenants</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-pill">
              <span className="metric-val">3x</span>
              <span className="metric-lbl">Faster Bookings</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-pill">
              <span className="metric-val">₹0</span>
              <span className="metric-lbl">Listing Fee</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN WIZARD CONTAINER */}
      <section className="list-property-wizard-section">
        <div className="container wizard-grid-layout">

          {/* LEFT: STEP-BY-STEP FORM CARD */}
          <div className="wizard-card-main card glass">
            
            {/* Success Screen if Published */}
            {successMessage && (
              <div className="publish-success-overlay">
                <div className="success-icon-badge">🎉</div>
                <h2 className="success-title">Property Listed Successfully!</h2>
                <p className="success-desc">
                  Your property is now live on S.R Rental Services and visible to thousands of verified prospective tenants.
                </p>
                
                <div className="success-action-buttons">
                  {publishedPropertyId && (
                    <Link href={`/properties/${publishedPropertyId}`} className="btn btn-primary">
                      👁️ View Public Listing
                    </Link>
                  )}
                  <Link href="/owner" className="btn btn-secondary">
                    📊 Go to Landlord Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                      setSuccessMessage('');
                      setCurrentStep(1);
                    }} 
                    className="btn btn-outline"
                  >
                    ➕ List Another Property
                  </button>
                </div>
              </div>
            )}

            {!successMessage && (
              <>
                {/* STEPPER PROGRESS BAR */}
                <div className="wizard-stepper-header">
                  <div className="stepper-track">
                    <div 
                      className="stepper-progress-fill"
                      style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                    ></div>
                  </div>

                  <div className="stepper-steps-row">
                    {[
                      { step: 1, label: 'Basic Info', icon: '📍' },
                      { step: 2, label: 'Rent & Terms', icon: '💰' },
                      { step: 3, label: 'Amenities', icon: '🛋️' },
                      { step: 4, label: 'Photos', icon: '📸' },
                      { step: 5, label: 'Publish', icon: '🚀' },
                    ].map((s) => (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => handleStepClick(s.step)}
                        className={`step-circle-btn ${currentStep === s.step ? 'active' : currentStep > s.step ? 'completed' : ''}`}
                      >
                        <div className="step-circle">
                          {currentStep > s.step ? '✓' : s.step}
                        </div>
                        <span className="step-label">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ERROR BANNER */}
                {errorMessage && (
                  <div className="alert-message error-alert">
                    <span>⚠️ {errorMessage}</span>
                  </div>
                )}

                {/* FORM CONTENT BY STEP */}
                <form onSubmit={handleSubmitProperty} className="wizard-form-body">

                  {/* ================= STEP 1 ================= */}
                  {currentStep === 1 && (
                    <div className="step-panel animate-fadeIn">
                      <div className="step-title-box">
                        <span className="step-pill-indicator">Step 1 of 5</span>
                        <h2 className="step-heading">Property Basics & Location</h2>
                        <p className="step-subheading">Tell us where your property is located and its basic layout.</p>
                      </div>

                      {/* City Selector */}
                      <div className="form-group-block">
                        <label className="field-label">Select City <span className="req">*</span></label>
                        <div className="city-pill-selector">
                          {Object.keys(POPULAR_LOCALITIES).map((city) => (
                            <button
                              key={city}
                              type="button"
                              className={`city-pill-btn ${formData.city === city ? 'active' : ''}`}
                              onClick={() => {
                                handleInputChange('city', city);
                                handleInputChange('locality', POPULAR_LOCALITIES[city][0]);
                              }}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                        {fieldErrors.city && <span className="inline-field-error">{fieldErrors.city}</span>}
                      </div>

                      {/* Locality & Society */}
                      <div className="grid-2 form-row-gap">
                        <div className="form-group-block">
                          <label className="field-label" htmlFor="prop-locality">Locality / Area <span className="req">*</span></label>
                          <select
                            id="prop-locality"
                            className={`form-input custom-select ${fieldErrors.locality ? 'field-error' : ''}`}
                            value={formData.locality}
                            onChange={(e) => handleInputChange('locality', e.target.value)}
                          >
                            {(POPULAR_LOCALITIES[formData.city] || []).map((loc) => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                            <option value="Other Area">Other Locality / Sector</option>
                          </select>
                          {fieldErrors.locality && <span className="inline-field-error">{fieldErrors.locality}</span>}
                        </div>

                        <div className="form-group-block">
                          <label className="field-label" htmlFor="prop-society">
                            Apartment / Society Name <span className="req">*</span>
                          </label>
                          <input
                            type="text"
                            id="prop-society"
                            className={`form-input ${fieldErrors.societyName ? 'field-error' : ''}`}
                            placeholder="e.g. Godrej 24, Rohan Viti, Megapolis"
                            value={formData.societyName}
                            onChange={(e) => handleInputChange('societyName', e.target.value)}
                            required
                          />
                          {fieldErrors.societyName && <span className="inline-field-error">{fieldErrors.societyName}</span>}
                        </div>
                      </div>

                      {/* Property Type Cards */}
                      <div className="form-group-block">
                        <label className="field-label">Property Type <span className="req">*</span></label>
                        <div className="selection-cards-grid">
                          {[
                            { id: 'apartment', label: 'Apartment / Flat', icon: '🏢', sub: 'High-rise & Gated Societies' },
                            { id: 'house', label: 'Independent House / Villa', icon: '🏡', sub: 'Stand-alone or Row House' },
                            { id: 'pg', label: 'PG / Co-living', icon: '🛏️', sub: 'Shared or Private Rooms' },
                            { id: 'commercial', label: 'Commercial Office', icon: '💼', sub: 'Retail & Office Spaces' },
                          ].map((type) => (
                            <div
                              key={type.id}
                              className={`selection-card ${formData.propertyType === type.id ? 'active' : ''}`}
                              onClick={() => handleInputChange('propertyType', type.id)}
                            >
                              <span className="card-icon">{type.icon}</span>
                              <div className="card-texts">
                                <span className="card-main-title">{type.label}</span>
                                <span className="card-sub-title">{type.sub}</span>
                              </div>
                              <span className="card-check">{formData.propertyType === type.id ? '●' : '○'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Looking For: House / Room / Bed */}
                      <div className="form-group-block">
                        <label className="field-label">Listing Scope</label>
                        <div className="segmented-toggle-row">
                          {['House', 'Room', 'Bed'].map((scope) => (
                            <button
                              key={scope}
                              type="button"
                              className={`segmented-btn ${formData.lookingFor === scope ? 'active' : ''}`}
                              onClick={() => handleInputChange('lookingFor', scope)}
                            >
                              {scope === 'House' ? '🏠 Entire House' : scope === 'Room' ? '🚪 Private Room' : '🛏️ Shared Bed'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* BHK Selector */}
                      <div className="form-group-block">
                        <label className="field-label">Bedrooms (BHK) <span className="req">*</span></label>
                        <div className="bhk-pills-row">
                          {[1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              type="button"
                              className={`bhk-pill-btn ${formData.bhk === num ? 'active' : ''}`}
                              onClick={() => handleInputChange('bhk', num)}
                            >
                              {num} BHK
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Carpet Area & Floor */}
                      <div className="grid-3 form-row-gap">
                        <div className="form-group-block">
                          <label className="field-label" htmlFor="prop-carpet">Carpet Area (sq. ft) <span className="req">*</span></label>
                          <input
                            type="number"
                            id="prop-carpet"
                            className={`form-input ${fieldErrors.carpetArea ? 'field-error' : ''}`}
                            placeholder="e.g. 950"
                            value={formData.carpetArea}
                            onChange={(e) => handleInputChange('carpetArea', e.target.value)}
                            min={50}
                            required
                          />
                          {fieldErrors.carpetArea && <span className="inline-field-error">{fieldErrors.carpetArea}</span>}
                        </div>
                        <div className="form-group-block">
                          <label className="field-label" htmlFor="prop-floor">Floor Number</label>
                          <input
                            type="text"
                            id="prop-floor"
                            className="form-input"
                            placeholder="e.g. 4th Floor"
                            value={formData.floorNo}
                            onChange={(e) => handleInputChange('floorNo', e.target.value)}
                          />
                        </div>
                        <div className="form-group-block">
                          <label className="field-label" htmlFor="prop-totalfloors">Total Floors</label>
                          <input
                            type="text"
                            id="prop-totalfloors"
                            className="form-input"
                            placeholder="e.g. 14 Floors"
                            value={formData.totalFloors}
                            onChange={(e) => handleInputChange('totalFloors', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Listing Title with Auto-Suggest Button */}
                      <div className="form-group-block">
                        <div className="field-header-flex">
                          <label className="field-label" htmlFor="prop-title">Listing Headline <span className="req">*</span></label>
                          <button
                            type="button"
                            className="ai-desc-btn"
                            onClick={handleSuggestTitle}
                          >
                            ✨ Auto-Suggest Headline
                          </button>
                        </div>
                        <input
                          type="text"
                          id="prop-title"
                          className={`form-input ${fieldErrors.title ? 'field-error' : ''}`}
                          placeholder="e.g. Fully Furnished 2 BHK Apartment in Hinjawadi Phase 1"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          required
                        />
                        {fieldErrors.title && <span className="inline-field-error">{fieldErrors.title}</span>}
                      </div>
                    </div>
                  )}

                  {/* ================= STEP 2 ================= */}
                  {currentStep === 2 && (
                    <div className="step-panel animate-fadeIn">
                      <div className="step-title-box">
                        <span className="step-pill-indicator">Step 2 of 5</span>
                        <h2 className="step-heading">Rental Expectations & Terms</h2>
                        <p className="step-subheading">Define your rent, deposit terms, and preferred tenant types.</p>
                      </div>

                      {/* Monthly Rent with Quick Increment Buttons */}
                      <div className="form-group-block">
                        <div className="field-header-flex">
                          <label className="field-label" htmlFor="prop-rent">Expected Monthly Rent (₹) <span className="req">*</span></label>
                          <span className="rent-calc-hint">Suggested: ₹{estimatedValues.monthly.toLocaleString('en-IN')}/mo</span>
                        </div>
                        <div className="price-input-wrapper">
                          <span className="currency-prefix">₹</span>
                          <input
                            type="number"
                            id="prop-rent"
                            className={`form-input price-large-input ${fieldErrors.price ? 'field-error' : ''}`}
                            placeholder="e.g. 22000"
                            value={formData.price}
                            onChange={(e) => {
                              const p = e.target.value;
                              handleInputChange('price', p);
                              if (p && !isNaN(Number(p))) {
                                handleInputChange('deposit', String(Number(p) * 2));
                              }
                            }}
                            min={1000}
                            step={500}
                            required
                          />
                        </div>
                        {fieldErrors.price && <span className="inline-field-error">{fieldErrors.price}</span>}

                        <div className="quick-suggestions-row">
                          {[15000, 20000, 25000, 30000, 35000, 45000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              className={`suggestion-pill ${Number(formData.price) === amt ? 'active' : ''}`}
                              onClick={() => {
                                handleInputChange('price', String(amt));
                                handleInputChange('deposit', String(amt * 2));
                              }}
                            >
                              ₹{(amt / 1000).toFixed(0)}k
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Security Deposit */}
                      <div className="grid-2 form-row-gap">
                        <div className="form-group-block">
                          <label className="field-label" htmlFor="prop-deposit">Security Deposit (₹) <span className="req">*</span></label>
                          <div className="price-input-wrapper">
                            <span className="currency-prefix">₹</span>
                            <input
                              type="number"
                              id="prop-deposit"
                              className={`form-input ${fieldErrors.deposit ? 'field-error' : ''}`}
                              placeholder="e.g. 44000"
                              value={formData.deposit}
                              onChange={(e) => handleInputChange('deposit', e.target.value)}
                              required
                            />
                          </div>
                          {fieldErrors.deposit && <span className="inline-field-error">{fieldErrors.deposit}</span>}

                          <div className="deposit-multipliers">
                            <button
                              type="button"
                              className="multiplier-btn"
                              onClick={() => {
                                const p = Number(formData.price) || 20000;
                                handleInputChange('deposit', String(p * 2));
                              }}
                            >
                              2 Months (₹{((Number(formData.price) || 20000) * 2).toLocaleString('en-IN')})
                            </button>
                            <button
                              type="button"
                              className="multiplier-btn"
                              onClick={() => {
                                const p = Number(formData.price) || 20000;
                                handleInputChange('deposit', String(p * 3));
                              }}
                            >
                              3 Months
                            </button>
                          </div>
                        </div>

                        {/* Availability Timing */}
                        <div className="form-group-block">
                          <label className="field-label">Available From <span className="req">*</span></label>
                          <div className="availability-pills-row">
                            {['Immediate', 'Within 7 Days', 'Within 15 Days', 'More than 15 Days'].map((av) => (
                              <button
                                key={av}
                                type="button"
                                className={`availability-pill ${formData.availability === av ? 'active' : ''}`}
                                onClick={() => handleInputChange('availability', av)}
                              >
                                {av}
                              </button>
                            ))}
                          </div>
                          {fieldErrors.availability && <span className="inline-field-error">{fieldErrors.availability}</span>}
                        </div>
                      </div>

                      {/* Tenant Preferences */}
                      <div className="form-group-block">
                        <label className="field-label">Preferred Tenants</label>
                        <div className="segmented-toggle-row">
                          {[
                            { id: 'Family', label: '👨‍👩‍👧 Family' },
                            { id: 'Boys', label: '👨 Bachelor Boys' },
                            { id: 'Girls', label: '👩 Bachelor Girls' },
                            { id: 'Anyone', label: '👥 Anyone / Any' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              className={`segmented-btn ${formData.availableFor === t.id ? 'active' : ''}`}
                              onClick={() => handleInputChange('availableFor', t.id)}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Living Experience / Management Plan */}
                      <div className="form-group-block">
                        <label className="field-label">Management Service Option</label>
                        <div className="management-options-grid">
                          {[
                            {
                              id: 'Managed by S.R Rentals',
                              title: '⭐ Managed by S.R Rentals',
                              desc: 'Guaranteed rent, full tenant management, inspection, maintenance & legal agreement support.',
                              badge: 'Most Popular'
                            },
                            {
                              id: 'Select (Premium Furnished)',
                              title: '💎 Select Premium',
                              desc: 'Higher rental guarantee with high-end designer interior furnishing support.',
                              badge: 'Highest Yield'
                            },
                            {
                              id: 'Managed by Owner',
                              title: '🔑 Managed by Owner',
                              desc: 'Standard listing with direct tenant interaction and owner-handled maintenance.',
                              badge: 'Self Managed'
                            },
                          ].map((opt) => (
                            <div
                              key={opt.id}
                              className={`management-card ${formData.livingExperience === opt.id ? 'active' : ''}`}
                              onClick={() => handleInputChange('livingExperience', opt.id)}
                            >
                              <div className="mgmt-card-header">
                                <span className="mgmt-title">{opt.title}</span>
                                {opt.badge && <span className="mgmt-badge">{opt.badge}</span>}
                              </div>
                              <p className="mgmt-desc">{opt.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================= STEP 3 ================= */}
                  {currentStep === 3 && (
                    <div className="step-panel animate-fadeIn">
                      <div className="step-title-box">
                        <span className="step-pill-indicator">Step 3 of 5</span>
                        <h2 className="step-heading">Furnishing & Society Amenities</h2>
                        <p className="step-subheading">Properties with detailed amenities receive 4x higher inquiry rates.</p>
                      </div>

                      {/* Furnishing Status Cards */}
                      <div className="form-group-block">
                        <label className="field-label">Furnishing Status <span className="req">*</span></label>
                        <div className="furnishing-cards-row">
                          {[
                            { id: 'Fully Furnished', label: 'Fully Furnished', icon: '🛋️', desc: 'Beds, Sofa, Wardrobes, Appliances' },
                            { id: 'Semi Furnished', label: 'Semi Furnished', icon: '🚪', desc: 'Wardrobes, Lights, Fans, Modular Kitchen' },
                            { id: 'Unfurnished', label: 'Unfurnished', icon: '📦', desc: 'Bare essentials only' },
                          ].map((f) => (
                            <div
                              key={f.id}
                              className={`furnishing-card ${formData.furnishingType === f.id ? 'active' : ''}`}
                              onClick={() => handleInputChange('furnishingType', f.id)}
                            >
                              <span className="f-icon">{f.icon}</span>
                              <span className="f-title">{f.label}</span>
                              <span className="f-desc">{f.desc}</span>
                              <span className="f-check">{formData.furnishingType === f.id ? '✓ Selected' : 'Select'}</span>
                            </div>
                          ))}
                        </div>
                        {fieldErrors.furnishingType && <span className="inline-field-error">{fieldErrors.furnishingType}</span>}
                      </div>

                      {/* Parking Availability */}
                      <div className="form-group-block">
                        <label className="field-label">Parking Available <span className="req">*</span></label>
                        <div className="segmented-toggle-row">
                          {['Two Wheeler', 'Four Wheeler', 'Both', 'None'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              className={`segmented-btn ${formData.parking === p ? 'active' : ''}`}
                              onClick={() => handleInputChange('parking', p)}
                            >
                              {p === 'Two Wheeler' ? '🛵 Two Wheeler' : p === 'Four Wheeler' ? '🚗 Four Wheeler' : p === 'Both' ? '🚗 + 🛵 Both' : '🚫 None'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amenities Checklist */}
                      <div className="form-group-block">
                        <div className="field-header-flex">
                          <label className="field-label">Available Amenities & Facilities ({formData.selectedAmenities.length} selected)</label>
                          <button
                            type="button"
                            className="select-all-btn"
                            onClick={() => {
                              if (formData.selectedAmenities.length === AMENITIES_LIST.length) {
                                handleInputChange('selectedAmenities', []);
                              } else {
                                handleInputChange('selectedAmenities', AMENITIES_LIST.map((a) => a.id));
                              }
                            }}
                          >
                            {formData.selectedAmenities.length === AMENITIES_LIST.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        <div className="amenities-toggle-grid">
                          {AMENITIES_LIST.map((amenity) => {
                            const isSelected = formData.selectedAmenities.includes(amenity.id);
                            return (
                              <button
                                key={amenity.id}
                                type="button"
                                className={`amenity-badge-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleAmenity(amenity.id)}
                              >
                                <span className="amenity-icon">{amenity.icon}</span>
                                <span className="amenity-name">{amenity.label}</span>
                                <span className="amenity-status-icon">{isSelected ? '✓' : '+'}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================= STEP 4 ================= */}
                  {currentStep === 4 && (
                    <div className="step-panel animate-fadeIn">
                      <div className="step-title-box">
                        <span className="step-pill-indicator">Step 4 of 5</span>
                        <h2 className="step-heading">Photos & Property Highlights</h2>
                        <p className="step-subheading">Select from high-resolution interior styles or add your own image links.</p>
                      </div>

                      {/* Curated Interior Picker */}
                      <div className="form-group-block">
                        <label className="field-label">Click to Include High-Res Room Photos ({formData.images.length} Selected) <span className="req">*</span></label>
                        <div className="curated-photos-grid">
                          {CURATED_IMAGES.map((img) => {
                            const isSelected = formData.images.includes(img.url);
                            return (
                              <div
                                key={img.id}
                                className={`photo-picker-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleCuratedImage(img.url)}
                              >
                                <img src={img.url} alt={img.label} className="picker-img" />
                                <div className="photo-picker-overlay">
                                  <span className="picker-badge">{img.type}</span>
                                  <span className="picker-check">{isSelected ? '✓ Added' : '+ Add'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {fieldErrors.images && <span className="inline-field-error">{fieldErrors.images}</span>}
                      </div>

                      {/* Custom Image URL Uploader */}
                      <div className="form-group-block">
                        <label className="field-label" htmlFor="custom-img-url">Add Custom Image URL</label>
                        <div className="custom-url-input-row">
                          <input
                            type="url"
                            id="custom-img-url"
                            className="form-input flex-1"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={formData.customImageUrl}
                            onChange={(e) => handleInputChange('customImageUrl', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomImage}
                            className="btn btn-outline-primary"
                          >
                            ➕ Add Photo
                          </button>
                        </div>
                      </div>

                      {/* Photo Thumbnails Preview */}
                      <div className="form-group-block">
                        <label className="field-label">Selected Gallery ({formData.images.length} photos)</label>
                        <div className="selected-thumbnails-row">
                          {formData.images.map((url, idx) => (
                            <div key={idx} className="thumbnail-preview-card">
                              <img src={url} alt={`Listing Photo ${idx + 1}`} className="thumb-img" />
                              <button
                                type="button"
                                className="remove-thumb-btn"
                                onClick={() => toggleCuratedImage(url)}
                                title="Remove photo"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Description & AI Generator */}
                      <div className="form-group-block">
                        <div className="field-header-flex">
                          <label className="field-label" htmlFor="prop-desc">Property Description & Highlights <span className="req">*</span></label>
                          <button
                            type="button"
                            className="ai-desc-btn"
                            onClick={generateDescription}
                          >
                            ✨ Auto-Generate Highlights
                          </button>
                        </div>
                        <textarea
                          id="prop-desc"
                          rows={6}
                          className={`form-textarea ${fieldErrors.description ? 'field-error' : ''}`}
                          placeholder="Describe your property's special features, proximity to metro/IT parks, furnishing details, etc."
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          required
                        ></textarea>
                        {fieldErrors.description && <span className="inline-field-error">{fieldErrors.description}</span>}
                      </div>
                    </div>
                  )}

                  {/* ================= STEP 5 ================= */}
                  {currentStep === 5 && (
                    <div className="step-panel animate-fadeIn">
                      <div className="step-title-box">
                        <span className="step-pill-indicator">Step 5 of 5</span>
                        <h2 className="step-heading">Owner Contact & Review</h2>
                        <p className="step-subheading">Review your listing details and confirm to publish instantly.</p>
                      </div>

                      {/* Live Listing Summary Preview Card */}
                      <div className="listing-summary-preview-card">
                        <div className="summary-media-box">
                          <img
                            src={formData.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80'}
                            alt={formData.title}
                            className="summary-hero-img"
                          />
                          <span className="summary-badge-type">{formData.bhk} BHK • {formData.propertyType}</span>
                        </div>
                        <div className="summary-info-box">
                          <h3 className="summary-title">{formData.title || 'Untitled Property'}</h3>
                          <p className="summary-location">📍 {formData.societyName ? `${formData.societyName}, ` : ''}{formData.locality}, {formData.city}</p>
                          
                          <div className="summary-pills-row">
                            <span className="sum-pill">🛋️ {formData.furnishingType}</span>
                            <span className="sum-pill">📐 {formData.carpetArea || '800'} sq.ft</span>
                            <span className="sum-pill">🛵 {formData.parking}</span>
                            <span className="sum-pill">⚡ {formData.availability}</span>
                          </div>

                          <div className="summary-price-tag">
                            <span className="price-bold">₹{Number(formData.price || 0).toLocaleString('en-IN')}</span>
                            <span className="price-sub">/ month</span>
                            <span className="deposit-tag">• Deposit: ₹{Number(formData.deposit || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Landlord Contact Info */}
                      <div className="owner-contact-form-section">
                        <h4 className="section-sub-title">
                          {user ? '👤 Landlord Account' : '👤 Landlord Contact Details'}
                        </h4>

                        {user ? (
                          <div className="logged-in-owner-badge">
                            <div className="user-avatar-circle">{user.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="logged-owner-name">{user.name} ({user.role.toUpperCase()})</p>
                              <p className="logged-owner-email">📧 {user.email} {user.phone ? `• 📞 ${user.phone}` : ''}</p>
                            </div>
                            <span className="verified-owner-pill">✓ Verified Landlord</span>
                          </div>
                        ) : (
                          <div className="guest-owner-inputs-grid">
                            <div className="form-group-block">
                              <label className="field-label" htmlFor="owner-name">Full Name <span className="req">*</span></label>
                              <input
                                type="text"
                                id="owner-name"
                                className={`form-input ${fieldErrors.ownerName ? 'field-error' : ''}`}
                                placeholder="e.g. Rajesh Sharma"
                                value={formData.ownerName}
                                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                                required
                              />
                              {fieldErrors.ownerName && <span className="inline-field-error">{fieldErrors.ownerName}</span>}
                            </div>

                            <div className="form-group-block">
                              <label className="field-label" htmlFor="owner-phone">Mobile Number <span className="req">*</span></label>
                              <input
                                type="tel"
                                id="owner-phone"
                                className={`form-input ${fieldErrors.ownerPhone ? 'field-error' : ''}`}
                                placeholder="e.g. +91 98765 43210"
                                value={formData.ownerPhone}
                                onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                                required
                              />
                              {fieldErrors.ownerPhone && <span className="inline-field-error">{fieldErrors.ownerPhone}</span>}
                            </div>

                            <div className="form-group-block">
                              <label className="field-label" htmlFor="owner-email">Email Address <span className="req">*</span></label>
                              <input
                                type="email"
                                id="owner-email"
                                className={`form-input ${fieldErrors.ownerEmail ? 'field-error' : ''}`}
                                placeholder="e.g. rajesh.sharma@gmail.com"
                                value={formData.ownerEmail}
                                onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                                required
                              />
                              {fieldErrors.ownerEmail && <span className="inline-field-error">{fieldErrors.ownerEmail}</span>}
                            </div>

                            <div className="form-group-block">
                              <label className="field-label" htmlFor="owner-pass">Set Account Password</label>
                              <input
                                type="password"
                                id="owner-pass"
                                className="form-input"
                                placeholder="Create a secure password"
                                value={formData.ownerPassword}
                                onChange={(e) => handleInputChange('ownerPassword', e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {/* Terms Agreement */}
                        <div className="terms-checkbox-row">
                          <label className="terms-checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.agreeTerms}
                              onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                              required
                            />
                            <span className="terms-text">
                              I certify that I am the owner or authorized representative of this property. I agree to S.R Rental Services' <Link href="/contact" className="consent-link">Landlord Terms of Service</Link> and <Link href="/contact" className="consent-link">Privacy Policy</Link>.
                            </span>
                          </label>
                          {fieldErrors.agreeTerms && <span className="inline-field-error">{fieldErrors.agreeTerms}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WIZARD ACTION BUTTONS FOOTER */}
                  <div className="wizard-actions-footer">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="btn btn-outline-prev"
                        disabled={loading}
                      >
                        ← Back
                      </button>
                    ) : (
                      <div></div>
                    )}

                    {currentStep < 5 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="btn btn-next-step"
                      >
                        Save & Continue →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-publish-final"
                      >
                        {loading ? 'Publishing Listing...' : '🚀 Publish Property Listing'}
                      </button>
                    )}
                  </div>

                </form>
              </>
            )}

          </div>

          {/* RIGHT: INTERACTIVE RENT ESTIMATOR & PERKS SIDEBAR */}
          <div className="wizard-sidebar-column">
            
            {/* Rent Estimator Card */}
            <div className="card glass rent-estimator-card">
              <div className="calc-header">
                <span className="calc-badge">📊 Rent Estimator</span>
                <h3 className="calc-title">Estimated Monthly Earnings</h3>
              </div>

              <div className="calc-controls">
                <div className="calc-field">
                  <label className="calc-lbl">City</label>
                  <select
                    className="calc-select"
                    value={calcCity}
                    onChange={(e) => setCalcCity(e.target.value)}
                  >
                    {Object.keys(POPULAR_LOCALITIES).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="calc-field">
                  <label className="calc-lbl">BHK Configuration</label>
                  <div className="calc-bhk-row">
                    {[1, 2, 3, 4].map((b) => (
                      <button
                        key={b}
                        type="button"
                        className={`calc-bhk-btn ${calcBhk === b ? 'active' : ''}`}
                        onClick={() => setCalcBhk(b)}
                      >
                        {b}BHK
                      </button>
                    ))}
                  </div>
                </div>

                <div className="calc-field">
                  <label className="calc-lbl">Furnishing</label>
                  <select
                    className="calc-select"
                    value={calcFurnishing}
                    onChange={(e) => setCalcFurnishing(e.target.value)}
                  >
                    <option value="Fully Furnished">Fully Furnished</option>
                    <option value="Semi Furnished">Semi Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>
              </div>

              <div className="calc-result-box">
                <div className="result-main">
                  <span className="res-curr">₹</span>
                  <span className="res-amount">{estimatedValues.monthly.toLocaleString('en-IN')}</span>
                  <span className="res-period">/ month</span>
                </div>
                <p className="res-annual-text">
                  Estimated Annual Yield: <strong>₹{estimatedValues.annual.toLocaleString('en-IN')}</strong>
                </p>
                <button
                  type="button"
                  className="apply-estimate-btn"
                  onClick={() => {
                    handleInputChange('price', String(estimatedValues.monthly));
                    handleInputChange('deposit', String(estimatedValues.deposit));
                    handleInputChange('bhk', calcBhk);
                    handleInputChange('furnishingType', calcFurnishing);
                    handleInputChange('city', calcCity);
                  }}
                >
                  ⚡ Apply to Form
                </button>
              </div>
            </div>

            {/* Landlord Benefits Mini List */}
            <div className="card glass benefits-mini-card">
              <h4 className="mini-card-title">Why Owners Trust S.R Rentals</h4>
              <ul className="mini-benefits-list">
                <li>
                  <span className="b-icon">🛡️</span>
                  <div>
                    <strong>100% Verified Tenants</strong>
                    <p>Corporate background checks & police verification</p>
                  </div>
                </li>
                <li>
                  <span className="b-icon">💵</span>
                  <div>
                    <strong>Guaranteed On-Time Rent</strong>
                    <p>Rent credited to your account by 5th of every month</p>
                  </div>
                </li>
                <li>
                  <span className="b-icon">📸</span>
                  <div>
                    <strong>Free Photoshoot & Marketing</strong>
                    <p>Multi-portal promotion to 100,000+ prospective tenants</p>
                  </div>
                </li>
                <li>
                  <span className="b-icon">📄</span>
                  <div>
                    <strong>Digital Rental Agreement</strong>
                    <p>Biometric stamp duty & hassle-free online signing</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Help & Support Card */}
            <div className="card landlord-support-card">
              <h4>Need assistance listing?</h4>
              <p>Our Landlord Specialist team is available 7 days a week to help you list and inspect your property.</p>
              <a href="tel:+919876501234" className="call-support-link">
                📞 Call Landlord Helpline: +91 98765 01234
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* 3. VALUE PROPOSITION GRID SECTION */}
      <section className="landlord-value-props-section">
        <div className="container">
          <div className="section-heading-centered">
            <span className="section-pill">The S.R Rentals Advantage</span>
            <h2 className="section-title">Everything You Need to Rent Out Confidently</h2>
            <p className="section-desc">Experience modern property management crafted for smart property owners.</p>
          </div>

          <div className="value-cards-grid">
            <div className="value-card card">
              <div className="v-icon-box">🛡️</div>
              <h3 className="v-title">Verified Tenants Only</h3>
              <p className="v-text">Rigorous employment verification, KYC check, and government ID validation before handing over the keys.</p>
            </div>

            <div className="value-card card">
              <div className="v-icon-box">💰</div>
              <h3 className="v-title">Zero Brokerage</h3>
              <p className="v-text">Never pay high brokerage fees. List your house for free and keep 100% of your earnings.</p>
            </div>

            <div className="value-card card">
              <div className="v-icon-box">⚡</div>
              <h3 className="v-title">Fastest Tenant Matching</h3>
              <p className="v-text">Our proprietary algorithm matches your property with verified tenants in an average of 7-10 days.</p>
            </div>

            <div className="value-card card">
              <div className="v-icon-box">🔧</div>
              <h3 className="v-title">360° Property Maintenance</h3>
              <p className="v-text">Periodic house health checks, move-in/move-out inspections, and instant repair resolution.</p>
            </div>

            <div className="value-card card">
              <div className="v-icon-box">📜</div>
              <h3 className="v-title">Legal & Police Verification</h3>
              <p className="v-text">Compliant digital rental agreements, stamp paper generation, and local police verification handled seamlessly.</p>
            </div>

            <div className="value-card card">
              <div className="v-icon-box">📱</div>
              <h3 className="v-title">Dedicated Landlord App</h3>
              <p className="v-text">Track rent payments, view tenant documents, manage repair tickets, and monitor lease dates in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. OWNER FAQS SECTION */}
      <section className="landlord-faqs-section">
        <div className="container">
          <div className="section-heading-centered">
            <span className="section-pill">Common Questions</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-desc">Find quick answers to common questions about listing your property with S.R Rental Services.</p>
          </div>

          <div className="faqs-accordion-wrapper">
            {[
              {
                q: 'How much does it cost to list a property on S.R Rental Services?',
                a: 'Listing your property on S.R Rental Services is 100% free! You can publish your property photos, set your preferred rent, and connect with prospective verified tenants without any upfront fees.'
              },
              {
                q: 'How does S.R Rental Services verify prospective tenants?',
                a: 'Every prospective tenant goes through a strict 3-tier verification process: identity check (Aadhaar/PAN/Passport), employment verification (corporate email & pay slips), and digital police verification.'
              },
              {
                q: 'Who decides the monthly rent for my property?',
                a: 'You have complete control over the monthly rent and security deposit amounts. Our smart rent estimator also provides real-time market suggestions to maximize your occupancy and rental yield.'
              },
              {
                q: 'How soon can I expect my property to be rented out?',
                a: 'On average, properties listed on S.R Rental Services find verified tenants within 7 to 14 days thanks to our high active user base in IT corridors across Pune, Bangalore, Hyderabad, and Mumbai.'
              },
              {
                q: 'What happens in case of maintenance issues or property damages?',
                a: 'Under our Managed Plan, our dedicated on-ground operations team conducts thorough move-in and move-out inspections. Any tenant-incurred damages are deducted from the security deposit before final settlement.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className={`faq-accordion-item card ${openFaq === idx ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="faq-question-row">
                  <h4 className="faq-q-text">{faq.q}</h4>
                  <span className="faq-toggle-icon">{openFaq === idx ? '−' : '+'}</span>
                </div>
                {openFaq === idx && (
                  <div className="faq-answer-body animate-fadeIn">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CTA BANNER */}
      <section className="landlord-bottom-cta">
        <div className="container">
          <div className="bottom-cta-box">
            <h2 className="cta-heading">Ready to list your property and earn assured rentals?</h2>
            <p className="cta-sub">Join thousands of happy homeowners who trust S.R Rental Services every day.</p>
            <button
              onClick={() => {
                setCurrentStep(1);
                window.scrollTo({ top: 380, behavior: 'smooth' });
              }}
              className="btn btn-cta-gold"
            >
              🚀 Start Listing Your Property Now
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
