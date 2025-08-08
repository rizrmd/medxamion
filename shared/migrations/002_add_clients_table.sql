-- Migration: Add clients table for multi-client support
-- Date: 2025-08-07

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255),
    subdomain VARCHAR(255) UNIQUE,
    settings JSON,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6),
    deleted_at TIMESTAMPTZ(6)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS clients_slug_index ON clients(slug);
CREATE INDEX IF NOT EXISTS clients_subdomain_index ON clients(subdomain);

-- Insert default client for existing data
INSERT INTO clients (name, slug, is_active, created_at) 
VALUES ('Default Client', 'default', true, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert demo clients for testing
INSERT INTO clients (name, slug, domain, is_active, created_at) VALUES
('PT Medxamion Indonesia', 'medxamion', 'medxamion.com', true, NOW()),
('RS Siloam', 'siloam', 'siloam.co.id', true, NOW()),
('RSCM Jakarta', 'rscm', 'rscm.co.id', true, NOW())
ON CONFLICT (slug) DO NOTHING;