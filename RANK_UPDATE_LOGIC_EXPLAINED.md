# Rank Update Logic - Complete Guide

## Date: October 13, 2025

## Overview

This document explains the complete rank update system used in the Leadora Global MLM platform. The system automatically updates user ranks based on points and downline requirements.

---

## 📊 Rank Hierarchy

### **All Ranks (Ordered by Required Points)**

| Rank # | Rank Name | Required Points | Downline Requirements |
|--------|-----------|-----------------|----------------------|
| 1 | **Consultant** | 0 | None |
| 2 | **Manager** | 1,000 | None |
| 3 | **Sapphire Manager** | 2,000 | None |
| 4 | **Diamond** | 8,000 | 3 lines with 2000+ points |
| 5 | **Sapphire Diamond** | 24,000 | 3 lines with Diamond rank |
| 6 | **Ambassador** | 50,000 | 6 lines with Diamond rank |
| 7 | **Sapphire Ambassador** | 100,000 | 3 Ambassador lines OR 10 Diamond lines |
| 8 | **Royal Ambassador** | 200,000 | 3 Sapphire Ambassador lines OR 15 Diamond lines |
| 9 | **Global Ambassador** | 500,000 | 3 Royal Ambassador lines OR 25 Diamond lines |
| 10 | **Honory Share Holder** | 1,000,000 | 3 Global Ambassador lines OR (50 Diamond + 10 Royal Ambassador) lines |

---

## 🔄 How Rank Updates Work

### **Main Update Function: `updateUserRank(userId)`**

**Location:** `src/lib/rankUtils.js`

**Called When:**
1. ✅ User's package is approved
2. ✅ User earns commissions
3. ✅ User's points increase
4. ✅ Manual rank check/update

**Process Flow:**

```
START: updateUserRank(userId)
  ↓
1. Fetch user data (id, username, points, current rank)
  ↓
2. Fetch all ranks from database (ordered by points DESC)
  ↓
3. Loop through ranks from highest to lowest:
  ↓
  3a. Check if user has enough POINTS for rank
      ↓
      NO → Skip to next (lower) rank
      ↓
      YES → Continue to 3b
  ↓
  3b. Is this a HIGHER RANK? (Diamond+)
      ↓
      NO → User qualifies! Set this rank → GOTO 4
      ↓
      YES → Check downline requirements (3c)
  ↓
  3c. Call checkNewRankRequirementsOptimized(username, rankTitle)
      ↓
      Returns: { qualifies: true/false, reason: "...", details: {...} }
      ↓
      qualifies = TRUE → User qualifies! Set this rank → GOTO 4
      ↓
      qualifies = FALSE → Continue to next (lower) rank
  ↓
4. Update user's rank in database if changed
  ↓
5. Log rank update
  ↓
END: Return new rank name
```

---

## 📋 Lower Ranks (Points Only)

### **Ranks: Consultant, Manager, Sapphire Manager**

These ranks only require **POINTS**. No downline requirements.

```javascript
// Example: Manager Rank
User Points: 1,500
Required Points: 1,000
Downline Requirements: NONE

Result: ✅ QUALIFIES for Manager
```

**Logic:**
```javascript
if (user.points >= rank.required_points) {
  // For lower ranks (not in HIGHER_RANKS array)
  newRankName = rank.title;
  newRankId = rank.id;
  console.log(`✅ ${user.username} qualifies for ${rank.title} (points requirement met)`);
  break;
}
```

---

## 💎 Higher Ranks (Points + Downline)

### **Ranks: Diamond, Sapphire Diamond, Ambassador, Sapphire Ambassador, Royal Ambassador, Global Ambassador, Honory Share Holder**

These ranks require **POINTS + DOWNLINE REQUIREMENTS**.

**Location:** `src/lib/newRankLogicOptimized.js`

---

## 🔍 Diamond Rank Logic

### **Requirements:**
1. **Points:** 8,000
2. **Downline:** At least 3 direct referrals with 2,000+ points

### **How It Checks:**

