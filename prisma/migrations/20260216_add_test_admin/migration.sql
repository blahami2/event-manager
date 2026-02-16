-- Add test admin user
-- Supabase user ID from production: dd7699e7-4071-4985-9adb-11bf09582a6a
-- Email: czs.jokers@centrum.cz

INSERT INTO "AdminUser" ("id", "supabaseUserId", "email", "createdAt")
VALUES (
  '00000000-0000-0000-0000-000000000100',
  'dd7699e7-4071-4985-9adb-11bf09582a6a',
  'czs.jokers@centrum.cz',
  NOW()
)
ON CONFLICT ("supabaseUserId") DO NOTHING;
