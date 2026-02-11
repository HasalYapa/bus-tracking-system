import { isLocationOnRoute, analyzeStopPattern, validateCluster, GPSPoint } from '../utils/BusDetectionLogic';
import { ROUTE_138_POLYLINE, BUS_STOPS } from '../utils/mockRouteData';

async function runTests() {
    console.log('--- Starting Bus Detection Logic Tests ---');

    // Test 1: Route Matching
    console.log('\n[Filter 1] Testing Route Matching...');

    // Point exactly on route (first coordinate of polyline)
    const [lng, lat] = ROUTE_138_POLYLINE.geometry.coordinates[0];
    const pointOnRoute: GPSPoint = {
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
        speed: 10
    };

    // Point slightly off route (should be within 20m)
    // 0.0001 deg is approx 11m
    const pointNearRoute: GPSPoint = {
        latitude: lat + 0.0001,
        longitude: lng,
        timestamp: Date.now(),
        speed: 10
    };

    // Point far off route
    const pointFarOffRoute: GPSPoint = {
        latitude: lat + 0.01, // ~1km away
        longitude: lng,
        timestamp: Date.now(),
        speed: 10
    };

    console.log('On Route (Expected: true):', isLocationOnRoute(pointOnRoute));
    console.log('Near Route (Expected: true):', isLocationOnRoute(pointNearRoute));
    console.log('Far Off Route (Expected: false):', isLocationOnRoute(pointFarOffRoute));


    // Test 2: Stop Pattern Analysis
    console.log('\n[Filter 2] Testing Stop Pattern Analysis...');

    // Create history at a known stop location
    const stop1 = BUS_STOPS[0];
    const stopLoc = { lat: stop1.location[1], lng: stop1.location[0] };

    const historyAtStop: GPSPoint[] = [];
    const now = Date.now();

    // Generate 4 points over 40 seconds (meeting 30s min duration) at low speed
    for (let i = 0; i < 4; i++) {
        historyAtStop.push({
            latitude: stopLoc.lat,
            longitude: stopLoc.lng,
            timestamp: now - (40000 - i * 10000), // 40s ago, 30s ago, 20s ago, 10s ago
            speed: 0 // stopped
        });
    }

    const detectedStop = analyzeStopPattern(historyAtStop);
    console.log(`Detected Stop ID (Expected: ${stop1.id}):`, detectedStop);

    // Test moving history (should be null)
    const historyMoving: GPSPoint[] = historyAtStop.map(p => ({ ...p, speed: 10 })); // fast speed
    console.log('Moving at Stop (Expected: null):', analyzeStopPattern(historyMoving));


    // Test 3: Cluster Validation
    console.log('\n[Filter 3] Testing Cluster Validation...');

    const user1 = pointOnRoute;
    const user2 = { ...pointOnRoute, latitude: pointOnRoute.latitude + 0.00005 }; // extremely close

    console.log('Two users close together (Expected: true):', validateCluster([user1, user2]));

    const user3 = { ...pointOnRoute, latitude: pointOnRoute.latitude + 0.001 }; // ~100m away
    console.log('Two users far apart (Expected: false):', validateCluster([user1, user3]));

    console.log('\n--- Tests Completed ---');
}

runTests().catch(console.error);
