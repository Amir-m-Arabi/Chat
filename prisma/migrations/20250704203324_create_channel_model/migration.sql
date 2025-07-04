-- CreateTable
CREATE TABLE `Channels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `channelName` VARCHAR(191) NOT NULL,
    `profileImage` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Channels` ADD CONSTRAINT `Channels_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
