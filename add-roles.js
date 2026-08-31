const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'KIOSK'`);
    console.log("Added KIOSK");
  } catch (e) {
    console.log("KIOSK might already exist or error:", e.message);
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DISPLAY'`);
    console.log("Added DISPLAY");
  } catch (e) {
    console.log("DISPLAY might already exist or error:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
