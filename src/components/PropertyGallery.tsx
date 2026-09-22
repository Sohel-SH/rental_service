'use client';

import React, { useState } from 'react';

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const safeImages = images && images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&auto=format&fit=crop&q=80'
  ];

  return (
    <div className="property-gallery-box">
      {/* Main Image View */}
      <div className="gallery-main-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={safeImages[selectedIdx]}
          alt={`${title} - Photo ${selectedIdx + 1}`}
          className="gallery-main-img"
        />
        <span className="gallery-counter-badge">
          📷 {selectedIdx + 1} / {safeImages.length}
        </span>
      </div>

      {/* Thumbnails row if more than 1 image */}
      {safeImages.length > 1 && (
        <div className="gallery-thumbnails-strip">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`gallery-thumb-btn ${idx === selectedIdx ? 'active' : ''}`}
              aria-label={`View photo ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="gallery-thumb-img" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
