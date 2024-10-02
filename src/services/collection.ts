import axios from "axios";
import fetch from "cross-fetch";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import path from "path";

import { prisma } from "../../prisma/prismaClient";
import { NotFoundError } from "../errors";
import { fectchHoldersByCollection } from "../infra/gateway/holdersHttpGateway";
import { delay, durationMonthsByTimestamp, vectorSlice } from "../utils";
import { IPFS_URL } from "../utils/constants";
import {
  ageScoreRecipe,
  assessmentScoreByStars,
  holdersCoresRecipe,
  volumeScoreRecipe,
} from "../utils/voyagerScoreRecipes";
import { getMedianAssessments } from "./assessement";
dotenv.config();

const publicPath = path.join(__dirname, "../../public");

export const genCollections = async () => {
  console.info("[start] genCollections");
  try {
    const collections = readFileSync(publicPath + "/collections.txt", "utf8");
    const collectionsArr = collections.split(",");

    const collectionsDatabase = await prisma.collections.findMany();

    await prisma.collections.createMany({
      data: collectionsArr
        .filter(
          collection =>
            !collectionsDatabase.some(
              item => item.collection_name === collection,
            ),
        )
        .map(collection => {
          return { collection_name: collection };
        }),
      skipDuplicates: true,
    });

    console.info("[end] genCollections");
    return { message: "success" };
  } catch (error: any) {
    console.error("[error] genCollections", error.message);
    return { message: error.message };
  }
};

export const genExplorer = async () => {
  console.info("[start] genExplorer");
  try {
    const tempArray: any = [];
    const collectionsArr = await prisma.collections.findMany();
    const explorersDatabase = await prisma.explorer.findMany();
    const newCollections = collectionsArr.filter(
      collection =>
        !explorersDatabase.some(
          item => item.collection_name === collection.collection_name,
        ),
    );

    const collectionPages = Math.ceil(newCollections.length / 50) + 1;
    const promises: any = [];
    for (let i = 1; i <= collectionPages; i++) {
      const collectionsSlice: any = newCollections
        .map(item => item.collection_name)
        .slice(50 * (i - 1), 50 * i);

      if (collectionsSlice.length === 0) {
        break;
      }

      const url = `https://wax.api.atomicassets.io/atomicmarket/v1/stats/collections?symbol=WAX&collection_name=${collectionsSlice.join(
        ",",
      )}&limit=50`;
      const promise = axios(url);
      promises.push(promise);
    }

    const response = await Promise.all(promises);
    const data: any = [];

    response.forEach(item => {
      if (item.data.data) {
        item.data.data.results.forEach((val: any) => data.push(val));
      }
    });

    console.log(data);

    data.forEach((element: any) => {
      const temp = {
        collection_name: element.collection_name,
        name: element.name,
        img: IPFS_URL + element.img,
        sales: element.sales,
        volume: element.volume,
        created_at_time: element.created_at_time,
      };

      tempArray.push(temp);
    });

    await prisma.explorer.createMany({
      data: tempArray,
      skipDuplicates: true,
    });

    console.info("[end] genExplorer");
    return { message: "success" };
  } catch (error: any) {
    console.error("[error] genExplorer", error.message);
    return { message: error.message };
  }
};

export const findWhitelistCollection = async (
  collectionName: string,
  order: string,
  sort: string,
) => {
  const str = regexStr(collectionName);
  try {
    const collectionsArr = await prisma.explorer.findMany();
    const arr = collectionsArr
      .filter((element: any) => element.collection_name.includes(str))
      .sort((a: any, b: any) => {
        if (order === "asc") {
          return a[sort] - b[sort];
        } else {
          return b[sort] - a[sort];
        }
      });

    return arr;
  } catch (error: any) {
    return [];
  }
};

export const findCollection = async (
  collectionName: string,
  order: string,
  sort: string,
) => {
  const str = regexStr(collectionName);
  try {
    const collections = await prisma.collections.findMany();
    const collectionsArr: any = collections.map(item => item.collection_name);

    const url = `https://wax.api.atomicassets.io/atomicmarket/v1/stats/collections?symbol=WAX&search=${str}&page=1&limit=100&order=${order}&sort=${sort}`;

    const response = await fetch(url);
    const data = await response.json();
    const arr = data.data.results;

    const filteredArray = arr.filter((element: any) => {
      return collectionsArr.includes(element.collection_name);
    });

    return filteredArray;
  } catch (error: any) {
    return [];
  }
};

const regexStr = (str: string) => {
  return str.replace(/[\s-]+/g, "").toLowerCase();
};

export const calculateCollectionScore = async (collectionName: string) => {
  console.info("[start] calculateCollectionScore");
  const collectionDatabase = await prisma.explorer.findFirst({
    where: {
      collection_name: collectionName,
    },
  });
  if (!collectionDatabase)
    throw new NotFoundError(`Collection ${collectionName} not found`);
  const holdersData = await fectchHoldersByCollection(collectionName);
  const ownersQuantity = +holdersData.owners || 0;
  const scoreHolder = getScoreHolder(ownersQuantity);
  const globalVolume = +collectionDatabase.volume / 100000000 || 0;
  const scoreVolume = getScoreVolume(globalVolume);
  const ageMonths = ageMonthsCollection(+collectionDatabase.created_at_time);
  const scoreAge = getScoreAge(ageMonths);
  const assessmentScores = await getScoresAssessments(collectionName);
  console.info("[end] calculateCollectionScore");
  return {
    scoreHolder,
    scoreVolume,
    scoreAge,
    assessmentScores,
  };
};

