-- CreateTable
CREATE TABLE "Scores" (
    "id" TEXT NOT NULL,
    "collection_name" TEXT NOT NULL,
    "holder_score" INTEGER NOT NULL DEFAULT 0,
    "volume_score" INTEGER NOT NULL DEFAULT 0,
    "age_score" INTEGER NOT NULL DEFAULT 0,
    "community_user_experience_score" INTEGER NOT NULL DEFAULT 0,
    "community_innovation_score" INTEGER NOT NULL DEFAULT 0,
    "community_engagement_score" INTEGER NOT NULL DEFAULT 0,
    "community_art_work_score" INTEGER NOT NULL DEFAULT 0,
    "audit_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scores_collection_name_key" ON "Scores"("collection_name");
