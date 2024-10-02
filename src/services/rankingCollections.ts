import axios from "axios";

import { delRedis, getRedis, redisKeys, setRedis } from "../redisConfig";
import { atomicMarketEndpoint, mainEndpoint } from "../utils/constants";

async function getCollectionVolumesFilters(collections: string[]) {
  const response = collections.map((collection: string) =>
    axios.get(`${mainEndpoint}/analytics/${collection}/volume`),
  );

  const resolvedCollections = await Promise.all(response);

  const dataCollections = resolvedCollections.map(item => item.data);

  return dataCollections;
}

async function fetchCollectionsData(page: number = 1) {
  try {
    const response = await axios.get(
      `${atomicMarketEndpoint}/stats/collections?symbol=WAX&page=${page}`,
    );

    const dataCollectionsName = response.data.data.results.map(
      (item: any) => item.collection_name,
    );

    const getCollectionsVolumesFilters =
      await getCollectionVolumesFilters(dataCollectionsName);

    const collectionsData = response.data.data.results.map((element: any) => {
      const finding = getCollectionsVolumesFilters.find(
        (item: any) => item.collection_name === element.collection_name,
      );
      return {
        collection_name: element.collection_name,
        name: element.name,
        img: element.img,
        sales: element.sales,
        volumeFilters: {
          AllTimeVolume: element.volume,
          total_volume_24_hours: finding?.total_volume_24_hours,
          total_volume_7_days: finding?.total_volume_7_days,
          total_volume_30_days: finding?.total_volume_30_days,
          total_volume_90_days: finding?.total_volume_90_days,
        },
      };
    });

    return collectionsData;
  } catch (error: any) {
    return [];
  }
}

export async function fetchDataAndProcessForRanking() {
  try {
    let pageCollectionsData: any[] = [];

    const currentRankingCollectionsPage = await getRedis(
      redisKeys.rankingCollections,
    );

    if (currentRankingCollectionsPage) {
      pageCollectionsData = JSON.parse(currentRankingCollectionsPage);
    }

    let page = 1;

    const pageCollections = await getRedis(redisKeys.pageCollections);
    if (pageCollections) {
      page = parseInt(pageCollections);
    }

    const collectionsData = await fetchCollectionsData(page);
    console.log("collectionsData", collectionsData.length);
    if (collectionsData.length === 0 || page > 20) {
      await delRedis(redisKeys.pageCollections);
    }

    pageCollectionsData[page - 1] = collectionsData;

    await setRedis(
      redisKeys.rankingCollections,
      JSON.stringify(pageCollectionsData),
    );
    if (page <= 20)
      await setRedis(redisKeys.pageCollections, (page + 1).toString());
  } catch (error: any) {
    console.error(
      "Erro ao buscar e processar os dados das coleções:",
      error.message,
    );
  }
}
