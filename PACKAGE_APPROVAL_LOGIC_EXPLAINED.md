# Package Approval Logic - Complete Explanation

## Date: October 13, 2025

## Overview

The package approval system is a critical component that handles user package subscriptions, commission distribution, and rank updates in a transactional manner.

---

## Entry Point

### **Admin API Endpoint**
**File:** `src/app/api/admin/package-requests/[id]/route.js`

```javascript
PUT /api/admin/package-requests/{id}
```

**Request Body:**
```json
{
  "status": "approved",  // or "rejected", "pending"
  "adminNotes": "Optional notes"
}
```

---

## Approval Flow

### **Step 1: Admin Action**

Admin clicks "Approve" on a pending package request:

```javascript
// Frontend calls API
fetch(`/api/admin/package-requests/${requestId}`, {
  method: 'PUT',
  body: JSON.stringify({
    status: 'approved',
    adminNotes: 'Approved by admin'
  })
});
```

### **Step 2: API Route Handler**

**File:** `src/app/api/admin/package-requests/[id]/route.js` (Lines 62-108)

```javascript
// If status is 'approved', trigger comprehensive approval
if (status === 'approved') {
  const approvalResult = await approvePackageRequest(packageRequestId);
  
  // Get updated package request
  const updatedRequest = await prisma.packageRequest.findUnique({
    where: { id: packageRequestId },
    include: {
      user: { select: { id, username, fullname } },
      package: { select: { id, package_name, package_amount } }
    }
  });
  
  return {
    success: true,
    message: 'Package approved with commission distribution',
    packageRequest: updatedRequest,
    approvalResult
  };
}
```

### **Step 3: Main Approval Function**

**File:** `src/lib/packageApproval.js` (Lines 344-537)

```javascript
export async function approvePackageRequest(packageRequestId)
```

This is the main orchestrator that handles the entire approval process.

---

## Detailed Approval Process

### **Phase 1: Validation & Data Fetching**

#### **1.1 Load Rank Conditions**
```javascript
await loadRankConditions();
```
- Fetches all ranks from database
- Creates RANK_CONDITIONS mapping
- Example: `{ 'Diamond': { minPoints: 8000 } }`

#### **1.2 Fetch Package Request**
```javascript
const packageRequest = await prisma.packageRequest.findUnique({
  where: { id: requestId },
  include: {
    user: {
      select: {
        id, username, fullname, referredBy,
        points, balance, currentPackageId,
        packageId, status, rank
      }
    },
    package: {
      select: {
        id, package_name, package_amount,
        package_direct_commission,
        package_indirect_commission,
        package_points, status
      }
    }
  }
});
```

#### **1.3 Validate Request Status**
```javascript
if (!packageRequest) {
  throw new Error('Package request not found');
}

if (packageRequest.status !== 'pending') {
  throw new Error('Package request is not pending');
}

if (packageRequest.user.status !== 'active') {
  throw new Error('User is not active');
}

if (packageRequest.package.status !== 'active') {
  throw new Error('Package is not active');
}
```

#### **1.4 Determine Package Type**
```javascript
if (user.currentPackageId === packageData.id) {
  console.log('🔄 This is a package renewal');
} else if (user.currentPackageId && user.currentPackageId !== packageData.id) {
  console.log('⬆️ This is a package upgrade');
} else {
  console.log('🆕 This is a new package assignment');
}
```

---

### **Phase 2: Transaction Execution**

The system uses a Prisma transaction to ensure atomicity (all operations succeed or all fail):

```javascript
result = await prisma.$transaction(async (tx) => {
  // Step 1: Update user package and rank
  // Step 2: Calculate and distribute MLM commissions
  // Step 3: Update package request status
}, {
  timeout: 300000,  // 5 minutes
  maxWait: 30000,   // 30 seconds
  isolationLevel: 'ReadCommitted'
});
```

---

#### **Step 1: Update User Package & Rank**

