# 🎯 Package-Specific Rank Assignment Feature

## Overview

This feature allows **specific packages** to automatically assign a **fixed rank** to users upon activation, regardless of their current points or downline structure. This provides immediate rank benefits for premium packages.

---

## Feature Logic

### **Special Package Rank Assignment Rules**

| Package ID | Assigned Rank | Rank ID | Description |
|------------|---------------|---------|-------------|
| **7** | **Sapphire Manager** | 3 | Users purchasing Package ID 7 instantly become Sapphire Manager |
| **8** | **Diamond** | 4 | Users purchasing Package ID 8 instantly become Diamond |
| **Others** | **Normal Logic** | - | All other packages use standard point-based rank calculation |

---

## Implementation Details

### Location
- **File:** `src/lib/commissionSystem.js`
- **Functions:** 
  - `updateUserPackageAndRankInTransaction(packageRequestId, tx)` - Transaction version
  - `updateUserPackageAndRank(packageRequestId)` - Non-transaction version (fallback)

### Code Logic

```javascript
// SPECIAL PACKAGE RANK ASSIGNMENT LOGIC
// Package ID 7 → Sapphire Manager (Rank ID 3)
// Package ID 8 → Diamond (Rank ID 4)

if (packageData.id === 7) {
  // Assign Sapphire Manager rank directly
  await tx.user.update({
    where: { id: user.id },
    data: {
      rankId: 3  // Sapphire Manager
    }
  });
  console.log(`✅ Assigned Sapphire Manager rank to ${user.username} (Package ID 7)`);
  
} else if (packageData.id === 8) {
  // Assign Diamond rank directly
  await tx.user.update({
    where: { id: user.id },
    data: {
      rankId: 4  // Diamond
    }
  });
  console.log(`✅ Assigned Diamond rank to ${user.username} (Package ID 8)`);
  
} else {
  // For other packages, use normal rank update logic based on points
  const updatedUser = await tx.user.findUnique({
    where: { id: user.id },
    select: { points: true }
  });

  if (updatedUser) {
    const newRank = await updateUserRankInTransaction(user.id, updatedUser.points, tx);
    console.log(`Updated user ${user.username} with rank ${newRank}`);
  }
}
```

---

## Execution Flow

### Example: User Purchases Package ID 7 (Sapphire Manager Package)

#### **Before Package Activation:**
```
User: JohnDoe123
Current Rank: Consultant (Rank ID 1)
Points: 500
```

#### **Step 1: Package Activation**
```javascript
approvePackageRequest(packageRequestId)
  └── updateUserPackageAndRankInTransaction(packageRequestId, tx)
```

#### **Step 2: Package & Rank Assignment**
```javascript
// Update package
await tx.user.update({
  where: { id: user.id },
  data: {
    currentPackageId: 7,
    packageExpiryDate: "2025-12-31",
    packageId: 7
  }
});

// Check package ID
if (packageData.id === 7) {
  // ✅ SPECIAL LOGIC: Assign Sapphire Manager directly
  await tx.user.update({
    where: { id: user.id },
    data: {
      rankId: 3  // Sapphire Manager
    }
  });
}
```

#### **Step 3: Continue with Normal MLM Operations**
```javascript
// Points distribution to upline (normal)
distributePointsToTreeInTransaction(user.username, packagePoints, tx);

// Direct commission to direct referrer (normal)
giveDirectCommissionInTransaction(user.referredBy, directCommission, packageRequestId, tx);

// Indirect commission distribution (normal)
distributeIndirectCommissionsInTransaction(user.username, indirectCommission, packageRequestId, tx);
```

#### **After Package Activation:**
```
User: JohnDoe123
Current Rank: Sapphire Manager (Rank ID 3) ✅ Upgraded instantly!
Points: 600 (500 + 100 from package)
Package: Package ID 7
Package Expiry: 2025-12-31
```

---

## Complete Example Scenario

### **Scenario: User "NewUser50" Purchases Package ID 8 (Diamond Package)**

#### **Initial State:**
```
NewUser50 (Consultant, 300 points, Balance: PKR 1,000,000)
  └── Referred by: Zaman75 (Sapphire Manager, 12,800 points)
        └── Referred by: Bushra750 (Sapphire Diamond, 45,100 points)
              └── Referred by: Touseef231 (Royal Ambassador, 75,100 points)
```

#### **User Purchases Package ID 8:**
```http
POST /api/user/subscribe-balance
Body: {
  userId: 5678,
  packageId: 8  // Diamond Package
}
```

**Package Details:**
- Package Amount: PKR 800,000
- Direct Commission: PKR 100,000
- Indirect Commission: PKR 80,000
- Points: 150

---

### **Execution Steps:**

