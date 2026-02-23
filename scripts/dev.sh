#!/usr/bin/env bash
set -euo pipefail

# Start Supabase local stack (idempotent - skips if already running)
# echo "Removing Supabase local stack..."
# docker rm -f $(docker ps -aq --filter "name=birthday-celebration")
echo "Starting Supabase local stack..."
if npx supabase status > /dev/null 2>&1; then
  echo "Supabase is already running."
else
  npx -y supabase start
fi

# Extract credentials and export as env vars for Next.js
SUPABASE_OUTPUT=$(npx supabase status -o env)
eval "$SUPABASE_OUTPUT"

export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres?schema=public"
export DIRECT_URL="$DATABASE_URL"

echo ""
echo "Supabase local services:"
echo "  API:      $API_URL"
echo "  Studio:   http://127.0.0.1:54323"
echo "  Inbucket: http://127.0.0.1:54324"
echo "  DB:       postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo ""

# Start Next.js dev server
exec npx next dev
