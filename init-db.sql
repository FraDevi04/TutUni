-- Database initialization script for TutUni AI
-- This script runs when the PostgreSQL container starts for the first time

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a simple health check table
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    message VARCHAR(255) DEFAULT 'Database initialized successfully',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial health check record
INSERT INTO health_check (message) VALUES ('TutUni AI Database Ready');

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tutuni_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tutuni_user; 