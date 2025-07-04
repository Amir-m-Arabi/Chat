/*
  Warnings:

  - You are about to drop the column `profileImage` on the `Channels` table. All the data in the column will be lost.
  - Added the required column `profileURL` to the `Channels` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Channels` DROP COLUMN `profileImage`,
    ADD COLUMN `profileURL` VARCHAR(191) NOT NULL;
