-- Remove unique constraint from email column
ALTER TABLE `users` DROP INDEX `users_email_key`;

-- Remove unique constraint from phone_number column (if it exists)
-- Note: The phone_number column might not have a unique constraint, but we'll try to drop it
ALTER TABLE `users` DROP INDEX `users_phone_number_key`;
