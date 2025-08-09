# Esensi Deployment Guide

## Overview

Esensi is a multi-domain application with 5 different sites:
- **main.esensi**: Main e-commerce site
- **chapter.esensi**: Digital book/chapter reading platform
- **publish.esensi**: Publisher dashboard
- **internal.esensi**: Internal admin dashboard
- **auth.esensi**: Authentication service

This guide covers deploying both production and development environments on Fly.io.

## Production Deployment

### Configuration
- **App**: `esensi`
- **Domains**: `esensi.online`, `chapter.esensi.online`, etc.
- **Branch**: `main`

### Deploy Command
```bash
fly deploy --app esensi
```

### GitHub Action (`.github/workflows/deploy-prod.yml`)
```yaml
name: Deploy Production
on:
  push:
    branches: [main]
env:
  FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Deploy to Fly.io Production
        run: fly deploy --app esensi
```

## Development Deployment (with Basic Auth)

### Configuration
- **App**: `esensi-dev`
- **Domains**: `main-dev.esensi.online`, `chapter-dev.esensi.online`, etc.
- **Branch**: `dev`
- **Protection**: Basic authentication

### 1. Create Basic Auth Middleware

**backend/src/lib/middleware/basic-auth.ts:**
```typescript
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || "admin";
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS || "devpassword";

export function basicAuthMiddleware(req: Request): Response | null {
  // Skip auth for health checks
  const url = new URL(req.url);
  if (url.pathname === "/api/health") {
    return null;
  }

  // Only apply in development environment
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new Response("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Development Environment"'
      }
    });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = credentials.split(":");

  if (username !== BASIC_AUTH_USER || password !== BASIC_AUTH_PASS) {
    return new Response("Invalid credentials", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Development Environment"'
      }
    });
  }

  return null; // Authentication successful
}
```

### 2. Update Main Entry Point

**backend/src/index.tsx:**
```typescript
import { basicAuthMiddleware } from "./lib/middleware/basic-auth";

const onFetch: onFetch = async ({ url, req }) => {
  // Apply basic auth middleware in development
  if (process.env.NODE_ENV === "development") {
    const authResponse = basicAuthMiddleware(req);
    if (authResponse) {
      return authResponse;
    }
  }

  // Existing auth handler
  if (url.pathname.startsWith("/api/auth")) {
    return await auth.handler(req);
  }
};
```

### 3. Create Dev Configuration

**config.dev.json:**
```json
{
  "db": {
    "orm": "prisma",
    "provider": "postgresql"
  },
  "sites": {
    "main": {
      "name": "main.esensi",
      "domains": ["main-dev.esensi.online"],
      "devPort": 3000
    },
    "chapter": {
      "name": "chapter.esensi",
      "domains": ["chapter-dev.esensi.online"],
      "devPort": 3001
    },
    "publish": {
      "name": "publish.esensi",
      "domains": ["publish-dev.esensi.online"],
      "devPort": 3002
    },
    "internal": {
      "name": "internal.esensi",
      "domains": ["internal-dev.esensi.online"],
      "devPort": 3003
    },
    "auth": {
      "name": "auth.esensi",
      "domains": ["auth-dev.esensi.online"],
      "devPort": 3004
    }
  }
}
```

### 4. Create Fly Dev Configuration

**fly.dev.toml:**
```toml
app = "esensi-dev"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"
  
[build.args]
  BUILD_ENV = "development"

[env]
  NODE_ENV = "development"
  CONFIG_PATH = "/app/config.dev.json"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0  # Scale to zero when not in use
  max_machines_running = 1  # Single instance for dev
  
[http_service.concurrency]
  type = "requests"
  hard_limit = 500
  soft_limit = 400

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256  # Minimal resources for dev

[[http_service.checks]]
  interval = "60s"
  timeout = "10s"
  grace_period = "20s"
  method = "GET"
  path = "/api/health"
```

### 5. Update Dockerfile

```dockerfile
# Build argument for environment
ARG BUILD_ENV=production

# Copy appropriate config based on build env
COPY config.${BUILD_ENV}.json config.json
```

### 6. Setup Commands

```bash
# Create the dev app
fly apps create esensi-dev

# Set secrets including basic auth
fly secrets set \
  BASIC_AUTH_USER="admin" \
  BASIC_AUTH_PASS="your-secure-password" \
  DATABASE_URL="postgresql://..." \
  BETTER_AUTH_SECRET="dev-secret-key" \
  GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..." \
  --app esensi-dev

# Add certificates for all domains
fly certs add main-dev.esensi.online --app esensi-dev
fly certs add chapter-dev.esensi.online --app esensi-dev
fly certs add publish-dev.esensi.online --app esensi-dev
fly certs add internal-dev.esensi.online --app esensi-dev
fly certs add auth-dev.esensi.online --app esensi-dev

# Initial deployment
fly deploy --config fly.dev.toml --app esensi-dev
```

### 7. GitHub Action for Auto-Deploy

**.github/workflows/deploy-dev.yml:**
```yaml
name: Deploy Development
on:
  push:
    branches: [dev]
env:
  FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN_DEV }}
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Deploy to Fly.io Dev
        run: |
          fly deploy \
            --config fly.dev.toml \
            --app esensi-dev \
            --build-arg BUILD_ENV=development
```

## DNS Configuration

### Production
```
esensi.online              A/AAAA  Fly.io IPs
chapter.esensi.online      CNAME   esensi.fly.dev
publish.esensi.online      CNAME   esensi.fly.dev
internal.esensi.online     CNAME   esensi.fly.dev
auth.esensi.online         CNAME   esensi.fly.dev
```

### Development
```
main-dev.esensi.online     CNAME   esensi-dev.fly.dev
chapter-dev.esensi.online  CNAME   esensi-dev.fly.dev
publish-dev.esensi.online  CNAME   esensi-dev.fly.dev
internal-dev.esensi.online CNAME   esensi-dev.fly.dev
auth-dev.esensi.online     CNAME   esensi-dev.fly.dev
```

## Monitoring & Management

### View Logs
```bash
fly logs --app esensi-dev -f        # Dev logs
fly logs --app esensi -f            # Production logs
```

### SSH Access
```bash
fly ssh console --app esensi-dev    # Dev environment
fly ssh console --app esensi        # Production
```

### Check Status
```bash
fly status --app esensi-dev         # Dev status
fly status --app esensi             # Production status
```

## Alternative: Cloudflare Access (Instead of Basic Auth)

For better security, use Cloudflare Access:

1. Add dev domains to Cloudflare
2. Go to Zero Trust → Access → Applications
3. Create application for `*-dev.esensi.online`
4. Configure authentication method (email, Google, etc.)
5. Remove basic auth middleware

## Cost Optimization

### Development Environment
- **Scale to Zero**: `min_machines_running = 0`
- **Single Instance**: `max_machines_running = 1`  
- **Small VM**: 256MB RAM
- **Auto-stop**: Stops after inactivity
- **Estimated Cost**: ~$0-5/month (only when running)

### Production Environment
- Configure based on actual traffic needs
- Start with minimal resources and scale as needed