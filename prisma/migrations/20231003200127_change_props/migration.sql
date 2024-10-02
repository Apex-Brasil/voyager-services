/*
  Warnings:

  - You are about to drop the column `wallet` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[account]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_wallet_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "wallet",
ADD COLUMN     "account" TEXT,
ADD COLUMN     "permission" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_account_key" ON "User"("account");
