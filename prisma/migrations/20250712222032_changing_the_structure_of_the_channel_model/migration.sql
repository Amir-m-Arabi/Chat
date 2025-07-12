/*
  Warnings:

  - You are about to drop the column `userId` on the `CreateChannel` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `CreateChannel` DROP FOREIGN KEY `CreateChannel_userId_fkey`;

-- DropIndex
DROP INDEX `CreateChannel_userId_fkey` ON `CreateChannel`;

-- AlterTable
ALTER TABLE `CreateChannel` DROP COLUMN `userId`;

-- CreateTable
CREATE TABLE `ChannelAdmins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` VARCHAR(191) NOT NULL,
    `channelId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChannelContent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `senderId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `channelId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChannelAdmins` ADD CONSTRAINT `ChannelAdmins_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `CreateChannel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChannelContent` ADD CONSTRAINT `ChannelContent_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `CreateChannel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
