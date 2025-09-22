# Accounts Without Referrals Guide

## 🔍 Get Accounts Where referred_by is NULL

### **Quick Commands**

#### **1. Easiest Way - Run the Script:**
```bash
node scripts/get-accounts-without-referrals.js
```

This will show you:
- ✅ **Summary statistics** of accounts without referrals
- 📋 **Detailed list** of accounts where referred_by is NULL
- 📊 **Status breakdown** by account status
- 💡 **Insights** about the accounts
- 🗄️ **Direct database analysis**

#### **2. Get by Status:**
```bash
# Get only active accounts without referrals
node scripts/get-accounts-without-referrals.js --status active

# Get only inactive accounts without referrals
node scripts/get-accounts-without-referrals.js --status inactive

# Get only suspended accounts without referrals
node scripts/get-accounts-without-referrals.js --status suspended
```

#### **3. Get Detailed Information:**
```bash
node scripts/get-accounts-without-referrals.js --detailed
```

This shows:
- 📋 **Complete user details** for each account
- 📦 **Package information** for each account
- 💰 **Earnings history** for each account
- 🔐 **KYC status** for each account
- 📊 **Recent activity** for each account

#### **4. API Endpoints:**

##### **Get Accounts Without Referrals:**
```bash
# Get basic list
curl http://localhost:3000/api/admin/accounts-without-referrals

# Get with pagination
curl "http://localhost:3000/api/admin/accounts-without-referrals?limit=50&offset=0"

# Get by status
curl "http://localhost:3000/api/admin/accounts-without-referrals?status=active"

# Get with detailed user information
curl "http://localhost:3000/api/admin/accounts-without-referrals?includeDetails=true"
```

##### **Export Accounts Without Referrals:**
```bash
# Export to CSV
curl -X POST http://localhost:3000/api/admin/accounts-without-referrals \
  -H "Content-Type: application/json" \
  -d '{"format": "csv"}' > accounts_without_referrals.csv

# Export to JSON with details
curl -X POST http://localhost:3000/api/admin/accounts-without-referrals \
  -H "Content-Type: application/json" \
  -d '{"format": "json", "includeDetails": true}' > accounts_without_referrals.json

# Export only active accounts
curl -X POST http://localhost:3000/api/admin/accounts-without-referrals \
  -H "Content-Type: application/json" \
  -d '{"format": "csv", "status": "active"}' > active_accounts_without_referrals.csv
```

### **What You'll See in the Output:**

#### **Summary Statistics:**
```
✅ Accounts Without Referrals Summary:
   Total Accounts Without Referrals: 150
   Current Page: 1 of 2
   Accounts on This Page: 100
   Total Balance: $15,000.00
   Total Earnings: $8,500.00
   Average Balance: $100.00
   Average Earnings: $56.67
```

#### **Status Breakdown:**
```
📊 Status Breakdown:
   active: 120 accounts
   inactive: 20 accounts
   suspended: 10 accounts
```

#### **Insights:**
```
💡 Insights:
   80.0% active users, 20.0% inactive users without referrals (80.0%)
   75.0% users have balance > $0 (75.0%)
   60.0% users have earnings > $0 (60.0%)
   45.0% users have made referrals (but weren't referred themselves) (45.0%)
```

#### **Accounts Without Referrals:**
```
📋 Accounts Without Referrals (referred_by = NULL):
   ID | Username | Full Name | Email | Status | Balance | Points | Referral Count | Days Since Created
   ---|----------|-----------|-------|--------|---------|--------|----------------|------------------
   123 | john_doe | John Doe  | john@... | active | $100.00 | 50     | 5              | 45
   124 | jane_sm  | Jane Smith| jane@... | active | $250.00 | 100    | 3              | 30
   125 | bob_wil  | Bob Wilson| bob@...  | active | $75.00  | 25     | 0              | 60
```

### **Understanding the Results:**

#### **What are Accounts Without Referrals?**
- Users whose `referredBy` field is NULL
- These are typically:
  - **Root users** - Original users who joined without being referred
  - **Direct signups** - Users who registered directly
  - **Cleaned accounts** - Users whose referrals were removed
  - **System accounts** - Administrative or system accounts

#### **Why This Matters:**
- **Business Analysis** - Understand your user acquisition patterns
- **Referral System Health** - See how many users joined without referrals
- **Marketing Insights** - Identify direct vs. referral-based growth
- **Data Cleanup** - Find accounts that might need referral assignment

### **Use Cases:**

#### **1. Business Analysis:**
```bash
# Get all accounts without referrals for analysis
node scripts/get-accounts-without-referrals.js

# Export for business intelligence
curl -X POST http://localhost:3000/api/admin/accounts-without-referrals \
  -H "Content-Type: application/json" \
  -d '{"format": "csv"}' > business_analysis.csv
```

