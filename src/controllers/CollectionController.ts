import axios from "axios";
import fetch from "cross-fetch";
import { JsonRpc } from "eosjs";
import { Request, Response } from "express";
import cache from "memory-cache";

import { prisma } from "../../prisma/prismaClient";
import { getRedis, redisKeys } from "../redisConfig";
import { consultAssessment, executeAssessment } from "../services/assessement";
import {
  findCollection,
  findWhitelistCollection,
  getAllVoyagerScores,
  getVoyagerScoresByCOllection,
} from "../services/collection";
import {
  IPFS_URL,
  atomicEndpoint,
  atomicMarketEndpoint,
  divider,
  mainEndpoint,
  responseMessages,
  rpcEndpoint,
  twoHours,
} from "../utils/constants";
import { assetFormatter, collectionStatusFormatter } from "../utils/formatter";

export default class CollectionController {
  static async index(req: Request, res: Response) {
    const { page, sort, order, find, whitelist, limit, isRankedPage } =
      req.query;

    try {
      const defaultPage = (page || 1) as number;
      const defaultOrder = (order || "desc") as string;
      const defaultSort = (sort || "sales") as string;
      const defaultLimit = Number(limit) || 10;

      const tempObj: any[] = [];

      // todas collections e usando find
      if (find && !whitelist) {
        const data = await findCollection(
          find as string,
          defaultOrder,
          defaultSort,
        );

        data.forEach((element: any) => {
          const temp = {
            collection_name: element.collection_name,
            name: element.name,
            img: IPFS_URL + element.img,
            sales: element.sales,
            volume: element.volume,
          };

          tempObj.push(temp);
        });

        return res.status(200).send(data);
      }

      // todas collections sem usar find
      if (!whitelist) {
        const response = await axios.get(
          `${atomicMarketEndpoint}/stats/collections?symbol=WAX&limit=${defaultLimit}&page=${defaultPage}&order=${defaultSort}&sort=${defaultSort}`,
        );
        const data = response.data.data.results;

        data.forEach((element: any) => {
          const temp = {
            collection_name: element.collection_name,
            name: element.name,
            img: IPFS_URL + element.img,
            sales: element.sales,
            volume: element.volume,
          };

          tempObj.push(temp);
        });

        return res.status(200).send(tempObj.slice(0, defaultLimit));
      }

      // para ranking page
      if (whitelist && isRankedPage) {
        const getCollectionsRedis = await getRedis(
          redisKeys.rankingCollections,
        );

        // arr of arr so we need to flat
        const data = JSON.parse(getCollectionsRedis!).flat();
        return res.status(200).send(data);
      }

      // whitelist collections e usando find
      if (find) {
        const data = await findWhitelistCollection(
          find as string,
          defaultSort,
          defaultSort,
        );

        data.forEach((element: any) => {
          const temp = {
            collection_name: element.collection_name,
            name: element.name,
            img: IPFS_URL + element.img,
            sales: element.sales,
            volume: element.volume,
          };

          tempObj.push(temp);
        });
        cache.put(req.originalUrl, tempObj, 30 * 60 * 1000);
        return res.status(200).send(data);
      }

      // todas collections sem usar find
      const collectionsArr = await prisma.explorer.findMany();
      const sortedCollections = collectionsArr
        .slice()
        .sort((a: any, b: any) => {
          if (order === "asc") {
            return a[defaultSort] - b[defaultSort];
          } else {
            return b[defaultSort] - a[defaultSort];
          }
        })
        .slice(36 * (+defaultPage - 1), 36 * +defaultPage);

      sortedCollections.forEach((element: any) => {
        const temp = {
          collection_name: element.collection_name,
          name: element.name,
          img: IPFS_URL + element.img,
          sales: element.sales,
          volume: element.volume,
        };

        tempObj.push(temp);
      });
      cache.put(req.originalUrl, tempObj, 30 * 60 * 1000);
      return res.status(200).send(tempObj);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }

  static async status(req: Request, res: Response) {
    try {
      const { name } = req.params;

      const response = await axios.get(atomicEndpoint + "/collections/" + name);
      const formated = collectionStatusFormatter(response.data);

      cache.put(req.originalUrl, formated, 30 * 60 * 1000);

      res.status(200).send({ ...responseMessages.success, data: formated });
    } catch (error) {
      res.status(500).send(responseMessages.internalServerError);
    }
  }

  static async schemas(req: Request, res: Response) {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).send(responseMessages.missingCollectionName);
      }

      let nonce = Date.now();
      let pageNumber = 1;

