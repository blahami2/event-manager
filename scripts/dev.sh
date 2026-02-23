#!/usr/bin/env bash
set -euo pipefail

# Define cleanup function to gracefully shut down Supabase Docker containers
cleanup() {
  echo ""
  echo "Tearing down Supabase local stack..."
  npx supabase stop
  
  # Terminate all child processes (including Next.js)
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
# Trap EXIT (normal exit) and SIGINT/SIGTERM (Ctrl+C, kill) signals to run cleanup
trap cleanup EXIT SIGINT SIGTERM

echo "Starting Supabase local stack..."
if npx supabase status > /dev/null 2>&1; then
  echo "Supabase is already running."
else
  npx -y supabase start
fi

# Extract credentials
SUPABASE_OUTPUT=$(npx supabase status -o env)
eval "$SUPABASE_OUTPUT"

# Write credentials explicitly to .env.local so Next.js seamlessly picks them up
echo "Generating .env.local for local Next.js binding..."
cat <<EOF > .env.local
NEXT_PUBLIC_SUPABASE_URL="$API_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres?schema=public"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres?schema=public"
EOF

# Load them for Prisma and create-admin script in the current shell
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres?schema=public"
export DIRECT_URL="$DATABASE_URL"

# Ensure the database schema is up-to-date locally before generating anything
echo "Running Prisma migrations..."
npx prisma db push

# Generate the test admin user for local development
echo "Syncing local test admin user..."
npx tsx scripts/create-admin.ts

echo ""
echo "Supabase local services:"
echo "  API:      $API_URL"
echo "  Studio:   http://127.0.0.1:54323"
echo "  Inbucket: http://127.0.0.1:54324"
echo "  DB:       postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo ""

# Start Next.js dev server in the background so the trap can catch SIGINT
npx next dev &
NEXT_PID=$!

# Wait for the Next.js process to finish or be killed
wait $NEXT_PID
