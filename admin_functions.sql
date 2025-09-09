-- Function to get popular content
CREATE OR REPLACE FUNCTION get_popular_content()
RETURNS TABLE (
  tmdb_id integer,
  title text,
  type text,
  count bigint
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH combined AS (
    -- Get counts from watched_content
    SELECT 
      wc.tmdb_id,
      wc.title,
      wc.type,
      COUNT(*) as item_count
    FROM watched_content wc
    GROUP BY wc.tmdb_id, wc.title, wc.type
    
    UNION ALL
    
    -- Get counts from watchlist
    SELECT 
      wl.tmdb_id,
      wl.title,
      wl.type,
      COUNT(*) as item_count
    FROM watchlist wl
    GROUP BY wl.tmdb_id, wl.title, wl.type
  )
  
  -- Aggregate the combined results
  SELECT 
    c.tmdb_id,
    c.title,
    c.type,
    SUM(c.item_count) as count
  FROM combined c
  GROUP BY c.tmdb_id, c.title, c.type
  ORDER BY count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_popular_content() TO authenticated;

-- Function to get user activity
CREATE OR REPLACE FUNCTION get_user_activity()
RETURNS TABLE (
  date text,
  watched_count bigint,
  watchlist_count bigint
) SECURITY DEFINER
AS $$
DECLARE
  current_date date;
  i integer;
BEGIN
  FOR i IN 0..29 LOOP
    current_date := (CURRENT_DATE - i::integer);
    
    RETURN QUERY
    SELECT 
      current_date::text as date,
      (
        SELECT COUNT(*) 
        FROM watched_content 
        WHERE DATE(watched_at) = current_date
      ) as watched_count,
      (
        SELECT COUNT(*) 
        FROM watchlist 
        WHERE DATE(added_at) = current_date
      ) as watchlist_count;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_activity() TO authenticated;
