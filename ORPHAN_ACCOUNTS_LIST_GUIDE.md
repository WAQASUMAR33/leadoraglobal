# Orphan Accounts List Guide

## 📋 How to Get the List of Orphan Accounts

### **Quick Commands**

#### **1. Get All Orphan Accounts (Recommended)**
```bash
# Run the script to get a comprehensive list
node scripts/get-orphan-accounts-list.js
```

#### **2. Get Specific Type of Orphan Accounts**
```bash
# Get only referral orphan accounts
node scripts/get-orphan-accounts-list.js --type referrals

# Get only package request orphan accounts  
node scripts/get-orphan-accounts-list.js --type package_requests

# Get only earnings orphan accounts
node scripts/get-orphan-accounts-list.js --type earnings
```

#### **3. Get Orphan Accounts via API**
```bash
# Get all orphan accounts
curl http://localhost:3000/api/admin/orphan-accounts-list?type=all

# Get only referral issues
curl http://localhost:3000/api/admin/orphan-accounts-list?type=referrals

# Get with pagination
curl "http://localhost:3000/api/admin/orphan-accounts-list?type=referrals&limit=50&offset=0"
```

#### **4. Export Orphan Accounts List**
```bash
# Export to CSV
curl -X POST http://localhost:3000/api/admin/orphan-accounts-list \
  -H "Content-Type: application/json" \
  -d '{"exportType": "referrals", "format": "csv"}' > orphan_accounts.csv

# Export to JSON
curl -X POST http://localhost:3000/api/admin/orphan-accounts-list \
  -H "Content-Type: application/json" \
  -d '{"exportType": "all", "format": "json"}' > orphan_accounts.json
```

### **What You'll Get**

#### **Orphan Referral Accounts**
Users whose `referredBy` field points to non-existent users:

```
📋 Orphan Accounts (Users with invalid referrals):
   ID | Username | Full Name | Referred By | Issue | Severity
   ---|----------|-----------|-------------|-------|----------
   123 | john_doe | John Doe  | deleted_user| Referrer not found | high
   124 | jane_sm  | Jane Smith| missing_ref | Referrer not found | high
```

#### **Missing Referrers**
Users who were deleted but still have referrals pointing to them:

```
❌ Missing Referrers:
   Username | Affected Users
   ---------|---------------
   deleted_user | 5
   missing_ref  | 3
```

#### **Circular Referrals**
Users who refer to each other:

```
🔄 Circular Referrals:
   user1 ↔ user2
   alice ↔ bob
```

#### **Self Referrals**
Users who refer to themselves:

```
🪞 Self Referrals:
   self_user (refers to themselves)
```

#### **Orphan Package Requests**
Package requests without valid users:

```
📦 Orphan Package Requests:
   ID | Package Name | Amount | Transaction ID | Status
   ---|--------------|--------|----------------|-------
   456 | Premium      | 1000   | TXN123456789   | pending
```

#### **Orphan Earnings**
Earnings records without valid users:

```
💰 Orphan Earnings:
   ID | Amount | Type | Description | Created At
   ---|--------|------|-------------|-----------
   789 | 100.00 | direct_commission | Commission | 2024-01-15
```

### **API Endpoints**

#### **GET /api/admin/orphan-accounts-list**
Get orphan accounts list with pagination.

**Parameters:**
- `type` - Type of orphan accounts (all, referrals, package_requests, earnings)
- `limit` - Number of records to return (default: 100)
- `offset` - Number of records to skip (default: 0)

**Example:**
```bash
curl "http://localhost:3000/api/admin/orphan-accounts-list?type=referrals&limit=20&offset=0"
```

#### **POST /api/admin/orphan-accounts-list**
Export orphan accounts list.

**Body:**
```json
{
  "exportType": "referrals|package_requests|earnings|all",
  "format": "json|csv"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/orphan-accounts-list \
  -H "Content-Type: application/json" \
  -d '{"exportType": "referrals", "format": "csv"}'
```

### **Response Format**

