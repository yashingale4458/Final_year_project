-- AntiCheat Vision System - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== Tables ====================

-- Cameras table: Store registered camera information
CREATE TABLE IF NOT EXISTS cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stream_url TEXT NOT NULL,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'disconnected',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exam sessions table: Track exam sessions
CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Incidents table: Store detected cheating incidents
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID REFERENCES cameras(id) ON DELETE CASCADE,
    session_id UUID REFERENCES exam_sessions(id) ON DELETE SET NULL,
    behaviors TEXT[] NOT NULL,
    confidence FLOAT NOT NULL,
    snapshot_url TEXT,
    snapshot_path TEXT,
    track_id INTEGER,
    yaw FLOAT,
    pitch FLOAT,
    roll FLOAT,
    detected_at TIMESTAMPTZ DEFAULT now(),
    reviewed BOOLEAN DEFAULT false,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Detection settings table: Store per-camera or global settings
CREATE TABLE IF NOT EXISTS detection_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID REFERENCES cameras(id) ON DELETE CASCADE,
    yaw_threshold FLOAT DEFAULT 15.0,
    look_duration FLOAT DEFAULT 0.5,
    proximity_pix INTEGER DEFAULT 150,
    proximity_duration FLOAT DEFAULT 2.0,
    frame_skip INTEGER DEFAULT 5,
    confidence_threshold FLOAT DEFAULT 0.25,
    gaze_threshold FLOAT DEFAULT 0.3,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== Indexes ====================

-- Index for quick incident queries by camera
CREATE INDEX IF NOT EXISTS idx_incidents_camera ON incidents(camera_id);

-- Index for incident queries by timestamp
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at DESC);

-- Index for incident queries by session
CREATE INDEX IF NOT EXISTS idx_incidents_session ON incidents(session_id);

-- Index for cameras by status
CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);

-- ==================== Row Level Security ====================

-- Enable RLS on all tables
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to view cameras"
    ON cameras FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert cameras"
    ON cameras FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update cameras"
    ON cameras FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete cameras"
    ON cameras FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to view incidents"
    ON incidents FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role to insert incidents"
    ON incidents FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view exam sessions"
    ON exam_sessions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to manage exam sessions"
    ON exam_sessions FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view detection settings"
    ON detection_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to manage detection settings"
    ON detection_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ==================== Storage Bucket ====================

-- Create storage bucket for incident snapshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-snapshots', 'incident-snapshots', false)
ON CONFLICT (id) DO NOTHING;

-- Policy for reading snapshots
CREATE POLICY "Allow authenticated users to view snapshots"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'incident-snapshots');

-- Policy for uploading snapshots (service role only)
CREATE POLICY "Allow service role to upload snapshots"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'incident-snapshots');

-- ==================== Functions ====================

-- Function to get incident statistics
CREATE OR REPLACE FUNCTION get_incident_stats(
    p_session_id UUID DEFAULT NULL,
    p_start_time TIMESTAMPTZ DEFAULT NULL,
    p_end_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    total_incidents BIGINT,
    cameras_with_incidents BIGINT,
    behavior_type TEXT,
    behavior_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_incidents,
        COUNT(DISTINCT camera_id) as cameras_with_incidents,
        behavior.behavior_type,
        behavior.behavior_count
    FROM incidents
    CROSS JOIN LATERAL (
        SELECT
            unnest(behaviors) as behavior_type,
            COUNT(*) as behavior_count
        FROM incidents i2
        WHERE i2.id = incidents.id
        GROUP BY unnest(behaviors)
    ) as behavior
    WHERE
        (p_session_id IS NULL OR session_id = p_session_id)
        AND (p_start_time IS NULL OR detected_at >= p_start_time)
        AND (p_end_time IS NULL OR detected_at <= p_end_time)
    GROUP BY behavior.behavior_type, behavior.behavior_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to cameras table
CREATE TRIGGER update_cameras_updated_at
    BEFORE UPDATE ON cameras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Apply trigger to detection_settings table
CREATE TRIGGER update_detection_settings_updated_at
    BEFORE UPDATE ON detection_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ==================== Sample Data (Optional) ====================

-- Insert a sample camera (remove in production)
-- INSERT INTO cameras (name, stream_url, location)
-- VALUES ('Room 101 Camera', 'rtsp://192.168.1.100:554/stream', 'Room 101');

-- ==================== Comments ====================

COMMENT ON TABLE cameras IS 'Stores registered camera information for the surveillance system';
COMMENT ON TABLE exam_sessions IS 'Tracks individual exam sessions for grouping incidents';
COMMENT ON TABLE incidents IS 'Stores detected cheating incidents with snapshots and metadata';
COMMENT ON TABLE detection_settings IS 'Configurable detection thresholds per camera or globally';