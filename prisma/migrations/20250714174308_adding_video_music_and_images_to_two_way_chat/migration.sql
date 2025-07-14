/*
  Warnings:

  - Added the required column `chatId` to the `Audio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chatId` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chatId` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Audio` ADD COLUMN `chatId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Image` ADD COLUMN `chatId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Video` ADD COLUMN `chatId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Video` ADD CONSTRAINT `Video_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `ChatContent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `ChatContent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Audio` ADD CONSTRAINT `Audio_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `ChatContent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