#### **JSON Response:**
```json
{
  "success": true,
  "message": "Orphan accounts list retrieved successfully",
  "summary": {
    "totalUsers": 1000,
    "usersWithReferrals": 500,
    "orphanPackageRequests": 10,
    "orphanEarnings": 5,
    "orphanPercentage": {
      "packageRequests": "2.00",
      "earnings": "1.00"
    }
  },
  "data": {
    "referrals": {
      "orphanAccounts": [
        {
          "id": 123,
          "username": "john_doe",
          "fullname": "John Doe",
          "email": "john@example.com",
          "referredBy": "deleted_user",
          "status": "active",
          "balance": 100.00,
          "issue": "Referrer not found",
          "severity": "high",
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ],
      "statistics": {
        "orphanAccountsCount": 1,
        "circularReferralsCount": 0,
        "selfReferralsCount": 0,
        "missingReferrersCount": 1
      }
    }
  }
}
```

### **Understanding the Results**

#### **Severity Levels:**
- **High** - Critical issues that need immediate attention
  - Referrer not found (user was deleted)
  - Circular referrals
- **Medium** - Issues that should be addressed
  - Referrer is inactive
  - Self referrals

#### **Issue Types:**
- **Referrer not found** - The user being referred to doesn't exist
- **Referrer is inactive** - The referrer exists but is suspended/inactive
- **Circular referral detected** - Two users refer to each other
- **Self-referral detected** - User refers to themselves

### **Next Steps After Getting the List**

#### **1. Fix Orphan Referrals:**
```bash
# Check and fix orphan accounts
curl -X POST http://localhost:3000/api/admin/check-orphan-accounts \
  -H "Content-Type: application/json" \
  -d '{"checkType": "referrals", "fixIssues": true, "dryRun": false}'
```

#### **2. Recreate Missing Referrers:**
```bash
# Recreate deleted referrer accounts
node scripts/recreate-deleted-user.js --recreate \
  --username deleted_user \
  --fullname "Deleted User" \
  --email deleted@example.com \
  --password password123
```

#### **3. Clean Up Orphan Data:**
```bash
# Clean up orphan package requests and earnings
curl -X POST http://localhost:3000/api/admin/check-orphan-accounts \
  -H "Content-Type: application/json" \
  -d '{"checkType": "all", "fixIssues": true, "dryRun": false}'
```

### **Monitoring and Prevention**

#### **Regular Checks:**
```bash
# Schedule regular orphan account checks
# Add to crontab:
0 2 * * * /path/to/scripts/get-orphan-accounts-list.js > /var/log/orphan-accounts.log
```

#### **Database Constraints:**
Add foreign key constraints to prevent orphan records:
```sql
ALTER TABLE package_requests 
ADD CONSTRAINT fk_package_requests_user 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE RESTRICT;
```

### **Troubleshooting**

#### **Common Issues:**

1. **"No orphan accounts found"**
   - Check if users actually have referrals
   - Verify database connection
   - Check if referrals are properly set

2. **"API not responding"**
   - Ensure the server is running
   - Check if the endpoint is accessible
   - Verify authentication if required

3. **"Large number of orphan accounts"**
   - Consider bulk cleanup operations
   - Use pagination to process in batches
   - Export to CSV for analysis

### **Quick Reference**

| Command | Purpose |
|---------|---------|
| `node scripts/get-orphan-accounts-list.js` | Get all orphan accounts |
| `node scripts/get-orphan-accounts-list.js --type referrals` | Get only referral orphans |
| `curl http://localhost:3000/api/admin/orphan-accounts-list?type=all` | API call for all orphans |
| `curl -X POST .../orphan-accounts-list -d '{"exportType":"referrals","format":"csv"}'` | Export to CSV |

### **Integration with Package Requests**

You can also check orphan accounts as part of package request processing:

```bash
curl -X PUT http://localhost:3000/api/package-requests/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "pending", "checkOrphanAccounts": true}'
```

This will return orphan account information along with the package request processing result.






