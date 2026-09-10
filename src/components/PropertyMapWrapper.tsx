'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="map-loading">Loading Map view...</div>
});

interface PropertyItem {
  id: string;
  title: string;
  price: number;
  location: string;
  latitude: number;
  longitude: number;
}

interface PropertyMapWrapperProps {
  properties: PropertyItem[];
  highlightedId?: string | null;
}

export default function PropertyMapWrapper({ properties, highlightedId }: PropertyMapWrapperProps) {
  return <MapView properties={properties} highlightedId={highlightedId} />;
}
