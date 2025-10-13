# Rank Update Logic During Package Approval

## Date: October 13, 2025

## Overview

When a package is approved, the system automatically updates user ranks based on their new points. This document explains the exact rank update logic that happens during package approval.

---

## When Rank Updates Happen

During package approval, ranks are updated **THREE times**:

1. **Main User** - After package points are added
2. **Direct Referrer (Level 1)** - After receiving direct commission
3. **Indirect Referrer (Level 2)** - After receiving indirect commission

---

## Main Function: `updateUserRankInTransaction(userId, currentPoints, tx)`

**Location:** `src/lib/commissionSystem.js` (Lines 8-103)

**Called From:**
- `updateUserPackageAndRankInTransaction()` - For the subscribing user
- `giveDirectCommissionInTransaction()` - For Level 1 referrer
- `giveIndirectCommissionInTransaction()` - For Level 2 referrer

---

## Step-by-Step Rank Update Process

### **Step 1: Fetch User Data**

```javascript
const user = await tx.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    username: true,
    points: true,
    rank: {
      select: { title: true }
    }
  }
});
```

**Gets:**
- User ID
- Username
- Current points
- Current rank title

---

### **Step 2: Fetch All Ranks**

```javascript
const ranks = await tx.rank.findMany({
  orderBy: { required_points: 'desc' }
});
```

**Returns ranks ordered from highest to lowest:**
```
1. Honory Share Holder (1,000,000 points)
2. Global Ambassador (500,000 points)
3. Royal Ambassador (200,000 points)
4. Sapphire Ambassador (100,000 points)
5. Ambassador (50,000 points)
6. Sapphire Diamond (24,000 points)
7. Diamond (8,000 points)
8. Sapphire Manager (2,000 points)
9. Manager (1,000 points)
10. Consultant (0 points)
```

---

### **Step 3: Define Higher Ranks**

```javascript
const HIGHER_RANKS = [
  'Diamond',              // 8000 points + 3 lines with 2000+ points
  'Sapphire Diamond',     // 3 lines with Diamond rank
  'Ambassador',           // 6 lines with Diamond rank
  'Sapphire Ambassador',  // 3 Ambassador OR 10 Diamond lines
  'Royal Ambassador',     // 3 Sapphire Ambassador OR 15 Diamond lines
  'Global Ambassador',    // 3 Royal Ambassador OR 25 Diamond lines
  'Honory Share Holder'   // 3 Global Ambassador OR (50 Diamond + 10 Royal Ambassador)
];
```

These ranks require **both points AND downline requirements**.

---

### **Step 4: Loop Through Ranks (Highest to Lowest)**

```javascript
for (const rank of ranks) {
  // Check if user has enough points
  if (currentPoints >= rank.required_points) {
    
    // Is this a higher rank?
    if (HIGHER_RANKS.includes(rank.title)) {
      // YES → Check downline requirements
      const rankCheckResult = await checkNewRankRequirementsOptimized(
        user.username, 
        rank.title, 
        tx
      );
      
      if (rankCheckResult.qualifies) {
        // User qualifies!
        newRankTitle = rank.title;
        newRankId = rank.id;
        break; // Stop checking lower ranks
      } else {
        // Doesn't qualify, continue to next (lower) rank
        continue;
      }
      
    } else {
      // NO → Only points matter
      newRankTitle = rank.title;
      newRankId = rank.id;
      break; // Stop checking lower ranks
    }
  }
}
```

---

### **Step 5: Update User's Rank**

```javascript
await tx.user.update({
  where: { id: userId },
  data: { rankId: newRankId }
});

console.log(`✅ Updated rank for user ${userId}: ${newRankTitle}`);
return newRankTitle;
```

---

## Example: Package Approval Rank Updates

### **Scenario:**

```
User Hierarchy:
Ali (Grandparent) → Sara (Parent) → Ahmed (Subscriber)

Ahmed Subscribes to Pro Max:
- Package Amount: PKR 50,000
- Package Points: 30,000
- Direct Commission: 5% (PKR 2,500)
- Indirect Commission: 2% (PKR 1,000)
```

---

### **Rank Update #1: Ahmed (Subscriber)**

**Triggered By:** `updateUserPackageAndRankInTransaction()`

**Before Approval:**
```
Ahmed:
- Points: 5,000
- Rank: Sapphire Manager (requires 2,000 points)
```

