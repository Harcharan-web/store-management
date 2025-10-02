# NextAuth Database Setup

This project uses NextAuth v5 with Drizzle ORM adapter for database session management.

## Database Tables

The following tables are automatically managed by NextAuth:

### 1. **auth_users** - NextAuth Users
- Stores OAuth users (if you add OAuth providers in the future)
- Separate from the `users` table (which is for staff/admin with passwords)

### 2. **accounts** - OAuth Provider Accounts
- Links users to their OAuth provider accounts (Google, GitHub, etc.)
- Stores access tokens, refresh tokens, etc.

### 3. **sessions** - User Sessions
- Manages active user sessions
- Automatically expires old sessions

### 4. **verification_tokens** - Email Verification
- Stores tokens for email verification
- Used for passwordless login flows

### 5. **authenticators** - WebAuthn/Passkeys
- Supports modern authentication methods
- Biometric authentication support

## Current Authentication Flow

Currently, the system uses:
- **JWT Strategy** - For credentials (email/password) login
- **Database Adapter** - Ready for OAuth providers (Google, GitHub, etc.)

## How It Works

1. **Staff Login** (Current)
   - Uses the `users` table with password hashing
   - Creates JWT tokens (no database sessions)
   - Perfect for admin/staff with traditional login

2. **Future OAuth Login** (Ready to add)
   - Would use `auth_users` table
   - Automatically managed by NextAuth adapter
   - Can add Google, GitHub, etc. with minimal code changes

## Adding OAuth Providers

To add OAuth login (e.g., Google), simply add to `src/auth.ts`:

```typescript
import Google from "next-auth/providers/google";

providers: [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
  Credentials({...}), // Keep existing credentials login
],
```

Then change session strategy to:
```typescript
session: {
  strategy: "database", // Use database sessions for OAuth
}
```

## Database Schema Location

All NextAuth tables are defined in:
- [src/db/schema/auth.ts](src/db/schema/auth.ts)

## Indexes Added

All tables have proper indexes for optimal performance:
- `auth_users_email_idx` - Fast email lookups
- `accounts_user_id_idx` - User's linked accounts
- `sessions_user_id_idx` - User's sessions
- `sessions_expires_idx` - Session cleanup
- `verification_tokens_token_idx` - Token verification

## Migration

Run this command to create all tables:
```bash
npm run db:push
```

The adapter will automatically:
- ✅ Create users on OAuth login
- ✅ Link accounts to users
- ✅ Manage sessions
- ✅ Handle token verification
- ✅ Clean up expired data
