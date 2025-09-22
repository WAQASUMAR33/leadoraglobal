-- Add soft delete fields to users table
ALTER TABLE `users` ADD COLUMN `deletedAt` DATETIME(3) NULL;
ALTER TABLE `users` ADD COLUMN `deletedBy` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `deleteReason` TEXT NULL;

-- Add soft delete fields to admins table  
ALTER TABLE `admins` ADD COLUMN `deletedAt` DATETIME(3) NULL;
ALTER TABLE `admins` ADD COLUMN `deletedBy` VARCHAR(191) NULL;
ALTER TABLE `admins` ADD COLUMN `deleteReason` TEXT NULL;

-- Add indexes for soft delete queries
CREATE INDEX `users_deleted_at_idx` ON `users`(`deletedAt`);
CREATE INDEX `admins_deleted_at_idx` ON `admins`(`deletedAt`);