**During Approval:**
```javascript
// Package points added
newPoints = 5,000 + 30,000 = 35,000

// Rank check triggered
updateUserRankInTransaction(ahmed.id, 35000, tx)
```

**Rank Check Process:**
```
Loop through ranks (highest to lowest):

1. Check Honory Share Holder (1M points)
   → 35,000 < 1,000,000 ❌ Skip

2. Check Global Ambassador (500K points)
   → 35,000 < 500,000 ❌ Skip

3. Check Royal Ambassador (200K points)
   → 35,000 < 200,000 ❌ Skip

4. Check Sapphire Ambassador (100K points)
   → 35,000 < 100,000 ❌ Skip

5. Check Ambassador (50K points)
   → 35,000 < 50,000 ❌ Skip

6. Check Sapphire Diamond (24K points)
   → 35,000 >= 24,000 ✅
   → Is higher rank? YES
   → Check downline: Need 3 Diamond lines
   → Ahmed has: 0 Diamond lines ❌
   → DOESN'T QUALIFY, continue...

7. Check Diamond (8K points)
   → 35,000 >= 8,000 ✅
   → Is higher rank? YES
   → Check downline: Need 3 lines with 2000+ points
   → Ahmed has:
      - User1: 2,500 points ✅
      - User2: 2,200 points ✅
      - User3: 3,000 points ✅
   → Total: 3 qualifying lines ✅
   → QUALIFIES! ✅
   → STOP LOOP
```

**After Approval:**
```
Ahmed:
- Points: 35,000 (was 5,000)
- Rank: Diamond (was Sapphire Manager) ✅
```

---

### **Rank Update #2: Sara (Direct Referrer)**

**Triggered By:** `giveDirectCommissionInTransaction()`

**Before Commission:**
```
Sara:
- Points: 15,000
- Balance: PKR 10,000
- Rank: Diamond
```

**During Commission Distribution:**
```javascript
// Direct commission given
commission = PKR 2,500

// Update balance
newBalance = 10,000 + 2,500 = 12,500

// Points don't change from commission
// (Only package purchases add points)

// Rank check triggered
updateUserRankInTransaction(sara.id, 15000, tx)
```

**Rank Check Process:**
```
Loop through ranks:

1. Check Ambassador (50K points)
   → 15,000 < 50,000 ❌ Skip

2. Check Sapphire Diamond (24K points)
   → 15,000 < 24,000 ❌ Skip

3. Check Diamond (8K points)
   → 15,000 >= 8,000 ✅
   → Is higher rank? YES
   → Check downline: Need 3 lines with 2000+ points
   → Sara has:
      - Ahmed: 35,000 points ✅
      - User2: 2,100 points ✅
      - User3: 2,800 points ✅
   → Total: 3 qualifying lines ✅
   → QUALIFIES! ✅
   → Already Diamond, no change
```

**After Commission:**
```
Sara:
- Points: 15,000 (unchanged - commissions don't add points)
- Balance: PKR 12,500 (was 10,000)
- Rank: Diamond (unchanged) ✅
```

---

### **Rank Update #3: Ali (Indirect Referrer)**

**Triggered By:** `giveIndirectCommissionInTransaction()`

**Before Commission:**
```
Ali:
- Points: 45,000
- Balance: PKR 20,000
- Rank: Diamond
```

**During Commission Distribution:**
```javascript
// Indirect commission given
commission = PKR 1,000

// Update balance
newBalance = 20,000 + 1,000 = 21,000

// Rank check triggered
updateUserRankInTransaction(ali.id, 45000, tx)
```

**Rank Check Process:**
```
Loop through ranks:

1. Check Ambassador (50K points)
   → 45,000 < 50,000 ❌ Skip

2. Check Sapphire Diamond (24K points)
   → 45,000 >= 24,000 ✅
   → Is higher rank? YES
   → Check downline: Need 3 Diamond lines
   → Ali has:
      - Sara: Diamond ✅
      - User2: Diamond ✅
      - User3: Sapphire Manager ❌
      - User4: Diamond ✅
   → Total: 3 Diamond lines ✅
   → QUALIFIES! ✅
   → UPGRADE TO SAPPHIRE DIAMOND!
```

**After Commission:**
```
Ali:
- Points: 45,000 (unchanged)
- Balance: PKR 21,000 (was 20,000)
- Rank: Sapphire Diamond (was Diamond) ✅ UPGRADED!
```

---

## Key Points About Rank Updates

### **1. Points vs Commissions**

