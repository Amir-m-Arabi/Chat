-- CreateTable
CREATE TABLE `File` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileURL` VARCHAR(191) NOT NULL,
    `contentId` INTEGER NOT NULL,
    `chatId` INTEGER NOT NULL,
    `groupChatId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_contentId_fkey` FOREIGN KEY (`contentId`) REFERENCES `ChannelContent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `ChatContent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_groupChatId_fkey` FOREIGN KEY (`groupChatId`) REFERENCES `GroupChats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
