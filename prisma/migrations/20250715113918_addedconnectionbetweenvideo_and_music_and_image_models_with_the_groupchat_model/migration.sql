/*
  Warnings:

  - Added the required column `groupChatId` to the `Audio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupChatId` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupChatId` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Audio` ADD COLUMN `groupChatId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Image` ADD COLUMN `groupChatId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Video` ADD COLUMN `groupChatId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Video` ADD CONSTRAINT `Video_groupChatId_fkey` FOREIGN KEY (`groupChatId`) REFERENCES `GroupChats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_groupChatId_fkey` FOREIGN KEY (`groupChatId`) REFERENCES `GroupChats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Audio` ADD CONSTRAINT `Audio_groupChatId_fkey` FOREIGN KEY (`groupChatId`) REFERENCES `GroupChats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
