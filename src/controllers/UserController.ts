import { Request, Response } from "express";
import cache from "memory-cache";

import { prisma } from "../../prisma/prismaClient";
import { responseMessages } from "../utils/constants";

export default class UsersController {
  static async getUsers(req: Request, res: Response) {
    try {
      const allowedWallets = process.env.ALLOWED_WALLETS?.split(",");
      const { wallet } = req.params;

      if (!wallet) {
        return res.status(400).send(responseMessages.missingWalletName);
      }

      if (!allowedWallets?.includes(wallet)) {
        return res.status(401).send(responseMessages.walletUnauthorized);
      }

      const users = await prisma.user.findMany();

      cache.put(req.originalUrl, users, 30 * 1000);

      return res.status(200).send({ ...responseMessages.success, data: users });
    } catch (error) {
      return res.status(500).send(responseMessages.internalServerError);
    }
  }
}
