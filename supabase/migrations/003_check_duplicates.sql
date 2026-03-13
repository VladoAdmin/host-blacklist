-- 003_check_duplicates.sql
-- HTB-012: Enhanced duplicate detection for blacklist entries
-- Uses pg_trgm for fuzzy name matching + exact email/phone match

-- Ensure pg_trgm is enabled (already done in 002, but safe to repeat)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for phone trigram (for potential future fuzzy phone search)
CREATE INDEX IF NOT EXISTS idx_guests_phone_trgm 
  ON guests USING GIN (phone gin_trgm_ops)
  WHERE phone IS NOT NULL;

-- Function: check_duplicates
-- Checks for potential duplicate guests based on:
--   1. Fuzzy name match (trigram similarity > 0.6)
--   2. Exact email match
--   3. Exact phone match
-- Returns matching guests with match_type indicator
CREATE OR REPLACE FUNCTION check_duplicates(
  p_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  reports_count INTEGER,
  match_type TEXT,
  name_similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (g.id)
    g.id,
    g.full_name,
    g.email,
    g.phone,
    g.reports_count,
    CASE
      WHEN p_email IS NOT NULL AND p_email != '' AND g.email = p_email THEN 'email'
      WHEN p_phone IS NOT NULL AND p_phone != '' AND g.phone = p_phone THEN 'phone'
      ELSE 'name'
    END AS match_type,
    similarity(g.full_name, p_name) AS name_similarity
  FROM guests g
  WHERE 
    -- Fuzzy name match (similarity > 0.6)
    (similarity(g.full_name, p_name) > 0.6)
    -- Exact email match
    OR (p_email IS NOT NULL AND p_email != '' AND g.email = p_email)
    -- Exact phone match
    OR (p_phone IS NOT NULL AND p_phone != '' AND g.phone = p_phone)
  ORDER BY g.id, 
    -- Priority: exact matches first, then by similarity
    CASE
      WHEN p_email IS NOT NULL AND p_email != '' AND g.email = p_email THEN 0
      WHEN p_phone IS NOT NULL AND p_phone != '' AND g.phone = p_phone THEN 1
      ELSE 2
    END,
    similarity(g.full_name, p_name) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
