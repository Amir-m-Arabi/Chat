/*
  Warnings:

  - Added the required column `superAdminId` to the `CreateChannel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CreateChannel` ADD COLUMN `superAdminId` VARCHAR(191) NOT NULL;
