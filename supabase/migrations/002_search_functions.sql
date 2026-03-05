-- 002_search_functions.sql
-- Fuzzy search functions for guests using pg_trgm
-- TASK-006: Database functions pre fuzzy search

-- Enable pg_trgm extension for trigram-based similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN index for fuzzy search on guests.full_name
CREATE INDEX IF NOT EXISTS idx_guests_full_name_trgm 
  ON guests USING GIN (full_name gin_trgm_ops);

-- GIN index for fuzzy search on guests.email (optional, useful for partial matching)
CREATE INDEX IF NOT EXISTS idx_guests_email_trgm 
  ON guests USING GIN (email gin_trgm_ops);

-- Function: search_guests
-- Searches guests by name (fuzzy/trigram) or exact email match
-- Returns up to 20 results ordered by similarity score
CREATE OR REPLACE FUNCTION search_guests(query TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.full_name,
    g.email,
    similarity(g.full_name, query) AS similarity_score
  FROM guests g
  WHERE 
    g.full_name % query  -- trigram similarity operator
    OR g.email = query   -- exact email match
  ORDER BY similarity(g.full_name, query) DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
