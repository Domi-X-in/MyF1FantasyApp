-- Race Status Migration for F1 Fantasy App
-- Phase 1: Add RaceStatus enum and update races table
-- Run this migration in your Supabase SQL editor

-- Create RaceStatus enum
CREATE TYPE race_status AS ENUM ('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Add race_status column to races table
ALTER TABLE races ADD COLUMN IF NOT EXISTS race_status race_status DEFAULT 'UPCOMING';

-- Create index for better performance on race status queries
CREATE INDEX IF NOT EXISTS idx_races_race_status ON races(race_status);

-- Function to automatically update race status based on time and results
CREATE OR REPLACE FUNCTION update_race_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If race has results, it's COMPLETED
    IF NEW.results IS NOT NULL AND jsonb_typeof(NEW.results) = 'object' THEN
        NEW.race_status := 'COMPLETED';
    -- If race time has passed but no results, it's IN_PROGRESS
    ELSIF NEW.race_datetime_utc IS NOT NULL AND NEW.race_datetime_utc <= NOW() THEN
        NEW.race_status := 'IN_PROGRESS';
    -- Otherwise, it's UPCOMING
    ELSE
        NEW.race_status := 'UPCOMING';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update race status
CREATE TRIGGER update_race_status_trigger
    BEFORE INSERT OR UPDATE OF date, race_time, timezone, results, race_datetime_utc ON races
    FOR EACH ROW EXECUTE FUNCTION update_race_status();

-- Function to manually set race status (for admin override)
CREATE OR REPLACE FUNCTION set_race_status(race_id UUID, new_status race_status)
RETURNS VOID AS $$
BEGIN
    UPDATE races 
    SET race_status = new_status, updated_at = NOW()
    WHERE id = race_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get races by status
CREATE OR REPLACE FUNCTION get_races_by_status(status_filter race_status DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    city VARCHAR(100),
    date DATE,
    race_status race_status,
    race_time TIME,
    timezone VARCHAR(50),
    race_datetime_utc TIMESTAMP WITH TIME ZONE,
    country VARCHAR(100),
    circuit_name VARCHAR(150),
    results JSONB,
    star_winners TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.city,
        r.date,
        r.race_status,
        r.race_time,
        r.timezone,
        r.race_datetime_utc,
        r.country,
        r.circuit_name,
        r.results,
        r.star_winners,
        r.created_at,
        r.updated_at
    FROM races r
    WHERE status_filter IS NULL OR r.race_status = status_filter
    ORDER BY r.date ASC, r.race_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming race (first race that hasn't started)
CREATE OR REPLACE FUNCTION get_upcoming_race()
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    city VARCHAR(100),
    date DATE,
    race_status race_status,
    race_time TIME,
    timezone VARCHAR(50),
    race_datetime_utc TIMESTAMP WITH TIME ZONE,
    country VARCHAR(100),
    circuit_name VARCHAR(150),
    results JSONB,
    star_winners TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.city,
        r.date,
        r.race_status,
        r.race_time,
        r.timezone,
        r.race_datetime_utc,
        r.country,
        r.circuit_name,
        r.results,
        r.star_winners,
        r.created_at,
        r.updated_at
    FROM races r
    WHERE r.race_status IN ('UPCOMING', 'IN_PROGRESS')
    ORDER BY r.race_datetime_utc ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get completed races
CREATE OR REPLACE FUNCTION get_completed_races()
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    city VARCHAR(100),
    date DATE,
    race_status race_status,
    race_time TIME,
    timezone VARCHAR(50),
    race_datetime_utc TIMESTAMP WITH TIME ZONE,
    country VARCHAR(100),
    circuit_name VARCHAR(150),
    results JSONB,
    star_winners TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.city,
        r.date,
        r.race_status,
        r.race_time,
        r.timezone,
        r.race_datetime_utc,
        r.country,
        r.circuit_name,
        r.results,
        r.star_winners,
        r.created_at,
        r.updated_at
    FROM races r
    WHERE r.race_status = 'COMPLETED'
    ORDER BY r.date DESC, r.race_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if predictions are allowed for a race
CREATE OR REPLACE FUNCTION is_prediction_allowed(race_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    race_status_val race_status;
BEGIN
    SELECT r.race_status INTO race_status_val
    FROM races r
    WHERE r.id = race_id;
    
    -- Predictions are only allowed for UPCOMING races
    RETURN race_status_val = 'UPCOMING';
END;
$$ LANGUAGE plpgsql;

-- Function to get race status description
CREATE OR REPLACE FUNCTION get_race_status_description(status race_status)
RETURNS TEXT AS $$
BEGIN
    CASE status
        WHEN 'UPCOMING' THEN RETURN 'Predictions open. Race has not started.';
        WHEN 'IN_PROGRESS' THEN RETURN 'Race has started. Predictions locked but still visible.';
        WHEN 'COMPLETED' THEN RETURN 'Admin has submitted results. Show results and scores.';
        WHEN 'CANCELLED' THEN RETURN 'Race has been cancelled.';
        ELSE RETURN 'Unknown status.';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Update existing races to have appropriate status
-- Races with results are COMPLETED
UPDATE races 
SET race_status = 'COMPLETED'
WHERE results IS NOT NULL AND jsonb_typeof(results) = 'object';

-- Races that have passed their time but no results are IN_PROGRESS
UPDATE races 
SET race_status = 'IN_PROGRESS'
WHERE race_datetime_utc IS NOT NULL 
  AND race_datetime_utc <= NOW() 
  AND (results IS NULL OR jsonb_typeof(results) != 'object');

-- All other races are UPCOMING (this is the default, but let's be explicit)
UPDATE races 
SET race_status = 'UPCOMING'
WHERE race_status IS NULL;

-- Add comments to document the new columns and functions
COMMENT ON COLUMN races.race_status IS 'Current status of the race: UPCOMING, IN_PROGRESS, COMPLETED, or CANCELLED';
COMMENT ON FUNCTION update_race_status() IS 'Automatically updates race status based on time and results';
COMMENT ON FUNCTION set_race_status(UUID, race_status) IS 'Manually set race status (admin override)';
COMMENT ON FUNCTION get_races_by_status(race_status) IS 'Get races filtered by status';
COMMENT ON FUNCTION get_upcoming_race() IS 'Get the next race that is UPCOMING or IN_PROGRESS';
COMMENT ON FUNCTION get_completed_races() IS 'Get all races with COMPLETED status';
COMMENT ON FUNCTION is_prediction_allowed(UUID) IS 'Check if predictions are allowed for a race';
COMMENT ON FUNCTION get_race_status_description(race_status) IS 'Get human-readable description of race status';

-- Create a view for easier querying of race status information
CREATE OR REPLACE VIEW race_status_view AS
SELECT 
    r.id,
    r.name,
    r.city,
    r.date,
    r.race_status,
    r.race_time,
    r.timezone,
    r.race_datetime_utc,
    r.country,
    r.circuit_name,
    r.results,
    r.star_winners,
    get_race_status_description(r.race_status) as status_description,
    CASE 
        WHEN r.race_status = 'UPCOMING' THEN '🔓 Open'
        WHEN r.race_status = 'IN_PROGRESS' THEN '🔒 In Progress'
        WHEN r.race_status = 'COMPLETED' THEN '✅ Completed'
        WHEN r.race_status = 'CANCELLED' THEN '❌ Cancelled'
    END as status_icon,
    CASE 
        WHEN r.race_status = 'UPCOMING' THEN 'blue'
        WHEN r.race_status = 'IN_PROGRESS' THEN 'yellow'
        WHEN r.race_status = 'COMPLETED' THEN 'green'
        WHEN r.race_status = 'CANCELLED' THEN 'red'
    END as status_color,
    r.created_at,
    r.updated_at
FROM races r
ORDER BY r.date ASC, r.race_time ASC;

-- Add comment to the view
COMMENT ON VIEW race_status_view IS 'Comprehensive view of races with status information and descriptions'; 