**Package Points:**
- ✅ Added to user's points
- ✅ Trigger rank upgrades
- ✅ Count toward rank requirements

**Commission Earnings:**
- ✅ Added to user's balance (money)
- ❌ Do NOT add to points
- ❌ Do NOT directly trigger rank upgrades
- ✅ But rank is still checked after commission

**Example:**
```
User buys PKR 50,000 package with 30,000 points:
→ User gets +30,000 points ✅
→ User's rank checked with new points ✅

User receives PKR 2,500 commission:
→ User gets +PKR 2,500 balance ✅
→ User's points unchanged ❌
→ User's rank still checked (may upgrade if downline changed) ✅
```

---

### **2. Downline Requirements for Higher Ranks**

**Lower Ranks (Points Only):**
- Consultant (0 points)
- Manager (1,000 points)
- Sapphire Manager (2,000 points)

**Higher Ranks (Points + Downline):**

#### **Diamond:**
```
Required:
- Points: 8,000
- Downline: 3 direct referrals with 2,000+ points

Check:
const directReferrals = await tx.user.findMany({
  where: { referredBy: username }
});

let qualifyingLines = 0;
for (const referral of directReferrals) {
  if (referral.points >= 2000) {
    qualifyingLines++;
  }
}

if (qualifyingLines >= 3) {
  return { qualifies: true };
}
```

#### **Sapphire Diamond:**
```
Required:
- Points: 24,000
- Downline: 3 direct referrals with Diamond rank

Check:
let diamondLines = 0;
for (const referral of directReferrals) {
  if (referral.rank?.title === 'Diamond') {
    diamondLines++;
  }
}

if (diamondLines >= 3) {
  return { qualifies: true };
}
```

#### **Ambassador:**
```
Required:
- Points: 50,000
- Downline: 6 direct referrals with Diamond rank

Check:
let diamondLines = 0;
for (const referral of directReferrals) {
  if (referral.rank?.title === 'Diamond') {
    diamondLines++;
  }
}

if (diamondLines >= 6) {
  return { qualifies: true };
}
```

---

### **3. Rank Check Order**

**Always checks from HIGHEST to LOWEST:**

```
1. Check Honory Share Holder first
   ↓ If doesn't qualify
2. Check Global Ambassador
   ↓ If doesn't qualify
3. Check Royal Ambassador
   ↓ If doesn't qualify
4. Check Sapphire Ambassador
   ↓ If doesn't qualify
5. Check Ambassador
   ↓ If doesn't qualify
6. Check Sapphire Diamond
   ↓ If doesn't qualify
7. Check Diamond
   ↓ If doesn't qualify
8. Check Sapphire Manager
   ↓ If doesn't qualify
9. Check Manager
   ↓ If doesn't qualify
10. Default to Consultant
```

**Why this order?**
- Ensures user gets the HIGHEST rank they qualify for
- Prevents under-ranking
- Maximizes user benefits

---

### **4. Only Updates if Rank Changed**

```javascript
// Only update if rank changed
if (!user.rank || user.rank.title !== newRankTitle) {
  await tx.user.update({
    where: { id: userId },
    data: { rankId: newRankId }
  });
  
  console.log(`✅ Updated rank: ${oldRank} → ${newRankTitle}`);
} else {
  console.log(`ℹ️ Rank unchanged: ${user.rank.title}`);
}
```

**Benefits:**
- Reduces unnecessary database writes
- Cleaner logs
- Better performance

---

## Complete Approval Flow with Rank Updates

