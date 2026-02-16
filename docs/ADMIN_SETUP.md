# Admin User Setup

## Problem
After PR #75, authentication works (401 → 403) but users get "Insufficient permissions" because their Supabase user ID is not in the AdminUser database table.

## Root Cause
Two separate databases:
1. **Supabase Auth** - handles authentication (login/password)
2. **Postgres AdminUser table** - determines who has admin privileges

When you login successfully, Supabase Auth validates your credentials. But the app then checks if your Supabase user ID exists in the AdminUser table. If not → 403 Forbidden.

## Solution: Add Admin User

### Step 1: Get Your Supabase User ID

After logging in at `/admin/login`, the 403 error will now include your Supabase user ID in the response:
```
Insufficient permissions. Supabase user ID: abc123-def456-...
```

Alternatively, use Supabase Dashboard → Authentication → Users to find the user ID.

### Step 2: Add to AdminUser Table

Run the script:
```bash
SUPABASE_USER_ID="your-supabase-id-here" \
EMAIL="czs.jokers@centrum.cz" \
npm run add-admin
```

Replace `your-supabase-id-here` with the actual Supabase user ID from Step 1.

### Step 3: Test

1. Go to `/admin/login`
2. Login with czs.jokers@centrum.cz / 123456
3. Should redirect to `/admin` successfully
4. Registrations page and CSV export should now work

## Seed Data

The seed script (`npx prisma db seed`) creates:
- Admin user: admin@example.com (Supabase ID: "supabase-admin-seed-001")

This is for development/testing only. Production admins must be added via the script above.
