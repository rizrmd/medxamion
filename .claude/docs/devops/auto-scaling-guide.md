# Esensi Auto-Scaling Guide

## Overview

This guide explains how to enable complete auto-scaling for Esensi on Fly.io using:
- **Tigris** for object storage (replacing local file storage)
- **PostgreSQL LISTEN/NOTIFY** for WebSocket state sharing (no Redis needed)

## Architecture Overview

With these changes, Esensi can:
1. **Auto-scale HTTP endpoints** horizontally (1-10 instances)
2. **Auto-scale WebSocket connections** across multiple instances
3. **Serve files from Tigris** (accessible from any instance)
4. **Share notifications** between instances via PostgreSQL

## Step 1: Implement Tigris for File Storage

### Install SDK
```bash
bun add @aws-sdk/client-s3
```

### Update Upload Handler
**backend/src/api/upload.ts:**
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Tigris is S3-compatible
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.TIGRIS_ENDPOINT || "https://fly.storage.tigris.dev",
  credentials: {
    accessKeyId: process.env.TIGRIS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TIGRIS_SECRET_ACCESS_KEY!,
  },
});

export default defineAPI({
  name: "upload",
  url: "/api/upload",
  async handler(): Promise<UploadAPIResponse> {
    // ... existing file processing code ...
    
    const key = `upload/${yyyyMM}/${dd}/${fileName}`;
    
    // Upload to Tigris instead of local disk
    const command = new PutObjectCommand({
      Bucket: process.env.TIGRIS_BUCKET || "esensi-uploads",
      Key: key,
      Body: upload.file,
      ContentType: file.type,
    });
    
    await s3Client.send(command);
    
    return {
      name: fileName,
      url: `https://${process.env.TIGRIS_BUCKET}.fly.storage.tigris.dev/${key}`,
    };
  },
});
```

### Update File Serving
**backend/src/api/files.ts:**
```typescript
// Redirect to Tigris CDN URL
export default defineAPI({
  name: "files",
  url: "/_file/upload/*",
  async handler(): Promise<Response> {
    const path = req.url.split("/_file/upload/").slice(1).join("/");
    const tigrisUrl = `https://${process.env.TIGRIS_BUCKET}.fly.storage.tigris.dev/upload/${path}`;
    
    return Response.redirect(tigrisUrl, 301);
  },
});
```

### Set Up Tigris
```bash
# Install Tigris CLI
curl -sSL https://tigris.dev/cli/install.sh | sh

# Create bucket
tigris create bucket esensi-uploads --public

# Get credentials
tigris auth application create esensi

# Set secrets in Fly.io
fly secrets set \
  TIGRIS_ACCESS_KEY_ID="tid_..." \
  TIGRIS_SECRET_ACCESS_KEY="tsec_..." \
  TIGRIS_BUCKET="esensi-uploads" \
  TIGRIS_ENDPOINT="https://fly.storage.tigris.dev" \
  --app esensi