```
ADMIN APPROVES PACKAGE
  ↓
┌─────────────────────────────────────────────────────────┐
│ TRANSACTION START                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ STEP 1: UPDATE SUBSCRIBER PACKAGE & RANK               │
│   ├─ Update package details                            │
│   │   ├─ currentPackageId = package.id                 │
│   │   ├─ packageExpiryDate = today + 1 year            │
│   │   └─ packageId = package.id                        │
│   │                                                     │
│   └─ 🏆 RANK UPDATE #1 (Subscriber)                    │
│       ├─ Get user's current points                     │
│       ├─ Loop through ranks (highest to lowest)        │
│       ├─ Check points requirement                      │
│       ├─ Check downline requirement (if higher rank)   │
│       └─ Update rankId if qualified                    │
│                                                         │
│ STEP 2: DISTRIBUTE MLM COMMISSIONS                     │
│   │                                                     │
│   ├─ 2A: Give Direct Commission (Level 1)              │
│   │   ├─ Calculate: 5% of package amount               │
│   │   ├─ Update referrer balance (+PKR 2,500)          │
│   │   ├─ Update referrer totalEarnings (+PKR 2,500)    │
│   │   ├─ Create earnings record                        │
│   │   │                                                 │
│   │   └─ 🏆 RANK UPDATE #2 (Direct Referrer)          │
│   │       ├─ Get referrer's current points             │
│   │       ├─ Loop through ranks                        │
│   │       ├─ Check points + downline                   │
│   │       └─ Update rankId if qualified                │
│   │                                                     │
│   └─ 2B: Give Indirect Commission (Level 2)            │
│       ├─ Calculate: 2% of package amount               │
│       ├─ Update referrer balance (+PKR 1,000)          │
│       ├─ Update referrer totalEarnings (+PKR 1,000)    │
│       ├─ Create earnings record                        │
│       │                                                 │
│       └─ 🏆 RANK UPDATE #3 (Indirect Referrer)        │
│           ├─ Get referrer's current points             │
│           ├─ Loop through ranks                        │
│           ├─ Check points + downline                   │
│           └─ Update rankId if qualified                │
│                                                         │
│ STEP 3: UPDATE REQUEST STATUS                          │
│   └─ Set status = 'approved'                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
  ↓
TRANSACTION COMMIT ✅
  ↓
ALL RANKS UPDATED!
```

---

## Detailed Example

### **Initial State:**

```
Ali (Grandparent):
- Points: 45,000
- Rank: Diamond
- Direct Referrals: Sara (Diamond), User2 (Diamond), User3 (Sapphire Manager), User4 (Diamond)

Sara (Parent):
- Points: 15,000
- Rank: Diamond
- Direct Referrals: Ahmed, User5, User6

Ahmed (Subscriber):
- Points: 5,000
- Rank: Sapphire Manager
- Direct Referrals: User7 (2,500 pts), User8 (2,200 pts), User9 (3,000 pts)
```

---

### **Package Approval Process:**

#### **1. Ahmed Subscribes to Pro Max (30,000 points)**

**Rank Update #1 (Ahmed):**
```
Old Points: 5,000
New Points: 5,000 + 30,000 = 35,000

Rank Check:
  Ambassador (50K)? → 35K < 50K ❌
  Sapphire Diamond (24K)? → 35K >= 24K ✅
    → Check: Need 3 Diamond lines
    → Ahmed has: 0 Diamond lines ❌
    → DOESN'T QUALIFY
  
  Diamond (8K)? → 35K >= 8K ✅
    → Check: Need 3 lines with 2000+ points
    → Ahmed has:
       * User7: 2,500 ✅
       * User8: 2,200 ✅
       * User9: 3,000 ✅
    → Total: 3 qualifying lines ✅
    → QUALIFIES! ✅

Result: Sapphire Manager → Diamond ✅
```

#### **2. Sara Receives Direct Commission (PKR 2,500)**

**Rank Update #2 (Sara):**
```
Points: 15,000 (unchanged - commissions don't add points)
Balance: 10,000 → 12,500 (+2,500)

Rank Check:
  Ambassador (50K)? → 15K < 50K ❌
  Sapphire Diamond (24K)? → 15K < 24K ❌
  Diamond (8K)? → 15K >= 8K ✅
    → Check: Need 3 lines with 2000+ points
    → Sara has:
       * Ahmed: 35,000 ✅ (just upgraded!)
       * User5: 2,100 ✅
       * User6: 2,800 ✅
    → Total: 3 qualifying lines ✅
    → QUALIFIES! ✅
    → Already Diamond

Result: Diamond → Diamond (no change)
```

#### **3. Ali Receives Indirect Commission (PKR 1,000)**

**Rank Update #3 (Ali):**
```
Points: 45,000 (unchanged)
Balance: 20,000 → 21,000 (+1,000)

Rank Check:
  Ambassador (50K)? → 45K < 50K ❌
  Sapphire Diamond (24K)? → 45K >= 24K ✅
    → Check: Need 3 Diamond lines
    → Ali has:
       * Sara: Diamond ✅
       * User2: Diamond ✅
       * User3: Sapphire Manager ❌
       * User4: Diamond ✅
    → Total: 3 Diamond lines ✅
    → QUALIFIES! ✅

Result: Diamond → Sapphire Diamond ✅ UPGRADED!
```

---

## Summary of Rank Updates

