import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Get connection string with proper fallback
const rawConnectionString = process.env.DATABASE_URL || "";

// Remove SSL mode from connection string and handle it in config
const connectionString = rawConnectionString.replace(/\?sslmode=\w+/, "");

// Create a connection pool with SSL configuration
// Only create pool if DATABASE_URL is available
let pool: Pool | null = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : { rejectUnauthorized: false },
    connectionTimeoutMillis: 60000,
    idleTimeoutMillis: 30000,
    max: 20,
  });

  // Handle pool errors (don't use process.exit for Edge Runtime compatibility)
  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
  });
}

// Create drizzle instance
// @ts-ignore - pool might be null during build time
export const db = drizzle(pool, { schema });