```

## Step 2: Implement PostgreSQL Pub/Sub for WebSockets

### Create Database Functions
```sql
-- Add to your Prisma migrations
CREATE OR REPLACE FUNCTION notify_user(
  user_id TEXT,
  notification JSONB
) RETURNS void AS $$
BEGIN
  PERFORM pg_notify(
    'user_notifications',
    json_build_object(
      'user_id', user_id,
      'notification', notification,
      'timestamp', extract(epoch from now())
    )::text
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION broadcast_notification(
  notification JSONB
) RETURNS void AS $$
BEGIN
  PERFORM pg_notify(
    'broadcast_notifications',
    json_build_object(
      'notification', notification,
      'timestamp', extract(epoch from now())
    )::text
  );
END;
$$ LANGUAGE plpgsql;
```

### Update WebSocket Handler
**backend/src/lib/notif.ts:**
```typescript
import type { Server, WebSocketHandler } from "bun";
import { db } from "./db";

// Instance ID for debugging
const instanceId = process.env.FLY_ALLOC_ID || `local-${process.pid}`;

// Local connections
const conns = {} as Record<string, { wsClients: Set<WSType>; notifList: NotifItem[] }>;

// PostgreSQL listener
let listenerConnection: any = null;

// Initialize PostgreSQL listener
async function initializeListener() {
  try {
    const { Client } = await import('pg');
    listenerConnection = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await listenerConnection.connect();
    await listenerConnection.query('LISTEN user_notifications');
    await listenerConnection.query('LISTEN broadcast_notifications');
    
    listenerConnection.on('notification', (msg: any) => {
      try {
        const data = JSON.parse(msg.payload);
        
        if (msg.channel === 'user_notifications') {
          deliverToUser(data.user_id, data.notification);
        } else if (msg.channel === 'broadcast_notifications') {
          deliverToAll(data.notification);
        }
      } catch (error) {
        console.error('Error handling notification:', error);
      }
    });
    
    console.log(`[${instanceId}] PostgreSQL listener initialized`);
  } catch (error) {
    console.error('Failed to initialize listener:', error);
    setTimeout(initializeListener, 5000);
  }
}

// Deliver to local connections
function deliverToUser(userId: string, notification: any) {
  const userConn = conns[userId];
  if (userConn) {
    const message = JSON.stringify({
      action: WSMessageAction.ADD,
      payload: notification
    });
    
    userConn.wsClients.forEach(ws => {
      try {
        ws.send(message);
      } catch (error) {
        console.error(`Failed to send to user ${userId}:`, error);
      }
    });
  }
}

// Send notification via PostgreSQL
export async function sendNotification(userId: string, notification: NotifItem) {
  try {
    // Save to database
    await db.notif.create({
      data: {
        id_user: userId,
        type: notification.type,
        status: notification.status,
        data: notification.data,
        created_at: new Date()
      }
    });
    
    // Publish via PostgreSQL
    await db.$queryRaw`
      SELECT notify_user(
        ${userId}::text,
        ${JSON.stringify(notification)}::jsonb
      )
    `;
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send notification:', error);
    return { success: false, error };
  }
}

// Initialize on startup
initializeListener();

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  if (listenerConnection) {
    await listenerConnection.end();
  }
});

// WebSocket handler remains the same
export const wsNotif: WSNotif = {
  async message(ws: WSType, message) {
    const msg = JSON.parse(message as string) as { uid: string };
    
    if (!conns[msg.uid]) {
      conns[msg.uid] = { wsClients: new Set(), notifList: [] };
    }
    
    const conn = conns[msg.uid];
    ws.data.user_id = msg.uid;
    conn.wsClients.add(ws);
    
    // Load notifications from database
    const list = await db.notif.findMany({
      where: { id_user: msg.uid },
      orderBy: { created_at: "desc" },
    });
    
    conn.notifList = list.map((notif: any) => ({
      type: notif.type as NotifType,
      status: notif.status as NotifStatus,
      id: notif.id,
      data: notif.data,
      created_at: notif.created_at,
    }));
    
    ws.send(JSON.stringify({
      action: WSMessageAction.INIT,
      payload: conn.notifList,
    }));
  },
  
  async close(ws: WSType) {
    const userId = ws.data.user_id;
    if (userId && conns[userId]) {
      conns[userId].wsClients.delete(ws);
      
      if (conns[userId].wsClients.size === 0) {
        delete conns[userId];
      }
    }
  }
};
```

### Add Connection Pooling
**backend/src/lib/db.ts:**
```typescript
import { PrismaClient } from '@prisma/client';

// Increase connection limit for pub/sub
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Each instance needs: 1 for listener + N for queries
  connectionLimit: 20,
});

export const db = prisma;
```

## Step 3: Update fly.toml for Auto-Scaling

```toml
app = "esensi"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3000"
  CONFIG_PATH = "/app/config.json"
  DATABASE_CONNECTION_LIMIT = "20"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 2       # Minimum 2 for redundancy
  max_machines_running = 10      # Scale up to 10 instances
  
  [http_service.concurrency]
    type = "requests"
    hard_limit = 1000
    soft_limit = 800

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512

# Remove [mounts] section - using Tigris now

[[http_service.checks]]
  interval = "30s"
  timeout = "5s"
  grace_period = "10s"
  method = "GET"
  path = "/api/health"
