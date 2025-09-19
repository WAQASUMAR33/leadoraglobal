-- Add transaction ID and payment details fields to orders table
ALTER TABLE `orders` ADD COLUMN `transaction_id` VARCHAR(255) NULL;
ALTER TABLE `orders` ADD COLUMN `payment_details` LONGTEXT NULL;
