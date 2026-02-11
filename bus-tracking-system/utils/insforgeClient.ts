// Custom InsForge Client Implementation using Fetch API
// This bypasses the need for the 'insforge' package which is a monorepo root
// and implements a PostgREST-compatible client.

interface InsForgeConfig {
    project: string;
    apiKey: string;
    baseUrl?: string;
}

class InsForge {
    private config: InsForgeConfig;
    private baseUrl: string;

    constructor(config: InsForgeConfig) {
        this.config = config;
        this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_INSFORGE_BASE_URL || 'http://localhost:8000';

        if (!this.config.project || !this.config.apiKey) {
            console.warn('[InsForge] Missing Project ID or API Key. Check .env.local');
        } else {
            console.log(`[InsForge] Initialized for project: ${this.config.project} at ${this.baseUrl}`);
        }
    }

    private get headers() {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation' // Standard PostgREST header
        };

        if (this.config.apiKey.startsWith('ik_')) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        } else {
            headers['x-api-key'] = this.config.apiKey;
        }
        return headers;
    }

    database() {
        return {
            collection: (collectionName: string) => {
                return {
                    doc: (docId: string) => {
                        return {
                            set: async (data: any, options?: { merge: boolean }) => {
                                // Default to upsert behavior if possible
                                // For PostgREST, we can use POST with On Conflict or PATCH if we know it exists
                                // Here we will try to use POST with Prefer: resolution=merge-duplicates if supported
                                // Or we can assume the table has a PK 'id' matching docId

                                const payload = { ...data };
                                // Ensure ID is in payload if docId is provided
                                if (docId) {
                                    payload.id = docId;
                                }

                                // Reverting to the correct path structure found in backend source: /api/database/records/:tableName
                                const url = `${this.baseUrl}/api/database/records/${collectionName}`;
                                console.log('[InsForge] Attempting to POST to:', url);

                                try {
                                    // Try POST (Insert/Upsert)
                                    // Including 'on_conflict' if the API supports it, otherwise generic POST
                                    // We add Prefer: resolution=merge-duplicates to handle upserts on PK
                                    const postHeaders = {
                                        ...this.headers,
                                        'Prefer': 'resolution=merge-duplicates, return=representation'
                                    };

                                    const response = await fetch(url, {
                                        method: 'POST',
                                        headers: postHeaders,
                                        body: JSON.stringify(payload)
                                    });

                                    if (!response.ok) {
                                        const errorText = await response.text();
                                        console.error(`[InsForge] API Error (${response.status}):`, errorText);
                                        throw new Error(`InsForge API Error: ${response.statusText}`);
                                    }

                                    // console.log(`[InsForge] Saved doc ${docId} to ${collectionName}`);
                                } catch (error) {
                                    // Do not throw, just log. This prevents the UI from crashing if backend is unreachable.
                                    console.warn('[InsForge] Network request failed (Backend might be offline or unreachable):', error);
                                }
                            }
                        };
                    },
                    where: (field: string, op: string, value: any) => {
                        return {
                            onSnapshot: (callback: (data: any[]) => void) => {
                                // Polling implementation since we don't have a real socket client here
                                const poll = async () => {
                                    try {
                                        // Construct PostgREST query
                                        // op mapping: '>' -> 'gt', '==' -> 'eq', '<' -> 'lt'
                                        let postgrestOp = 'eq';
                                        if (op === '>') postgrestOp = 'gt';
                                        if (op === '<') postgrestOp = 'lt';
                                        if (op === '>=') postgrestOp = 'gte';
                                        if (op === '<=') postgrestOp = 'lte';

                                        // Value formatting
                                        const queryValue = value instanceof Date ? value.toISOString() : value;

                                        // Reverting to the correct path: /api/database/records/:tableName
                                        const url = `${this.baseUrl}/api/database/records/${collectionName}?${field}=${postgrestOp}.${queryValue}&select=*`;

                                        const response = await fetch(url, {
                                            method: 'GET',
                                            headers: this.headers
                                        });

                                        if (response.ok) {
                                            const data = await response.json();
                                            callback(data);
                                        }
                                    } catch (error) {
                                        console.warn('[InsForge] Polling failed:', error);
                                    }
                                };

                                // Initial poll
                                poll();
                                // Poll every 5 seconds
                                const intervalId = setInterval(poll, 5000);

                                return () => clearInterval(intervalId);
                            }
                        };
                    }
                };
            }
        };
    }
}

// Initialize the InsForge client
// We use the environment variables created in .env.local
const insforge = new InsForge({
    project: process.env.NEXT_PUBLIC_INSFORGE_PROJECT_ID || '',
    apiKey: process.env.NEXT_PUBLIC_INSFORGE_API_KEY || '',
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL
});

// Database reference
const db = insforge.database();

/**
 * Sends a valid bus location update to the backend.
 * @param sessionId Unique session ID for the trip
 * @param location Current location { lat, lng }
 * @param speed Current speed in m/s
 * @param confidence Confidence score (0-1)
 */
export async function sendBusLocation(
    sessionId: string,
    location: { latitude: number; longitude: number },
    speed: number,
    confidence: number
) {
    // Only send if we have credentials
    if (!process.env.NEXT_PUBLIC_INSFORGE_API_KEY) {
        // console.log('[InsForge] Skipping update - No API Key');
        return;
    }

    try {
        await db.collection('bus_sessions').doc(sessionId).set({
            location: {
                lat: location.latitude,
                lng: location.longitude,
            },
            speed: speed,
            confidence: confidence,
            lastUpdated: new Date().toISOString(),
            routeId: '138',
        }, { merge: true });

        // console.log(`[InsForge] Bus location updated for session ${sessionId}`);
    } catch (error) {
        console.error('[InsForge] Failed to update location:', error);
    }
}

/**
 * Subscribe to real-time bus locations for the map.
 * @param callback Function to call with updated bus data
 */
export function subscribeToBusLocations(callback: (buses: any[]) => void) {
    // Only subscribe if we have credentials
    if (!process.env.NEXT_PUBLIC_INSFORGE_API_KEY) {
        return () => { };
    }

    // Subscribe to buses updated in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

    return db.collection('bus_sessions')
        .where('lastUpdated', '>', oneMinuteAgo)
        .onSnapshot((data: any[]) => {
            // Transform data if necessary? 
            // PostgREST returns array of objects, which matches our component expectation
            callback(data || []);
        });
}

export default insforge;
