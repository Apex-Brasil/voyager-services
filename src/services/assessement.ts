import { prisma } from "../../prisma/prismaClient";
import { BadRequestError } from "../errors";
import { validCollectionExists } from "./collection";

type Input = {
  collection_name: string;
  wallet: string;
  user_experience_score: number;
  innovation_score: number;
  community_engagement_score: number;
  support_score: number;
  art_work_score: number;
  reliability_score: number;
  comment?: string;
};

const MIN_SCORE = 1;
const MAX_SCORE = 5;

export const consultAssessment = async (
  collectionName: string,
  wallet: string,
) => {
  if (!prisma.assessments) {
    return null;
  }

  const assessment = await prisma.assessments.findFirst({
    where: { collection_name: collectionName, wallet },
  });

  if (!assessment) {
    return null;
  }

  return assessment;
};

export const executeAssessment = async (input: Input) => {
  console.info("[start] executeAssessment");
  validateScores([
    input.user_experience_score,
    input.innovation_score,
    input.community_engagement_score,
    input.art_work_score,
    input.reliability_score,
    input.support_score,
  ]);
  await validCollectionExists(input.collection_name);
  await validWalletAlreadyAssessed(input.wallet, input.collection_name);
  await prisma.assessments.create({
    data: input,
  });
  console.info("[end] executeAssessment");
};

const validWalletAlreadyAssessed = async (
  wallet: string,
  collectionName: string,
) => {
  console.info("[start] validWalletAlreadyAssessed");
  const findAssessmentByWalletAndCollectionName =
    await prisma.assessments.findFirst({
      where: {
        collection_name: collectionName,
        wallet,
      },
    });
  console.info("[end] validWalletAlreadyAssessed");
  if (findAssessmentByWalletAndCollectionName) {
    throw new BadRequestError("You have already assessed this collection");
  }
};

const validateScores = (scores: number[]) => {
  console.info("[start] validateScores");
  const invalidsScoresQuantity = scores.filter(
    score => !(score >= MIN_SCORE && score <= MAX_SCORE),
  );
  console.info("[end] validateScores");
  if (invalidsScoresQuantity.length) {
    throw new BadRequestError(
      `Score must be between ${MIN_SCORE} and ${MAX_SCORE}`,
    );
  }
};

export const getMedianAssessments = async (collectionName: string) => {
  console.info("[start] getMedianAssessments");
  const assessments = await prisma.assessments.groupBy({
    by: ["collection_name"],
    where: {
      collection_name: collectionName,
    },
    _avg: {
      user_experience_score: true,
      innovation_score: true,
      community_engagement_score: true,
      support_score: true,
      art_work_score: true,
      reliability_score: true,
    },
  });

  console.info("[end] getMedianAssessments");
  return {
    user_experience_score: assessments[0]?._avg.user_experience_score ?? 0,
    innovation_score: assessments[0]?._avg.innovation_score ?? 0,
    community_engagement_score:
      assessments[0]?._avg.community_engagement_score ?? 0,
    support_score: assessments[0]?._avg.support_score ?? 0,
    art_work_score: assessments[0]?._avg.art_work_score ?? 0,
    reliability_score: assessments[0]?._avg.reliability_score ?? 0,
  };
};