      let data: any[] = [];
      while (true) {
        const response = await axios.get(
          `${atomicEndpoint}/schemas?collection_name=${name}&limit=1000&page=${pageNumber}&nonce=${nonce}`,
        );
        data = [...data, ...response.data.data] as any;
        pageNumber++;
        nonce = Date.now() + 1;
        if (response.data.data.length < 1000) {
          break;
        }
      }
      const dataMap = data.map(item => item.schema_name);
      cache.put(req.originalUrl, dataMap, 30 * 60 * 1000);
      res.status(200).send({
        ...responseMessages.success,
        data: dataMap,
      });
    } catch (error) {
      res.status(500).send(responseMessages.internalServerError);
    }
  }

  static async assets(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const { schema } = req.query;

      if (!name) {
        return res.status(400).send(responseMessages.missingCollectionName);
      }

      if (!schema) {
        return res.status(400).send(responseMessages.missingSchemaName);
      }

      let nonce = Date.now();
      let pageNumber = 1;

      let data = [];
      while (true) {
        const response = await axios.get(
          `${atomicEndpoint}/assets?collection_name=${name}&schema_name=${
            schema as string
          }&limit=1000&page=${pageNumber}&nonce=${nonce}`,
        );
        data = [...data, ...response.data.data] as any;
        pageNumber++;
        nonce = Date.now() + 1;
        if (response.data.data.length < 1000) {
          break;
        }
      }

      const formated = assetFormatter(data);

      const tempArray: any[] = [];

      formated.forEach((element: any) => {
        const existwner = tempArray.find(item => item.owner === element.owner);

        if (existwner) {
          existwner.quantity++;
        } else {
          tempArray.push({
            owner: element.owner,
            template: element.template_id,
            quantity: 1,
          });
        }
      });

      const sortByQuantity = [...tempArray].sort(
        (a, b) => b.quantity - a.quantity,
      );

      cache.put(req.originalUrl, sortByQuantity, 30 * 60 * 1000);

      res
        .status(200)
        .send({ ...responseMessages.success, data: sortByQuantity });
    } catch (error: any) {
      res.status(500).send(responseMessages.internalServerError);
    }
  }

  static async holders(req: Request, res: Response) {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).send(responseMessages.missingCollectionName);
      }
      const response = await axios.get(
        `${mainEndpoint}/analytics/${name}/buckets`,
      );

      const tempObj = response.data;

      cache.put(req.originalUrl, tempObj, 30 * 60 * 1000);

      return res
        .status(200)
        .send({ ...responseMessages.success, data: tempObj });
    } catch (error: any) {
      console.log(error);
      res.status(500).send(responseMessages.internalServerError);
    }
  }

  static async accounts(req: Request, res: Response) {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).send(responseMessages.missingCollectionName);
      }

      const existsCollection = await prisma.holders.findFirst({
        where: {
          collection_name: name,
        },
      });

      if (existsCollection) {
        if (+existsCollection.updated_at + twoHours < Date.now()) {
          let nonce = Date.now();
          let page = 1;

          let data: any = [];
          while (true) {
            const response = await axios.get(
              `${atomicEndpoint}/accounts?collection_name=${name}&limit=1000&page=${page}&nonce=${nonce}`,
            );
            data = [...data, ...response.data.data] as any;
            page++;
            nonce = Date.now() + 1;
            if (response.data.data.length < 1000) {
              break;
            }
          }

          const tempObj: any = {
            accounts: data.length,
          };

          await prisma.holders.update({
            where: {
              id: existsCollection.id,
            },
            data: {
              accounts: data.length.toString(),
              updated_at: Date.now().toString(),
            },
          });

          return res
            .status(200)
            .send({ ...responseMessages.success, data: tempObj });
        }

        const tempObj: any = {
          accounts: existsCollection.accounts,
        };

        cache.put(req.originalUrl, tempObj, 60 * 1000);

        return res
          .status(200)
          .send({ ...responseMessages.success, data: tempObj });
      }

      let nonce = Date.now();
      let page = 1;

      let data: any = [];
      while (true) {
        const response = await axios.get(
          `${atomicEndpoint}/accounts?collection_name=${name}&limit=1000&page=${page}&nonce=${nonce}`,
        );
        data = [...data, ...response.data.data] as any;
        page++;
        nonce = Date.now() + 1;
        if (response.data.data.length < 1000) {
          break;
        }
      }

      const tempObj: any = {
        accounts: data.length,
      };

      await prisma.holders.create({
        data: {
          collection_name: name,
          accounts: data.length.toString(),
          updated_at: Date.now().toString(),
        },
      });

      cache.put(req.originalUrl, tempObj, 60 * 1000);

      return res
        .status(200)
        .send({ ...responseMessages.success, data: tempObj });
    } catch (error: any) {
      res.status(500).send(responseMessages.internalServerError);
    }
  }

  static async market(req: Request, res: Response) {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).send({
          message: "Missing collection name",
        });
      }

      const response = await axios.get(
        `${atomicMarketEndpoint}/stats/collections/${name}?symbol=WAX`,
      );

      const data = response.data.data;
      const vol = Number((+data.result.volume / divider).toFixed(2));

      const tempObj: any = {
        symbol: data.symbol,
        collection_name: data.result.collection_name,
        volume: vol.toLocaleString() + "K",
        sales: data.result.sales,
        img: IPFS_URL + data.result.img,
        author: data.result.author,
        authorized_accounts: data.result.authorized_accounts,
      };

      cache.put(req.originalUrl, tempObj, 60 * 1000);

      res.status(200).send({ ...responseMessages.success, data: tempObj });
    } catch (error: any) {
      res.status(500).send(responseMessages.internalServerError);
    }
  }

  static async filters(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const rpc = new JsonRpc(rpcEndpoint, { fetch });

      if (!name) {
        return res.status(400).send(responseMessages.missingCollectionName);
      }

      let nonce = Date.now();
      let page = 1;

      let data: any = [];
      while (true) {
        const response = await axios.get(
          `${atomicEndpoint}/templates?collection_name=${name}&limit=1000&page=${page}&nonce=${nonce}`,
        );
        data = [...data, ...response.data.data] as any;
        page++;
        nonce = Date.now() + 1;
        if (response.data.data.length < 1000) {
          break;
        }
      }

      if (!data.length) {
        return res.status(404).send(responseMessages.collectionNotFound);
      }

      const responseRows = await rpc.get_table_rows({
        json: true,
        code: "atomhubtools",
        scope: name,
        table: "colfilters",
        limit: 1000,
      });

      const atomicFilters = responseRows.rows.map((val: any) => {
        const possibleValues = val.possible_values.map((item: any) =>
          JSON.parse(item),
        );

        cache.put(req.originalUrl, possibleValues, 60 * 1000);

        return {
          ...val,
          possible_values: possibleValues,
        };
      });

      const tempArray: any[] = [];

      const filteredData = data.filter((item: any) => +item.issued_supply > 0);

      filteredData.forEach((item: any) => {
        const exist = tempArray.find(
          element => element.schema_name === item.schema.schema_name,
        );

        const tempObj = {
          schema_name: item.schema.schema_name,
          template: item.template_id,
          data: {
            ...item.immutable_data,
            img: IPFS_URL + item.immutable_data.img,
            about: "",
          },
          mutable: item.mutable_data,
          immutable: item.immutable_data,
        };

        if (exist) {
          exist.assets.push(tempObj);
        } else {
          tempArray.push({
            schema_name: item.schema.schema_name,
            assets: [tempObj],
          });
        }
      });

      const tempData = {
        data: tempArray,
        filters: atomicFilters,
        collection_name: name,
      };

      cache.put(req.originalUrl, tempData, 60 * 1000);

      res.status(200).send({ ...responseMessages.success, data: tempData });
    } catch (error: any) {
      res.status(500).send(responseMessages.internalServerError);
    }
  }

  static async assessments(req: Request, res: Response) {
    console.info("[start] CollectionController - assessments");
    await executeAssessment(req.body);
    cache.put(req.originalUrl, req.body, 30 * 60 * 1000);
    res.status(204).send();
    console.info("[end] CollectionController - assessments");
  }

  static async consultAssessment(req: Request, res: Response) {
    console.info("[start] CollectionController - assessments consult");
    const { collectionName, wallet } = req.query;
    const data = await consultAssessment(
      collectionName as string,
      wallet as string,
    );
    cache.put(req.originalUrl, data, 30 * 60 * 1000);
    res.status(200).send({ data });
    console.info("[end] CollectionController - assessments consult");
  }

  static async voyagerScores(req: Request, res: Response) {
    console.info("[start] CollectionController - voyagerScores");
    const collection = req.query.byCollection as string;
    const responseVoyagerScore =
      collection !== undefined
        ? await getVoyagerScoresByCOllection(collection)
        : await getAllVoyagerScores();
    cache.put(req.originalUrl, responseVoyagerScore, 30 * 60 * 1000);
    res.status(200).send(responseVoyagerScore);
    console.info("[end] CollectionController - voyagerScores");
  }

  static readonly pairs = async (req: Request, res: Response) => {
    // implementação do switch rpc via server
    const rpc = new JsonRpc(rpcEndpoint, { fetch });

    const dataRequest: any = {
      json: true,
      code: "delphioracle",
      scope: "waxpusd",
      table: `datapoints`,
      limit: 1,
    };

    try {
      const response = await rpc?.get_table_rows(dataRequest);
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(
        `The script uses approximately ${Math.round(used * 100) / 100} MB`,
      );
      cache.put(req.originalUrl, response.rows || [], 10 * 1000);
      return res.status(200).json(response.rows || []);
    } catch (error: any) {
      return res.status(200).json({
        error: error.message,
      });
    }
  };
}
