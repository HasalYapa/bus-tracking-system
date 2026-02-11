import { useState, useEffect, useRef, useCallback } from 'react';
import { GHOST_RIDE_PATH } from '../utils/mockRouteData';

interface GhostRideHook {
    isGhostRideActive: boolean;
    startGhostRide: () => void;
    stopGhostRide: () => void;
}

export function useGhostRide(
    onLocationUpdate: (position: GeolocationPosition) => void
): GhostRideHook {
    const [isActive, setIsActive] = useState(false);
    const indexRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startGhostRide = useCallback(() => {
        if (isActive) return;
        setIsActive(true);
        indexRef.current = 0;
    }, [isActive]);

    const stopGhostRide = useCallback(() => {
        setIsActive(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isActive) return;

        intervalRef.current = setInterval(() => {
            const point = GHOST_RIDE_PATH[indexRef.current];

            if (!point) {
                stopGhostRide(); // End of route
                return;
            }

            // Create a fake GeolocationPosition object
            const mockPosition: GeolocationPosition = {
                coords: {
                    latitude: point.lat,
                    longitude: point.lng,
                    altitude: null,
                    accuracy: 10,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: point.speed,
                    toJSON: () => { }
                },
                timestamp: Date.now(),
                toJSON: () => ({})
            };

            onLocationUpdate(mockPosition);

            // Advance index, loop or stop? Let's stop at end for now.
            if (indexRef.current < GHOST_RIDE_PATH.length - 1) {
                indexRef.current++;
            } else {
                // Loop the simulation
                indexRef.current = 0;
            }
        }, 1000); // Update every 1 second

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, onLocationUpdate, stopGhostRide]);

    return { isGhostRideActive: isActive, startGhostRide, stopGhostRide };
}
