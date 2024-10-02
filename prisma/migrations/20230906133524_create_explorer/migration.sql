-- CreateTable
CREATE TABLE "Explorer" (
    "id" TEXT NOT NULL,
    "collection_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "sales" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "created_at_time" TEXT NOT NULL,

    CONSTRAINT "Explorer_pkey" PRIMARY KEY ("id")
);
