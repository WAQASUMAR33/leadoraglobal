-- Add performance indexes for package requests
CREATE INDEX `package_requests_status_created_at_idx` ON `package_requests` (`status`, `created_at` DESC);
CREATE INDEX `package_requests_user_id_status_idx` ON `package_requests` (`user_id`, `status`);
CREATE INDEX `package_requests_created_at_idx` ON `package_requests` (`created_at` DESC);
