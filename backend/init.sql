-- Create database if it doesn't exist
SELECT 'CREATE DATABASE wear_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'wear_db')\gexec

-- Connect to the wear_db database
\c wear_db;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant necessary permissions for PgBouncer
GRANT ALL PRIVILEGES ON DATABASE wear_db TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
