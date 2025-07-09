-- Verification script for timezone migration
-- Run this after executing timezone-migration.sql to verify success

-- Check if all new columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'races' 
AND column_name IN ('race_time', 'timezone', 'race_datetime_utc', 'country', 'circuit_name')
ORDER BY ordinal_position;

-- Check if timezone data was populated for existing races
SELECT 
    id,
    name,
    city,
    date,
    race_time,
    timezone,
    race_datetime_utc,
    country,
    circuit_name
FROM races 
ORDER BY date DESC 
LIMIT 10;

-- Count races with timezone data
SELECT 
    COUNT(*) as total_races,
    COUNT(race_time) as races_with_time,
    COUNT(timezone) as races_with_timezone,
    COUNT(race_datetime_utc) as races_with_utc,
    ROUND(COUNT(race_time) * 100.0 / COUNT(*), 2) as percentage_complete
FROM races;

-- Check if triggers were created
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'races'
AND trigger_name = 'update_race_datetime_utc_trigger';

-- Test timezone function
SELECT get_timezone_for_city('monaco') as monaco_timezone;
SELECT get_timezone_for_city('singapore') as singapore_timezone;
SELECT get_timezone_for_city('las vegas') as vegas_timezone;

-- Test UTC calculation function
SELECT calculate_race_datetime_utc('2025-05-25'::DATE, '15:00:00'::TIME, 'Europe/Monaco') as monaco_race_utc;

-- Show sample of race data with all timezone fields
SELECT 
    name,
    city,
    race_time,
    timezone,
    TO_CHAR(race_datetime_utc, 'YYYY-MM-DD HH24:MI:SS TZ') as utc_time,
    country,
    circuit_name
FROM races 
WHERE timezone IS NOT NULL 
ORDER BY date 
LIMIT 5;