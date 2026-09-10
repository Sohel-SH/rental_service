'use client';

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

interface PropertyItem {
  id: string;
  title: string;
  price: number;
  location: string;
  latitude: number;
  longitude: number;
  images?: string[];
}

interface MapViewProps {
  properties: PropertyItem[];
  highlightedId?: string | null;
}

// Helper to center map dynamically when listings change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Custom Marker component to auto-trigger popups programmatically on hover
function HoverableMarker({ 
  prop, 
  isHighlighted, 
  icon 
}: { 
  prop: PropertyItem; 
  isHighlighted: boolean; 
  icon: L.DivIcon 
}) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (markerRef.current) {
      if (isHighlighted) {
        markerRef.current.openPopup();
      } else {
        markerRef.current.closePopup();
      }
    }
  }, [isHighlighted]);

  const fallbackImg = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&auto=format&fit=crop&q=60';
  const imgUrl = prop.images && prop.images.length > 0 ? prop.images[0] : fallbackImg;
  const primaryLocality = prop.location ? prop.location.split(',')[0] : '';

  return (
    <Marker
      ref={markerRef}
      position={[prop.latitude, prop.longitude]}
      icon={icon}
    >
      <Popup closeButton={false} autoClose={false} closeOnClick={false}>
        <div className="map-popup-content-exact">
          <div className="popup-img-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl} alt={prop.title} className="popup-mini-img" />
          </div>
          <div className="popup-text-box">
            <h5 className="popup-mini-title" title={prop.title}>
              {prop.title.length > 32 ? `${prop.title.slice(0, 32)}...` : prop.title}
            </h5>
            <p className="popup-mini-location">{primaryLocality}</p>
            <p className="popup-mini-price">₹ {prop.price.toLocaleString('en-IN')}/ month</p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapView({ properties, highlightedId }: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="map-loading">Loading Map...</div>;
  }

  const defaultCenter: [number, number] = [17.4401, 78.3489]; // Hyderabad default
  const center: [number, number] = properties.length > 0 && properties[0].latitude && properties[0].longitude
    ? [properties[0].latitude, properties[0].longitude]
    : defaultCenter;

  // Premium custom marker icon using pure HTML/CSS
  const createPinIcon = (isHighlighted: boolean) => {
    return L.divIcon({
      html: `<div class="custom-map-pin ${isHighlighted ? 'highlighted' : ''}">
               <div class="pin-inner"></div>
             </div>`,
      className: 'custom-pin-wrapper',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} />
        {properties.map((prop) => {
          if (!prop.latitude || !prop.longitude) return null;
          const isHighlighted = prop.id === highlightedId;
          return (
            <HoverableMarker
              key={prop.id}
              prop={prop}
              isHighlighted={isHighlighted}
              icon={createPinIcon(isHighlighted)}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
