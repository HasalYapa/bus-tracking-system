'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { usePassengerTracking } from '@/hooks/usePassengerTracking';
import { subscribeToBusLocations } from '@/utils/insforgeClient';
import IdleScreen from '@/components/UI/IdleScreen';
import ActiveScreen from '@/components/UI/ActiveScreen';

import { useGhostRide } from '@/hooks/useGhostRide';

// Dynamically import MapLayer to avoid SSR issues with Leaflet
const MapLayer = dynamic(() => import('@/components/MapLayer'), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading Map...</div>
});

export default function Home() {
  const [simulatedPosition, setSimulatedPosition] = useState<GeolocationPosition | null>(null);
  const { startGhostRide } = useGhostRide(setSimulatedPosition);

  const { status, isBus, currentLocation, currentSpeed, nextHalt } = usePassengerTracking(simulatedPosition);
  const [buses, setBuses] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToBusLocations((data) => {
      setBuses(data);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return (
    <main className="flex h-screen flex-col bg-gray-50 relative overflow-hidden">

      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapLayer buses={buses} userLocation={currentLocation} onStartGhostRide={startGhostRide} />
      </div>

      {/* UI Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6 pb-8">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden border border-white/50 transition-all duration-500 ease-in-out">

          {/* Header Bar */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center">
            <h1 className="text-white font-bold text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Route 138 Tracker
            </h1>
            <div className={`w-3 h-3 rounded-full ${isBus ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
          </div>

          <div className="p-6">
            {!isBus ? (
              <IdleScreen status={status} />
            ) : (
              <ActiveScreen speed={currentSpeed} nextHalt={nextHalt} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
