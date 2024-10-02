import { prisma } from "../../prisma/prismaClient";

export const cleanOldSales = async () => {
  // clean sales older than 3 days
  const threeDayAgo = Date.now() - 259200000;
  await prisma.sales.deleteMany({
    where: {
      updated_at: {
        lte: new Date(threeDayAgo),
      },
    },
  });
};