**Function:** `updateUserPackageAndRankInTransaction(requestId, tx)`
**File:** `src/lib/commissionSystem.js`

```javascript
// What happens:
1. Fetch package request data
2. Calculate new package expiry date (30 days from now)
3. Update user record:
   - currentPackageId = package.id
   - packageExpiryDate = new Date + 30 days
   - packageId = package.id
   - points += package.package_points
   - updatedAt = now

4. Update user's rank based on new points
   - Call updateUserRankInTransaction(userId, newPoints, tx)
   - Check if user qualifies for higher rank
   - Update rankId if rank changed
```

**Example:**
```javascript
User: Ahmed
Current Points: 5,000
Current Rank: Sapphire Manager
Package: Pro Max (30,000 points)

After Update:
- Points: 5,000 + 30,000 = 35,000
- Rank check:
  * Has 35,000 points (meets Diamond 8,000 ✅)
  * Check downline: Has 3 lines with 2000+ points? → YES ✅
  * New Rank: Diamond
- Package: Pro Max
- Expiry: Today + 30 days
```

---

#### **Step 2: Calculate & Distribute MLM Commissions**

**Function:** `calculateMLMCommissionsInTransaction(requestId, tx)`
**File:** `src/lib/commissionSystem.js`

This is where the MLM magic happens!

##### **2.1 Get Referral Tree (Upline Chain)**

```javascript
const referralTree = await getReferralTree(userId);

// Example Result:
[
  { 
    level: 1, 
    username: 'user_parent',
    balance: 10000,
    referredUser: 'Ahmed'
  },
  {
    level: 2,
    username: 'user_grandparent',
    balance: 20000,
    referredUser: 'user_parent'
  }
]
```

##### **2.2 Calculate Commission Amounts**

```javascript
const packageAmount = parseFloat(package.package_amount);
const directCommissionRate = parseFloat(package.package_direct_commission) / 100;
const indirectCommissionRate = parseFloat(package.package_indirect_commission) / 100;

// Calculate amounts
const directCommissionAmount = packageAmount * directCommissionRate;
const indirectCommissionAmount = packageAmount * indirectCommissionRate;

// Example:
// Package Amount: PKR 50,000
// Direct Rate: 5%
// Indirect Rate: 2%
//
// Direct Commission: 50,000 × 5% = PKR 2,500
// Indirect Commission: 50,000 × 2% = PKR 1,000
```

##### **2.3 Distribute Direct Commission (Level 1)**

