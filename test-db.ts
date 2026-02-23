import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUser() {
  const users = await prisma.adminUser.findMany();
  console.log("Admin Users in DB:", users);
}

checkUser().finally(() => prisma.$disconnect());
