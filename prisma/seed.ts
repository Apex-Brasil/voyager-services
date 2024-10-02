import { PrismaClient } from "@prisma/client";

import { SERVICES_TO_CREATE } from "../src/utils/constants";
const prisma = new PrismaClient();

const seed = async () => {
  const status = await prisma.status.createMany({
    data: SERVICES_TO_CREATE,
    skipDuplicates: true,
  });

  console.log(status);
};

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
