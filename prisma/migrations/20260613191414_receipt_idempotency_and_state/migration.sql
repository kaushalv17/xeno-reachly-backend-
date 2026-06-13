/*
  Warnings:

  - You are about to drop the column `queuedAt` on the `Communication` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId]` on the table `CommunicationEvent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Communication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventId` to the `CommunicationEvent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Communication" DROP CONSTRAINT "Communication_customerId_fkey";

-- DropIndex
DROP INDEX "Campaign_status_idx";

-- DropIndex
DROP INDEX "Customer_city_idx";

-- DropIndex
DROP INDEX "Customer_lastOrderAt_idx";

-- DropIndex
DROP INDEX "Order_createdAt_idx";

-- AlterTable
ALTER TABLE "Communication" DROP COLUMN "queuedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "CommunicationEvent" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "eventId" TEXT NOT NULL,
ALTER COLUMN "occurredAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationEvent_eventId_key" ON "CommunicationEvent"("eventId");
