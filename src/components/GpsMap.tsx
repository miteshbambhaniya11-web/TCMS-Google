'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Trip, localDb } from '@/db/localDb';

interface GpsMapProps {
  activeTrip: Trip | null;
  tripsList: Trip[];
  onGeofenceTrigger: (tripId: string, status: string) => void;
}

export default function GpsMap({ activeTrip, tripsList, onGeofenceTrigger }: GpsMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.00, 70.80]);
  const [zoom, setZoom] = useState(8);

  // Standard route track coordinates from Mundra to Ahmedabad
  const routePath: [number, number][] = [
    [22.842, 69.721], // Mundra Port
    [22.981, 70.125], // Gandhidham
    [23.151, 70.521], // Samakhiali Bypass
    [23.003, 70.812], // Active marker 1
    [22.894, 70.925], // Active marker 2
    [23.011, 71.551], // Viramgam Toll
    [23.023, 72.581], // Sanand, Ahmedabad
  ];

  // Geofence settings
  const pickupCenter: [number, number] = [22.842, 69.721];
  const destCenter: [number, number] = [23.023, 72.581];

  // Glowing custom HTML marker icons
  const activeTruckIcon = L.divIcon({
    html: `<div class="relative flex h-6 w-6">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-6 w-6 bg-sky-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-black text-white">TRK</span>
    </div>`,
    className: 'custom-gps-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const deviatingTruckIcon = L.divIcon({
    html: `<div class="relative flex h-6 w-6">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-6 w-6 bg-rose-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-black text-white">DEV</span>
    </div>`,
    className: 'custom-gps-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Center map on selected trip coordinates
  useEffect(() => {
    if (activeTrip && activeTrip.currentLat && activeTrip.currentLng) {
      setMapCenter([activeTrip.currentLat, activeTrip.currentLng]);
      setZoom(10);
    }
  }, [activeTrip]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-800">
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Polyline track */}
        <Polyline pathOptions={{ color: '#0284c7', weight: 4, dashArray: '5, 10' }} positions={routePath} />

        {/* Pickup Geofence */}
        <Circle 
          center={pickupCenter} 
          radius={5000} // 5 km radius
          pathOptions={{ fillColor: '#10b981', fillOpacity: 0.15, color: '#10b981', weight: 1.5 }}
        />

        {/* Destination Geofence */}
        <Circle 
          center={destCenter} 
          radius={5000} 
          pathOptions={{ fillColor: '#ef4444', fillOpacity: 0.15, color: '#ef4444', weight: 1.5 }}
        />

        {/* Active Trips markers */}
        {tripsList.filter(t => t.currentLat && t.currentLng).map(trip => {
          const isDeviating = trip.routeDeviationAlert;
          const pos: [number, number] = [trip.currentLat!, trip.currentLng!];
          const isSelected = activeTrip?.id === trip.id;
          
          return (
            <Marker 
              key={trip.id} 
              position={pos} 
              icon={isDeviating ? deviatingTruckIcon : activeTruckIcon}
            >
              <Popup>
                <div className="text-slate-900 font-sans text-xs space-y-1 p-0.5">
                  <p className="font-extrabold text-[11px] border-b pb-1 text-slate-800 flex justify-between items-center gap-4">
                    <span>{trip.tripNumber}</span>
                    <span className="font-mono text-slate-500">{(trip.currentSpeed || 50)} km/h</span>
                  </p>
                  <p className="font-semibold text-slate-700">Material: {trip.material}</p>
                  <p className="text-slate-500 font-semibold">{trip.pickup} → {trip.destination}</p>
                  
                  {isDeviating && (
                    <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[9px] font-bold block text-center border border-rose-200 mt-1 animate-pulse">
                      ROUTE DEVIATION ALERT
                    </span>
                  )}

                  {/* Geofence trigger simulations */}
                  <div className="flex gap-1.5 pt-2 border-t mt-2">
                    <button
                      onClick={() => onGeofenceTrigger(trip.id, 'Reached Destination')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[9px] transition-all"
                    >
                      Trigger Reached Geofence
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