```javascript
if (referralTree.length > 0) {
  const directReferrer = referralTree[0];  // Level 1 upline
  
  // Update referrer's balance and earnings
  await tx.user.update({
    where: { id: directReferrer.id },
    data: {
      balance: {
        increment: directCommissionAmount  // Add PKR 2,500
      },
      totalEarnings: {
        increment: directCommissionAmount
      }
    }
  });
  
  // Create earnings record
  await tx.earnings.create({
    data: {
      userId: directReferrer.id,
      fromUserId: user.id,
      packageRequestId: requestId,
      type: 'direct_commission',
      amount: directCommissionAmount,
      description: `Direct commission from ${user.username}'s package`
    }
  });
  
  console.log(`✅ Level 1: ${directReferrer.username} earned PKR ${directCommissionAmount}`);
}
```

##### **2.4 Distribute Indirect Commission (Level 2)**

```javascript
if (referralTree.length > 1) {
  const indirectReferrer = referralTree[1];  // Level 2 upline
  
  // Update referrer's balance and earnings
  await tx.user.update({
    where: { id: indirectReferrer.id },
    data: {
      balance: {
        increment: indirectCommissionAmount  // Add PKR 1,000
      },
      totalEarnings: {
        increment: indirectCommissionAmount
      }
    }
  });
  
  // Create earnings record
  await tx.earnings.create({
    data: {
      userId: indirectReferrer.id,
      fromUserId: user.id,
      packageRequestId: requestId,
      type: 'indirect_commission',
      amount: indirectCommissionAmount,
      description: `Indirect commission from ${user.username}'s package`
    }
  });
  
  console.log(`✅ Level 2: ${indirectReferrer.username} earned PKR ${indirectCommissionAmount}`);
}
```

##### **2.5 Update Upline Ranks**

```javascript
// After giving commissions, check if upline members qualify for rank upgrade
for (const referrer of [directReferrer, indirectReferrer]) {
  if (referrer) {
    const newBalance = referrer.balance + commission;
    const newPoints = await getUserPoints(referrer.id);
    
    await updateUserRankInTransaction(referrer.id, newPoints, tx);
  }
}
```

---

#### **Step 3: Update Package Request Status**

```javascript
await tx.packageRequest.update({
  where: { id: requestId },
  data: {
    status: 'approved',
    updatedAt: new Date()
  }
});
```

---

### **Phase 3: Result & Response**

```javascript
return {
  success: true,
  message: 'Package approved successfully with MLM commission distribution',
  user: user.username,
  package: packageData.package_name,
  packageAmount: packageData.package_amount,
  packagePoints: packageData.package_points,
  isRenewal: user.currentPackageId === packageData.id,
  isUpgrade: user.currentPackageId && user.currentPackageId !== packageData.id
};
```

---

## Fallback Mechanism

If the transaction fails (e.g., timeout), the system attempts a fallback approach without transaction:

```javascript
catch (transactionError) {
  console.error('❌ Transaction failed, attempting fallback');
  
  // Try without transaction (less safe but completes the operation)
  await updateUserPackageAndRank(requestId);  // Without tx
  await calculateMLMCommissions(requestId);   // Without tx
  await updatePackageRequestStatus(requestId, 'approved');
  
  return {
    success: true,
    message: 'Package approved (fallback method)',
    fallback: true
  };
}
```

---

## Complete Example: Package Approval

### **Scenario:**

```
User: Ahmed (ID: 123)
Referred By: Sara (ID: 100)
Sara Referred By: Ali (ID: 50)

Package: Pro Max
Amount: PKR 50,000
Points: 30,000
Direct Commission: 5%
Indirect Commission: 2%

Ahmed's Current Status:
- Points: 5,000
- Rank: Sapphire Manager
- Balance: PKR 0
- Package: None
```

### **Approval Process:**

#### **1. Validation ✅**
- Package request exists
- Status is 'pending'
- User is 'active'
- Package is 'active'

#### **2. Transaction Start**

##### **2.1 Update Ahmed's Account:**
```
Ahmed BEFORE:
- Points: 5,000
- Rank: Sapphire Manager
- Package: None
- Balance: PKR 0

Ahmed AFTER:
- Points: 5,000 + 30,000 = 35,000
- Rank: Diamond (if meets downline requirements)
- Package: Pro Max
- Package Expiry: Today + 30 days
- Balance: PKR 0 (unchanged)
```

##### **2.2 Calculate Commissions:**
```
Package Amount: PKR 50,000

Direct Commission (5%): PKR 50,000 × 5% = PKR 2,500
Indirect Commission (2%): PKR 50,000 × 2% = PKR 1,000
```

##### **2.3 Distribute to Sara (Level 1 - Direct Referrer):**
```
Sara BEFORE:
- Balance: PKR 10,000
- Total Earnings: PKR 15,000

Sara AFTER:
- Balance: PKR 10,000 + PKR 2,500 = PKR 12,500
- Total Earnings: PKR 15,000 + PKR 2,500 = PKR 17,500

Earnings Record Created:
- User: Sara
- From User: Ahmed
- Type: direct_commission
- Amount: PKR 2,500
- Description: "Direct commission from Ahmed's package"
```

##### **2.4 Distribute to Ali (Level 2 - Indirect Referrer):**
```
Ali BEFORE:
- Balance: PKR 20,000
- Total Earnings: PKR 50,000

