/*
  Warnings:

  - You are about to drop the `Channels` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Channels` DROP FOREIGN KEY `Channels_userId_fkey`;

-- DropTable
DROP TABLE `Channels`;

-- CreateTable
CREATE TABLE `CreateChannel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `channelName` VARCHAR(191) NOT NULL,
    `profileURL` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CreateChannel` ADD CONSTRAINT `CreateChannel_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowChannels` ADD CONSTRAINT `FollowChannels_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `CreateChannel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
