'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { ROUTE_138_POLYLINE, BUS_STOPS } from '../utils/mockRouteData';

// Fix for default marker// No changes yet, just reading first to be safe.let + Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
});

// Bus icon (distinctive)
const busIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', // Placeholder bus icon
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

interface MapLayerProps {
    buses: any[]; // Array of inferred buses
    userLocation?: { latitude: number; longitude: number; heading?: number } | null;
    onStartGhostRide?: () => void;
}

export default function MapLayer({ buses, userLocation, onStartGhostRide }: MapLayerProps) {
    // Swap lat/lng for Leaflet (GeoJSON is [lng, lat], Leaflet wants [lat, lng])
    const routePositions: [number, number][] = ROUTE_138_POLYLINE.geometry.coordinates.map(
        (coord) => [coord[1], coord[0]] as [number, number]
    );

    return (
        <MapContainer
            center={[6.9271, 79.8612]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User Location Marker */}
            {userLocation && (
                <Marker
                    position={[userLocation.latitude, userLocation.longitude]}
                    icon={L.divIcon({
                        className: 'user-marker',
                        html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                    })}
                >
                    <Popup>You are here</Popup>
                </Marker>
            )}

            {/* Route Polyline */}
            <Polyline positions={routePositions} color="blue" weight={5} opacity={0.7} />

            {/* Bus Stops */}
            {BUS_STOPS.map((stop) => (
                <Marker
                    key={stop.id}
                    position={[stop.location[1], stop.location[0]]}
                    icon={defaultIcon}
                >
                    <Popup>{stop.name}</Popup>
                </Marker>
            ))}

            {/* Inferred Buses */}
            {buses.map((bus) => (
                <Marker
                    key={bus.id}
                    position={[bus.location.lat, bus.location.lng]}
                    icon={busIcon}
                >
                    <Popup>
                        <strong>Route 138 Bus</strong><br />
                        Speed: {Math.round((bus.speed || 0) * 3.6)} km/h<br />
                        Confidence: {Math.round(bus.confidence * 100)}%
                    </Popup>
                </Marker>
            ))}
            {/* Dev Mode: Ghost Ride Button */}
            {process.env.NODE_ENV === 'development' && onStartGhostRide && (
                <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', zIndex: 1000 }}>
                    <div className="leaflet-control leaflet-bar">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onStartGhostRide();
                            }}
                            className="bg-red-600 text-white font-bold py-2 px-4 rounded shadow-lg hover:bg-red-700 transition-colors"
                            style={{ cursor: 'pointer' }}
                        >
                            👻 Ghost Ride
                        </button>
                    </div>
                </div>
            )}
        </MapContainer>
    );
}