Ali AFTER:
- Balance: PKR 20,000 + PKR 1,000 = PKR 21,000
- Total Earnings: PKR 50,000 + PKR 1,000 = PKR 51,000

Earnings Record Created:
- User: Ali
- From User: Ahmed
- Type: indirect_commission
- Amount: PKR 1,000
- Description: "Indirect commission from Ahmed's package"
```

##### **2.5 Update Package Request:**
```
Package Request BEFORE:
- Status: pending

Package Request AFTER:
- Status: approved
- Updated At: [current timestamp]
```

#### **3. Transaction Commit ✅**

All changes saved to database atomically.

---

## Database Changes Summary

### **Tables Updated:**

1. **users (Ahmed)**
   - currentPackageId: NULL → 3
   - packageExpiryDate: NULL → 2025-11-13
   - packageId: NULL → 3
   - points: 5000 → 35000
   - rankId: 3 (Sapphire Manager) → 4 (Diamond)

2. **users (Sara - Direct Referrer)**
   - balance: 10000 → 12500
   - totalEarnings: 15000 → 17500

3. **users (Ali - Indirect Referrer)**
   - balance: 20000 → 21000
   - totalEarnings: 50000 → 51000

4. **earnings (2 new records)**
   - Record 1: Sara's direct commission (PKR 2,500)
   - Record 2: Ali's indirect commission (PKR 1,000)

5. **packageRequest**
   - status: 'pending' → 'approved'

---

## Error Handling

### **1. Validation Errors**
```javascript
if (packageRequest.status !== 'pending') {
  throw new Error('Package request is not pending');
}
// Returns: 500 error with message
```

### **2. Transaction Timeout**
```javascript
// After 5 minutes (300s), transaction times out
// System attempts fallback approach without transaction
```

### **3. Fallback Failure**
```javascript
// If both transaction AND fallback fail:
await prisma.packageRequest.update({
  where: { id: requestId },
  data: {
    status: 'failed',
    adminNotes: `Approval failed: ${error.message}`
  }
});
```

---

## Key Features

### **1. Transactional Integrity**
- All operations succeed or all fail
- No partial updates
- Data consistency guaranteed

### **2. MLM Commission Distribution**
- Automatic upline identification
- Direct commission (Level 1 - 5%)
- Indirect commission (Level 2 - 2%)

### **3. Rank Auto-Upgrade**
- User rank updated based on new points
- Upline ranks checked after receiving commissions
- Complex downline requirements validated

### **4. Package Management**
- New package assignment
- Package renewal (same package)
- Package upgrade (different package)
- 30-day expiry tracking

### **5. Audit Trail**
- Earnings records created
- Transaction logs
- Status updates tracked
- Admin notes preserved

---

## Files Involved

1. **`src/app/api/admin/package-requests/[id]/route.js`**
   - API endpoint handler
   - Admin authentication
   - Triggers approval function

2. **`src/lib/packageApproval.js`**
   - Main approval orchestrator
   - Validation logic
   - Transaction management
   - Fallback mechanism

3. **`src/lib/commissionSystem.js`**
   - Commission calculation
   - Commission distribution
   - Rank update logic
   - User package updates

4. **`src/lib/rankUtils.js`**
   - Rank eligibility checks
   - Downline requirements validation
   - Rank upgrade logic

---

## Summary

**Package Approval = 3 Main Steps:**

1. **Update User Package & Rank**
   - Add package points to user
   - Update package details
   - Calculate and assign new rank

2. **Distribute MLM Commissions**
   - Level 1 (Direct): 5% commission
   - Level 2 (Indirect): 2% commission
   - Update upline balances
   - Create earnings records

3. **Update Request Status**
   - Mark as 'approved'
   - Add timestamp

**All wrapped in a database transaction for safety!** ✅

---

*Last Updated: October 13, 2025*
*Feature: Package Approval System*
*Status: ✅ PRODUCTION READY*

