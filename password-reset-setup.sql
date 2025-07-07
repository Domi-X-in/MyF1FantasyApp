-- Password Reset Setup for F1 Fantasy App
-- Run this in your Supabase SQL editor

-- Add new fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_password_reset TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_reset_count INTEGER DEFAULT 0;

-- Create password reset requests table
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    new_password_hash VARCHAR(255) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_status ON password_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_password_reset_requested_at ON password_reset_requests(requested_at);

-- Create trigger for updated_at
CREATE TRIGGER update_password_reset_updated_at BEFORE UPDATE ON password_reset_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for password_reset_requests table
CREATE POLICY "Anyone can view password reset requests" ON password_reset_requests
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert password reset requests" ON password_reset_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update password reset requests" ON password_reset_requests
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete password reset requests" ON password_reset_requests
    FOR DELETE USING (true);

-- Create function to generate secure random password
CREATE OR REPLACE FUNCTION generate_secure_password(length INTEGER DEFAULT 12)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars))::integer + 1, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql; 