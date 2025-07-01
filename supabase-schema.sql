-- F1 Fantasy App Database Schema
-- Run this in your Supabase SQL editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    stars INTEGER DEFAULT 0,
    races_participated INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create races table
CREATE TABLE IF NOT EXISTS races (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    results JSONB,
    star_winners TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    first VARCHAR(10) NOT NULL,
    second VARCHAR(10) NOT NULL,
    third VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, race_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_races_date ON races(date);
CREATE INDEX IF NOT EXISTS idx_races_completed ON races(is_completed);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_race_id ON predictions(race_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete any user" ON users
    FOR DELETE USING (true);

-- Create policies for races table
CREATE POLICY "Anyone can view races" ON races
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert races" ON races
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update races" ON races
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete races" ON races
    FOR DELETE USING (true);

-- Create policies for predictions table
CREATE POLICY "Users can view all predictions" ON predictions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own predictions" ON predictions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own predictions" ON predictions
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete any predictions" ON predictions
    FOR DELETE USING (true);

-- Create function to calculate user stats
CREATE OR REPLACE FUNCTION calculate_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_races BIGINT,
    total_score INTEGER,
    average_score NUMERIC,
    perfect_matches BIGINT,
    star_wins BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT p.race_id) as total_races,
        COALESCE(SUM(
            CASE 
                WHEN p.first = r.results->>'first' AND p.second = r.results->>'second' AND p.third = r.results->>'third' THEN 100
                WHEN p.first = r.results->>'first' THEN 30
                WHEN p.second = r.results->>'second' THEN 30
                WHEN p.third = r.results->>'third' THEN 30
                WHEN p.first = r.results->>'second' OR p.first = r.results->>'third' THEN 10
                WHEN p.second = r.results->>'first' OR p.second = r.results->>'third' THEN 10
                WHEN p.third = r.results->>'first' OR p.third = r.results->>'second' THEN 10
                ELSE 0
            END
        ), 0) as total_score,
        COALESCE(AVG(
            CASE 
                WHEN p.first = r.results->>'first' AND p.second = r.results->>'second' AND p.third = r.results->>'third' THEN 100
                WHEN p.first = r.results->>'first' THEN 30
                WHEN p.second = r.results->>'second' THEN 30
                WHEN p.third = r.results->>'third' THEN 30
                WHEN p.first = r.results->>'second' OR p.first = r.results->>'third' THEN 10
                WHEN p.second = r.results->>'first' OR p.second = r.results->>'third' THEN 10
                WHEN p.third = r.results->>'first' OR p.third = r.results->>'second' THEN 10
                ELSE 0
            END
        ), 0) as average_score,
        COUNT(CASE 
            WHEN p.first = r.results->>'first' AND p.second = r.results->>'second' AND p.third = r.results->>'third' THEN 1
        END) as perfect_matches,
        COUNT(CASE 
            WHEN user_uuid::text = ANY(r.star_winners) THEN 1
        END) as star_wins
    FROM predictions p
    JOIN races r ON p.race_id = r.id
    WHERE p.user_id = user_uuid AND r.is_completed = true;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing
INSERT INTO users (username, name, password_hash, stars, races_participated) VALUES
('admin', 'Admin User', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 0, 0)
ON CONFLICT (username) DO NOTHING;

-- Sample races
INSERT INTO races (name, city, date, is_completed) VALUES
('Australian Grand Prix', 'Melbourne', '2025-03-16', false),
('Japanese Grand Prix', 'Suzuka', '2025-04-06', false),
('Chinese Grand Prix', 'Shanghai', '2025-04-20', false)
ON CONFLICT DO NOTHING; 