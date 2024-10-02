-- CreateTable
CREATE TABLE "Auctions" (
    "id" TEXT NOT NULL,
    "auction_id" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "listing_price" TEXT NOT NULL,
    "listing_symbol" TEXT NOT NULL,
    "assets" TEXT[],
    "collection" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auctions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Auctions_auction_id_key" ON "Auctions"("auction_id");
