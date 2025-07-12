-- DropForeignKey
ALTER TABLE `FollowChannels` DROP FOREIGN KEY `FollowChannels_channelId_fkey`;

-- DropIndex
DROP INDEX `FollowChannels_channelId_fkey` ON `FollowChannels`;

-- AddForeignKey
ALTER TABLE `FollowChannels` ADD CONSTRAINT `FollowChannels_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `CreateChannel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
