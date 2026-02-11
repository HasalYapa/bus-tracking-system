-- Run this SQL in your InsForge Project Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS bus_sessions (
    id TEXT PRIMARY KEY,
    location JSONB,
    speed REAL,
    confidence REAL,
    "lastUpdated" TIMESTAMPTZ DEFAULT NOW(),
    "routeId" TEXT
);

-- Enable Row Level Security (RLS) if needed, or leave it off for dev
ALTER TABLE bus_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for development (adjust for production!)
CREATE POLICY "Allow public read-write" ON bus_sessions
FOR ALL
USING (true)
WITH CHECK (true);
