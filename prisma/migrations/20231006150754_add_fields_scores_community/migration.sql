-- AlterTable
ALTER TABLE "Assessments" ADD COLUMN     "reliability_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "support_score" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Scores" ADD COLUMN     "community_reliability_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "community_support_score" INTEGER NOT NULL DEFAULT 0;
