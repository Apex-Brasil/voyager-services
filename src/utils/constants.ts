import dotenv from "dotenv";
dotenv.config();

export const tokenExpiresIn = "10d";

export const mainEndpoint = `${process.env.PRIVATE_API_ENDPOINT}/${process.env.PRIVATE_KEY}`;
export const rpcEndpoint: string = mainEndpoint || "";

export const atomicPublicEndpoint: string =
  process.env.ATOMIC_PUBLIC_ENDPOINT ?? "";

export const historyActionsEndpoint: string =
  "https://wax.connect3.io/{{credentials}}/history/actions?name=transfer&contract=eosio.token";

export const atomicEndpoint: string =
  mainEndpoint.split("//").join("//atomic.") + "/atomicassets/v1/" || "";
export const atomicMarketEndpoint: string =
  mainEndpoint.split("//").join("//atomic.") + "/atomicmarket/v1" || "";
export const atomicMarketV2Endpoint: string =
  mainEndpoint.split("//").join("//atomic.") + "/atomicmarket/v2" || "";
export const balanceEndpoint: string = process.env.BALANCE_ENDPOINT ?? "";
export const contractAccountKey: string =
  process.env.CONTRACT_ACCOUNT_KEY ?? "";
export const executionContractKey: string =
  process.env.EXECUTION_CONTRACT_KEY ?? "";
export const atomicassetsContractAccount = "atomicassets";
export const atomicAssetsRoute = "atomic";
export const contractGlobalConfigTable: string = "config";
export const contractTableDefaultLimit = 3000;
export const HOLDER_ENDPOINT: string = `${mainEndpoint}/analytics/{collection_name}/buckets`;

export const IPFS_URL = "https://atomichub-ipfs.com/ipfs/";

export const twoHours = 7200000;
export const divider = 100000000000;
export const atomicToolsContract = "atomhubtools";
export const CORS_ORIGIN = process.env.CORS_ORIGIN || ["http://localhost:3000"];

export const responseMessages = {
  success: {
    code: 200,
    status: "success",
  },
  internalServerError: {
    code: 500,
    message: "Internal server error",
    status: "error",
  },
  badRequest: {
    code: 400,
    message: "Bad request",
    status: "error",
  },
  collectionNotFound: {
    code: 404,
    message: "Collection not found",
    status: "error",
  },
  missingCollectionName: {
    code: 400,
    message: "Missing collection name",
    status: "error",
  },
  missingSchemaName: {
    code: 400,
    message: "Missing schema name",
    status: "error",
  },
  missingWalletName: {
    code: 400,
    message: "Missing wallet name",
    status: "error",
  },
  walletUnauthorized: {
    code: 401,
    message: "Wallet unauthorized",
    status: "error",
  },
};

export const SERVICES_TO_CREATE = [
  {
    service: "sync_sales",
    status: "success",
    last_id: "148160822",
  },
  {
    service: "sync_auctions",
    status: "success",
    last_id: "148160822",
  },
];