```javascript
async function checkDiamondRankRequirementsOptimized(username, tx) {
  // Step 1: Check points
  const user = await tx.user.findUnique({ where: { username } });
  
  if (user.points < 8000) {
    return { qualifies: false, reason: "Insufficient points: X/8000" };
  }

  // Step 2: Get direct referrals
  const directReferrals = await tx.user.findMany({
    where: { referredBy: username }
  });

  // Step 3: Count direct referrals with 2000+ points
  let qualifyingLines = 0;
  for (const referral of directReferrals) {
    if (referral.points >= 2000) {
      qualifyingLines++;
    }
  }

  // Step 4: Check if meets requirement
  if (qualifyingLines >= 3) {
    return { 
      qualifies: true, 
      reason: "Met points and 3/3 direct lines with 2000+ points" 
    };
  } else {
    return { 
      qualifies: false, 
      reason: "Insufficient qualifying lines: X/3" 
    };
  }
}
```

### **Example:**

```
User: Ahmed
Points: 9,000 ✅
Direct Referrals:
  - Sara: 2,500 points ✅
  - Ali: 2,100 points ✅
  - Omar: 1,800 points ❌
  - Fatima: 3,000 points ✅

Qualifying Lines: 3 (Sara, Ali, Fatima)
Required Lines: 3

Result: ✅ QUALIFIES for Diamond
```

---

## 💠 Sapphire Diamond Rank Logic

### **Requirements:**
1. **Points:** 24,000
2. **Downline:** At least 3 direct referrals with **Diamond** rank

### **How It Checks:**

```javascript
async function checkSapphireDiamondRankRequirementsOptimized(username, tx) {
  // Step 1: Check points
  if (user.points < 24000) {
    return { qualifies: false, reason: "Insufficient points: X/24000" };
  }

  // Step 2: Get direct referrals with their ranks
  const directReferrals = await tx.user.findMany({
    where: { referredBy: username },
    include: { rank: true }
  });

  // Step 3: Count direct referrals with Diamond rank
  let qualifyingLines = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      qualifyingLines++;
    }
  }

  // Step 4: Check if meets requirement
  if (qualifyingLines >= 3) {
    return { qualifies: true };
  } else {
    return { qualifies: false };
  }
}
```

### **Example:**

```
User: Bushra
Points: 30,000 ✅
Direct Referrals:
  - User1: Diamond rank ✅
  - User2: Diamond rank ✅
  - User3: Sapphire Manager rank ❌
  - User4: Diamond rank ✅
  - User5: Manager rank ❌

Qualifying Lines: 3 (User1, User2, User4 have Diamond)
Required Lines: 3

Result: ✅ QUALIFIES for Sapphire Diamond
```

---

## 🎖️ Ambassador Rank Logic

### **Requirements:**
1. **Points:** 50,000
2. **Downline:** At least 6 direct referrals with **Diamond** rank

### **Logic:**
```javascript
// Count direct referrals with Diamond rank
let qualifyingLines = 0;
for (const referral of directReferrals) {
  if (referral.rank?.title === 'Diamond') {
    qualifyingLines++;
  }
}

// Need at least 6 Diamond referrals
if (qualifyingLines >= 6) {
  return { qualifies: true };
}
```

### **Example:**

```
User: Kalsoom231
Points: 65,000 ✅
Direct Referrals with Diamond Rank: 11 ✅

Qualifying Lines: 11
Required Lines: 6

Result: ✅ QUALIFIES for Ambassador
```

---

## 🌟 Sapphire Ambassador Rank Logic

### **Requirements (EITHER Option 1 OR Option 2):**

**Option 1:**
- Points: 100,000
- Downline: 3 direct referrals with **Ambassador** rank

**Option 2:**
- Points: 100,000
- Downline: 10 direct referrals with **Diamond** rank

### **Logic:**

```javascript
async function checkSapphireAmbassadorRankRequirementsOptimized(username, tx) {
  // Step 1: Check points
  if (user.points < 100000) {
    return { qualifies: false };
  }

  // Step 2: Count Ambassador lines (Option 1)
  let ambassadorLines = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Ambassador') {
      ambassadorLines++;
    }
  }
  const option1Qualifies = ambassadorLines >= 3;

  // Step 3: Count Diamond lines (Option 2)
  let diamondLines = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      diamondLines++;
    }
  }
  const option2Qualifies = diamondLines >= 10;

  // Step 4: Check if EITHER option is met
  if (option1Qualifies || option2Qualifies) {
    return { qualifies: true };
  } else {
    return { qualifies: false };
  }
}
```

