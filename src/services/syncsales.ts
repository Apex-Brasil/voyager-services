import axios from "axios";

import { prisma } from "../../prisma/prismaClient";
import { atomicMarketV2Endpoint } from "../utils/constants";

export const syncSales = async () => {
  // getting update_at from status service sales_sync and use it as after param
  // to guarantee that we are not missing any sales we will decrease the value by 1 hour
  // for first run we will use 3 days ago

  const syncSalesStatus = await prisma.status.findFirst({
    where: {
      service: {
        equals: "sync_sales",
      },
    },
  });

  if (!syncSalesStatus) {
    throw new Error("Sales sync status not found");
  }

  const promises = [];
  // 1 hour ago
  const after = new Date(Date.now() - 60 * 60 * 1000).getTime();

  const numberOfPages = 30;
  let data: any[] = [];

  while (true) {
    for (let i = 0; i < numberOfPages; i++) {
      const promise = axios.get(
        `${atomicMarketV2Endpoint}/sales?state=3&limit=100&page=${
          i + 1
        }&after=${after}&sort=created&order=desc`,
      );
      promises.push(promise);
    }

    const response = (await Promise.all(promises))
      .map(res => res.data.data)
      .flat()
      .map(sale => {
        return {
          sale_id: sale.sale_id,
          seller: sale.seller,
          buyer: sale.buyer,
          offer_id: sale.offer_id,
          listing_price: sale.listing_price,
          listing_symbol: sale.listing_symbol,
          assets: sale.assets.map((asset: { asset_id: any }) => asset.asset_id),
          collection: sale.assets[0].collection.collection_name,
        };
      });
    console.log(response.length, "sales synced");

    data = [...data, ...response];
    if (response.length < numberOfPages * 100) {
      break;
    }
  }

  await prisma.sales.createMany({
    data,
    skipDuplicates: true,
  });

  await prisma.status.update({
    where: {
      id: syncSalesStatus.id,
    },
    data: {
      status: "success",
      updated_at: new Date(),
    },
  });
};
