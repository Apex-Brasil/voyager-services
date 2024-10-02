-- CreateTable
CREATE TABLE "Holders" (
    "id" TEXT NOT NULL,
    "collection_name" TEXT NOT NULL,
    "accounts" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,

    CONSTRAINT "Holders_pkey" PRIMARY KEY ("id")
);
