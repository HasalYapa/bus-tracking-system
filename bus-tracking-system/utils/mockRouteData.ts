export const ROUTE_138_POLYLINE = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [
      [79.8612, 6.9271], // Fort
      [79.8650, 6.9250],
      [79.8700, 6.9200], // Town Hall area
      [79.8800, 6.9100],
      [79.8900, 6.9000], // Nugegoda approach
      [79.9000, 6.8900],
      [79.9100, 6.8800], // Maharagama
      [79.9200, 6.8700],
      [79.9300, 6.8600], // Kottawa
      [79.9400, 6.8500], // Homagama
    ]
  }
};

export const BUS_STOPS = [
  { id: "stop_1", name: "Fort Main", location: [79.8612, 6.9271] },
  { id: "stop_2", name: "Town Hall", location: [79.8700, 6.9200] },
  { id: "stop_3", name: "Nugegoda", location: [79.8900, 6.9000] },
  { id: "stop_4", name: "Maharagama", location: [79.9100, 6.8800] },
  { id: "stop_5", name: "Homagama", location: [79.9400, 6.8500] },
];

/**
 * Ghost Ride Path: Colombo Fort -> Nugegoda
 * Includes a simulated stop at a bus stop.
 */
export const GHOST_RIDE_PATH = [
  // Moving: Fort to Town Hall (Speed ~30-40 km/h)
  { lat: 6.9271, lng: 79.8612, speed: 8.3, timestamp: 0 }, // 30 km/h
  { lat: 6.9265, lng: 79.8620, speed: 9.7, timestamp: 1000 },
  { lat: 6.9258, lng: 79.8630, speed: 11.1, timestamp: 2000 }, // 40 km/h
  { lat: 6.9250, lng: 79.8640, speed: 10.0, timestamp: 3000 },
  { lat: 6.9240, lng: 79.8650, speed: 9.0, timestamp: 4000 },

  // ... approaching a known stop (let's say Town Hall area, close to [79.8700, 6.9200])
  { lat: 6.9210, lng: 79.8690, speed: 5.5, timestamp: 5000 }, // Slowing down

  // STOPPED Sequence (45 seconds at ~same location)
  // Location: [6.9200, 79.8700] matches a stop in our mockRouteData (Town Hall)
  ...Array.from({ length: 45 }, (_, i) => ({
    lat: 6.9200 + (Math.random() * 0.0001 - 0.00005), // Tiny GPS jitter
    lng: 79.8700 + (Math.random() * 0.0001 - 0.00005),
    speed: 0, // Stopped
    timestamp: 6000 + (i * 1000)
  })),

  // Moving again: Town Hall -> Borella
  // Moving again: Town Hall -> Borella -> Nugegoda (Speed ~40 km/h)
  { lat: 6.9190, lng: 79.8710, speed: 5.0, timestamp: 52000 },
  { lat: 6.9100, lng: 79.8800, speed: 11.1, timestamp: 60000 }, // Borella
  { lat: 6.9000, lng: 79.8900, speed: 11.1, timestamp: 120000 }, // Approaching Nugegoda

  // STOP: Nugegoda (45s)
  ...Array.from({ length: 45 }, (_, i) => ({
    lat: 6.8900 + (Math.random() * 0.0001 - 0.00005),
    lng: 79.9000 + (Math.random() * 0.0001 - 0.00005),
    speed: 0,
    timestamp: 125000 + (i * 1000)
  })),

  // Moving: Nugegoda -> Maharagama
  { lat: 6.8850, lng: 79.9050, speed: 10.0, timestamp: 175000 },
  { lat: 6.8800, lng: 79.9100, speed: 12.0, timestamp: 240000 }, // Approaching Maharagama

  // STOP: Maharagama (45s)
  ...Array.from({ length: 45 }, (_, i) => ({
    lat: 6.8800 + (Math.random() * 0.0001 - 0.00005),
    lng: 79.9100 + (Math.random() * 0.0001 - 0.00005),
    speed: 0,
    timestamp: 245000 + (i * 1000)
  })),

  // Moving: Maharagama -> Homagama (End)
  { lat: 6.8600, lng: 79.9300, speed: 12.0, timestamp: 300000 }, // Kottawa
  { lat: 6.8500, lng: 79.9400, speed: 8.0, timestamp: 360000 }, // Homagama Arrival

  // STOP: Homagama (45s)
  ...Array.from({ length: 45 }, (_, i) => ({
    lat: 6.8500 + (Math.random() * 0.0001 - 0.00005),
    lng: 79.9400 + (Math.random() * 0.0001 - 0.00005),
    speed: 0,
    timestamp: 365000 + (i * 1000)
  })),
];
