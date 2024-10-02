import axios from "axios";
import { JsonRpc } from "eosjs";
import { Request, Response } from "express";
import cache from "memory-cache";

import {
  responseMessages,
  atomicMarketV2Endpoint,
  atomicMarketEndpoint,
  rpcEndpoint,
  historyActionsEndpoint,
} from "../utils/constants";

async function fetchSalesData(
  collectionName: string,
  after: number,
): Promise<any> {
  const response = await axios.get(
    `${atomicMarketV2Endpoint}/sales?collection_name=${collectionName}&after=${after}&page=1&limit=100&order=desc&sort=price&state=3`,
  );
  return response.data;
}

async function fetchVolumesData(collectionName: string): Promise<any> {
  const response = await axios.get(
    `${atomicMarketEndpoint}/stats/graph?symbol=WAX&collection_whitelist=${collectionName}`,
  );

  return response.data;
}

function calculateTransactionFrequency(salesData: any[]): {
  classification: number;
  allSalesWallets: string[];
} {
  const assetWalletsCountArray: any[] = [];

  salesData.forEach(saleData => {
    const assetId = saleData.assets[0].asset_id;

    const walletsCount =
      assetWalletsCountArray.find(obj => obj.asset_id === assetId)
        ?.numberOfAssociatedWallets || 0;

    let classification = 0.1;

    if (walletsCount >= 8) {
      classification = 0.4;
    } else if (walletsCount >= 6) {
      classification = 0.2;
    }

    const resultObject = {
      asset_id: assetId,
      numberOfAssociatedWallets: walletsCount + 2,
      classification,
    };

    assetWalletsCountArray.push(resultObject);
  });

  const findingHigherItemResultArray = assetWalletsCountArray.reduce(
    (higherObject, currentObject) => {
      return currentObject.numberOfAssociatedWallets >
        higherObject.numberOfAssociatedWallets
        ? currentObject
        : higherObject;
    },
    assetWalletsCountArray[0],
  );

  const allWallets = salesData
    .map(saleData => [saleData.seller, saleData.buyer]) // Mapeia para uma array de arrays contendo seller e buyer
    .flat();

  const uniqueSalesWallets = [...new Set(allWallets)];

  return {
    classification: findingHigherItemResultArray.classification,
    allSalesWallets: uniqueSalesWallets,
  };
}

async function calculateAccountActivity(
  holders: string[],
  sevenDaysTimestamp: number,
) {
  const rpc = new JsonRpc(rpcEndpoint, { fetch });

  const validFromStrings = [
    "waxonbinance",
    "okxtothemars",
    "kcstothemoon",
    "bittrex",
  ];

  const holdersPromises = holders.map(holder => rpc.get_account(holder));

  const resolvedHolders = await Promise.all(holdersPromises);

  const resultHolders = resolvedHolders
    .filter(holder => {
      const createdTimestamp = new Date(holder.created).getTime();

      return createdTimestamp >= sevenDaysTimestamp;
    })
    .map(holder => holder.account_name);

  const ActionsPromises = resultHolders.map(holder => {
    const response = axios.get(`${historyActionsEndpoint}&account=${holder}`);

    return response;
  });

  const resolvedActions: any = (await Promise.all(ActionsPromises.slice(0, 3)))
    .map(response => response.data)
    .flat();

  const resultsActions = resolvedActions
    .map((action: any) => {
      const data = action.data;
      const actionContainsFrom = !!data.from;
      const actionsCotainsTo = !!data.to;
      const actionIncludesFrom = validFromStrings.includes(data.from);
      const isValid =
        data &&
        [actionContainsFrom, actionsCotainsTo, actionIncludesFrom].every(
          Boolean,
        );

      if (isValid) {
        return {
          from: data.from,
          to: data.to,
        };
      } else {
        return undefined;
      }
    })
    .filter((item: any) => item !== undefined);

  if (resultsActions.length >= 11) {
    return 0.3;
  }
  if (resultsActions.length >= 6) {
    return 0.2;
  }
  if (resultsActions.length >= 1) {
    return 0.1;
  }

  return 0;
}

function calculateVoumeClassification(
  volumesData: any[],
  sevenDaysTimestamp: number,
) {
  const findingFirstTimestamp = volumesData.find(
    item => parseInt(item.time) >= sevenDaysTimestamp,
  );
  const lastVolume = volumesData[volumesData.length - 1];
  const historicalVolume = parseInt(findingFirstTimestamp.volume);
  const currentVolume = parseInt(lastVolume.volume);

  const volumeIncreasePercentage =
    ((currentVolume - historicalVolume) / historicalVolume) * 100;

  if (volumeIncreasePercentage >= 60) {
    return 0.3;
  }

  if (volumeIncreasePercentage >= 40) {
    return 0.2;
  }

  if (volumeIncreasePercentage >= 0) {
    return 0.1;
  }

  return 0;
}

export default class WashTradingController {
  static async byCollection(req: Request, res: Response) {
    const { name } = req.params;
    const nowTimestamp = Date.now();
    const sevenDaysTimestamp = nowTimestamp - 7 * 24 * 60 * 60 * 1000;

    try {
      const salesData = await fetchSalesData(name, sevenDaysTimestamp);
      const volumesData = await fetchVolumesData(name);

      const transactionFrequency = calculateTransactionFrequency(
        salesData.data,
      );

      const accountActivity = await calculateAccountActivity(
        transactionFrequency.allSalesWallets,
        sevenDaysTimestamp,
      );

      const historicalTradingBehavior = calculateVoumeClassification(
        volumesData.data.results,
        sevenDaysTimestamp,
      );

      const data = {
        wash_trading_score:
          transactionFrequency.classification +
          accountActivity +
          historicalTradingBehavior,
      };

      const result = {
        ...responseMessages.success,
        data,
      };

      cache.put(req.originalUrl, result, 60 * 30 * 1000);

      res.status(200).send(result);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send(responseMessages.internalServerError);
    }
  }
}
