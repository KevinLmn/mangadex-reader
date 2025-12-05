/*
  Warnings:

  - You are about to drop the `MangaView` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MangaView" DROP CONSTRAINT "MangaView_userId_fkey";

-- DropTable
DROP TABLE "MangaView";

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "page" INTEGER NOT NULL DEFAULT 1,
    "totalPages" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_userId_mangaId_key" ON "ReadingProgress"("userId", "mangaId");

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