```

## Step 4: Add Monitoring

### WebSocket Metrics
```typescript
export default defineAPI({
  name: "websocket-metrics",
  url: "/api/metrics/websockets",
  async handler() {
    const metrics = {
      instance_id: instanceId,
      listener_connected: !!listenerConnection,
      local_connections: Object.keys(conns).length,
      total_websockets: Object.values(conns).reduce((sum, c) => sum + c.wsClients.size, 0),
      timestamp: new Date()
    };
    
    // PostgreSQL stats
    const pgStats = await db.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) filter (where state = 'active') as active_queries,
        count(*) filter (where query like 'LISTEN%') as listeners
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;
    
    return { ...metrics, postgres: pgStats[0] };
  }
});
```

### Health Check
```typescript
export default defineAPI({
  name: "health",
  url: "/api/health",
  async handler() {
    const checks = {
      database: false,
      storage: false,
      pubsub: false
    };
    
    try {
      await db.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (e) {}
    
    try {
      // Check Tigris connectivity
      await s3Client.send(new HeadBucketCommand({
        Bucket: process.env.TIGRIS_BUCKET
      }));
      checks.storage = true;
    } catch (e) {}
    
    checks.pubsub = !!listenerConnection;
    
    const healthy = Object.values(checks).every(v => v);
    
    return {
      status: healthy ? "healthy" : "unhealthy",
      checks,
      instance: instanceId,
      timestamp: new Date().toISOString()
    };
  },
});
```

## How Auto-Scaling Works

### HTTP Requests
1. Request arrives at Fly.io edge
2. Load balancer distributes to any available instance
3. New instances spawn when load increases
4. All instances can handle any HTTP request
5. Files served directly from Tigris CDN

### WebSocket Connections
1. User connects to any instance
2. Instance maintains local connection
3. Notifications published via PostgreSQL
4. All instances receive and deliver to local connections
5. No sticky sessions needed!

## Performance Considerations

### PostgreSQL Limits
- **Payload size**: 8KB per notification
- **Latency**: 1-10ms typically
- **Throughput**: Thousands of messages/second

### Optimizations
1. **Batch notifications** for high-volume scenarios
2. **Connection pooling** to manage database connections
3. **Health checks** to monitor listener connections
4. **Graceful degradation** with polling fallback

## Testing

```bash
# Deploy with auto-scaling
fly deploy --app esensi

# Scale to multiple instances
fly scale count 3 --app esensi

# Monitor scaling
fly status --watch --app esensi

# Test WebSocket distribution
# 1. Connect multiple clients
# 2. Note which instances they connect to
# 3. Send notifications and verify delivery

# Load test
hey -n 10000 -c 100 https://esensi.online/api/health

# Monitor PostgreSQL
fly postgres connect -a your-db-app
\> SELECT * FROM pg_stat_activity WHERE query LIKE 'LISTEN%';
```

## Cost Analysis

### Monthly Estimates
- **Fly.io Instances**: $0.0000008/s × instances × uptime
- **Tigris Storage**: $0.005/GB stored + $0.01/GB bandwidth
- **PostgreSQL**: Included with your existing database
- **Total**: ~$10-50/month based on traffic

### Compared to Alternatives
- **vs Redis**: Save $10-50/month (no Redis needed)
- **vs Single Instance**: Better availability, automatic scaling
- **vs Manual Scaling**: No intervention needed

## Troubleshooting

### WebSocket Issues
```bash
# Check listener connections
curl https://esensi.online/api/metrics/websockets

# View instance logs
fly logs --app esensi --instance <id>

# Check PostgreSQL listeners
fly postgres connect -a your-db
\> SELECT * FROM pg_stat_activity WHERE query LIKE 'LISTEN%';
```

### File Upload Issues
```bash
# Check Tigris credentials
fly secrets list --app esensi

# Test Tigris connectivity
curl https://your-bucket.fly.storage.tigris.dev/test.txt
```

## Migration Checklist

- [ ] Set up Tigris bucket and credentials
- [ ] Update upload/download handlers
- [ ] Create PostgreSQL notification functions
- [ ] Update WebSocket handler with pub/sub
- [ ] Increase database connection pool
- [ ] Update fly.toml for multi-instance
- [ ] Deploy and test with 2 instances
- [ ] Monitor metrics and logs
- [ ] Scale up gradually

## Summary

This setup provides:
- ✅ **Full auto-scaling** for both HTTP and WebSockets
- ✅ **No Redis dependency** (using PostgreSQL)
- ✅ **Centralized file storage** (using Tigris)
- ✅ **High availability** with multiple instances
- ✅ **Cost efficient** scale-to-demand
- ✅ **Simple architecture** with existing tools

The application can now handle thousands of concurrent users across multiple instances while maintaining real-time WebSocket functionality.