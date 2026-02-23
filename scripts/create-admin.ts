import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY. Ensure you are running this with local supabase environment variables.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const password = "password123";

  console.log(`Creating test admin user: ${email}...`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let supabaseUserId = authData?.user?.id;

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log("User already exists in Supabase Auth. Forcing password reset to ensure consistency...");
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error("Failed to list users to find existing admin:", listError);
        process.exit(1);
      }
      const existingUser = listData.users.find((u) => u.email === email);
      if (existingUser) {
        supabaseUserId = existingUser.id;

        // Force reset the password
        const { error: updateError } = await supabase.auth.admin.updateUserById(supabaseUserId as string, {
          password: password,
          email_confirm: true,
        });

        if (updateError) {
          console.error("Failed to reset existing user password:", updateError);
          process.exit(1);
        }
      } else {
        console.error("Could not determine user ID");
        process.exit(1);
      }
    } else {
      console.error("Failed to create User in Auth:", authError);
      process.exit(1);
    }
  }

  if (!supabaseUserId) {
    console.error("Critical Error: supabaseUserId is undefined.");
    process.exit(1);
  }

  console.log(`Supabase User ID: ${supabaseUserId}`);

  // Now create or update the AdminUser record in Prisma
  await prisma.adminUser.upsert({
    where: { supabaseUserId },
    update: {
      email,
    },
    create: {
      supabaseUserId,
      email,
    },
  });

  console.log("Admin user successfully synchronized with the database.");
  console.log(`\nYou can now log in at /admin/login with:\nEmail: ${email}\nPassword: ${password}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
