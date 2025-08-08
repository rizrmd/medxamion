-- Add clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255),
    subdomain VARCHAR(255) UNIQUE,
    settings JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ(6) DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6),
    deleted_at TIMESTAMPTZ(6)
);

CREATE INDEX IF NOT EXISTS clients_slug_index ON clients(slug);
CREATE INDEX IF NOT EXISTS clients_subdomain_index ON clients(subdomain);

-- Insert a default client
INSERT INTO clients (name, slug, is_active) 
VALUES ('Default Client', 'default', true)
ON CONFLICT (slug) DO NOTHING;