import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "derekfrancis.14@gmail.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
const EMPLOYEE_EMAIL = process.env.SEED_EMPLOYEE_EMAIL ?? "employee@opustech.example";
const EMPLOYEE_PASSWORD = process.env.SEED_EMPLOYEE_PASSWORD ?? "ChangeMe123!";

async function main() {
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const employeePasswordHash = await bcrypt.hash(EMPLOYEE_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: "Marketing Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: EMPLOYEE_EMAIL },
    update: {},
    create: {
      email: EMPLOYEE_EMAIL,
      name: "Sample Employee",
      passwordHash: employeePasswordHash,
      role: "EMPLOYEE",
    },
  });

  const existingStyleGuide = await prisma.styleGuide.findFirst();
  if (!existingStyleGuide) {
    const defaultContent = fs.readFileSync(
      path.join(process.cwd(), "prisma/seed-content/default-style-guide.md"),
      "utf-8",
    );
    await prisma.styleGuide.create({
      data: { content: defaultContent, updatedById: admin.id },
    });
  }

  const existingPosts = await prisma.post.count();
  if (existingPosts === 0) {
    await prisma.post.create({
      data: {
        caption:
          "We just shipped a major update to our platform that cuts customer onboarding time in half. Huge thanks to the engineering and CX teams who made this happen. Read more about what's new:",
        linksJson: JSON.stringify(["https://opustechnologies.example/blog/onboarding-update"]),
        status: "PUBLISHED",
        createdById: admin.id,
      },
    });
    await prisma.post.create({
      data: {
        caption:
          "Opus Technologies is hiring across engineering, product, and design. If you want to build tools that real teams rely on every day, we'd love to talk.",
        linksJson: JSON.stringify(["https://opustechnologies.example/careers"]),
        status: "PUBLISHED",
        createdById: admin.id,
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Admin login:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Employee login: ${EMPLOYEE_EMAIL} / ${EMPLOYEE_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
