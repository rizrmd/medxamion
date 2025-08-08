-- Add multi-client support to the database
-- This migration adds client_id columns and creates the clients table

-- Create clients table first
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255),
    subdomain VARCHAR(255) UNIQUE,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Create indexes for clients
CREATE INDEX idx_clients_slug ON clients(slug);
CREATE INDEX idx_clients_subdomain ON clients(subdomain);

-- Create a default "system" client for existing data
INSERT INTO clients (name, slug, is_active) VALUES ('System Default', 'system', true);

-- Add client_id columns to all relevant tables
ALTER TABLE activity_log ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE answers ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE attachments ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE attempt_question ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE attempts ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE categories ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE deliveries ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE exams ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE groups ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE items ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE questions ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE takers ADD COLUMN client_id INTEGER NOT NULL DEFAULT 1;

-- Add client_id to users table (nullable for super admins)
ALTER TABLE users ADD COLUMN client_id INTEGER;
ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT false;

-- Create indexes for client_id columns
CREATE INDEX idx_activity_log_client_id ON activity_log(client_id);
CREATE INDEX idx_answers_client_id ON answers(client_id);
CREATE INDEX idx_attachments_client_id ON attachments(client_id);
CREATE INDEX idx_attempt_question_client_id ON attempt_question(client_id);
CREATE INDEX idx_attempts_client_id ON attempts(client_id);
CREATE INDEX idx_categories_client_id ON categories(client_id);
CREATE INDEX idx_deliveries_client_id ON deliveries(client_id);
CREATE INDEX idx_exams_client_id ON exams(client_id);
CREATE INDEX idx_groups_client_id ON groups(client_id);
CREATE INDEX idx_items_client_id ON items(client_id);
CREATE INDEX idx_questions_client_id ON questions(client_id);
CREATE INDEX idx_takers_client_id ON takers(client_id);
CREATE INDEX idx_users_client_id ON users(client_id);

-- Remove existing unique constraints that conflict with tenant isolation
DROP INDEX IF EXISTS users_username_unique;
DROP INDEX IF EXISTS users_email_unique;
DROP INDEX IF EXISTS groups_code_unique;

-- Create client-scoped unique constraints
CREATE UNIQUE INDEX users_client_id_username_unique ON users(client_id, username) WHERE client_id IS NOT NULL;
CREATE UNIQUE INDEX users_client_id_email_unique ON users(client_id, email) WHERE client_id IS NOT NULL;
CREATE UNIQUE INDEX groups_client_id_code_unique ON groups(client_id, code) WHERE code IS NOT NULL;
CREATE UNIQUE INDEX exams_client_id_code_unique ON exams(client_id, code);
CREATE UNIQUE INDEX takers_client_id_email_unique ON takers(client_id, email) WHERE email IS NOT NULL;

-- Remove the default constraint after existing data has been migrated
ALTER TABLE activity_log ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE answers ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE attachments ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE attempt_question ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE attempts ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE categories ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE deliveries ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE exams ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE groups ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE items ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE questions ALTER COLUMN client_id DROP DEFAULT;
ALTER TABLE takers ALTER COLUMN client_id DROP DEFAULT;