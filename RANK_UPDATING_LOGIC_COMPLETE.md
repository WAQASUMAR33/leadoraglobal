# 📊 Complete Rank Updating Logic Documentation

## Overview

The rank updating system is a **two-tier system** that evaluates users for their appropriate rank based on:
1. **Points** (for lower ranks)
2. **Points + Downline Requirements** (for higher ranks)

This document explains the complete logic from start to finish.

---

## Table of Contents
1. [Rank Hierarchy](#rank-hierarchy)
2. [When Rank Updates Happen](#when-rank-updates-happen)
3. [Core Rank Update Functions](#core-rank-update-functions)
4. [Lower Ranks Logic (Points Only)](#lower-ranks-logic-points-only)
5. [Higher Ranks Logic (Downline Required)](#higher-ranks-logic-downline-required)
6. [Step-by-Step Execution Flow](#step-by-step-execution-flow)
7. [Package-Specific Rank Assignment](#package-specific-rank-assignment)
8. [Complete Examples](#complete-examples)

---

## Rank Hierarchy

### All Ranks in System

| Rank # | Rank Title | Points Required | Downline Required | Notes |
|--------|-----------|-----------------|-------------------|-------|
| 1 | **Consultant** | 0 | None | Default rank for all new users |
| 2 | **Manager** | 1,000 | None | Points only |
| 3 | **Sapphire Manager** | 5,000 | None | Points only |
| 4 | **Diamond** | 8,000 | 3 direct lines with 2,000+ points | First rank requiring downline |
| 5 | **Sapphire Diamond** | ~~20,000~~ None | 3 direct lines with Diamond rank | Points requirement removed |
| 6 | **Ambassador** | ~~30,000~~ None | 6 direct lines with Diamond rank | Points requirement removed |
| 7 | **Sapphire Ambassador** | ~~40,000~~ None | 3 Ambassadors OR 10 Diamonds | Points requirement removed |
| 8 | **Royal Ambassador** | ~~50,000~~ None | 3 Sapphire Ambassadors OR 15 Diamonds | Points requirement removed |
| 9 | **Global Ambassador** | ~~60,000~~ None | 3 Royal Ambassadors OR 25 Diamonds | Points requirement removed |
| 10 | **Honory Share Holder** | ~~100,000~~ None | 3 Global Ambassadors OR 50 Diamonds + 10 Royal Ambassadors | Points requirement removed |

---

## When Rank Updates Happen

### Automatic Triggers

```javascript
// 1. During Package Activation (if not Package ID 7 or 8)
await updateUserPackageAndRankInTransaction(packageRequestId, tx)
  └── await updateUserRankInTransaction(user.id, updatedUser.points, tx)

// 2. After Points Distribution to Upline
await distributePointsToTreeInTransaction(user.username, packagePoints, tx)
  └── For each upline member:
      └── await updateUserRankInTransaction(user.id, updatedUser.points, tx)

// 3. After Direct Commission Given
await giveDirectCommissionInTransaction(referredByUsername, directCommission, packageRequestId, tx)
  └── await updateUserRankInTransaction(referrer.id, updatedUser.points, tx)

// 4. Manual Rank Update Scripts
await updateUserRank(userId)  // Called from scripts like update-all-ranks-bottom-to-top.js
```

---

## Core Rank Update Functions

### 1. Main Function: `updateUserRank(userId)`

**Location:** `src/lib/rankUtils.js`

**Purpose:** Non-transaction version for manual updates or fallback

```javascript
export async function updateUserRank(userId) {
  // 1. Get user details (username, points, current rank)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, points: true, rank: { select: { title: true } } }
  });

  // 2. Get all ranks from database (ordered by required_points DESC)
  const ranks = await prisma.rank.findMany({
    orderBy: { required_points: 'desc' }
  });

  // 3. Loop through ranks from highest to lowest
  for (const rank of ranks) {
    if (user.points >= rank.required_points) {
      
      // 4. Check if this is a HIGHER RANK (requires downline)
      if (HIGHER_RANKS.includes(rank.title)) {
        const rankCheckResult = await checkNewRankRequirementsOptimized(user.username, rank.title);
        
        if (rankCheckResult.qualifies) {
          // User qualifies! Assign this rank
          newRankId = rank.id;
          break;
        } else {
          // User doesn't qualify, continue to next rank
          continue;
        }
      } else {
        // LOWER RANK - only points matter
        newRankId = rank.id;
        break;
      }
    }
  }

  // 5. Update user's rank in database
  await prisma.user.update({
    where: { id: userId },
    data: { rankId: newRankId }
  });
}
```

---

### 2. Transaction Version: `updateUserRankInTransaction(userId, currentPoints, tx)`

**Location:** `src/lib/commissionSystem.js`

**Purpose:** Used during package activation (within transaction)

**Same logic as above, but uses transaction `tx` instead of `prisma`**

---

## Lower Ranks Logic (Points Only)

### Ranks: Consultant, Manager, Sapphire Manager

```javascript
const LOWER_RANKS = ['Consultant', 'Manager', 'Sapphire Manager'];

// Check logic
if (user.points >= rank.required_points) {
  // User qualifies immediately
  newRankId = rank.id;
}
```

### Example 1: User with 500 Points

```javascript
User Points: 500

Check from highest to lowest:
1. Diamond (8,000 points) → ❌ 500 < 8,000
2. Sapphire Manager (5,000 points) → ❌ 500 < 5,000
3. Manager (1,000 points) → ❌ 500 < 1,000
4. Consultant (0 points) → ✅ 500 >= 0

Result: Consultant
```

### Example 2: User with 3,500 Points

```javascript
User Points: 3,500

Check from highest to lowest:
1. Diamond (8,000 points) → ❌ 3,500 < 8,000
2. Sapphire Manager (5,000 points) → ❌ 3,500 < 5,000
3. Manager (1,000 points) → ✅ 3,500 >= 1,000

Result: Manager
```

### Example 3: User with 7,200 Points

```javascript
User Points: 7,200

Check from highest to lowest:
1. Diamond (8,000 points) → ❌ 7,200 < 8,000
2. Sapphire Manager (5,000 points) → ✅ 7,200 >= 5,000

Result: Sapphire Manager
```

---

## Higher Ranks Logic (Downline Required)

### Ranks: Diamond, Sapphire Diamond, Ambassador, Sapphire Ambassador, Royal Ambassador, Global Ambassador, Honory Share Holder

```javascript
const HIGHER_RANKS = [
  'Diamond',
  'Sapphire Diamond',
  'Ambassador',
  'Sapphire Ambassador',
  'Royal Ambassador',
  'Global Ambassador',
  'Honory Share Holder'
];

// Check logic
if (user.points >= rank.required_points) {
  if (HIGHER_RANKS.includes(rank.title)) {
    // Must also check downline requirements
    const rankCheckResult = await checkNewRankRequirementsOptimized(user.username, rank.title);
    
    if (rankCheckResult.qualifies) {
      // User qualifies!
      newRankId = rank.id;
    } else {
      // User doesn't qualify, continue checking lower ranks
      continue;
    }
  }
}
```

---

## Downline Requirements by Rank

### Diamond (Rank ID 4)

**File:** `src/lib/newRankLogicOptimized.js` → `checkDiamondRankRequirementsOptimized()`

**Requirements:**
- ✅ **8,000 points**
- ✅ **3 direct lines** where each line has **2,000+ points**

```javascript
async function checkDiamondRankRequirementsOptimized(username, tx) {
  const user = await tx.user.findUnique({ where: { username } });
  
  // Check 1: Points
  if (user.points < 8000) {
    return { qualifies: false, reason: 'Insufficient points: ${user.points}/8000' };
  }

  // Check 2: Direct referrals with 2000+ points
  const directReferrals = await getDirectReferralsWithRanks(username, tx);
  let qualifyingLines = 0;
  
  for (const referral of directReferrals) {
    if (referral.points >= 2000) {
      qualifyingLines++;
    }
  }

  if (qualifyingLines >= 3) {
    return { qualifies: true, reason: 'Met points and 3 direct lines with 2000+ points' };
  } else {
    return { qualifies: false, reason: 'Insufficient qualifying lines: ${qualifyingLines}/3' };
  }
}
```

**Example:**
```javascript
User: Zaman75
Points: 12,800 ✅ (>= 8,000)

Direct Referrals:
1. Shabana75 (9,400 points) ✅
2. NewUser1 (1,500 points) ❌
3. NewUser2 (2,300 points) ✅
4. NewUser3 (2,100 points) ✅

Qualifying Lines: 3 (Shabana75, NewUser2, NewUser3)
Required Lines: 3

Result: ✅ Qualifies for Diamond
```

---

### Sapphire Diamond (Rank ID 5)

**File:** `src/lib/newRankLogicOptimized.js` → `checkSapphireDiamondRankRequirementsOptimized()`

**Requirements:**
- ✅ ~~20,000 points~~ **REMOVED**
- ✅ **3 direct lines** with **Diamond rank**

```javascript
async function checkSapphireDiamondRankRequirementsOptimized(username, tx) {
  const user = await tx.user.findUnique({ where: { username } });
  
  // Note: No points check anymore
  
  // Check: Direct referrals with Diamond rank
  const directReferrals = await getDirectReferralsWithRanks(username, tx);
  let qualifyingLines = 0;
  
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      qualifyingLines++;
    }
  }

  if (qualifyingLines >= 3) {
    return { qualifies: true, reason: 'Met downline requirement: 3 direct lines with Diamond rank' };
  } else {
    return { qualifies: false, reason: 'Insufficient qualifying lines: ${qualifyingLines}/3' };
  }
}
```

**Example:**
```javascript
User: Bushra750
Points: 45,100 (not checked anymore)

Direct Referrals:
1. Rashna750 (Diamond) ✅
2. SohailM892 (Diamond) ✅
3. AliRaza4767 (Diamond) ✅
4. Zaman75 (Sapphire Manager) ❌
5. Bushra123 (Sapphire Manager) ❌

Qualifying Lines (Diamonds): 3
Required Lines: 3

Result: ✅ Qualifies for Sapphire Diamond
```

---

### Ambassador (Rank ID 6)

**Requirements:**
- ✅ ~~30,000 points~~ **REMOVED**
- ✅ **6 direct lines** with **Diamond rank**

```javascript
async function checkAmbassadorRankRequirementsOptimized(username, tx) {
  const directReferrals = await getDirectReferralsWithRanks(username, tx);
  let qualifyingLines = 0;
  
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      qualifyingLines++;
    }
  }

  if (qualifyingLines >= 6) {
    return { qualifies: true, reason: '6 direct lines with Diamond rank' };
  } else {
    return { qualifies: false, reason: 'Insufficient: ${qualifyingLines}/6 Diamonds' };
  }
}
```

---

### Sapphire Ambassador (Rank ID 7)

**Requirements (2 options):**
- ✅ ~~40,000 points~~ **REMOVED**
- ✅ **Option 1:** 3 direct lines with **Ambassador rank**
- ✅ **Option 2:** 10 direct lines with **Diamond rank**

```javascript
async function checkSapphireAmbassadorRankRequirementsOptimized(username, tx) {
  const directReferrals = await getDirectReferralsWithRanks(username, tx);
  
  // Option 1: 3 Ambassadors
  let ambassadorCount = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Ambassador') {
      ambassadorCount++;
    }
  }
  
  if (ambassadorCount >= 3) {
    return { qualifies: true, reason: '3 direct Ambassadors' };
  }

  // Option 2: 10 Diamonds
  let diamondCount = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      diamondCount++;
    }
  }
  
  if (diamondCount >= 10) {
    return { qualifies: true, reason: '10 direct Diamonds' };
  }

  return { qualifies: false, reason: 'Need 3 Ambassadors OR 10 Diamonds' };
}
```

---

### Royal Ambassador (Rank ID 8)

**Requirements (2 options):**
- ✅ ~~50,000 points~~ **REMOVED**
- ✅ **Option 1:** 3 direct lines with **Sapphire Ambassador rank**
- ✅ **Option 2:** 15 direct lines with **Diamond rank**

---

### Global Ambassador (Rank ID 9)

**Requirements (2 options):**
- ✅ ~~60,000 points~~ **REMOVED**
- ✅ **Option 1:** 3 direct lines with **Royal Ambassador rank**
- ✅ **Option 2:** 25 direct lines with **Diamond rank**

---

### Honory Share Holder (Rank ID 10)

**Requirements (2 options):**
- ✅ ~~100,000 points~~ **REMOVED**
- ✅ **Option 1:** 3 direct lines with **Global Ambassador rank**
- ✅ **Option 2:** 50 direct lines with **Diamond rank** + 10 direct lines with **Royal Ambassador rank**

---

## Step-by-Step Execution Flow

### Scenario: User "TestUser" Receives 500 Points from Package

#### Initial State
```
TestUser
- Points: 3,200
- Rank: Manager (Rank ID 2)
- Direct Referrals: 
  1. Child1 (1,800 points, Consultant)
  2. Child2 (2,500 points, Manager)
  3. Child3 (3,100 points, Manager)
```

#### Step 1: Points Added
```javascript
// During package activation, points are distributed
await distributePointsToTreeInTransaction("TestUser", 500, tx)

// Points updated
TestUser.points = 3,200 + 500 = 3,700
```

#### Step 2: Rank Update Triggered
```javascript
await updateUserRankInTransaction(TestUser.id, 3700, tx)
```

#### Step 3: Get All Ranks
```javascript
const ranks = await tx.rank.findMany({
  orderBy: { required_points: 'desc' }
});

// Ranks (descending order):
// [Diamond (8000), Sapphire Manager (5000), Manager (1000), Consultant (0)]
```

#### Step 4: Check Each Rank
```javascript
// Loop from highest to lowest

// 1. Diamond (8,000 points)
if (3700 >= 8000) → ❌ FALSE
// Continue to next rank

// 2. Sapphire Manager (5,000 points)
if (3700 >= 5000) → ❌ FALSE
// Continue to next rank

// 3. Manager (1,000 points)
if (3700 >= 1000) → ✅ TRUE
// Manager is NOT a higher rank, so only points matter
newRankId = 2 (Manager)
// BREAK - Stop checking
```

#### Step 5: Update Database
```javascript
await tx.user.update({
  where: { id: TestUser.id },
  data: { rankId: 2 }  // Manager
});

console.log(`✅ Updated rank for TestUser: Manager (3700 points, requires 1000 points)`);
```

#### Final State
```
TestUser
- Points: 3,700
- Rank: Manager (Rank ID 2) ← UNCHANGED (already Manager)
```

---

## Package-Specific Rank Assignment

### Special Logic for Package ID 7 and 8

**Location:** `src/lib/commissionSystem.js` → `updateUserPackageAndRankInTransaction()`

#### Package ID 7 → Sapphire Manager (Rank ID 3)
```javascript
if (packageData.id === 7) {
  // SKIP normal rank calculation
  // Assign Sapphire Manager directly
  await tx.user.update({
    where: { id: user.id },
    data: { rankId: 3 }  // Sapphire Manager
  });
  
  console.log(`✅ Assigned Sapphire Manager rank (Package ID 7)`);
  
  // Then continue with normal MLM operations:
  // - Points distribution to upline
  // - Direct commission to direct referrer
  // - Indirect commission distribution
}
```

#### Package ID 8 → Diamond (Rank ID 4)
```javascript
else if (packageData.id === 8) {
  // SKIP normal rank calculation
  // Assign Diamond directly
  await tx.user.update({
    where: { id: user.id },
    data: { rankId: 4 }  // Diamond
  });
  
  console.log(`✅ Assigned Diamond rank (Package ID 8)`);
  
  // Then continue with normal MLM operations
}
```

#### Other Packages → Normal Logic
```javascript
else {
  // Use normal rank update logic
  const updatedUser = await tx.user.findUnique({
    where: { id: user.id },
    select: { points: true }
  });

  if (updatedUser) {
    const newRank = await updateUserRankInTransaction(user.id, updatedUser.points, tx);
  }
}
```

---

## Complete Examples

### Example 1: User Qualifies for Diamond

#### Initial State
```
User: Zaman75
Points: 7,500
Rank: Sapphire Manager
Direct Referrals:
  1. Shabana75 (9,000 points)
  2. NewUser1 (2,300 points)
  3. NewUser2 (2,100 points)
  4. NewUser3 (1,500 points)
```

#### Event: Zaman75 receives +500 points from downline package

#### Step 1: Points Updated
```
Zaman75.points = 7,500 + 500 = 8,000
```

#### Step 2: Rank Update Triggered
```javascript
await updateUserRankInTransaction(Zaman75.id, 8000, tx)
```

#### Step 3: Check Ranks

**Check Diamond (8,000 points required):**
```javascript
// Points check
if (8000 >= 8000) → ✅ TRUE

// Diamond is a HIGHER RANK, check downline
await checkDiamondRankRequirementsOptimized("Zaman75", tx)

// Check points (already passed)
// Check direct referrals with 2000+ points:
// - Shabana75: 9,000 ✅
// - NewUser1: 2,300 ✅
// - NewUser2: 2,100 ✅
// - NewUser3: 1,500 ❌

qualifyingLines = 3
requiredLines = 3

Result: { qualifies: true, reason: 'Met points and 3 direct lines with 2000+ points' }
```

#### Step 4: Assign Diamond Rank
```javascript
await tx.user.update({
  where: { id: Zaman75.id },
  data: { rankId: 4 }  // Diamond
});

console.log(`✅ Updated rank for Zaman75: Sapphire Manager → Diamond`);
```

#### Final State
```
User: Zaman75
Points: 8,000
Rank: Diamond ✨ UPGRADED!
Direct Referrals:
  1. Shabana75 (9,000 points)
  2. NewUser1 (2,300 points)
  3. NewUser2 (2,100 points)
  4. NewUser3 (1,500 points)
```

---

### Example 2: User Doesn't Qualify for Diamond

#### Initial State
```
User: TestUser2
Points: 8,500
Rank: Sapphire Manager
Direct Referrals:
  1. Child1 (2,500 points)
  2. Child2 (1,800 points)
  3. Child3 (1,200 points)
```

#### Event: TestUser2 receives +500 points

#### Step 1: Points Updated
```
TestUser2.points = 8,500 + 500 = 9,000
```

#### Step 2: Check Diamond
```javascript
// Points check
if (9000 >= 8000) → ✅ TRUE

// Check downline
await checkDiamondRankRequirementsOptimized("TestUser2", tx)

// Check direct referrals with 2000+ points:
// - Child1: 2,500 ✅
// - Child2: 1,800 ❌
// - Child3: 1,200 ❌

qualifyingLines = 1
requiredLines = 3

Result: { qualifies: false, reason: 'Insufficient qualifying lines: 1/3' }
```

#### Step 3: Continue to Next Rank (Sapphire Manager)
```javascript
// Check Sapphire Manager (5,000 points required)
if (9000 >= 5000) → ✅ TRUE

// Sapphire Manager is NOT a higher rank, so only points matter
newRankId = 3 (Sapphire Manager)
```

#### Final State
```
User: TestUser2
Points: 9,000
Rank: Sapphire Manager ← UNCHANGED (needs 3 lines with 2000+ points for Diamond)
```

---

### Example 3: User Qualifies for Sapphire Diamond

#### Initial State
```
User: Bushra750
Points: 45,100
Rank: Sapphire Manager
Direct Referrals:
  1. Rashna750 (Diamond)
  2. SohailM892 (Diamond)
  3. AliRaza4767 (Sapphire Manager)
  4. Zaman75 (Sapphire Manager)
```

#### Event: AliRaza4767 upgrades to Diamond rank

#### Step 1: Rank Update Triggered for Bushra750
```javascript
await updateUserRank(Bushra750.id)
```

#### Step 2: Check Sapphire Diamond
```javascript
// Note: No points check for Sapphire Diamond anymore

// Check downline
await checkSapphireDiamondRankRequirementsOptimized("Bushra750", tx)

// Count direct referrals with Diamond rank:
// - Rashna750: Diamond ✅
// - SohailM892: Diamond ✅
// - AliRaza4767: Diamond ✅ (just upgraded!)
// - Zaman75: Sapphire Manager ❌

qualifyingLines = 3
requiredLines = 3

Result: { qualifies: true, reason: 'Met downline requirement: 3 direct lines with Diamond rank' }
```

#### Step 3: Assign Sapphire Diamond Rank
```javascript
await prisma.user.update({
  where: { id: Bushra750.id },
  data: { rankId: 5 }  // Sapphire Diamond
});

console.log(`✅ Updated rank for Bushra750: Sapphire Manager → Sapphire Diamond`);
```

#### Final State
```
User: Bushra750
Points: 45,100
Rank: Sapphire Diamond ✨ UPGRADED!
Direct Referrals:
  1. Rashna750 (Diamond)
  2. SohailM892 (Diamond)
  3. AliRaza4767 (Diamond) ← Newly upgraded
  4. Zaman75 (Sapphire Manager)
```

---

## Key Takeaways

### 1. Two-Tier System
```
Lower Ranks (Consultant, Manager, Sapphire Manager):
- ✅ Points only

Higher Ranks (Diamond and above):
- ✅ Points (only for Diamond)
- ✅ Downline requirements (all higher ranks)
```

### 2. Top-Down Checking
```
Algorithm checks from HIGHEST rank to LOWEST
- Ensures user gets the highest rank they qualify for
- Stops at first qualifying rank
```

### 3. Package-Specific Overrides
```
Package ID 7 → Sapphire Manager (instant)
Package ID 8 → Diamond (instant)
All others → Normal calculation
```

### 4. Points Removed for Higher Ranks
```
Sapphire Diamond and above:
- No points requirement anymore
- Only downline requirements matter
```

### 5. Multiple Triggers
```
Rank updates happen:
1. During package activation
2. After points distribution
3. After commission distribution
4. Manual update scripts
```

---

## Related Files

### Core Logic Files
- `src/lib/rankUtils.js` - Main rank update function
- `src/lib/commissionSystem.js` - Transaction-based rank update
- `src/lib/newRankLogicOptimized.js` - Downline requirement checks

### Documentation Files
- `RANK_UPDATE_LOGIC_EXPLAINED.md` - General explanation
- `POINTS_REMOVED_FROM_HIGHER_RANKS.md` - Points removal details
- `PACKAGE_SPECIFIC_RANK_ASSIGNMENT.md` - Package ID 7/8 logic
- `PACKAGE_ACTIVATION_LOGIC_DOCUMENTATION.md` - Complete package system

---

**Generated:** January 2025  
**Version:** 2.0  
**System:** Leadora Global MLM Platform

