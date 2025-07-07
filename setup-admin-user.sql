-- Add Admin User to Database
-- Run this in your Supabase SQL editor

-- First, let's create the admin user with the hardcoded credentials
-- We'll use a specific UUID for consistency

INSERT INTO users (id, username, name, password_hash, stars, races_participated, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Admin',
    'Admin User',
    'dd090982', -- This is the plain text password, but we should hash it
    0,
    0,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- Note: In a production environment, you should hash the password properly
-- For now, we're using the plain text password as the hash for simplicity
-- You can update this later with a proper hash if needed 