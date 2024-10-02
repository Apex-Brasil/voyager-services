import axios from "axios";

import { prisma } from "../../prisma/prismaClient";
import { atomicMarketEndpoint } from "../utils/constants";

export const syncAuctions = async () => {
  // getting update_at from status service sales_sync and use it as after param
  // to guarantee that we are not missing any sales we will decrease the value by 1 hour
  // for first run we will use 3 days ago

  const syncSalesStatus = await prisma.status.findFirst({
    where: {
      service: {
        equals: "sync_auctions",
      },
    },
  });

  if (!syncSalesStatus) {
    throw new Error("Sales sync status not found");
  }

  const promises = [];
  // 12 hours ago
  const after = new Date(Date.now() - 12 * 60 * 60 * 1000).getTime();

  const numberOfPages = 30;
  let data: any[] = [];

  while (true) {
    for (let i = 0; i < numberOfPages; i++) {
      const promise = axios.get(
        `${atomicMarketEndpoint}/auctions?state=3&limit=100&page=${
          i + 1
        }&after=${after}&sort=created&order=desc`,
      );
      console.log(
        `${atomicMarketEndpoint}/auctions?state=3&limit=100&page=${
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
          auction_id: sale.auction_id,
          seller: sale.seller,
          buyer: sale.buyer,
          offer_id: sale.offer_id,
          listing_price: sale.price.amount,
          listing_symbol: sale.price.token_symbol,
          assets: sale.assets.map((asset: { asset_id: any }) => asset.asset_id),
          collection: sale.assets[0].collection.collection_name,
        };
      });
    console.log(response.length, "auctions synced");

    data = [...data, ...response];
    // return the biggest sale_id from the response
    if (response.length < numberOfPages * 100) {
      break;
    }
  }

  await prisma.auctions.createMany({
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
