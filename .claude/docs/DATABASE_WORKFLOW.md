# Database Workflow - Esensi Project

## Overview
This project uses a **database-first workflow** with Prisma migrations to manage schema changes safely between development and production.

## Workflow Steps

### 1. Making Database Changes (Development)

When you need to modify the database schema:

```bash
# Option A: Direct Database Changes (Recommended for complex changes)
# 1. Make changes directly in your dev database using SQL or a GUI tool
# 2. Pull the changes to update schema.prisma
bun db:pull

# 3. Generate a migration from the changes
bun db:migrate --name describe_your_change

# Option B: Schema-first (For simple changes)
# 1. Edit schema.prisma directly
# 2. Create and apply migration
bun db:migrate --name describe_your_change
```

### 2. Available Database Commands

```bash
# Pull database schema to schema.prisma (overwrites current schema)
bun db:pull

# Create and apply a new migration in development
bun db:migrate --name your_migration_name

# Push schema changes without creating migrations (dev only!)
bun db:push

# Open Prisma Studio to browse/edit data
bun db:studio

# Reset database (CAUTION: deletes all data!)
bun db:reset

# Deploy migrations to production (used in CI/CD)
bun db:deploy
```

### 3. Production Deployment

Migrations are **automatically applied** during deployment:

1. **Dockerfile**: Runs `prisma migrate deploy` before starting the app
2. **Safety**: Migration failures prevent app startup
3. **Zero-downtime**: Follow safe migration practices (see below)

### 4. Safe Migration Practices

#### ✅ Always Safe Changes
- Adding new tables
- Adding optional columns (`field String?`)
- Adding indexes
- Adding new models

#### ⚠️ Potentially Breaking Changes
- Removing columns/tables
- Changing column types
- Making columns required
- Renaming columns

#### Safe Breaking Change Process

For breaking changes, use a **3-step deployment**:

```bash
# Step 1: Make code compatible with both schemas
# - Deploy code that works with old AND new schema

# Step 2: Run migration
bun db:migrate --name breaking_change

# Step 3: Remove old code
# - Deploy code that only uses new schema
```

### 5. Migration Management

#### Check Migration Status
```bash
cd shared/prisma
bunx prisma migrate status
```

#### View Migration History
```bash
ls -la shared/prisma/migrations/
```

#### Rollback (Emergency Only)
```bash
# Mark last migration as rolled back (doesn't undo changes)
cd shared/prisma
bunx prisma migrate resolve --rolled-back

# You must manually undo database changes or restore from backup
```

### 6. Environment Setup

Ensure your `.env` file contains:
```env
DATABASE_URL=postgres://user:pass@host:port/database
```

For production, set via Fly.io secrets:
```bash
fly secrets set DATABASE_URL="postgres://..." --app esensi
```

### 7. Troubleshooting

#### Schema Drift
If dev and prod schemas are out of sync:
```bash
# On development
bun db:pull  # Get current dev state
bun db:migrate --name sync_schemas  # Create migration

# Deploy to production
bun deploy  # Will apply migrations
```

#### Migration Conflicts
If migrations fail in production:
1. Check logs: `fly logs --app esensi`
2. Verify migration locally first
3. Ensure no concurrent schema changes
4. Consider rolling deployment strategy

### 8. Best Practices

1. **Always test migrations locally** before deploying
2. **Backup production database** before major changes
3. **Review generated SQL**: Check `migrations/*/migration.sql`
4. **Use descriptive migration names**: `add_user_roles`, not `update1`
5. **Commit migrations to git** immediately after creating
6. **Never edit existing migrations** that have been deployed
7. **Coordinate team changes** to avoid conflicts

### 9. Example Workflow

```bash
# 1. Start with current state
bun db:pull

# 2. Make your database changes (via SQL, GUI, etc.)

# 3. Pull the changes
bun db:pull

# 4. Generate migration
bun db:migrate --name add_user_verification_fields

# 5. Test locally
bun dev

# 6. Commit and push
git add shared/prisma/migrations
git commit -m "Add user verification fields to database"
git push

# 7. Deploy (migrations run automatically)
bun deploy
```

## Important Notes

- **Development database** should be treated as source of truth for schema
- **Migrations** provide version control and deployment safety
- **Production deployment** automatically applies pending migrations
- **Never use `db:push`** in production (use migrations instead)