# Missing Referrals List Guide

## 🔍 Get Accounts with Missing Referrals

### **Quick Commands**

#### **1. Easiest Way - Run the Script:**
```bash
node scripts/get-missing-referrals-list.js
```

This will show you:
- ✅ **Summary statistics** of accounts with missing referrals
- 📋 **Detailed list** of accounts whose referrers are missing
- ❌ **Missing referrers summary** with affected user counts
- ⚠️ **Inactive referrers** (referrers who exist but are inactive)
- 💡 **Recommendations** for fixing the issues

#### **2. Get Detailed Information:**
```bash
node scripts/get-missing-referrals-list.js --detailed
```

This shows:
- 📋 **Complete user details** for each account with missing referrals
- 📦 **Package information** for affected users
- 💰 **Earnings history** for affected users
- 📊 **Recent activity** for affected users

#### **3. API Endpoints:**

##### **Get Missing Referrals List:**
```bash
# Get basic list
curl http://localhost:3000/api/admin/missing-referrals-list

# Get with pagination
curl "http://localhost:3000/api/admin/missing-referrals-list?limit=50&offset=0"

# Get with detailed user information
curl "http://localhost:3000/api/admin/missing-referrals-list?includeDetails=true"
```

##### **Export Missing Referrals:**
```bash
# Export to CSV
curl -X POST http://localhost:3000/api/admin/missing-referrals-list \
  -H "Content-Type: application/json" \
  -d '{"format": "csv"}' > missing_referrals.csv

# Export to JSON with details
curl -X POST http://localhost:3000/api/admin/missing-referrals-list \
  -H "Content-Type: application/json" \
  -d '{"format": "json", "includeDetails": true}' > missing_referrals.json
```

### **What You'll See in the Output:**

#### **Summary Statistics:**
```
✅ Missing Referrals Summary:
   Total Users with Referrals: 500
   Accounts with Missing Referrals: 25
   Valid Referrals: 450
   Inactive Referrers: 25
   Unique Missing Referrers: 8
   Total Balance Affected: $2,500.00
   Total Earnings Affected: $1,200.00
```

#### **Accounts with Missing Referrals:**
```
📋 Accounts with Missing Referrals:
   ID | Username | Full Name | Email | Status | Balance | Referred By | Days Since Created
   ---|----------|-----------|-------|--------|---------|-------------|------------------
   123 | john_doe | John Doe  | john@... | active | $100.00 | deleted_user | 45
   124 | jane_sm  | Jane Smith| jane@... | active | $250.00 | missing_ref | 30
   125 | bob_wil  | Bob Wilson| bob@...  | active | $75.00  | deleted_user | 60
```

#### **Missing Referrers Summary:**
```
❌ Missing Referrers Summary:
   Username | Affected Users | Total Balance | Total Earnings | Avg Balance | Avg Earnings
   ---------|----------------|---------------|----------------|-------------|-------------
   deleted_user | 15 | $1,500.00 | $800.00 | $100.00 | $53.33
   missing_ref  | 8  | $800.00  | $400.00 | $100.00 | $50.00
   old_user     | 2  | $200.00  | $100.00 | $100.00 | $50.00
```

#### **Recommendations:**
```
💡 Recommendations:
   1. Recreate missing referrer accounts
       Action: Recreate deleted referrer accounts or reassign referrals to valid referrers
       Affected: 25 accounts
       Impact: $2,500.00 in balances, $1,200.00 in earnings
       Priority: high

   2. Reactivate inactive referrer accounts
       Action: Reactivate suspended/inactive referrer accounts
       Affected: 25 accounts
       Priority: medium
```

### **Understanding the Results:**

#### **What are Missing Referrals?**
- Users whose `referredBy` field points to a username that doesn't exist in the database
- This happens when referrer accounts are deleted but their referrals still point to them
- These are "orphan" referral relationships

#### **Severity Levels:**
- **High** - Referrer account completely missing (deleted)
- **Medium** - Referrer account exists but is inactive/suspended

#### **Financial Impact:**
- Shows total balance and earnings of affected users
- Helps prioritize which missing referrers to recreate first
- Indicates the business impact of the missing referrals

