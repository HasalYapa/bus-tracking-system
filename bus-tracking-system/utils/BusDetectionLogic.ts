import * as turf from '@turf/turf';
import { BUS_STOPS, ROUTE_138_POLYLINE } from './mockRouteData';

// Types
export interface GPSPoint {
    latitude: number;
    longitude: number;
    timestamp: number; // Unix timestamp in ms
    speed: number | null; // Speed in m/s (from Geolocation API)
}

export interface BusStop {
    id: string;
    name: string;
    location: number[]; // [lng, lat]
}

// Config
const ROUTE_MATCH_THRESHOLD_METERS = 20;
const STOP_DURATION_MIN_SEC = 30;
const STOP_DURATION_MAX_SEC = 60;
const STOP_SPEED_THRESHOLD_KMH = 5;
const STOP_MATCH_RADIUS_METERS = 30; // 30m radius around bus stop

/**
 * Filter 1: Route Matching
 * Checks if the user is within 20 meters of the Route 138 polyline.
 * @param point User's current location
 * @param routePolyline Optional route override, used for testing
 */
export function isLocationOnRoute(point: GPSPoint, routePolyline?: any): boolean {
    // Use passed route or fallback to default constant
    const route = routePolyline || ROUTE_138_POLYLINE;

    if (!point || !route) return false;

    // Turf expects [lng, lat]
    const pt = turf.point([point.longitude, point.latitude]);
    const line = turf.lineString(route.geometry.coordinates);

    const distance = turf.pointToLineDistance(pt, line, { units: 'meters' });
    return distance <= ROUTE_MATCH_THRESHOLD_METERS;
}

/**
 * Filter 2: Stop Pattern Analysis
 * Helper to check if a sequence of points indicates a bus stop event.
 * Returns the matched Bus Stop ID or null.
 */
export function analyzeStopPattern(history: GPSPoint[]): string | null {
    if (history.length < 2) return null;

    // meaningful history window: last 60 seconds
    const now = Date.now();
    const recentPoints = history.filter(p => now - p.timestamp <= 90000); // 1.5 mins buffer

    if (recentPoints.length === 0) return null;

    // Check if the latest points form a stopped sequence of sufficient duration
    // We iterate backwards from the latest point
    let stoppedDuration = 0;

    for (let i = recentPoints.length - 1; i >= 0; i--) {
        const p = recentPoints[i];
        const speedKmh = (p.speed || 0) * 3.6;

        if (speedKmh > STOP_SPEED_THRESHOLD_KMH) {
            // Found a moving point, break the sequence
            break;
        }

        // Accumulate duration logic (simplified for discrete points)
        // ideally: duration = recentPoints[length-1].timestamp - recentPoints[i].timestamp
        stoppedDuration = recentPoints[recentPoints.length - 1].timestamp - p.timestamp;
    }

    // Convert ms to sec
    const durationSec = stoppedDuration / 1000;

    if (durationSec < STOP_DURATION_MIN_SEC) return null;

    // Check proximity to known bus stops
    const currentLoc = recentPoints[recentPoints.length - 1]; // Use latest point
    const pt = turf.point([currentLoc.longitude, currentLoc.latitude]);

    for (const stop of BUS_STOPS) {
        // BUS_STOPS uses [lng, lat] format
        const stopPt = turf.point(stop.location);
        const dist = turf.distance(pt, stopPt, { units: 'meters' });

        // turf.distance returns km by default if units not specified, but we used {units: 'meters'}? 
        // Wait, turf.distance default is kilometers. We need to be careful.
        // turf.distance(from, to, {units: 'meters'}) isn't standard in all versions? 
        // Standard is degrees, radians, miles, kilometers. 
        // Actually, modern turf supports 'meters'. But let's verify or convert.
        // Turf 6 supports 'kilometers', 'miles', 'degrees', 'radians'. 
        // Better to use 'kilometers' and compare to 0.03 km (30m).

        const distKm = turf.distance(pt, stopPt, { units: 'kilometers' });
        if (distKm * 1000 <= STOP_MATCH_RADIUS_METERS) {
            return stop.id;
        }
    }

    return null;
}

/**
 * Filter 3: Cluster Validation
 * Checks if multiple users are moving together.
 * For now, this function is a placeholder for server-side logic or client-side peer matching.
 * Returns true if enough confidence from clustering.
 */
export function validateCluster(activeUsers: GPSPoint[]): boolean {
    if (activeUsers.length < 2) return false;

    // Simplified check: Are there at least 2 users within 10m?
    for (let i = 0; i < activeUsers.length; i++) {
        for (let j = i + 1; j < activeUsers.length; j++) {
            const u1 = activeUsers[i];
            const u2 = activeUsers[j];

            const p1 = turf.point([u1.longitude, u1.latitude]);
            const p2 = turf.point([u2.longitude, u2.latitude]);
            const distKm = turf.distance(p1, p2, { units: 'kilometers' });

            if (distKm * 1000 <= 10) {
                // Also check speed similarity if available
                const s1 = (u1.speed || 0);
                const s2 = (u2.speed || 0);
                // 2 m/s diff
                if (Math.abs(s1 - s2) < 2) {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Calculates the next bus halt based on current location along the route.
 * Uses turf to find relative positions on the polyline.
 */
export function getNextHalt(currentLocation: GPSPoint): string {
    if (!currentLocation) return "Unknown";

    const pt = turf.point([currentLocation.longitude, currentLocation.latitude]);
    const line = turf.lineString(ROUTE_138_POLYLINE.geometry.coordinates);

    // Get user's distance along the line (km)
    const userSnap = turf.nearestPointOnLine(line, pt, { units: 'kilometers' });
    const userDist = userSnap.properties?.location || 0;

    // Find the first stop that is "after" the user (with small buffer)
    for (const stop of BUS_STOPS) {
        const stopPt = turf.point(stop.location);
        const stopSnap = turf.nearestPointOnLine(line, stopPt, { units: 'kilometers' });
        const stopDist = stopSnap.properties?.location || 0;

        // If stop is ahead of user by at least 100m (0.1km)
        if (stopDist > userDist + 0.05) {
            return stop.name;
        }
    }

    // If passed all stops (or near last one), return the destination or "End of Route"
    return "Homagama (End)";
}
