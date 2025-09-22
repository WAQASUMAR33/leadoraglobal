-- Add payment proof field to orders table
ALTER TABLE `orders` ADD COLUMN `payment_proof` LONGTEXT NULL;
