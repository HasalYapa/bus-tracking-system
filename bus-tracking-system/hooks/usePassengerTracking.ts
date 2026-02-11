import { useState, useEffect, useRef, useCallback } from 'react';
import {
    isLocationOnRoute,
    analyzeStopPattern,
    getNextHalt,
    GPSPoint
} from '../utils/BusDetectionLogic';
import { sendBusLocation } from '../utils/insforgeClient';

export function usePassengerTracking(simulatedPosition?: GeolocationPosition | null) {
    // console.log("usePassengerTracking mounted - Hook fix applied");
    const [status, setStatus] = useState<string>('Initializing...');
    const [isBus, setIsBus] = useState<boolean>(false);
    const [currentLocation, setCurrentLocation] = useState<GPSPoint | null>(null);

    // Use Ref to keep history without triggering re-renders or stale closures in callback
    const historyRef = useRef<GPSPoint[]>([]);
    const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const isBusRef = useRef<boolean>(false); // Ref for immediate access in callback

    // Reusable function to process location updates (real or simulated)
    const processPosition = useCallback(async (position: GeolocationPosition) => {
        const { latitude, longitude, speed } = position.coords;
        const timestamp = position.timestamp;
        const speedKmh = (speed || 0) * 3.6;

        const newPoint: GPSPoint = {
            latitude,
            longitude,
            timestamp: timestamp || Date.now(),
            speed: speed
        };

        setCurrentLocation(newPoint);

        // Update history (keep last 50 points)
        const currentHistory = [...historyRef.current, newPoint].slice(-50);
        historyRef.current = currentHistory;

        // --- Filter 1: Route Matching ---
        const onRoute = isLocationOnRoute(newPoint);

        if (!onRoute) {
            setStatus('Not on Route 138');
            setIsBus(false);
            isBusRef.current = false;
            return;
        }

        // --- Filter 2: Stop Pattern ---
        const atStopId = analyzeStopPattern(currentHistory);

        let confidence = 0;
        if (atStopId) {
            setStatus(`Stopped at Bus Stop: ${atStopId}`);
            confidence = 0.8;
            setIsBus(true);
            isBusRef.current = true;
        } else if (onRoute && speedKmh > 15) {
            setStatus('Moving on Route 138');
            confidence = 0.5;
            // Enhanced UX: If we are moving fast on the route, assume it's a bus for the demo/UI
            setIsBus(true);
            isBusRef.current = true;
        } else if (onRoute && isBusRef.current) {
            // If we were already a bus, and we are still on route but slow (e.g. traffic or approaching stop)
            // Keep the status as "Moving" or "Traffic"
            // Don't revert to "Ghost Ride Active" or "Walking"
            setStatus('Moving on Route 138 (Slow/Traffic)');
        }

        // --- Decision to Send Data ---
        // Constraint: "Only send data to Firebase if speed > 15 km/h"
        if (speedKmh > 15) {
            // If confirmed bus OR high confidence candidate
            if (isBusRef.current || confidence > 0.4) {
                await sendBusLocation(sessionIdRef.current, { latitude, longitude }, speed || 0, confidence);
                if (isBusRef.current) setStatus('Tracking Bus: Sending Updates');
            }
        }
    }, [isBusRef, sessionIdRef, historyRef]); // Dependencies

    // Effect for Simulated Position
    useEffect(() => {
        if (simulatedPosition) {
            // setStatus('Ghost Ride Active 👻'); // REMOVED: This overwrites "Stopped at Bus Stop" every second
            processPosition(simulatedPosition);
        }
    }, [simulatedPosition, processPosition]);

    // Effect for Real Geolocation (only if NOT mocking)
    useEffect(() => {
        if (simulatedPosition) return; // Ignore real GPS if mocking

        if (!('geolocation' in navigator)) {
            setStatus('Geolocation not supported');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            processPosition, // Use the shared processor
            (error) => {
                console.error("Geolocation error:", error);
                setStatus(`Error: ${error.message}`);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [simulatedPosition, processPosition]);

    // Return current speed (converted to km/h for UI)
    const currentSpeed = currentLocation?.speed ? Math.round(currentLocation.speed * 3.6) : 0;

    // Calculate Next Halt
    const nextHalt = currentLocation ? getNextHalt(currentLocation) : "Searching...";

    return { status, isBus, currentLocation, currentSpeed, nextHalt };
}
