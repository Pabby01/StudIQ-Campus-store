-- Create sessions table for secure RLS
CREATE TABLE IF NOT EXISTS secure_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_secure_sessions_user ON secure_sessions(user_address);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_id ON secure_sessions(id);

-- Update RLS policies for profiles to use the session ID
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;

CREATE POLICY "profiles_update_self" ON profiles 
FOR UPDATE 
USING (
  address IN (
    SELECT user_address 
    FROM secure_sessions 
    WHERE id::text = current_setting('request.header.sid', true)
    AND expires_at > NOW()
  )
) 
WITH CHECK (
  address IN (
    SELECT user_address 
    FROM secure_sessions 
    WHERE id::text = current_setting('request.header.sid', true)
    AND expires_at > NOW()
  )
);

-- Also secure SELECT if needed (users should only see their own private profile info)
DROP POLICY IF EXISTS "profiles_read_self" ON profiles;
CREATE POLICY "profiles_read_self" ON profiles
FOR SELECT
USING (
  address IN (
    SELECT user_address 
    FROM secure_sessions 
    WHERE id::text = current_setting('request.header.sid', true)
    AND expires_at > NOW()
  )
);