#### **2. Marketing Campaigns:**
```bash
# Get active accounts without referrals for marketing
node scripts/get-accounts-without-referrals.js --status active

# Export for email campaigns
curl -X POST http://localhost:3000/api/admin/accounts-without-referrals \
  -H "Content-Type: application/json" \
  -d '{"format": "csv", "status": "active"}' > marketing_list.csv
```

#### **3. Data Cleanup:**
```bash
# Get detailed information for cleanup
node scripts/get-accounts-without-referrals.js --detailed

# Identify accounts that might need referral assignment
```

### **API Response Format:**

#### **JSON Response:**
```json
{
  "success": true,
  "message": "Accounts without referrals retrieved successfully",
  "statistics": {
    "totalUsersWithoutReferrals": 150,
    "currentPageCount": 100,
    "totalPages": 2,
    "currentPage": 1,
    "statusBreakdown": {
      "active": 120,
      "inactive": 20,
      "suspended": 10
    },
    "financialSummary": {
      "totalBalance": 15000.00,
      "totalEarnings": 8500.00,
      "totalReferralCount": 450,
      "averageBalance": "100.00",
      "averageEarnings": "56.67"
    }
  },
  "accountsWithoutReferrals": [
    {
      "id": 123,
      "username": "john_doe",
      "fullname": "John Doe",
      "email": "john@example.com",
      "status": "active",
      "balance": 100.00,
      "points": 50,
      "totalEarnings": 75.00,
      "referralCount": 5,
      "referredBy": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "daysSinceCreated": 45
    }
  ],
  "insights": [
    {
      "type": "status_distribution",
      "message": "120 active users, 30 inactive users without referrals",
      "percentage": "80.0"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 150,
    "currentPage": 1,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### **Quick Reference Commands:**

| Command | Purpose |
|---------|---------|
| `node scripts/get-accounts-without-referrals.js` | Get all accounts without referrals |
| `node scripts/get-accounts-without-referrals.js --status active` | Get only active accounts |
| `node scripts/get-accounts-without-referrals.js --detailed` | Get detailed information |
| `curl http://localhost:3000/api/admin/accounts-without-referrals` | API call for accounts |
| `curl -X POST .../accounts-without-referrals -d '{"format":"csv"}'` | Export to CSV |

### **Filtering Options:**

#### **By Status:**
- `active` - Only active accounts
- `inactive` - Only inactive accounts
- `suspended` - Only suspended accounts
- `all` - All accounts (default)

#### **By Pagination:**
- `limit` - Number of records per page (default: 100)
- `offset` - Number of records to skip (default: 0)

#### **By Details:**
- `includeDetails=true` - Include package, earnings, KYC info
- `includeDetails=false` - Basic information only (default)

### **Integration Examples:**

#### **Business Intelligence:**
```bash
# Get comprehensive data for BI analysis
curl "http://localhost:3000/api/admin/accounts-without-referrals?includeDetails=true&limit=1000" > bi_data.json
```

#### **Marketing Automation:**
```bash
# Get active users for email campaigns
curl "http://localhost:3000/api/admin/accounts-without-referrals?status=active&limit=500" > marketing_users.json
```

#### **Data Migration:**
```bash
# Export all accounts for migration
curl -X POST http://localhost:3000/api/admin/accounts-without-referrals \
  -H "Content-Type: application/json" \
  -d '{"format": "csv", "includeDetails": true}' > migration_data.csv
```

### **Monitoring and Alerts:**

#### **Set up regular monitoring:**
```bash
# Add to crontab for daily checks
0 2 * * * /path/to/scripts/get-accounts-without-referrals.js > /var/log/accounts-without-referrals.log
```

#### **Alert thresholds:**
- **High Growth**: More than 50 new accounts without referrals per day
- **Low Referral Rate**: Less than 30% of new accounts have referrals
- **Balance Alert**: More than $10,000 in total balance for accounts without referrals

### **Database Query Equivalent:**

If you want to run the same query directly in the database:

```sql
-- Get all accounts where referred_by is NULL
SELECT 
    id, username, fullname, email, status, 
    balance, points, total_earnings, referral_count,
    created_at, updated_at
FROM users 
WHERE referred_by IS NULL 
ORDER BY created_at DESC 
LIMIT 100;

-- Get count by status
SELECT status, COUNT(*) as count
FROM users 
WHERE referred_by IS NULL 
GROUP BY status;

-- Get financial summary
SELECT 
    COUNT(*) as total_accounts,
    SUM(balance) as total_balance,
    SUM(total_earnings) as total_earnings,
    AVG(balance) as avg_balance,
    AVG(total_earnings) as avg_earnings
FROM users 
WHERE referred_by IS NULL;
```

This system will help you identify and analyze all accounts that don't have referrals, which is useful for understanding your user acquisition patterns and business growth!






