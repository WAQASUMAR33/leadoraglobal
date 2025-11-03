-- CreateTable
CREATE TABLE `shopping_transfers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `from_user_id` INTEGER NOT NULL,
    `to_user_id` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'completed',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `shopping_transfers_from_user_id_fkey`(`from_user_id`),
    INDEX `shopping_transfers_to_user_id_fkey`(`to_user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shopping_transfers` ADD CONSTRAINT `shopping_transfers_from_user_id_fkey` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopping_transfers` ADD CONSTRAINT `shopping_transfers_to_user_id_fkey` FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

