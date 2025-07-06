/*
  Warnings:

  - You are about to drop the column `secondPersonId` on the `Contact` table. All the data in the column will be lost.
  - Added the required column `secondPersonID` to the `Contact` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Contact` DROP COLUMN `secondPersonId`,
    ADD COLUMN `secondPersonID` VARCHAR(191) NOT NULL;