### **Example 1 (Option 1):**

```
User: UserA
Points: 120,000 ✅
Direct Referrals:
  - 3 Ambassadors ✅
  - 5 Diamonds

Result: ✅ QUALIFIES (Option 1 met: 3 Ambassador lines)
```

### **Example 2 (Option 2):**

```
User: UserB
Points: 150,000 ✅
Direct Referrals:
  - 2 Ambassadors ❌ (not enough for Option 1)
  - 12 Diamonds ✅

Result: ✅ QUALIFIES (Option 2 met: 10+ Diamond lines)
```

---

## 👑 Royal Ambassador Rank Logic

### **Requirements (EITHER Option 1 OR Option 2):**

**Option 1:**
- Points: 200,000
- Downline: 3 direct referrals with **Sapphire Ambassador** rank

**Option 2:**
- Points: 200,000
- Downline: 15 direct referrals with **Diamond** rank

### **Logic:** (Same pattern as Sapphire Ambassador, but different counts)

---

## 🌍 Global Ambassador Rank Logic

### **Requirements (EITHER Option 1 OR Option 2):**

**Option 1:**
- Points: 500,000
- Downline: 3 direct referrals with **Royal Ambassador** rank

**Option 2:**
- Points: 500,000
- Downline: 25 direct referrals with **Diamond** rank

---

## 🏆 Honory Share Holder Rank Logic

### **Requirements (EITHER Option 1 OR Option 2):**

**Option 1:**
- Points: 1,000,000
- Downline: 3 direct referrals with **Global Ambassador** rank

**Option 2 (BOTH conditions required):**
- Points: 1,000,000
- Downline: 50 direct referrals with **Diamond** rank **AND** 10 direct referrals with **Royal Ambassador** rank

### **Logic:**

```javascript
async function checkHonoryShareHolderRankRequirementsOptimized(username, tx) {
  // Step 1: Check points
  if (user.points < 1000000) {
    return { qualifies: false };
  }

  // Option 1: Count Global Ambassador lines
  let globalAmbassadorLines = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Global Ambassador') {
      globalAmbassadorLines++;
    }
  }
  const option1Qualifies = globalAmbassadorLines >= 3;

  // Option 2: Count Diamond AND Royal Ambassador lines
  let diamondLines = 0;
  let royalAmbassadorLines = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      diamondLines++;
    }
    if (referral.rank?.title === 'Royal Ambassador') {
      royalAmbassadorLines++;
    }
  }
  const option2Qualifies = (diamondLines >= 50 && royalAmbassadorLines >= 10);

  // Check if EITHER option is met
  if (option1Qualifies || option2Qualifies) {
    return { qualifies: true };
  } else {
    return { qualifies: false };
  }
}
```

---

## 🎯 When Ranks Are Updated

### **Automatic Rank Updates Trigger On:**

#### **1. Package Approval**
**File:** `src/lib/packageApproval.js`

```javascript
// After package is approved and commissions are distributed
await updateUserRank(userId);
```

**Triggered when:**
- Admin approves a package request
- User's points increase from package purchase
- Downline grows from new referrals

#### **2. Commission Distribution**
**File:** `src/lib/commissionSystem.js`

```javascript
// After distributing commissions to upline
await updateUserRankInTransaction(userId, newPoints, tx);
```

**Triggered when:**
- User earns direct commission
- User earns indirect commission
- User's points increase from any source

#### **3. Order Completion (Users Without Package)**
**File:** `src/app/api/admin/orders/[id]/route.js`

```javascript
// After order is approved for user without active package
await prisma.user.update({
  data: { points: { increment: pointsToAdd } }
});
// Points increased → May trigger rank upgrade
```

**Triggered when:**
- Admin approves order for user without package
- User receives points based on order amount
- Points may meet higher rank requirements