### **After Package Approval:**

```
Ahmed:
  Before: Sapphire Manager (5,000 points)
  After:  Diamond (35,000 points) ✅ UPGRADED

Sara:
  Before: Diamond (15,000 points)
  After:  Diamond (15,000 points) ✅ NO CHANGE

Ali:
  Before: Diamond (45,000 points)
  After:  Sapphire Diamond (45,000 points) ✅ UPGRADED
```

---

## Important Notes

### **1. Points vs Balance**

**Points:**
- Come from package purchases
- Trigger rank upgrades
- Required for rank qualification

**Balance:**
- Comes from commissions
- Can be withdrawn
- Does NOT add to points
- Does NOT directly trigger rank upgrades

### **2. Commission Doesn't Add Points**

```
❌ WRONG:
User receives PKR 2,500 commission
→ User gets +2,500 points

✅ CORRECT:
User receives PKR 2,500 commission
→ User gets +PKR 2,500 balance
→ User's points unchanged
→ Rank still checked (may upgrade if downline improved)
```

### **3. Rank Check Always Happens**

Even if points don't change, rank is checked because:
- Downline may have upgraded
- Downline may have gained points
- User may now meet downline requirements

### **4. Transactional Safety**

All rank updates happen within the transaction:
- If transaction fails → No rank updates
- If transaction succeeds → All rank updates saved
- Atomic operation guaranteed

---

## Console Logs During Approval

```
🚀 Starting package approval for request 544
📦 Approving package: Pro Max (PKR 50,000) for user: Ahmed
🆕 This is a new package assignment for user Ahmed

📝 Step 1: Updating user package and rank...
Package activation for user Ahmed: Pro Max
Payment method: Regular Payment
Shopping amount: 20000

🔍 Checking Diamond requirements for Ahmed using NEW LOGIC...
✅ Ahmed qualifies for Diamond: Met points and 3/3 direct lines with 2000+ points
📊 Details: { points: 35000, requiredPoints: 8000, qualifyingLines: 3 }
✅ Updated rank for user 123: Diamond (35000 points, requires 8000 points)
✅ Updated user Ahmed with package Pro Max and rank Diamond

💰 Step 2: Distributing MLM commissions...
Giving direct commission to direct referrer: Sara
✅ Level 1: Sara earned PKR 2500 (direct commission)
🔍 Checking rank for Sara after commission...
✅ Updated rank for user 100: Diamond (15000 points, requires 8000 points)

Giving indirect commission to indirect referrer: Ali
✅ Level 2: Ali earned PKR 1000 (indirect commission)
🔍 Checking Sapphire Diamond requirements for Ali using NEW LOGIC...
✅ Ali qualifies for Sapphire Diamond: Met points and 3/3 direct lines with Diamond rank
✅ Updated rank for user 50: Sapphire Diamond (45000 points, requires 24000 points)

📋 Step 3: Updating package request status...
✅ Package request status updated to approved

🎉 Package request 544 approved successfully
```

---

## Files Reference

**Main Rank Update Function:**
- `src/lib/commissionSystem.js` (Lines 8-103)
  - `updateUserRankInTransaction(userId, currentPoints, tx)`

**Downline Requirement Checks:**
- `src/lib/newRankLogicOptimized.js`
  - `checkNewRankRequirementsOptimized(username, rankTitle, tx)`
  - `checkDiamondRankRequirementsOptimized()`
  - `checkSapphireDiamondRankRequirementsOptimized()`
  - `checkAmbassadorRankRequirementsOptimized()`
  - etc.

**Package Approval Orchestrator:**
- `src/lib/packageApproval.js`
  - `approvePackageRequest(packageRequestId)`

**Commission Distribution:**
- `src/lib/commissionSystem.js`
  - `calculateMLMCommissionsInTransaction()`
  - `updateUserPackageAndRankInTransaction()`

---

## Quick Summary

**Rank Update During Approval:**

1. **Subscriber gets package points** → Rank checked and updated
2. **Direct referrer gets commission** → Rank checked (may upgrade if downline improved)
3. **Indirect referrer gets commission** → Rank checked (may upgrade if downline improved)

**All within ONE transaction for safety!** ✅

**Rank Logic:**
- Check points requirement first
- For higher ranks, also check downline
- Assign highest qualifying rank
- Update database if rank changed

---

*Last Updated: October 13, 2025*
*Feature: Rank Update in Package Approval*
*Status: ✅ DOCUMENTED*

