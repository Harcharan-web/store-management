// Load environment variables FIRST, before any imports that use them
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { hash } from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";

async function createAdmin() {
  let pool: Pool | null = null;

  try {
    console.log("🚀 Creating admin user...\n");

    // Verify database connection
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL is not set in .env.local");
      process.exit(1);
    }

    // Create a connection pool with SSL configuration
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 60000,
      idleTimeoutMillis: 30000,
      max: 1, // Single connection for scripts
    });

    const db = drizzle(pool);

    console.log("🔗 Connected to database");

    // Check if admin already exists
    const email = "admin@store.com";
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("Email:", email);
      console.log("\nIf you want to reset the admin password, delete the user from database first.");
      await pool.end();
      process.exit(0);
    }

    const password = "admin123";
    const name = "Admin User";

    const hashedPassword = await hash(password, 10);

    const [admin] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        role: "admin",
      })
      .returning();

    console.log("✅ Admin user created successfully!\n");
    console.log("📧 Email:    ", email);
    console.log("🔑 Password: ", password);
    console.log("👤 Name:     ", name);
    console.log("🎭 Role:     ", admin.role);
    console.log("\n⚠️  IMPORTANT: Please change the password after first login!");

    // Close the connection pool
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    if (pool) {
      await pool.end();
    }
    process.exit(1);
  }
}

createAdmin();