---

## 📊 Rank Update Examples

### **Example 1: Simple Points-Based Upgrade**

```
User: Ali
Current Rank: Manager (1,000 points)
Current Points: 1,800

Action: Ali purchases a package worth 500 points
New Points: 1,800 + 500 = 2,300

Rank Check:
1. Check Honory Share Holder (1M points) → NO (2,300 < 1M)
2. Check Global Ambassador (500K points) → NO (2,300 < 500K)
3. Check Royal Ambassador (200K points) → NO (2,300 < 200K)
4. Check Sapphire Ambassador (100K points) → NO (2,300 < 100K)
5. Check Ambassador (50K points) → NO (2,300 < 50K)
6. Check Sapphire Diamond (24K points) → NO (2,300 < 24K)
7. Check Diamond (8K points) → NO (2,300 < 8K)
8. Check Sapphire Manager (2K points) → YES! (2,300 >= 2K)
   - No downline requirements for Sapphire Manager
   - ✅ QUALIFIES!

Result: Manager → Sapphire Manager ✅
```

### **Example 2: Diamond Upgrade with Downline Check**

```
User: Sara
Current Rank: Sapphire Manager (2,000 points)
Current Points: 9,500

Direct Referrals:
  - User1: 2,100 points
  - User2: 2,500 points
  - User3: 1,800 points
  - User4: 3,000 points

Rank Check:
1. Check Diamond (8K points) → YES (9,500 >= 8K)
   - Check downline requirements:
     - Need 3 lines with 2000+ points
     - Qualifying lines:
       * User1: 2,100 ✅
       * User2: 2,500 ✅
       * User3: 1,800 ❌
       * User4: 3,000 ✅
     - Total qualifying: 3 lines
     - ✅ MEETS DOWNLINE REQUIREMENT!

Result: Sapphire Manager → Diamond ✅
```

### **Example 3: Failed Upgrade (Insufficient Downline)**

```
User: Omar
Current Rank: Sapphire Manager (2,000 points)
Current Points: 10,000

Direct Referrals:
  - User1: 2,500 points
  - User2: 1,900 points
  - User3: 1,500 points
  - User4: 1,000 points

Rank Check:
1. Check Diamond (8K points) → YES (10,000 >= 8K)
   - Check downline requirements:
     - Need 3 lines with 2000+ points
     - Qualifying lines:
       * User1: 2,500 ✅
       * User2: 1,900 ❌
       * User3: 1,500 ❌
       * User4: 1,000 ❌
     - Total qualifying: 1 line
     - ❌ FAILS DOWNLINE REQUIREMENT (1 < 3)
   - Continue to lower ranks...
2. Check Sapphire Manager (2K points) → YES (10,000 >= 2K)
   - No downline requirements
   - ✅ QUALIFIES!

Result: Sapphire Manager → Sapphire Manager (No change)
Reason: Has points for Diamond but lacks downline
```

---

## 🔧 Key Functions

### **1. updateUserRank(userId)**
**File:** `src/lib/rankUtils.js`

**Purpose:** Main function to update a user's rank based on current points and downline

**Returns:** New rank name or null

**Usage:**
```javascript
import { updateUserRank } from './lib/rankUtils.js';

const newRank = await updateUserRank(userId);
console.log(`User's new rank: ${newRank}`);
```

### **2. checkNewRankRequirementsOptimized(username, rankTitle)**
**File:** `src/lib/newRankLogicOptimized.js`

**Purpose:** Check if a user meets downline requirements for a specific higher rank

**Returns:**
```javascript
{
  qualifies: true/false,
  reason: "Explanation message",
  details: { /* statistics */ }
}
```

**Usage:**
```javascript
import { checkNewRankRequirementsOptimized } from './lib/newRankLogicOptimized.js';

const result = await checkNewRankRequirementsOptimized('ahmed123', 'Diamond');