#### **1. Balance Deduction**
```javascript
User Balance: PKR 1,000,000 → PKR 200,000 (-800,000)
```

#### **2. Package Request Created**
```javascript
PackageRequest {
  id: 999,
  userId: 5678,
  packageId: 8,
  transactionId: "BAL_1735670500000_5678",
  status: "pending"
}
```

#### **3. Approval Algorithm Triggered**
```javascript
approvePackageRequest(999)
```

#### **4. Package & Rank Assignment**
```javascript
// Package updated
currentPackageId: 8
packageExpiryDate: "2025-12-31"

// ✅ SPECIAL LOGIC: Package ID 8 detected
console.log(`🎯 Package ID 8 detected - Assigning Diamond rank to NewUser50`);

await tx.user.update({
  where: { id: 5678 },
  data: {
    rankId: 4  // Diamond
  }
});

console.log(`✅ Assigned Diamond rank to NewUser50 (Package ID 8)`);
```

**Result:**
- **NewUser50 is now Diamond rank INSTANTLY** (without needing 8,000 points or 3 downline lines)

#### **5. Points Distribution (Normal Logic)**
```javascript
distributePointsToTreeInTransaction("NewUser50", 150, tx)
```

| User | Old Points | New Points | Rank |
|------|------------|------------|------|
| NewUser50 | 300 | **450** | **Diamond** (assigned by package) |
| Zaman75 | 12,800 | **12,950** | Sapphire Manager |
| Bushra750 | 45,100 | **45,250** | Sapphire Diamond |
| Touseef231 | 75,100 | **75,250** | Royal Ambassador |

✅ All 4 users received +150 points

#### **6. Direct Commission (Normal Logic)**
```javascript
giveDirectCommissionInTransaction("Zaman75", 100000, 999, tx)
```

| User | Balance Change | Commission Type |
|------|----------------|-----------------|
| Zaman75 | +PKR 100,000 | Direct Commission |

✅ Zaman75 received PKR 100,000 direct commission

#### **7. Indirect Commission (Normal Logic)**
```javascript
distributeIndirectCommissionsInTransaction("NewUser50", 80000, 999, tx)
```

**Eligible Members (excluding Zaman75):**
- Bushra750 (Sapphire Diamond)
- Touseef231 (Royal Ambassador)

**Highest Rank:** Royal Ambassador (Touseef231)

| User | Balance Change | Commission Type |
|------|----------------|-----------------|
| Touseef231 | +PKR 80,000 | Indirect Commission |

✅ Touseef231 received PKR 80,000 indirect commission

---

### **Final State:**

#### **NewUser50 (Purchaser)**
- ✅ Rank: **Consultant → Diamond** (INSTANT UPGRADE via Package ID 8)
- ✅ Points: 300 → 450 (+150)
- ✅ Balance: PKR 1,000,000 → PKR 200,000 (-800,000)
- ✅ Package: Package ID 8 (Diamond Package)
- ✅ Package Expiry: December 31, 2025

#### **Zaman75 (Direct Referrer)**
- ✅ Points: 12,800 → 12,950 (+150)
- ✅ Balance: +PKR 100,000 (direct commission)
- ✅ Rank: Sapphire Manager (unchanged)

#### **Bushra750 (Level 2)**
- ✅ Points: 45,100 → 45,250 (+150)
- ✅ Balance: No change
- ✅ Rank: Sapphire Diamond (unchanged)

#### **Touseef231 (Level 3)**
- ✅ Points: 75,100 → 75,250 (+150)
- ✅ Balance: +PKR 80,000 (indirect commission)
- ✅ Rank: Royal Ambassador (unchanged)

---

## Key Benefits

### **1. Instant Rank Upgrade**
- Users don't need to wait to accumulate points
- Users don't need to build downline structure
- Immediate access to rank benefits

### **2. Premium Package Incentive**
- Encourages users to purchase higher-value packages
- Provides tangible immediate value

### **3. Network Growth**
- Users with higher ranks can recruit more effectively
- Upline still benefits from normal commissions and points

### **4. Flexible System**
- Special logic only applies to Package IDs 7 and 8
- All other packages continue with normal point-based ranking
- Easy to add more special packages in the future

---

## Important Notes

### **1. Normal MLM Operations Continue**
Even though the rank is assigned directly:
- ✅ Points are still distributed to entire upline
- ✅ Direct commission goes to direct referrer
- ✅ Indirect commission goes to highest eligible rank
- ✅ Package expiry is set to 1 year
- ✅ Shopping amount logic applies normally

### **2. Rank Assignment is Immediate**
```javascript
// Rank is assigned BEFORE points distribution
// This means the new rank is effective immediately
// Upline members see the user at their new rank for commission calculations
```

