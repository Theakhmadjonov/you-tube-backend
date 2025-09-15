/*
  Warnings:

  - You are about to alter the column `totalViews` on the `user` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to drop the column `thumbnail` on the `video` table. All the data in the column will be lost.
  - You are about to alter the column `viewsCount` on the `video` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - Added the required column `category` to the `video` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('music', 'news', 'chilloutmusic', 'gaming', 'gameshows', 'comedy', 'movie');

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "totalViews" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "video" DROP COLUMN "thumbnail",
ALTER COLUMN "viewsCount" SET DATA TYPE INTEGER,
DROP COLUMN "category",
ADD COLUMN     "category" "Category" NOT NULL;
