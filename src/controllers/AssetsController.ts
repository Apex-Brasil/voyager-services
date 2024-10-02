import { Request, Response } from "express";
import cache from "memory-cache";

import { AtomicService } from "../services/atomic.service";
import { responseMessages } from "../utils/constants";

export default class AssetsController {
  private readonly atomicService: AtomicService = new AtomicService();
  async byUser(req: Request, res: Response) {
    try {
      const { wallet } = req.params;
      const assets = await this.atomicService.getAssetsByUser(wallet);

      cache.put(req.originalUrl, assets, 60 * 1000);
      res.status(200).send({ ...responseMessages.success, data: assets });
    } catch (error) {
      console.log(error);
      res.status(500).send(responseMessages.internalServerError);
    }
  }

  async graph(req: Request, res: Response) {
    try {
      const { template } = req.params;

      const graphTemplateData =
        await this.atomicService.getGraphByTemplate(template);

      cache.put(req.originalUrl, graphTemplateData, 60 * 1000);

      return res
        .status(200)
        .send({ ...responseMessages.success, data: graphTemplateData });
    } catch (error) {
      return res.status(500).send(responseMessages.internalServerError);
    }
  }
}
