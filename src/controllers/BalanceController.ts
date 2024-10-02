import axios from "axios";
import { JsonRpc } from "eosjs";
import { Request, Response } from "express";
import cache from "memory-cache";

import {
  balanceEndpoint,
  responseMessages,
  rpcEndpoint,
} from "../utils/constants";
interface IBalances {
  contract: string;
  currency: string;
  decimals: string;
  amount: string;
}

interface IDataAlcorLPBalance {
  currency: string;
  amount: string;
}

interface IPair {
  id: string;
  supply: string;
  pool1: {
    quantity: string;
    contract: string;
  };
  pool2: {
    quantity: string;
    contract: string;
  };
}

async function fetchTacoLPBalance(name: string) {
  const rpc = new JsonRpc(rpcEndpoint, { fetch });
  const dataRequestPairs: any = {
    code: "swap.taco",
    scope: "swap.taco",
    table: "pairs",
    json: true,
    limit: 1000,
  };

  const dataRequestAllWalletPairs: any = {
    code: "swap.taco",
    scope: name,
    table: "accounts",
    json: true,
    limit: 1000,
  };

  const requestTablePairs = async (dataRequest: any) => {
    let nextKey = "0";
    let dataCost: any[] = [];

    while (true) {
      const response = await rpc?.get_table_rows(dataRequest);

      dataCost = [...dataCost, ...response.rows];
      if (!response.more) {
        break;
      } else {
        nextKey = response.next_key;
        dataRequest.lower_bound = nextKey;
      }
    }

    return dataCost;
  };

  const rowsPairs: IPair[] = await requestTablePairs(dataRequestPairs);
  const rowsAllWalletPairs = await requestTablePairs(dataRequestAllWalletPairs);

  const returningSymbolWalletPairs = rowsAllWalletPairs.map(
    (walletPair: { balance: string }) => {
      const generalPair = rowsPairs?.find(
        (pair: IPair) => pair.id === walletPair.balance.split(" ")[1],
      );

      const obj = {
        symbol: walletPair.balance.split(" ")[1],
        balance: walletPair.balance.split(" ")[0],
        generalPair,
      };

      return obj;
    },
  );

  const matchingPairsPercentage = returningSymbolWalletPairs.map(
    (pair: {
      symbol: string;
      balance: string;
      generalPair: IPair | undefined;
    }) => {
      if (!pair.generalPair) {
        return {
          pool1Resolv: "",
          pool2Resolv: "",
        };
      }

      const supply = Number(pair.generalPair.supply.split(" ")[0]);
      const percentageSupply = (Number(pair.balance) / supply) * 100;
      const { pool1, pool2 } = pair.generalPair;
      const pool1Resolv = (Number(pool1.quantity.split(" ")[0]) / supply) * 100;
      const pool2Resolv = (Number(pool2.quantity.split(" ")[0]) / supply) * 100;

      const sumPool1 = `${pool1Resolv + percentageSupply} ${
        pool1.quantity.split(" ")[1]
      }`;
      const sumPool2 = `${pool2Resolv + percentageSupply} ${
        pool2.quantity.split(" ")[1]
      }`;

      return {
        pool1Resolv: sumPool1,
        pool2Resolv: sumPool2,
      };
    },
  );

  const reducingTokens = matchingPairsPercentage.reduce((acc: any, item) => {
    // Extrai o nome do token da string
    const tokenName1: string = item.pool1Resolv.split(" ")[1];
    const tokenName2: string = item.pool2Resolv.split(" ")[1];

    // Soma a quantidade de token ao acumulador
    acc[tokenName1] = (acc[tokenName1] || 0) + parseFloat(item.pool1Resolv);
    acc[tokenName2] = (acc[tokenName2] || 0) + parseFloat(item.pool2Resolv);

    return acc;
  }, {});

  const result = Object.entries(reducingTokens).map(([currency, amount]) => ({
    currency,
    amount: amount as string,
  }));

  return result;
}

async function fetchAlcorLPBalance(name: string) {
  const responseAlcorLPBalance = await axios.get(
    `https://alcor.exchange/api/v2/account/${name}/positions`,
  );
  const dataAlcorLPBalance = responseAlcorLPBalance.data;

  const sumAmountsByAlcorToken = dataAlcorLPBalance.reduce(
    (acc: any, entry: any) => {
      // Process amountA
      const amountAToken = entry.amountA.split(" ")[1];
      acc[amountAToken] =
        (acc[amountAToken] || 0) + parseFloat(entry.amountA.split(" ")[0]);

      // Process amountB
      const amountBToken = entry.amountB.split(" ")[1];
      acc[amountBToken] =
        (acc[amountBToken] || 0) + parseFloat(entry.amountB.split(" ")[0]);

      return acc;
    },
    {},
  );

  const mapSumAmountsByAlcorTokenToResult = Object.entries(
    sumAmountsByAlcorToken,
  ).map(([currency, amount]) => ({
    currency,
    amount: amount as string,
  }));

  return mapSumAmountsByAlcorTokenToResult;
}

async function fetchBalanceWallet(name: string) {
  const walletBalanceResponse = await axios.get(`${balanceEndpoint}/${name}`);
  return walletBalanceResponse.data.balances;
}
export default class BalanceController {
  static async byUser(req: Request, res: Response) {
    const { name } = req.params;

    try {
      const mapSumAmountsByTACOTokenToResult: {
        currency: string;
        amount: string;
      }[] = await fetchTacoLPBalance(name);

      const mapSumAmountsByALCORTokenToResult: {
        currency: string;
        amount: string;
      }[] = await fetchAlcorLPBalance(name);

      const dataBalanceWallet: IBalances[] = await fetchBalanceWallet(name);

      const filteredDataHigherAmountInWallet = dataBalanceWallet.filter(
        (balance: IBalances) => Number(balance.amount) > 0,
      );

      const data = filteredDataHigherAmountInWallet.map(
        (balance: IBalances) => {
          const alcorLiquidity = mapSumAmountsByALCORTokenToResult.find(
            (alcorLPBalance: IDataAlcorLPBalance) =>
              alcorLPBalance.currency === balance.currency,
          );

          const tacoLiquidity = mapSumAmountsByTACOTokenToResult.find(
            (tacoLPBalance: IDataAlcorLPBalance) =>
              tacoLPBalance.currency === balance.currency,
          );

          return {
            ...balance,
            alcor_LP: alcorLiquidity || {
              currency: balance.currency,
              amount: "0",
            },
            taco_LP: tacoLiquidity || {
              currency: balance.currency,
              amount: "0",
            },
          };
        },
      );

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
