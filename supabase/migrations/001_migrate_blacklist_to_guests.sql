-- Migration: black_list → guests + reports
-- Run this in Supabase SQL Editor as admin

-- First, let's see what we're working with
SELECT COUNT(*) as old_records FROM black_list;

-- Create a temporary function to handle the migration with elevated privileges
CREATE OR REPLACE FUNCTION migrate_blacklist_data()
RETURNS TABLE (
    migrated_count BIGINT,
    failed_count BIGINT
) AS $$
DECLARE
    rec RECORD;
    new_guest_id UUID;
    new_report_id UUID;
    success_count BIGINT := 0;
    error_count BIGINT := 0;
    reporter_uuid UUID;
BEGIN
    -- Get the first profile as default reporter (or use a placeholder)
    SELECT id INTO reporter_uuid FROM profiles LIMIT 1;
    
    IF reporter_uuid IS NULL THEN
        -- Create a system user profile for migration
        INSERT INTO profiles (id, full_name, created_at)
        VALUES (gen_random_uuid(), 'System Migration User', NOW())
        RETURNING id INTO reporter_uuid;
    END IF;
    
    -- Loop through all black_list records
    FOR rec IN 
        SELECT 
            "id",
            "Meno",
            "Email", 
            "Telefon",
            "Co sa stalo",
            "Platforma",
            "Mesto",
            "Check in",
            "Check out",
            "Narodnost"
        FROM black_list
        ORDER BY id
    LOOP
        BEGIN
            -- Insert into guests table
            INSERT INTO guests (
                full_name,
                email,
                phone,
                created_at,
                reports_count
            ) VALUES (
                COALESCE(NULLIF(rec."Meno", ''), 'Unknown Guest'),
                NULLIF(rec."Email", ''),
                NULLIF(rec."Telefon", ''),
                NOW(),
                1
            )
            RETURNING id INTO new_guest_id;
            
            -- Insert into reports table
            IF rec."Co sa stalo" IS NOT NULL AND rec."Co sa stalo" <> '' THEN
                INSERT INTO reports (
                    guest_id,
                    reporter_id,
                    incident_type,
                    incident_date,
                    severity,
                    description,
                    platform,
                    property_name,
                    created_at
                ) VALUES (
                    new_guest_id,
                    reporter_uuid,
                    CASE 
                        WHEN rec."Co sa stalo" ILIKE '%theft%' OR rec."Co sa stalo" ILIKE '%krad%' OR rec."Co sa stalo" ILIKE '%ukrad%' THEN 'theft'
                        WHEN rec."Co sa stalo" ILIKE '%damage%' OR rec."Co sa stalo" ILIKE '%poškod%' THEN 'damage'
                        WHEN rec."Co sa stalo" ILIKE '%noise%' OR rec."Co sa stalo" ILIKE '%hluk%' THEN 'noise'
                        WHEN rec."Co sa stalo" ILIKE '%fraud%' OR rec."Co sa stalo" ILIKE '%podvod%' OR rec."Co sa stalo" ILIKE '%falošné%' THEN 'fraud'
                        ELSE 'other'
                    END,
                    COALESCE(
                        NULLIF(rec."Check out", '')::DATE,
                        NULLIF(rec."Check in", '')::DATE,
                        NOW()
                    ),
                    3, -- default severity
                    rec."Co sa stalo",
                    COALESCE(NULLIF(LOWER(rec."Platforma"), ''), 'other'),
                    rec."Mesto"
                );
            END IF;
            
            success_count := success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Failed to migrate record %: %', rec.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT success_count, error_count;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT * FROM migrate_blacklist_data();

-- Clean up the function
DROP FUNCTION IF EXISTS migrate_blacklist_data();

-- Verify results
SELECT 
    (SELECT COUNT(*) FROM black_list) as old_count,
    (SELECT COUNT(*) FROM guests) as new_guests,
    (SELECT COUNT(*) FROM reports) as new_reports;