### **3. No Downgrade Protection**
```javascript
// If user's package expires and they don't renew:
// - Their rank will be recalculated based on current points and downline
// - They might drop back to a lower rank if they don't meet requirements
```

### **4. Renewal Behavior**
```javascript
// If user renews the same package (Package ID 7 or 8):
// - Rank is reassigned (same rank, so no visible change)
// - Package expiry is extended by 1 year
// - All MLM operations are performed again

// If user had Package ID 7 (Sapphire Manager) and upgrades to Package ID 8 (Diamond):
// - Rank is upgraded to Diamond
// - New package benefits apply
```

---

## Comparison: Normal vs Special Package Logic

### **Normal Package Logic (e.g., Package ID 3 - Combo Package)**

```javascript
// User has 500 points after purchase
// Rank is calculated based on points:

if (points >= 10000) {
  rank = "Diamond";  // Requires downline check
} else if (points >= 5000) {
  rank = "Sapphire Manager";
} else if (points >= 1000) {
  rank = "Manager";
} else {
  rank = "Consultant";
}

// Result: User stays Consultant (500 < 1000)
```

### **Special Package Logic (Package ID 7)**

```javascript
// Package ID 7 detected
// Rank is assigned directly, ignoring points:

if (packageId === 7) {
  rank = "Sapphire Manager";  // Rank ID 3
}

// Result: User becomes Sapphire Manager immediately
// Even with only 500 points!
```

### **Special Package Logic (Package ID 8)**

```javascript
// Package ID 8 detected
// Rank is assigned directly, ignoring points and downline:

if (packageId === 8) {
  rank = "Diamond";  // Rank ID 4
}

// Result: User becomes Diamond immediately
// Even with only 500 points and no downline!
```

---

## Console Logs for Debugging

When Package ID 7 or 8 is activated, you'll see these logs:

```bash
🎯 Package ID 7 detected - Assigning Sapphire Manager rank to JohnDoe123
✅ Assigned Sapphire Manager rank to JohnDoe123 (Package ID 7)
📦 Special rank assignment complete for JohnDoe123: Sapphire Manager
Updated user JohnDoe123 with package Sapphire Manager Package
```

```bash
🎯 Package ID 8 detected - Assigning Diamond rank to NewUser50
✅ Assigned Diamond rank to NewUser50 (Package ID 8)
📦 Special rank assignment complete for NewUser50: Diamond
Updated user NewUser50 with package Diamond Package
```

For other packages:
```bash
📊 Package ID 3 - Using normal rank update logic based on points
Updated user TestUser99 with package Combo Package and rank Consultant
```

---

## Testing the Feature

### Test Package ID 7 (Sapphire Manager Assignment)

```javascript
// 1. Create test user with low rank
const testUser = await prisma.user.create({
  data: {
    username: 'testuser_pkg7',
    fullname: 'Test User Package 7',
    email: 'testpkg7@example.com',
    password: 'hashed_password',
    referredBy: 'Bushra750',
    balance: 500000,
    points: 200,  // Low points (Consultant)
    rankId: 1,    // Consultant
    status: 'active'
  }
});

// 2. Purchase Package ID 7
const response = await fetch('/api/user/subscribe-balance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: testUser.id,
    packageId: 7  // Sapphire Manager Package
  })
});

// 3. Verify result
const updatedUser = await prisma.user.findUnique({
  where: { id: testUser.id },
  include: { rank: true }
});

console.log(updatedUser.rank.title);  // Should be "Sapphire Manager"
console.log(updatedUser.rankId);      // Should be 3
```

### Test Package ID 8 (Diamond Assignment)

```javascript
// Same steps as above, but use packageId: 8
// Expected result: User rank becomes "Diamond" (Rank ID 4)
```

---

## Future Enhancements

### Easy to Add More Special Packages

```javascript
if (packageData.id === 7) {
  // Sapphire Manager
  rankId = 3;
} else if (packageData.id === 8) {
  // Diamond
  rankId = 4;
} else if (packageData.id === 9) {
  // Future: Sapphire Diamond?
  rankId = 5;
} else if (packageData.id === 10) {
  // Future: Ambassador?
  rankId = 6;
} else {
  // Normal logic
  await updateUserRankInTransaction(user.id, updatedUser.points, tx);
}
```

---

## Related Documentation

- [Package Activation Logic](./PACKAGE_ACTIVATION_LOGIC_DOCUMENTATION.md)
- [Rank Update Logic](./RANK_UPDATE_LOGIC_EXPLAINED.md)
- [Points Removed from Higher Ranks](./POINTS_REMOVED_FROM_HIGHER_RANKS.md)

---

**Generated:** January 2025  
**Version:** 1.0  
**Feature:** Package-Specific Rank Assignment

