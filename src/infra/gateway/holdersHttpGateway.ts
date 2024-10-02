import fetch from "cross-fetch";

import { HOLDER_ENDPOINT } from "../../utils/constants";

interface IOutput {
  collectionName: string;
  totalAssets: number;
  totalAssetsCirculating: number;
  totalBurned: number;
  owners: string;
  "1-10": string;
  "11-20": string;
  "21-30": string;
  "31-40": string;
  "41-50": string;
  "51+": string;
}

export const fectchHoldersByCollection = async (
  collectionName: string,
): Promise<IOutput> => {
  console.info("[start] fectchHoldersCollection");
  const endpoint = HOLDER_ENDPOINT.replace("{collection_name}", collectionName);
  const reponse = await fetch(endpoint);
  console.info("[end] fectchHoldersCollection");
  return await reponse.json();
};