### **Next Steps After Getting the List:**

#### **1. Recreate Missing Referrer Accounts:**
```bash
# Recreate a specific missing referrer
node scripts/recreate-deleted-user.js --recreate \
  --username deleted_user \
  --fullname "Deleted User" \
  --email deleted@example.com \
  --password password123
```

#### **2. Fix Missing Referrals:**
```bash
# Fix missing referrals by setting them to null
curl -X POST http://localhost:3000/api/admin/check-orphan-accounts \
  -H "Content-Type: application/json" \
  -d '{"checkType": "referrals", "fixIssues": true, "dryRun": false}'
```

#### **3. Reassign Referrals:**
```bash
# Update specific users to have valid referrers
# This would require a custom script or manual database update
```

### **API Response Format:**

#### **JSON Response:**
```json
{
  "success": true,
  "message": "Accounts with missing referrals retrieved successfully",
  "statistics": {
    "totalUsersWithReferrals": 500,
    "accountsWithMissingReferrals": 25,
    "validReferrals": 450,
    "inactiveReferrers": 25,
    "uniqueMissingReferrers": 8,
    "totalBalanceAffected": 2500.00,
    "totalEarningsAffected": 1200.00
  },
  "accountsWithMissingReferrals": [
    {
      "id": 123,
      "username": "john_doe",
      "fullname": "John Doe",
      "email": "john@example.com",
      "referredBy": "deleted_user",
      "status": "active",
      "balance": 100.00,
      "totalEarnings": 50.00,
      "issue": "Referrer not found",
      "severity": "high",
      "daysSinceCreated": 45
    }
  ],
  "missingReferrers": [
    {
      "username": "deleted_user",
      "totalAffectedUsers": 15,
      "totalBalance": 1500.00,
      "totalEarnings": 800.00,
      "averageBalance": "100.00",
      "averageEarnings": "53.33"
    }
  ],
  "recommendations": [
    {
      "type": "recreate_missing_referrers",
      "priority": "high",
      "description": "Recreate missing referrer accounts",
      "action": "Recreate deleted referrer accounts or reassign referrals to valid referrers",
      "affectedCount": 25,
      "estimatedImpact": "$2,500.00 in balances, $1,200.00 in earnings"
    }
  ]
}
```

### **Quick Reference Commands:**

| Command | Purpose |
|---------|---------|
| `node scripts/get-missing-referrals-list.js` | Get basic missing referrals list |
| `node scripts/get-missing-referrals-list.js --detailed` | Get detailed missing referrals list |
| `curl http://localhost:3000/api/admin/missing-referrals-list` | API call for missing referrals |
| `curl -X POST .../missing-referrals-list -d '{"format":"csv"}'` | Export to CSV |

### **Integration with Package Requests:**

You can also check missing referrals as part of package request processing:

```bash
curl -X PUT http://localhost:3000/api/package-requests/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "pending", "checkOrphanAccounts": true}'
```

This will return missing referral information along with the package request processing result.

### **Monitoring and Alerts:**

#### **Set up regular monitoring:**
```bash
# Add to crontab for daily checks
0 2 * * * /path/to/scripts/get-missing-referrals-list.js > /var/log/missing-referrals.log
```

#### **Alert thresholds:**
- **High Priority**: More than 10 accounts with missing referrals
- **Critical**: More than $1000 in affected balances
- **Urgent**: More than 5 unique missing referrers

### **Prevention:**

#### **Before deleting user accounts:**
1. Check if they have referrals: `SELECT COUNT(*) FROM users WHERE referredBy = 'username'`
2. Reassign referrals to valid referrers
3. Or set referrals to null before deletion

#### **Database constraints:**
```sql
-- Add foreign key constraint to prevent orphan referrals
ALTER TABLE users 
ADD CONSTRAINT fk_users_referred_by 
FOREIGN KEY (referredBy) REFERENCES users(username) ON DELETE SET NULL;
```

This will automatically set `referredBy` to NULL when a referrer is deleted, preventing orphan referrals.



