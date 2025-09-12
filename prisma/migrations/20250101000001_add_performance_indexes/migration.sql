-- Add performance indexes for frequently queried fields
-- These indexes will significantly speed up common queries

-- Index for referral lookups (used in MLM system)
CREATE INDEX idx_users_referred_by ON users(referredBy);

-- Index for user status filtering
CREATE INDEX idx_users_status ON users(status);

-- Index for username lookups (login, referral validation)
CREATE INDEX idx_users_username ON users(username);

-- Index for package requests by user
CREATE INDEX idx_package_requests_user_id ON package_requests(user_id);

-- Index for package requests by status
CREATE INDEX idx_package_requests_status ON package_requests(status);

-- Index for orders by user
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Index for orders by status
CREATE INDEX idx_orders_status ON orders(status);

-- Index for withdrawal requests by user
CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);

-- Index for withdrawal requests by status
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Index for earnings by user
CREATE INDEX idx_earnings_user_id ON earnings(user_id);

-- Index for transfers by user
CREATE INDEX idx_transfers_from_user_id ON transfers(from_user_id);
CREATE INDEX idx_transfers_to_user_id ON transfers(to_user_id);
