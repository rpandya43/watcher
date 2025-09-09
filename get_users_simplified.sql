-- Create a simplified function to get users
CREATE OR REPLACE FUNCTION get_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
) SECURITY DEFINER
AS $$
BEGIN
  -- This is a simplified version that just returns data from profiles
  -- It doesn't require access to auth.users
  RETURN QUERY
  SELECT 
    p.id,
    p.email::text,
    p.created_at,
    p.updated_at as last_sign_in_at
  FROM profiles p
  ORDER BY p.created_at DESC;
  
  -- If no rows returned, try to get user IDs from other tables
  IF NOT FOUND THEN
    RETURN QUERY
    WITH user_ids AS (
      SELECT DISTINCT user_id as id FROM watched_content
      UNION
      SELECT DISTINCT user_id as id FROM watchlist
    )
    SELECT 
      u.id,
      'User ' || substring(u.id::text, 1, 8) || '...' as email,
      now() as created_at,
      NULL::timestamptz as last_sign_in_at
    FROM user_ids u
    LIMIT 100;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users() TO authenticated;
