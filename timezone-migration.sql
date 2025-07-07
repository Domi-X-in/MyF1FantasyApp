-- Timezone Migration for F1 Fantasy App
-- Phase 1: Add timezone support to races table
-- Run this migration in your Supabase SQL editor

-- Add new columns to races table
ALTER TABLE races ADD COLUMN IF NOT EXISTS race_time TIME DEFAULT '15:00:00';
ALTER TABLE races ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE races ADD COLUMN IF NOT EXISTS race_datetime_utc TIMESTAMP WITH TIME ZONE;
ALTER TABLE races ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE races ADD COLUMN IF NOT EXISTS circuit_name VARCHAR(150);

-- Create index for better performance on timezone queries
CREATE INDEX IF NOT EXISTS idx_races_race_datetime_utc ON races(race_datetime_utc);
CREATE INDEX IF NOT EXISTS idx_races_timezone ON races(timezone);

-- Function to calculate UTC datetime from date, time, and timezone
CREATE OR REPLACE FUNCTION calculate_race_datetime_utc(
    race_date DATE,
    race_time TIME,
    race_timezone VARCHAR(50)
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    local_datetime TIMESTAMP;
    utc_datetime TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Combine date and time
    local_datetime := race_date + race_time;
    
    -- Convert to UTC (simplified - in production you'd use proper timezone conversion)
    -- For now, we'll use a basic offset mapping
    CASE race_timezone
        WHEN 'Australia/Melbourne' THEN utc_datetime := local_datetime - INTERVAL '11 hours';
        WHEN 'Asia/Tokyo' THEN utc_datetime := local_datetime - INTERVAL '9 hours';
        WHEN 'Asia/Shanghai' THEN utc_datetime := local_datetime - INTERVAL '8 hours';
        WHEN 'Europe/Monaco' THEN utc_datetime := local_datetime - INTERVAL '2 hours';
        WHEN 'Europe/London' THEN utc_datetime := local_datetime - INTERVAL '1 hour';
        WHEN 'America/New_York' THEN utc_datetime := local_datetime + INTERVAL '4 hours';
        WHEN 'America/Los_Angeles' THEN utc_datetime := local_datetime + INTERVAL '7 hours';
        WHEN 'Asia/Bahrain' THEN utc_datetime := local_datetime - INTERVAL '3 hours';
        WHEN 'Asia/Qatar' THEN utc_datetime := local_datetime - INTERVAL '3 hours';
        WHEN 'Europe/Rome' THEN utc_datetime := local_datetime - INTERVAL '2 hours';
        WHEN 'Europe/Budapest' THEN utc_datetime := local_datetime - INTERVAL '2 hours';
        WHEN 'Europe/Brussels' THEN utc_datetime := local_datetime - INTERVAL '2 hours';
        WHEN 'Europe/Amsterdam' THEN utc_datetime := local_datetime - INTERVAL '2 hours';
        WHEN 'America/Mexico_City' THEN utc_datetime := local_datetime + INTERVAL '5 hours';
        WHEN 'America/Sao_Paulo' THEN utc_datetime := local_datetime + INTERVAL '3 hours';
        WHEN 'America/Las_Vegas' THEN utc_datetime := local_datetime + INTERVAL '8 hours';
        WHEN 'Asia/Singapore' THEN utc_datetime := local_datetime - INTERVAL '8 hours';
        WHEN 'Asia/Baku' THEN utc_datetime := local_datetime - INTERVAL '4 hours';
        WHEN 'Asia/Dubai' THEN utc_datetime := local_datetime - INTERVAL '4 hours';
        ELSE utc_datetime := local_datetime; -- Default to UTC
    END CASE;
    
    RETURN utc_datetime;
END;
$$ LANGUAGE plpgsql;

-- Function to get timezone for a city (F1 specific mappings)
CREATE OR REPLACE FUNCTION get_timezone_for_city(city_name VARCHAR(100))
RETURNS VARCHAR(50) AS $$
BEGIN
    CASE LOWER(city_name)
        WHEN 'melbourne' THEN RETURN 'Australia/Melbourne';
        WHEN 'suzuka' THEN RETURN 'Asia/Tokyo';
        WHEN 'shanghai' THEN RETURN 'Asia/Shanghai';
        WHEN 'monaco' THEN RETURN 'Europe/Monaco';
        WHEN 'silverstone' THEN RETURN 'Europe/London';
        WHEN 'spa' THEN RETURN 'Europe/Brussels';
        WHEN 'monza' THEN RETURN 'Europe/Rome';
        WHEN 'budapest' THEN RETURN 'Europe/Budapest';
        WHEN 'zandvoort' THEN RETURN 'Europe/Amsterdam';
        WHEN 'austin' THEN RETURN 'America/Chicago';
        WHEN 'mexico city' THEN RETURN 'America/Mexico_City';
        WHEN 'sao paulo' THEN RETURN 'America/Sao_Paulo';
        WHEN 'las vegas' THEN RETURN 'America/Las_Vegas';
        WHEN 'singapore' THEN RETURN 'Asia/Singapore';
        WHEN 'baku' THEN RETURN 'Asia/Baku';
        WHEN 'manama' THEN RETURN 'Asia/Bahrain';
        WHEN 'doha' THEN RETURN 'Asia/Qatar';
        WHEN 'abu dhabi' THEN RETURN 'Asia/Dubai';
        WHEN 'miami' THEN RETURN 'America/New_York';
        WHEN 'imola' THEN RETURN 'Europe/Rome';
        WHEN 'spielberg' THEN RETURN 'Europe/Vienna';
        WHEN 'jeddah' THEN RETURN 'Asia/Riyadh';
        WHEN 'montreal' THEN RETURN 'America/Toronto';
        WHEN 'barcelona' THEN RETURN 'Europe/Madrid';
        ELSE RETURN 'UTC';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Update existing races with timezone information and typical F1 start times
UPDATE races 
SET 
    timezone = get_timezone_for_city(city),
    race_time = CASE 
        WHEN LOWER(city) IN ('singapore', 'bahrain', 'qatar', 'abu dhabi') THEN '20:00:00'  -- Night races
        WHEN LOWER(city) IN ('las vegas') THEN '22:00:00'  -- Late night race
        WHEN LOWER(city) IN ('australia', 'japan', 'china') THEN '14:00:00'  -- Early for European TV
        ELSE '15:00:00'  -- Standard European afternoon time
    END,
    country = CASE LOWER(city)
        WHEN 'melbourne' THEN 'Australia'
        WHEN 'suzuka' THEN 'Japan'
        WHEN 'shanghai' THEN 'China'
        WHEN 'monaco' THEN 'Monaco'
        WHEN 'silverstone' THEN 'United Kingdom'
        WHEN 'spa' THEN 'Belgium'
        WHEN 'monza' THEN 'Italy'
        WHEN 'budapest' THEN 'Hungary'
        WHEN 'zandvoort' THEN 'Netherlands'
        WHEN 'austin' THEN 'United States'
        WHEN 'mexico city' THEN 'Mexico'
        WHEN 'sao paulo' THEN 'Brazil'
        WHEN 'las vegas' THEN 'United States'
        WHEN 'singapore' THEN 'Singapore'
        WHEN 'baku' THEN 'Azerbaijan'
        WHEN 'manama' THEN 'Bahrain'
        WHEN 'doha' THEN 'Qatar'
        WHEN 'abu dhabi' THEN 'United Arab Emirates'
        WHEN 'miami' THEN 'United States'
        WHEN 'imola' THEN 'Italy'
        WHEN 'spielberg' THEN 'Austria'
        WHEN 'jeddah' THEN 'Saudi Arabia'
        WHEN 'montreal' THEN 'Canada'
        WHEN 'barcelona' THEN 'Spain'
        ELSE 'Unknown'
    END,
    circuit_name = CASE LOWER(city)
        WHEN 'melbourne' THEN 'Albert Park Circuit'
        WHEN 'suzuka' THEN 'Suzuka International Racing Course'
        WHEN 'shanghai' THEN 'Shanghai International Circuit'
        WHEN 'monaco' THEN 'Circuit de Monaco'
        WHEN 'silverstone' THEN 'Silverstone Circuit'
        WHEN 'spa' THEN 'Circuit de Spa-Francorchamps'
        WHEN 'monza' THEN 'Autodromo Nazionale di Monza'
        WHEN 'budapest' THEN 'Hungaroring'
        WHEN 'zandvoort' THEN 'Circuit Zandvoort'
        WHEN 'austin' THEN 'Circuit of the Americas'
        WHEN 'mexico city' THEN 'Autódromo Hermanos Rodríguez'
        WHEN 'sao paulo' THEN 'Autódromo José Carlos Pace'
        WHEN 'las vegas' THEN 'Las Vegas Strip Circuit'
        WHEN 'singapore' THEN 'Marina Bay Street Circuit'
        WHEN 'baku' THEN 'Baku City Circuit'
        WHEN 'manama' THEN 'Bahrain International Circuit'
        WHEN 'doha' THEN 'Losail International Circuit'
        WHEN 'abu dhabi' THEN 'Yas Marina Circuit'
        WHEN 'miami' THEN 'Miami International Autodrome'
        WHEN 'imola' THEN 'Autodromo Enzo e Dino Ferrari'
        WHEN 'spielberg' THEN 'Red Bull Ring'
        WHEN 'jeddah' THEN 'Jeddah Corniche Circuit'
        WHEN 'montreal' THEN 'Circuit Gilles Villeneuve'
        WHEN 'barcelona' THEN 'Circuit de Barcelona-Catalunya'
        ELSE city
    END
WHERE timezone IS NULL OR timezone = 'UTC';

-- Calculate and update UTC datetime for all races
UPDATE races 
SET race_datetime_utc = calculate_race_datetime_utc(date, race_time, timezone)
WHERE race_datetime_utc IS NULL;

-- Create trigger to automatically calculate UTC datetime when race time/timezone changes
CREATE OR REPLACE FUNCTION update_race_datetime_utc()
RETURNS TRIGGER AS $$
BEGIN
    NEW.race_datetime_utc := calculate_race_datetime_utc(NEW.date, NEW.race_time, NEW.timezone);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_race_datetime_utc_trigger
    BEFORE INSERT OR UPDATE OF date, race_time, timezone ON races
    FOR EACH ROW EXECUTE FUNCTION update_race_datetime_utc();

-- Add comment to document the changes
COMMENT ON COLUMN races.race_time IS 'Local race start time in the race city timezone';
COMMENT ON COLUMN races.timezone IS 'IANA timezone identifier for the race city (e.g., Europe/Monaco)';
COMMENT ON COLUMN races.race_datetime_utc IS 'Race start time in UTC, automatically calculated from date, race_time, and timezone';
COMMENT ON COLUMN races.country IS 'Country where the race takes place';
COMMENT ON COLUMN races.circuit_name IS 'Official name of the racing circuit';