if (result.qualifies) {
  console.log(`✅ User qualifies: ${result.reason}`);
} else {
  console.log(`❌ User doesn't qualify: ${result.reason}`);
}
```

### **3. updateUserRankInTransaction(userId, currentPoints, tx)**
**File:** `src/lib/commissionSystem.js`

**Purpose:** Transaction-safe version for updating rank during commission distribution

**Returns:** New rank name

**Usage:**
```javascript
// Inside a Prisma transaction
await prisma.$transaction(async (tx) => {
  // ... other operations
  const newRank = await updateUserRankInTransaction(userId, newPoints, tx);
  console.log(`Updated to: ${newRank}`);
});
```

---

## 📈 Rank Progression Path

### **Typical User Journey:**

```
1. Consultant (0 points)
   ↓ Purchase package / earn commissions
   
2. Manager (1,000 points)
   ↓ Earn more commissions
   
3. Sapphire Manager (2,000 points)
   ↓ Build team + accumulate points
   
4. Diamond (8,000 points + 3 lines with 2000+ points)
   ↓ Grow team + help them reach Diamond
   
5. Sapphire Diamond (24,000 points + 3 Diamond lines)
   ↓ Build more Diamond lines
   
6. Ambassador (50,000 points + 6 Diamond lines)
   ↓ Develop Ambassadors OR grow Diamond team
   
7. Sapphire Ambassador (100,000 points + 3 Ambassador OR 10 Diamond lines)
   ↓ Continue building leadership
   
8. Royal Ambassador (200,000 points + 3 Sapphire Ambassador OR 15 Diamond lines)
   ↓ Expand global network
   
9. Global Ambassador (500,000 points + 3 Royal Ambassador OR 25 Diamond lines)
   ↓ Build elite team
   
10. Honory Share Holder (1,000,000 points + 3 Global Ambassador OR 50 Diamond + 10 Royal Ambassador lines)
```

---

## 🎓 Important Notes

### **1. Only Direct Referrals Count**
```
❌ WRONG: Count grandchildren, great-grandchildren, etc.
✅ CORRECT: Only count DIRECT referrals (users referred by you)

Example:
You → User1 (Diamond) ✅ COUNTS
You → User2 → User3 (Diamond) ❌ DOESN'T COUNT (User3 is grandchild)
```

### **2. Rank Checks Are Real-Time**
- Every time points change, rank is rechecked
- No manual intervention needed
- Automatic upgrades (and downgrades if points decrease)

### **3. Optimized for Performance**
- Uses `newRankLogicOptimized.js` to avoid deep recursion
- Only checks direct referrals (not entire tree)
- Fast execution within database transactions

### **4. Points Sources**
Points increase from:
- ✅ Package purchases
- ✅ Direct commissions (5%)
- ✅ Indirect commissions (2%)
- ✅ Order completion (users without package)
- ✅ Admin transfers

### **5. Rank Never Decreases Automatically**
- Current implementation only upgrades
- Rank stays same if downline requirements no longer met
- Admin can manually adjust if needed

---

## 🛠️ Testing Rank Updates

### **Test Script:**

```javascript
// scripts/test-rank-update.js
import { PrismaClient } from '@prisma/client';
import { updateUserRank } from '../src/lib/rankUtils.js';

const prisma = new PrismaClient();

async function testRankUpdate(username) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, points: true, rank: { select: { title: true } } }
  });

  console.log(`Before: ${user.rank.title} (${user.points} points)`);
  
  const newRank = await updateUserRank(user.id);
  
  console.log(`After: ${newRank}`);
}

testRankUpdate('ahmed123');
```

---

## 📝 Summary

**Rank Update System:**
1. ✅ Automatic rank updates based on points and downline
2. ✅ Two-tier system: Points-only (lower) vs Points+Downline (higher)
3. ✅ Optimized to check only direct referrals
4. ✅ Real-time updates during transactions
5. ✅ Multiple qualification options for highest ranks
6. ✅ Logged and traceable

**Files Involved:**
- `src/lib/rankUtils.js` - Main rank update logic
- `src/lib/newRankLogicOptimized.js` - Downline requirement checks
- `src/lib/commissionSystem.js` - Transaction-based updates
- `src/lib/packageApproval.js` - Package approval triggers

---

*Last Updated: October 13, 2025*
*Feature: Rank Update System*
*Status: ✅ PRODUCTION READY*

