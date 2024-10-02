import axios from "axios";
import { Request, Response } from "express";
import cache from "memory-cache";

import { responseMessages } from "../utils/constants";

interface ISpecificToken {
  quote_token: {
    symbol: {
      name: string;
      precision: number;
    };
    contract: string;
  };
  last_price: number;
}

export default class TokensMarketController {
  static async fullMarket(req: Request, res: Response) {
    const url = "https://wax.alcor.exchange/api/markets";

    try {
      const response = await axios.get(url);
      const data = response.data;

      const result = {
        ...responseMessages.success,
        data,
      };

      cache.put(req.originalUrl, result, 30 * 1000);

      res.status(200).send(result);
    } catch (error) {
      res.status(500).send(responseMessages.internalServerError);
    }
  }

  static async marketByToken(req: Request, res: Response) {
    const { token } = req.params;
    const url = `https://wax.alcor.exchange/api/markets`;

    try {
      const response = await axios.get(url);
      const dataResponse = response.data;
      const findingSpecificToken: ISpecificToken = dataResponse.find(
        (tokenData: ISpecificToken) =>
          tokenData.quote_token.symbol.name === token,
      );

      const data = {
        token_name: findingSpecificToken.quote_token.symbol.name,
        token_last_price: findingSpecificToken.last_price,
      };

      const result = {
        ...responseMessages.success,
        data,
      };

      cache.put(req.originalUrl, result, 30 * 1000);

      res.status(200).send(result);
    } catch (error) {
      res.status(500).send(responseMessages.internalServerError);
    }
  }
}