export const generateScores = async () => {
  console.info("[start] generateScores");
  const collections = await prisma.explorer.findMany();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // get collectionScoreCreatedToday
  const scoresUpdatedToday = await prisma.scores.findMany({
    where: {
      updated_at: {
        gte: today,
      },
    },
    select: {
      collection_name: true,
    },
  });

  const collectionsToUdate = collections.filter(
    collection =>
      !scoresUpdatedToday.some(
        score => score.collection_name === collection.collection_name,
      ),
  );

  const collectionsSilced = vectorSlice(collectionsToUdate, 10);
  let timesFetch = 0;
  for (const collections of collectionsSilced) {
    await Promise.all(
      collections.map(async collection => {
        await genCollectionScore(collection.collection_name);
      }),
    );
    timesFetch++;
    console.log(`Times fetch: ${timesFetch}`);
    await delay(5000);
  }
  console.info("[end] generateScores");
};

const genCollectionScore = async (collectionName: string) => {
  console.info("[start] genCollectionScore");
  const { assessmentScores, scoreAge, scoreHolder, scoreVolume } =
    await calculateCollectionScore(collectionName);
  console.info("[end] genCollectionScore");
  await prisma.scores.upsert({
    where: {
      collection_name: collectionName,
    },
    create: {
      collection_name: collectionName,
      holder_score: scoreHolder,
      volume_score: scoreVolume,
      age_score: scoreAge,
      community_user_experience_score: assessmentScores.user_experience_score,
      community_innovation_score: assessmentScores.innovation_score,
      community_engagement_score: assessmentScores.community_engagement_score,
      community_support_score: assessmentScores.support_score,
      community_art_work_score: assessmentScores.art_work_score,
      community_reliability_score: assessmentScores.reliability_score,
    },
    update: {
      holder_score: scoreHolder,
      volume_score: scoreVolume,
      age_score: scoreAge,
      community_user_experience_score: assessmentScores.user_experience_score,
      community_innovation_score: assessmentScores.innovation_score,
      community_engagement_score: assessmentScores.community_engagement_score,
      community_support_score: assessmentScores.support_score,
      community_art_work_score: assessmentScores.art_work_score,
      community_reliability_score: assessmentScores.reliability_score,
    },
  });
};

const getScoreHolder = (totalOwners: number): number => {
  let score = 0;
  for (const item of holdersCoresRecipe) {
    if (totalOwners < item.min) break;
    score = item.score;
  }
  return score;
};

const getScoreVolume = (totalVolume: number): number => {
  let score = 0;
  for (const item of volumeScoreRecipe) {
    if (totalVolume < item.min) break;
    score = item.score;
  }
  return score;
};

const getScoreAge = (totalAge: number): number => {
  let score = 0;
  for (const item of ageScoreRecipe) {
    if (totalAge < item.min) break;
    score = item.score;
  }
  return score;
};

const getScoresAssessments = async (collectionName: string) => {
  const assessments = await getMedianAssessments(collectionName);
  return {
    user_experience_score:
      Math.trunc(assessments.user_experience_score) * assessmentScoreByStars,
    innovation_score:
      Math.trunc(assessments.innovation_score) * assessmentScoreByStars,
    community_engagement_score:
      Math.trunc(assessments.community_engagement_score) *
      assessmentScoreByStars,
    support_score:
      Math.trunc(assessments.support_score) * assessmentScoreByStars,
    art_work_score:
      Math.trunc(assessments.art_work_score) * assessmentScoreByStars,
    reliability_score:
      Math.trunc(assessments.reliability_score) * assessmentScoreByStars,
  };
};

const ageMonthsCollection = (timestamp: number): number => {
  return durationMonthsByTimestamp(timestamp);
};

export const validCollectionExists = async (collectionName: string) => {
  console.info("[start] validCollectionExists");
  const findCollection = await prisma.collections.findFirst({
    where: {
      collection_name: collectionName,
    },
  });
  console.info("[end] validCollectionExists");
  if (!findCollection) {
    throw new NotFoundError(`Collection ${collectionName} not found`);
  }
};

export const getVoyagerScoresByCOllection = async (collectionName?: string) => {
  console.info("[start] getVoyagerScoresByCOllection");
  const findCollection = await prisma.scores.findFirst({
    where: {
      collection_name: collectionName,
    },
  });
  if (!findCollection) {
    throw new NotFoundError(`Collection ${collectionName} not found`);
  }
  const totalScore =
    findCollection.holder_score +
    findCollection.volume_score +
    findCollection.age_score +
    findCollection.audit_score +
    findCollection.community_user_experience_score +
    findCollection.community_innovation_score +
    findCollection.community_engagement_score +
    findCollection.community_support_score +
    findCollection.community_art_work_score +
    findCollection.community_reliability_score;
  console.info("[end] getVoyagerScoresByCOllection");
  return {
    ...findCollection,
    totalScore,
  };
};

export const getAllVoyagerScores = async () => {
  console.info("[start] getAllVoyagerScores");
  const scores = await prisma.scores.findMany();
  if (!scores) throw new NotFoundError("Scores not found");
  const scoresWithTotal = scores.map(score => {
    const totalScore =
      score.holder_score +
      score.volume_score +
      score.age_score +
      score.audit_score +
      score.community_user_experience_score +
      score.community_innovation_score +
      score.community_engagement_score +
      score.community_support_score +
      score.community_art_work_score +
      score.community_reliability_score;
    return {
      ...score,
      totalScore,
    };
  });
  console.info("[end] getAllVoyagerScores");
  return scoresWithTotal;
};
