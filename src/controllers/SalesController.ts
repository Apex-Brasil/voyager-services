import { Request, Response } from "express";
import cache from "memory-cache";

import { prisma } from "../../prisma/prismaClient";
import { responseMessages } from "../utils/constants";

export default class AssetsController {
  static async sales(req: Request, res: Response) {
    try {
      const { collection } = req.params;
      const threeDayAgo = Date.now() - 259200000;
      const response = await prisma.sales.findMany({
        where: {
          collection,
          updated_at: {
            gte: new Date(threeDayAgo),
          },
        },
        orderBy: {
          updated_at: "desc",
        },
      });

      const users = await prisma.user.findMany({
        where: {
          twitter_username: {
            not: null,
          },
          account: {
            not: null,
          },
        },
      });

      const responseWithTwitter = response.map(sale => {
        const foundSeller = users.find(user => user.account === sale.seller);
        const foundBuyer = users.find(user => user.account === sale.buyer);
        const symbol = sale.listing_symbol === "WAX" ? "WAX" : "USD";
        const price =
          symbol === "WAX"
            ? +sale.listing_price * 10 ** -8
            : +sale.listing_price * 10 ** -2;
        return {
          ...sale,
          seller_twitter: foundSeller?.twitter_username ?? null,
          buyer_twitter: foundBuyer?.twitter_username ?? null,
          price:
            symbol === "WAX"
              ? `${price.toFixed(2)} WAX`
              : `${price.toFixed(2)} USD`,
        };
      });

      cache.put(req.originalUrl, responseWithTwitter, 30 * 1000);

      return res
        .status(200)
        .send({ ...responseMessages.success, response: responseWithTwitter });
    } catch (error) {
      return res.status(500).send(responseMessages.internalServerError);
    }
  }

  static async auctions(req: Request, res: Response) {
    try {
      const { collection } = req.params;
      const threeDayAgo = Date.now() - 259200000;
      const response = await prisma.auctions.findMany({
        where: {
          collection,
          updated_at: {
            gte: new Date(threeDayAgo),
          },
        },
        orderBy: {
          updated_at: "desc",
        },
      });

      const users = await prisma.user.findMany({
        where: {
          twitter_username: {
            not: null,
          },
        },
      });

      const responseWithTwitter = response.map(auction => {
        const foundSeller = users.find(user => user.account === auction.seller);
        const foundBuyer = users.find(user => user.account === auction.buyer);
        const symbol = auction.listing_symbol === "WAX" ? "WAX" : "USD";
        const price =
          symbol === "WAX"
            ? +auction.listing_price * 10 ** -8
            : +auction.listing_price * 10 ** -2;
        return {
          ...auction,
          seller_twitter: foundSeller?.twitter_username ?? null,
          buyer_twitter: foundBuyer?.twitter_username ?? null,
          price:
            symbol === "WAX"
              ? `${price.toFixed(2)} WAX`
              : `${price.toFixed(2)} USD`,
        };
      });

      cache.put(req.originalUrl, responseWithTwitter, 30 * 1000);

      return res
        .status(200)
        .send({ ...responseMessages.success, response: responseWithTwitter });
    } catch (error) {}
  }
}
