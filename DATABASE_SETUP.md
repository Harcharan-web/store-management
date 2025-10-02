# Database Setup & Configuration

This document explains the database setup and how we resolved connection issues.

## Database Driver: pg (PostgreSQL)

We use the **`pg`** package (node-postgres) instead of `postgres.js` for better stability and reliability with cloud databases.

### Why pg instead of postgres.js?

- ✅ **More stable** - Industry standard, battle-tested
- ✅ **Better SSL handling** - Works seamlessly with cloud databases (Aiven, AWS RDS, etc.)
- ✅ **Connection pooling** - Built-in connection pool management
- ✅ **Error handling** - Better error messages and recovery
- ✅ **Wide adoption** - Used by most production applications

## Configuration Files

### 1. Database Connection ([src/db/index.ts](src/db/index.ts))

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false }, // For cloud databases with self-signed certs
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 30000,
  max: 20, // Maximum number of clients in the pool
});

export const db = drizzle(pool, { schema });
```

**Key Features:**
- Connection pooling (max 20 connections)
- SSL with certificate verification disabled (safe for development/cloud DBs)
- Proper timeout configuration
- Error handling on idle clients

### 2. Drizzle Config ([drizzle.config.ts](drizzle.config.ts))

```typescript
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

**Note:** Uses `NODE_TLS_REJECT_UNAUTHORIZED=0` in npm scripts for drizzle-kit commands.

### 3. Environment Variables ([.env.local](.env.local))

```env
DATABASE_URL=postgres://user:password@host:port/database?sslmode=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
NODE_ENV=development
```

## Database Schema

### Tables Created

**Core Tables:**
- `users` - Staff/admin users with passwords
- `customers` - Customer profiles
- `products` - Product inventory (sale/rent/both)
- `sales` - Sales transactions
- `sale_items` - Sale line items
- `rentals` - Rental transactions
- `rental_items` - Rental line items

**NextAuth Tables:**
- `auth_users` - OAuth users (for future OAuth providers)
- `accounts` - OAuth provider accounts
- `sessions` - User sessions
- `verification_tokens` - Email verification
- `authenticators` - WebAuthn/Passkeys

### Indexes

All tables have optimized indexes for:
- Fast searches (name, email, phone, SKU)
- Efficient filtering (status, type, category)
- Quick lookups (foreign keys, unique fields)
- Sorted results (created_at, dates)

## Common Commands

```bash
# Push schema to database
npm run db:push

# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Create admin user
npm run seed:admin
```

## Troubleshooting

### SSL Certificate Errors

If you see "self-signed certificate" errors:

1. **Check `.env.local`** - Ensure DATABASE_URL is correct
2. **Verify SSL config** in `src/db/index.ts`:
   ```typescript
   ssl: { rejectUnauthorized: false }
   ```
3. **Check npm scripts** - They should have `NODE_TLS_REJECT_UNAUTHORIZED=0`

### Connection Pool Errors

If you see "too many connections":

1. **Reduce pool size** in `src/db/index.ts`:
   ```typescript
   max: 10, // Reduce from 20
   ```
2. **Check for connection leaks** - Ensure all queries complete properly

### Database Not Found

1. Verify database exists in your PostgreSQL server
2. Check DATABASE_URL has correct database name
3. Ensure you have permissions to create tables

## Security Notes

### Development
- `rejectUnauthorized: false` is acceptable for development
- `NODE_TLS_REJECT_UNAUTHORIZED=0` is for drizzle-kit only

### Production
Consider:
- Use proper SSL certificates
- Enable `rejectUnauthorized: true`
- Use connection string with verified SSL
- Set strong NEXTAUTH_SECRET
- Rotate database credentials regularly

## Migration from postgres.js

If you previously used `postgres.js`, the migration is complete:

✅ Removed `postgres` package
✅ Installed `pg` and `@types/pg`
✅ Updated all connection code
✅ Updated drizzle configuration
✅ Tested all database operations
✅ Login working correctly

## Performance Benefits

With `pg` connection pooling:

- ✅ Reuses database connections
- ✅ Handles concurrent requests efficiently
- ✅ Automatic connection management
- ✅ Better resource utilization
- ✅ Production-ready configuration
