# Manual Verification Checklist for Timezone Migration

After running `timezone-migration.sql` in your Supabase SQL Editor, verify the migration was successful by checking the following:

## ✅ Database Schema Verification

Run this query in your Supabase SQL Editor:

```sql
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
```

**Expected Result:** You should see 5 rows showing the new columns:
- `race_time` (TIME)
- `timezone` (VARCHAR)  
- `race_datetime_utc` (TIMESTAMP WITH TIME ZONE)
- `country` (VARCHAR)
- `circuit_name` (VARCHAR)

## ✅ Timezone Data Population

Check if existing races got timezone data:

```sql
-- View races with timezone information
SELECT 
    name,
    city,
    race_time,
    timezone,
    country,
    circuit_name
FROM races 
ORDER BY date DESC 
LIMIT 10;
```

**Expected Result:** Existing races should have:
- `race_time` populated (15:00:00, 20:00:00, etc.)
- `timezone` populated (Europe/Monaco, Asia/Singapore, etc.)
- `country` and `circuit_name` filled in

## ✅ Functions Created

Verify the timezone functions were created:

```sql
-- Test timezone function
SELECT get_timezone_for_city('monaco') as monaco_timezone;
SELECT get_timezone_for_city('singapore') as singapore_timezone;
```

**Expected Result:**
- `monaco_timezone`: "Europe/Monaco"
- `singapore_timezone`: "Asia/Singapore"

## ✅ UTC Calculation Working

Test the UTC calculation:

```sql
-- Test UTC calculation
SELECT calculate_race_datetime_utc('2025-05-25'::DATE, '15:00:00'::TIME, 'Europe/Monaco') as monaco_race_utc;
```

**Expected Result:** Should return a UTC timestamp (e.g., "2025-05-25 13:00:00+00")

## ✅ Triggers Active

Check if the automatic UTC calculation trigger was created:

```sql
-- Check for trigger
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'races'
AND trigger_name = 'update_race_datetime_utc_trigger';
```

**Expected Result:** Should show the trigger exists for INSERT and UPDATE operations.

## ✅ Sample Race Data

View complete race data with all timezone fields:

```sql
-- Show sample race with all timezone data
SELECT 
    name,
    city,
    date,
    race_time,
    timezone,
    TO_CHAR(race_datetime_utc, 'YYYY-MM-DD HH24:MI:SS TZ') as utc_time,
    country,
    circuit_name
FROM races 
WHERE timezone IS NOT NULL 
ORDER BY date 
LIMIT 5;
```

**Expected Result:** Races should show complete timezone information with accurate UTC times.

---

## 🎯 Success Criteria

**✅ Migration Successful if:**
- All 5 new columns exist in races table
- Existing races have timezone data populated  
- Functions return correct timezone mappings
- UTC timestamps are calculated automatically
- Triggers are active and working

**❌ Issues to Address if:**
- Any columns are missing → Re-run migration
- Timezone data is empty → Check migration execution
- Functions don't exist → Verify SQL was executed completely
- UTC times are NULL → Check function definitions

## 🚀 Next Steps After Successful Migration

1. **Test the Frontend**: Load your F1 Fantasy app and check if race creation works
2. **Create a Test Race**: Use the enhanced admin interface to create a race with timezone
3. **Verify Countdown**: Check that the CountdownClock shows proper timezone-aware countdown
4. **Test Race Editing**: Try editing an existing race to verify Phase 4 functionality

## 🆘 Troubleshooting

**If migration failed:**
- Check for error messages in Supabase SQL Editor
- Ensure you copied the entire `timezone-migration.sql` file
- Try running the corrected version with `::TIME` casting

**If functions don't work:**
- Verify the function definitions were created
- Check for syntax errors in the function creation
- Ensure you have proper database permissions

**For additional help:**
- Check the `TIMEZONE_SYSTEM_COMPLETE.md` for comprehensive documentation
- Review `PHASE4_IMPLEMENTATION_SUMMARY.md` for detailed Phase 4 information