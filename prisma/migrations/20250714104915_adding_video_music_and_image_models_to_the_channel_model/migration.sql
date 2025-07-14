-- CreateTable
CREATE TABLE `Video` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `videoURL` VARCHAR(191) NOT NULL,
    `contentId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Image` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageURL` VARCHAR(191) NOT NULL,
    `contentId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Audio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `audioURL` VARCHAR(191) NOT NULL,
    `contentId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Video` ADD CONSTRAINT `Video_contentId_fkey` FOREIGN KEY (`contentId`) REFERENCES `ChannelContent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_contentId_fkey` FOREIGN KEY (`contentId`) REFERENCES `ChannelContent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Audio` ADD CONSTRAINT `Audio_contentId_fkey` FOREIGN KEY (`contentId`) REFERENCES `ChannelContent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
