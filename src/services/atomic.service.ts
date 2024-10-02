import axios from "axios";

import { graphDataFormatter, interpolatedData } from "../lib/graph";
import {
  atomicEndpoint,
  atomicMarketEndpoint,
  atomicPublicEndpoint,
} from "../utils/constants";
import { AssetFormatterService } from "./asset-format.service";

export class AtomicService {
  private readonly atomicEndpoint = atomicEndpoint;
  private readonly atomicPublicEndpoint = atomicPublicEndpoint;
  private readonly atomicMarketEndpoint = atomicMarketEndpoint;
  private readonly limit = 1000;
  private readonly assetFormatterService: AssetFormatterService =
    new AssetFormatterService();

  async getAssetsNumberResponse(wallet: string) {
    const walletAssetsNumberUrl = `${this.atomicEndpoint}accounts?owner=${wallet}`;
    const assetsNumberResponse = await axios.get(walletAssetsNumberUrl);
    if (!assetsNumberResponse) {
      return 0;
    }

    if (assetsNumberResponse.data.data) {
      return assetsNumberResponse.data.data[0].assets || 0;
    }

    return 0;
  }

  createPagePromises(wallet: string, assetsNumber: number, nonce: number) {
    const pages = Math.ceil(assetsNumber / this.limit);
    const promises = [];

    for (let i = 1; i <= pages; i++) {
      const url = `${this.atomicEndpoint}/assets?owner=${wallet}&page=${i}&limit=${this.limit}&nonce=${nonce}`;
      promises.push(axios.get(url));
    }

    return promises;
  }

  flatAssetsToResponse(assetsPages: any[]) {
    const assets = assetsPages.reduce((acc: any[], res) => {
      if (res.data.data) {
        acc.push(...res.data.data);
      }
      return acc;
    }, []);

    return assets;
  }

  async getAssetsByUser(wallet: string) {
    const nonce = Date.now();

    const assetsNumber = await this.getAssetsNumberResponse(wallet);
    if (assetsNumber === 0) {
      return [];
    }

    const promises = this.createPagePromises(wallet, assetsNumber, nonce);

    const response = await Promise.all(promises);
    if (!response) return [];

    const assets = this.flatAssetsToResponse(response);

    const formattedAssets = this.assetFormatterService.assetFormat(assets);

    return formattedAssets;
  }

  async getGraphByTemplate(template: string) {
    const response = await axios.get(
      `${atomicMarketEndpoint}/prices/sales?template_id=${template}`,
    );
    const marketPriceSales = response.data.data;

    const formatedGraphData = graphDataFormatter(marketPriceSales);
    const interpolatedGraphData = interpolatedData(formatedGraphData);

    return interpolatedGraphData;
  }
}
