# Esensi DevOps Documentation

This directory contains documentation for deploying and scaling the Esensi application on Fly.io.

## Documents

### 1. [deployment-guide.md](./deployment-guide.md)
- **Purpose**: Complete guide for deploying Esensi to production and development
- **Covers**: 
  - Production deployment setup
  - Development environment with basic auth
  - Multi-domain configuration (5 domains)
  - GitHub Actions for CI/CD
  - DNS configuration

### 2. [auto-scaling-guide.md](./auto-scaling-guide.md) 
- **Purpose**: Complete auto-scaling implementation guide
- **Covers**:
  - Tigris for file storage (replaces local volumes)
  - PostgreSQL LISTEN/NOTIFY for WebSocket scaling (no Redis needed)
  - Full horizontal scaling for both HTTP and WebSockets
  - Performance optimizations and monitoring
  - Cost analysis and migration checklist

## Quick Start

### For Development Environment
1. Follow [dev-deployment-with-auth.md](./dev-deployment-with-auth.md)
2. Deploy to `main-dev.esensi.online`, `chapter-dev.esensi.online`, etc.
3. Protected with basic auth

### For Production Auto-Scaling
1. Follow [websocket-scaling-without-redis.md](./websocket-scaling-without-redis.md)
2. Implement PostgreSQL-based WebSocket tracking
3. Move file uploads to external storage (R2/S3)
4. Update fly.toml for multi-instance

## Architecture Decisions

### Why No Redis?
- Adds fixed monthly cost
- Can't scale to zero
- PostgreSQL + fly-replay provides sufficient functionality
- Simpler architecture with fewer dependencies

### Why No Staging Environment?
- Development environment serves testing purposes
- Reduces infrastructure costs
- Simplifies deployment pipeline
- Production-like dev environment with basic auth

### File Storage Strategy
- **Current**: Local persistent volume (single instance only)
- **For Scaling**: Must move to Cloudflare R2 or S3
- **Reason**: Persistent volumes can't be shared across instances

## Environment URLs

### Production
- Main: `https://esensi.online`
- Chapter: `https://chapter.esensi.online`
- Publish: `https://publish.esensi.online`
- Internal: `https://internal.esensi.online`
- Auth: `https://auth.esensi.online`

### Development (Protected)
- Main: `https://main-dev.esensi.online`
- Chapter: `https://chapter-dev.esensi.online`
- Publish: `https://publish-dev.esensi.online`
- Internal: `https://internal-dev.esensi.online`
- Auth: `https://auth-dev.esensi.online`

## Common Commands

```bash
# Deploy to dev
fly deploy --config fly.dev.toml --app esensi-dev

# Deploy to production
fly deploy --app esensi

# Check logs
fly logs --app esensi-dev -f

# SSH into instance
fly ssh console --app esensi-dev

# Scale instances
fly scale count 3 --app esensi

# Check status
fly status --app esensi
```