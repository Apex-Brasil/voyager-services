-- CreateTable
CREATE TABLE "Assessments" (
    "id" TEXT NOT NULL,
    "collection_name" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "user_experience_score" INTEGER NOT NULL DEFAULT 0,
    "innovation_score" INTEGER NOT NULL DEFAULT 0,
    "community_engagement_score" INTEGER NOT NULL DEFAULT 0,
    "art_work_score" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessments_pkey" PRIMARY KEY ("id")
);
