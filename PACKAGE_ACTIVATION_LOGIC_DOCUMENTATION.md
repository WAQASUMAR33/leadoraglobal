# 📦 Package Activation System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Package Activation Flow](#package-activation-flow)
3. [User-Side Package Purchase](#user-side-package-purchase)
4. [Admin Package Approval](#admin-package-approval)
5. [MLM Commission Distribution](#mlm-commission-distribution)
6. [Rank Update System](#rank-update-system)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Key Functions](#key-functions)
10. [Error Handling](#error-handling)

---

## Overview

The **Package Activation System** is the core of the MLM (Multi-Level Marketing) platform. When a user purchases a package, the system:

1. ✅ **Validates** the user and package
2. 💰 **Deducts payment** (from balance or external payment)
3. 📦 **Activates the package** with 1-year expiry
4. 🎁 **Distributes points** to the entire upline tree
5. 💵 **Distributes commissions** (direct and indirect)
6. 📊 **Updates ranks** for all affected users
7. 🛒 **Enables shopping** based on package benefits

---

## Package Activation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PACKAGE ACTIVATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

1. USER INITIATES PACKAGE PURCHASE
   ├── Option A: Pay from Balance → /api/user/subscribe-balance
   └── Option B: External Payment → /api/package-requests (pending)

2. PACKAGE REQUEST CREATED
   ├── Status: 'pending'
   ├── Transaction ID: BAL_xxxxx (balance) or PHOTO (external)
   └── Transaction Receipt: Balance receipt or payment proof image

3. ADMIN APPROVAL (if external payment)
   ├── Admin reviews payment proof
   ├── Admin approves/rejects request
   └── /api/admin/package-requests/[id] → PUT

4. APPROVAL TRIGGERS ACTIVATION ALGORITHM
   ├── Step 1: Update User Package & Rank
   ├── Step 2: Distribute MLM Commissions
   └── Step 3: Update Request Status to 'approved'

5. PACKAGE ACTIVATED
   ├── User gets package benefits
   ├── Package expires in 1 year
   ├── Shopping amount available (if applicable)
   └── Upline receives commissions and points
```

---

## User-Side Package Purchase

### Method 1: Pay from Balance (Auto-Approved)

**File:** `src/app/api/user/subscribe-balance/route.js`

#### Process:
```javascript
1. Check if user has sufficient balance
2. Check if user already has active package (prevent duplicates)
3. START TRANSACTION:
   a. Deduct package amount from user balance
   b. Create package request with:
      - transactionId: BAL_${timestamp}_${userId}
      - transactionReceipt: 'Paid from user balance'
      - status: 'pending'
4. Call approvePackageRequest(packageRequestId) - SAME as admin approval
5. COMMIT TRANSACTION
```

#### Key Logic:
```javascript
// Balance payment check
const userBalance = parseFloat(existingUser.balance);
const packageAmount = parseFloat(packageData.package_amount);

if (userBalance < packageAmount) {
  return NextResponse.json({ 
    error: 'Insufficient balance',
    required: packageAmount,
    available: userBalance,
    shortfall: packageAmount - userBalance
  }, { status: 400 });
}

// Check for active package
if (existingUser.currentPackageId && existingUser.currentPackage) {
  const now = new Date();
  const expiryDate = new Date(existingUser.packageExpiryDate);
  
  if (now <= expiryDate) {
    return NextResponse.json({ 
      error: 'User already has an active package',
      currentPackage: existingUser.currentPackage.package_name,
      expiryDate: existingUser.packageExpiryDate
    }, { status: 400 });
  }
}

// Transaction: Deduct balance + Create request
const result = await prisma.$transaction(async (tx) => {
  const newBalance = userBalance - packageAmount;
  
  await tx.user.update({
    where: { id: parseInt(userId) },
    data: {
      balance: newBalance,
      updatedAt: new Date()
    }
  });

  const packageRequest = await tx.packageRequest.create({
    data: {
      userId: parseInt(userId),
      packageId: parseInt(packageId),
      transactionId: `BAL_${Date.now()}_${userId}`,
      transactionReceipt: 'Paid from user balance',
      status: 'pending',
      notes: `Package subscription paid from user balance. Amount: PKR ${packageAmount}`,
      adminNotes: 'Auto-approved balance payment',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  return {
    packageRequestId: packageRequest.id,
    newBalance: newBalance
  };
});

// Approve using same algorithm as admin
await approvePackageRequest(result.packageRequestId);
```

---

### Method 2: External Payment (Requires Admin Approval)

**File:** `src/app/api/package-requests/route.js`

#### Process:
```javascript
1. User uploads payment proof image
2. Create package request with:
   - transactionId: User-provided (e.g., bank reference)
   - transactionReceipt: Base64 image of payment proof
   - status: 'pending'
3. Wait for admin approval
4. Admin reviews and approves → triggers activation
```

#### Key Logic:
```javascript
const packageRequest = await prisma.packageRequest.create({
  data: {
    userId: parseInt(userId),
    packageId: parseInt(packageId),
    transactionId,  // User-provided reference
    transactionReceipt,  // Base64 payment proof image
    notes: notes || '',
    status: 'pending'  // Waits for admin
  },
  include: {
    user: {
      select: {
        id: true,
        username: true,
        fullname: true
      }
    },
    package: {
      select: {
        id: true,
        package_name: true,
        package_amount: true
      }
    }
  }
});
```

---

## Admin Package Approval

**File:** `src/app/api/admin/package-requests/[id]/route.js`

### Approval Endpoint

```javascript
PUT /api/admin/package-requests/:id

Body: {
  status: 'approved',  // or 'rejected'
  adminNotes: 'Optional admin comments'
}
```

### Approval Logic:

```javascript
// If approved, use comprehensive approval system
if (status === 'approved') {
  try {
    const approvalResult = await approvePackageRequest(packageRequestId);
    
    // Get updated package request
    const updatedRequest = await prisma.packageRequest.findUnique({
      where: { id: packageRequestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true
          }
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Package request approved successfully with commission distribution',
        packageRequest: updatedRequest,
        approvalResult
      }),
      { status: 200 }
    );
  } catch (approvalError) {
    console.error('Package approval failed:', approvalError);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to approve package request',
        error: approvalError.message
      }),
      { status: 500 }
    );
  }
}

// For rejection, simply update status
if (status === 'rejected') {
  const updatedRequest = await prisma.packageRequest.update({
    where: { id: packageRequestId },
    data: {
      status: 'rejected',
      adminNotes: adminNotes || '',
      updatedAt: new Date()
    }
  });
  
  // Note: Balance is NOT refunded on rejection (external payment)
}
```

---

## Main Package Approval Function

**File:** `src/lib/packageApproval.js`

### Function: `approvePackageRequest(packageRequestId)`

This is the **CORE** function that handles all package activation logic.

```javascript
export async function approvePackageRequest(packageRequestId) {
  const requestId = parseInt(packageRequestId);
  console.log(`🚀 Starting package approval for request ${requestId}`);

  try {
    // Load rank conditions from database
    await loadRankConditions();

    // Get package request with all related data
    const packageRequest = await prisma.packageRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            referredBy: true,
            points: true,
            balance: true,
            currentPackageId: true,
            packageId: true,
            status: true,
            rank: { select: { title: true } }
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true,
            package_direct_commission: true,
            package_indirect_commission: true,
            package_points: true,
            status: true
          }
        }
      }
    });

    // Validations
    if (!packageRequest) {
      throw new Error('Package request not found');
    }

    if (packageRequest.status !== 'pending') {
      throw new Error(`Package request is not pending (current status: ${packageRequest.status})`);
    }

    if (packageRequest.user.status !== 'active') {
      throw new Error(`User is not active (current status: ${packageRequest.user.status})`);
    }

    if (packageRequest.package.status !== 'active') {
      throw new Error(`Package is not active (current status: ${packageRequest.package.status})`);
    }

    const { user, package: packageData } = packageRequest;
    console.log(`📦 Approving package: ${packageData.package_name} (PKR ${packageData.package_amount}) for user: ${user.username}`);

    // Check if renewal or upgrade
    if (user.currentPackageId === packageData.id) {
      console.log(`🔄 This is a package renewal for user ${user.username}`);
    } else if (user.currentPackageId && user.currentPackageId !== packageData.id) {
      console.log(`⬆️ This is a package upgrade for user ${user.username}`);
    } else {
      console.log(`🆕 This is a new package assignment for user ${user.username}`);
    }

    // Use database transaction for atomicity
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // Step 1: Update user's package and rank
        console.log(`📝 Step 1: Updating user package and rank...`);
        await updateUserPackageAndRankInTransaction(requestId, tx);
        console.log(`✅ Updated user ${user.username} with package and rank`);

        // Step 2: Calculate and distribute MLM commissions
        console.log(`💰 Step 2: Distributing MLM commissions...`);
        await calculateMLMCommissionsInTransaction(requestId, tx);
        console.log(`✅ MLM commissions distributed successfully`);

        // Step 3: Update package request status
        console.log(`📋 Step 3: Updating package request status...`);
        await tx.packageRequest.update({
          where: { id: requestId },
          data: {
            status: 'approved',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Package request status updated to approved`);

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
      }, { 
        timeout: 300000, // 5 minute timeout for complex MLM calculations
        maxWait: 30000, // 30 second max wait
        isolationLevel: 'ReadCommitted'
      });
    } catch (transactionError) {
      console.error('❌ Transaction failed, attempting fallback approach:', transactionError);
      
      // Fallback: Try without transaction (sequential operations)
      console.log(`🔄 Attempting fallback approach for user ${user.username}...`);
      
      await updateUserPackageAndRank(requestId);
      await calculateMLMCommissions(requestId);
      await prisma.packageRequest.update({
        where: { id: requestId },
        data: { status: 'approved', updatedAt: new Date() }
      });

      result = {
        success: true,
        message: 'Package approved successfully (fallback method)',
        user: user.username,
        package: packageData.package_name,
        fallback: true
      };
    }

    console.log(`🎉 Package request ${packageRequestId} approved successfully`);
    return result;

  } catch (error) {
    console.error('❌ Package approval failed:', error);
    
    // Update package request status to failed
    try {
      await prisma.packageRequest.update({
        where: { id: requestId },
        data: {
          status: 'failed',
          adminNotes: `Approval failed: ${error.message}`,
          updatedAt: new Date()
        }
      });
    } catch (updateError) {
      console.error('❌ Failed to update package request status:', updateError);
    }
    
    throw error;
  }
}
```

---

## Step 1: Update User Package & Rank

**File:** `src/lib/commissionSystem.js`

### Function: `updateUserPackageAndRankInTransaction(packageRequestId, tx)`

```javascript
export async function updateUserPackageAndRankInTransaction(packageRequestId, tx) {
  const packageRequest = await tx.packageRequest.findUnique({
    where: { id: packageRequestId },
    include: {
      user: true,
      package: {
        include: {
          rank: true
        }
      }
    }
  });

  if (!packageRequest) {
    throw new Error('Package request not found');
  }

  const { user, package: packageData } = packageRequest;
  const packageExpiryDate = new Date();
  packageExpiryDate.setFullYear(packageExpiryDate.getFullYear() + 1); // 1 year expiry

  // Check if this is a balance payment
  const isBalancePayment = packageRequest.transactionId && 
                          packageRequest.transactionId.startsWith('BAL_') && 
                          packageRequest.transactionReceipt === 'Paid from user balance';
  
  // For balance payments, shopping amount is 0 (already paid from balance)
  const effectiveShoppingAmount = isBalancePayment ? 0 : parseFloat(packageData.shopping_amount);
  
  console.log(`Package activation for user ${user.username}: ${packageData.package_name}`);
  console.log(`Payment method: ${isBalancePayment ? 'Balance Payment' : 'Regular Payment'}`);
  console.log(`Shopping amount: ${effectiveShoppingAmount} (original: ${packageData.shopping_amount})`);

  // Update user's package (allow renewals and upgrades)
  await tx.user.update({
    where: { id: user.id },
    data: {
      currentPackageId: packageData.id,
      packageExpiryDate: packageExpiryDate,
      packageId: packageData.id
    }
  });

  // Update user's rank based on current points
  const updatedUser = await tx.user.findUnique({
    where: { id: user.id },
    select: { points: true }
  });

  if (updatedUser) {
    const newRank = await updateUserRankInTransaction(user.id, updatedUser.points, tx);
    console.log(`Updated user ${user.username} with package ${packageData.package_name} and rank ${newRank}`);
  }

  return { 
    success: true, 
    isBalancePayment: isBalancePayment,
    effectiveShoppingAmount: effectiveShoppingAmount
  };
}
```

### Key Points:
1. **Package Expiry**: Set to 1 year from activation date
2. **Balance Payment Detection**: Checks if `transactionId` starts with `BAL_`
3. **Shopping Amount**: 
   - Balance payment → 0 (user already paid from balance)
   - External payment → Full shopping amount from package
4. **Package Fields Updated**:
   - `currentPackageId`: Active package ID
   - `packageExpiryDate`: 1 year from now
   - `packageId`: Package ID (for reference)

---

## Step 2: MLM Commission Distribution

**File:** `src/lib/commissionSystem.js`

### Function: `calculateMLMCommissionsInTransaction(packageRequestId, tx)`

```javascript
export async function calculateMLMCommissionsInTransaction(packageRequestId, tx) {
  // Get package request details
  const packageRequest = await tx.packageRequest.findUnique({
    where: { id: packageRequestId },
    include: {
      user: {
        include: {
          rank: true
        }
      },
      package: true
    }
  });

  const { user, package: packageData } = packageRequest;
  const packageAmount = parseFloat(packageData.package_amount);
  const directCommission = parseFloat(packageData.package_direct_commission);
  const indirectCommission = parseFloat(packageData.package_indirect_commission);
  const packagePoints = packageData.package_points || 0;

  console.log(`Processing MLM commissions for user ${user.username}, package: ${packageData.package_name}`);
  console.log(`Direct Commission: ${directCommission}, Indirect Commission: ${indirectCommission}`);

  // 1. Give points to ALL members in the tree (upward)
  await distributePointsToTreeInTransaction(user.username, packagePoints, tx);

  // 2. Give direct commission to direct referrer only
  if (user.referredBy) {
    console.log(`Giving direct commission to direct referrer: ${user.referredBy}`);
    await giveDirectCommissionInTransaction(user.referredBy, directCommission, packageRequestId, tx);
  } else {
    console.log(`No direct referrer found for ${user.username}`);
  }

  // 3. Give indirect commissions to ranks in the tree (excluding direct referrer)
  console.log(`Starting indirect commission distribution (excluding direct referrer)`);
  await distributeIndirectCommissionsInTransaction(user.username, indirectCommission, packageRequestId, tx);

  console.log('MLM commissions calculated successfully');
  return { success: true };
}
```

---

### Sub-Step 2.1: Distribute Points to Entire Upline

```javascript
async function distributePointsToTreeInTransaction(username, points, tx) {
  let currentUsername = username;
  const processedUsers = new Set();

  while (currentUsername) {
    const user = await tx.user.findUnique({
      where: { username: currentUsername }
    });

    if (!user || processedUsers.has(user.id)) {
      break; // Prevent infinite loops
    }

    // Add points to user
    await tx.user.update({
      where: { id: user.id },
      data: {
        points: {
          increment: points
        }
      }
    });

    // Update user's rank based on new points
    const updatedUser = await tx.user.findUnique({
      where: { id: user.id },
      select: { points: true }
    });

    if (updatedUser) {
      await updateUserRankInTransaction(user.id, updatedUser.points, tx);
    }

    console.log(`Added ${points} points to ${user.username} and updated rank`);
    processedUsers.add(user.id);
    currentUsername = user.referredBy;
  }
}
```

**Logic:**
- Start from the purchasing user
- Go up the referral tree (using `referredBy`)
- Give `packagePoints` to **EVERY user** in the upline
- Update each user's rank after adding points
- Stop at the root user (no `referredBy`)

**Example:**
```
User buys PKR 100,000 package (100 points)

Tree:
Touseef231 (root)
  └── Bushra750
        └── Zaman75
              └── NewUser (purchaser)

Points Added:
- NewUser: +100 points
- Zaman75: +100 points
- Bushra750: +100 points
- Touseef231: +100 points
```

---

### Sub-Step 2.2: Give Direct Commission to Direct Referrer

```javascript
async function giveDirectCommissionInTransaction(referredByUsername, directCommission, packageRequestId, tx) {
  const referrer = await tx.user.findUnique({
    where: { username: referredByUsername }
  });

  if (!referrer) {
    console.log(`Direct referrer ${referredByUsername} not found`);
    return;
  }

  // Add direct commission to referrer's balance
  await tx.user.update({
    where: { id: referrer.id },
    data: {
      balance: {
        increment: directCommission
      },
      totalEarnings: {
        increment: directCommission
      }
    }
  });

  // Update rank after balance change
  const updatedUser = await tx.user.findUnique({
    where: { id: referrer.id },
    select: { points: true }
  });

  if (updatedUser) {
    await updateUserRankInTransaction(referrer.id, updatedUser.points, tx);
  }

  // Create earnings record
  await tx.earnings.create({
    data: {
      userId: referrer.id,
      amount: directCommission,
      type: 'direct_commission',
      description: `Direct commission from package approval`,
      packageRequestId: packageRequestId
    }
  });

  console.log(`Added ${directCommission} direct commission to ${referrer.username}`);
}
```

**Logic:**
- **ONLY** the direct referrer (parent) gets direct commission
- Direct commission = Package-specific amount (e.g., PKR 10,000 for Combo)
- Added to referrer's `balance`
- Also recorded in `earnings` table for tracking
- Rank updated after commission

**Example:**
```
NewUser buys Combo Package (PKR 400,000)
Direct Commission: PKR 50,000

Direct Referrer: Zaman75
- Balance: +PKR 50,000
- TotalEarnings: +PKR 50,000
- Rank: Updated if points threshold crossed
```

---

### Sub-Step 2.3: Distribute Indirect Commission to Higher Ranks

```javascript
async function distributeIndirectCommissionsInTransaction(username, indirectCommission, packageRequestId, tx) {
  // Get all ranks from database (ordered by points)
  const ranks = await tx.rank.findMany({
    orderBy: { required_points: 'asc' }
  });

  const rankHierarchy = ranks.map(rank => rank.title);
  console.log('Rank hierarchy:', rankHierarchy);

  // Get tree members EXCLUDING direct referrer
  const treeMembers = await getTreeMembersExcludingDirectReferrerInTransaction(username, tx);
  console.log(`Found ${treeMembers.length} members in tree (excluding direct referrer)`);

  // Group members by rank
  const membersByRank = {};
  treeMembers.forEach(member => {
    const rankTitle = member.rank?.title || 'No Rank';
    if (!membersByRank[rankTitle]) {
      membersByRank[rankTitle] = [];
    }
    membersByRank[rankTitle].push(member);
  });

  // Process indirect commissions (start from highest rank, work down)
  const processedRanks = new Set();
  
  for (let i = rankHierarchy.length - 1; i >= 0; i--) {
    const currentRank = rankHierarchy[i];
    
    // Skip Consultant rank (no indirect commission)
    if (currentRank === 'Consultant') {
      continue;
    }

    if (processedRanks.has(currentRank)) {
      continue;
    }

    const membersOfRank = membersByRank[currentRank] || [];
    
    if (membersOfRank.length > 0) {
      // Give commission to the FIRST member of this rank (closest to purchaser)
      const firstMember = membersOfRank[0];
      await giveIndirectCommissionInTransaction(
        firstMember, 
        indirectCommission, 
        packageRequestId, 
        `Indirect commission from package approval (${currentRank})`,
        tx
      );
      processedRanks.add(currentRank);
      break; // Only one person gets indirect commission
    }
  }

  console.log('Indirect commission distribution complete');
}
```

**New Logic (Updated):**
1. **Direct referrer is EXCLUDED** from indirect commission
2. **Only ONE person** gets indirect commission per package
3. That person is the **first occurrence** of the highest rank in the upline tree (excluding direct referrer)
4. If no higher rank exists, commission goes to next same rank

**Example:**
```
NewUser buys Combo Package (PKR 400,000)
Indirect Commission: PKR 40,000

Tree (bottom to top):
NewUser (Consultant)
  └── Zaman75 (Sapphire Manager) ← Direct Referrer (gets ONLY direct commission)
        └── Bushra750 (Sapphire Diamond) ← Gets indirect commission
              └── Touseef231 (Royal Ambassador)

Indirect Commission Distribution:
- Zaman75: NO (direct referrer excluded)
- Bushra750: YES (Sapphire Diamond, first higher rank after direct referrer)
- Touseef231: NO (only one person gets indirect commission)

Result:
- Bushra750 gets PKR 40,000 indirect commission
```

---

## Rank Update System

**File:** `src/lib/commissionSystem.js`

### Function: `updateUserRankInTransaction(userId, currentPoints, tx)`

```javascript
async function updateUserRankInTransaction(userId, currentPoints, tx) {
  // Get user details
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

  if (!user) {
    console.log(`❌ User ${userId} not found for rank update`);
    return 'No Rank';
  }

  // Get all ranks from database ordered by required points (descending)
  const ranks = await tx.rank.findMany({
    orderBy: { required_points: 'desc' }
  });

  if (ranks.length === 0) {
    console.log(`❌ No ranks found in database`);
    return 'No Rank';
  }

  // Higher ranks require downline verification
  const HIGHER_RANKS = [
    'Diamond',              // 8000 points + 3 lines with 2000+ points
    'Sapphire Diamond',     // 3 lines with Diamond rank
    'Ambassador',           // 6 lines with Diamond rank
    'Sapphire Ambassador',  // 3 lines with Ambassador OR 10 lines with Diamond
    'Royal Ambassador',     // 3 lines with Sapphire Ambassador OR 15 lines with Diamond
    'Global Ambassador',    // 3 lines with Royal Ambassador OR 25 lines with Diamond
    'Honory Share Holder'   // 3 lines with Global Ambassador OR 50 Diamonds + 10 Royal Ambassadors
  ];

  // Find the highest rank the user qualifies for
  let newRankTitle = 'Consultant'; // Default fallback
  let newRankId = null;

  for (const rank of ranks) {
    if (currentPoints >= rank.required_points) {
      // For higher ranks, check downline requirements
      if (HIGHER_RANKS.includes(rank.title)) {
        console.log(`🔍 Checking ${rank.title} requirements for ${user.username}...`);
        const rankCheckResult = await checkNewRankRequirementsOptimized(user.username, rank.title, tx);
        
        if (rankCheckResult.qualifies) {
          newRankTitle = rank.title;
          newRankId = rank.id;
          console.log(`✅ ${user.username} qualifies for ${rank.title}: ${rankCheckResult.reason}`);
          break;
        } else {
          console.log(`❌ ${user.username} doesn't qualify for ${rank.title}: ${rankCheckResult.reason}`);
          // Continue checking lower ranks
        }
      } else {
        // For lower ranks, only points matter
        newRankTitle = rank.title;
        newRankId = rank.id;
        console.log(`✅ ${user.username} qualifies for ${rank.title} (points only)`);
        break;
      }
    }
  }

  // Update user's rank
  await tx.user.update({
    where: { id: userId },
    data: { rankId: newRankId }
  });

  console.log(`✅ Updated rank for user ${userId}: ${newRankTitle} (${currentPoints} points)`);
  return newRankTitle;
}
```

### Rank Requirements:

| Rank | Points Required | Downline Required |
|------|----------------|-------------------|
| **Consultant** | 0 | None |
| **Manager** | 1,000 | None |
| **Sapphire Manager** | 5,000 | None |
| **Diamond** | 8,000 | 3 lines with 2,000+ points each |
| **Sapphire Diamond** | ~~20,000~~ None | 3 lines with Diamond rank |
| **Ambassador** | ~~30,000~~ None | 6 lines with Diamond rank |
| **Sapphire Ambassador** | ~~40,000~~ None | 3 lines with Ambassador OR 10 lines with Diamond |
| **Royal Ambassador** | ~~50,000~~ None | 3 lines with Sapphire Ambassador OR 15 lines with Diamond |
| **Global Ambassador** | ~~60,000~~ None | 3 lines with Royal Ambassador OR 25 lines with Diamond |
| **Honory Share Holder** | ~~100,000~~ None | 3 lines with Global Ambassador OR 50 Diamonds + 10 Royal Ambassadors |

**Note:** Points criteria for ranks above Diamond have been **REMOVED**. Only downline criteria apply.

---

## Database Schema

### PackageRequest Table

```prisma
model PackageRequest {
  id                   Int       @id @default(autoincrement())
  userId               Int
  packageId            Int
  transactionId        String
  transactionReceipt   String    @db.LongText  // Base64 image or "Paid from user balance"
  status               String    @default("pending")  // pending, approved, rejected, failed
  notes                String?   @db.LongText
  adminNotes           String?   @db.LongText
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  package              Package   @relation(fields: [packageId], references: [id])
  earnings             Earnings[]
}
```

### User Table (Package-Related Fields)

```prisma
model User {
  id                   Int       @id @default(autoincrement())
  username             String    @unique
  fullname             String
  balance              Decimal   @default(0) @db.Decimal(10, 2)
  points               Int       @default(0)
  totalEarnings        Decimal   @default(0) @db.Decimal(10, 2)
  
  // Package fields
  currentPackageId     Int?
  packageId            Int?
  packageExpiryDate    DateTime?
  
  // Rank fields
  rankId               Int?
  rank                 Rank?     @relation(fields: [rankId], references: [id])
  
  // Referral fields
  referredBy           String?
  referralCount        Int       @default(0)
  
  // Relations
  currentPackage       Package?  @relation("UserCurrentPackage", fields: [currentPackageId], references: [id])
  packageRequests      PackageRequest[]
  earnings             Earnings[]
}
```

### Package Table

```prisma
model Package {
  id                              Int       @id @default(autoincrement())
  package_name                    String
  package_amount                  Decimal   @db.Decimal(10, 2)
  package_direct_commission       Decimal   @db.Decimal(10, 2)
  package_indirect_commission     Decimal   @db.Decimal(10, 2)
  package_points                  Int
  shopping_amount                 Decimal   @db.Decimal(10, 2)
  status                          String    @default("active")
  
  packageRequests                 PackageRequest[]
  usersWithCurrentPackage         User[]    @relation("UserCurrentPackage")
}
```

### Earnings Table

```prisma
model Earnings {
  id                   Int       @id @default(autoincrement())
  userId               Int
  amount               Decimal   @db.Decimal(10, 2)
  type                 String    // 'direct_commission', 'indirect_commission'
  description          String?   @db.Text
  packageRequestId     Int?
  createdAt            DateTime  @default(now())
  
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  packageRequest       PackageRequest? @relation(fields: [packageRequestId], references: [id])
}
```

---

## API Endpoints

### User-Side Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/subscribe-balance` | POST | Purchase package using user balance (auto-approved) |
| `/api/package-requests` | POST | Submit package request with external payment proof |
| `/api/package-requests?userId={id}` | GET | Get user's package requests |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/package-requests` | GET | Get all package requests (with pagination) |
| `/api/admin/package-requests/:id` | GET | Get single package request details |
| `/api/admin/package-requests/:id` | PUT | Approve/Reject package request |

---

## Key Functions Reference

### Package Approval
- **`approvePackageRequest(packageRequestId)`** - Main approval function
  - File: `src/lib/packageApproval.js`

### Package & Rank Update
- **`updateUserPackageAndRankInTransaction(packageRequestId, tx)`**
  - File: `src/lib/commissionSystem.js`
  - Updates user's package, expiry, and rank

### MLM Commission Distribution
- **`calculateMLMCommissionsInTransaction(packageRequestId, tx)`**
  - File: `src/lib/commissionSystem.js`
  - Main MLM commission calculation function

- **`distributePointsToTreeInTransaction(username, points, tx)`**
  - Gives points to entire upline tree

- **`giveDirectCommissionInTransaction(referredByUsername, directCommission, packageRequestId, tx)`**
  - Gives direct commission to direct referrer only

- **`distributeIndirectCommissionsInTransaction(username, indirectCommission, packageRequestId, tx)`**
  - Gives indirect commission to one eligible upline member

### Rank Update
- **`updateUserRankInTransaction(userId, currentPoints, tx)`**
  - File: `src/lib/commissionSystem.js`
  - Updates user rank based on points and downline

- **`checkNewRankRequirementsOptimized(username, rankTitle, tx)`**
  - File: `src/lib/newRankLogicOptimized.js`
  - Checks if user meets downline requirements for higher ranks

---

## Error Handling

### Transaction Rollback
- All package activation operations are wrapped in a **Prisma transaction**
- If any step fails, **entire transaction is rolled back**
- Fallback approach attempts sequential operations if transaction times out

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Package request not found` | Invalid `packageRequestId` | Verify request exists |
| `Package request is not pending` | Already approved/rejected | Check request status |
| `User is not active` | User account inactive | Activate user account |
| `Package is not active` | Package disabled | Activate package or choose another |
| `Insufficient balance` | User balance < package amount | Add funds to balance |
| `User already has an active package` | Package not expired | Wait for expiry or upgrade |
| `Transaction timeout` | Complex MLM calculation | Fallback approach will be used |

### Status Values

| Status | Description |
|--------|-------------|
| `pending` | Awaiting admin approval |
| `approved` | Package activated successfully |
| `rejected` | Admin rejected the request |
| `failed` | Activation failed (error occurred) |

---

## Complete Flow Example

### Example: User "NewUser99" Purchases Combo Package

**Package Details:**
- **Package:** Combo Package
- **Amount:** PKR 400,000
- **Direct Commission:** PKR 50,000
- **Indirect Commission:** PKR 40,000
- **Points:** 100
- **Shopping Amount:** PKR 500,000

**User's Upline Tree:**
```
Touseef231 (Royal Ambassador, 75,000 points)
  └── Bushra750 (Sapphire Diamond, 45,000 points)
        └── Zaman75 (Sapphire Manager, 12,700 points)
              └── NewUser99 (Consultant, 500 points) ← Purchaser
```

---

### Step-by-Step Execution:

#### 1. User Initiates Purchase
```http
POST /api/user/subscribe-balance
Body: {
  userId: 1234,
  packageId: 3  // Combo Package
}
```

#### 2. Balance Deduction
```javascript
User Balance: PKR 450,000
Package Amount: PKR 400,000
New Balance: PKR 50,000 ✅
```

#### 3. Package Request Created
```javascript
PackageRequest {
  id: 789,
  userId: 1234,
  packageId: 3,
  transactionId: "BAL_1735670400000_1234",
  transactionReceipt: "Paid from user balance",
  status: "pending"
}
```

#### 4. Approval Algorithm Triggered
```javascript
approvePackageRequest(789)
```

---

### STEP 1: Update User Package & Rank

```javascript
// Update NewUser99's package
await tx.user.update({
  where: { id: 1234 },
  data: {
    currentPackageId: 3,  // Combo Package
    packageExpiryDate: "2025-12-31T00:00:00.000Z",  // 1 year from now
    packageId: 3
  }
});

// Update NewUser99's rank
// NewUser99 points: 500 → Consultant (no change yet, points will be added next)
```

**Result:**
- ✅ NewUser99 now has Combo Package active
- ✅ Package expires: December 31, 2025
- ✅ Shopping amount: PKR 0 (balance payment)

---

### STEP 2: Distribute MLM Commissions

#### Sub-Step 2.1: Distribute Points to Entire Upline

```javascript
distributePointsToTreeInTransaction("NewUser99", 100, tx)
```

**Points Distribution:**

| User | Old Points | New Points | Old Rank | New Rank |
|------|------------|------------|----------|----------|
| **NewUser99** | 500 | **600** | Consultant | Consultant |
| **Zaman75** | 12,700 | **12,800** | Sapphire Manager | Sapphire Manager |
| **Bushra750** | 45,000 | **45,100** | Sapphire Diamond | Sapphire Diamond |
| **Touseef231** | 75,000 | **75,100** | Royal Ambassador | Royal Ambassador |

✅ All 4 users in upline tree received +100 points

---

#### Sub-Step 2.2: Give Direct Commission to Direct Referrer

```javascript
giveDirectCommissionInTransaction("Zaman75", 50000, 789, tx)
```

**Direct Commission:**

| User | Commission Type | Amount | Balance Change |
|------|----------------|--------|----------------|
| **Zaman75** | Direct Commission | PKR 50,000 | PKR 15,000 → **PKR 65,000** |

✅ Zaman75 (direct referrer) received PKR 50,000 direct commission

**Earnings Record Created:**
```javascript
Earnings {
  id: 456,
  userId: 1235,  // Zaman75
  amount: 50000,
  type: "direct_commission",
  description: "Direct commission from package approval",
  packageRequestId: 789
}
```

---

#### Sub-Step 2.3: Distribute Indirect Commission

```javascript
distributeIndirectCommissionsInTransaction("NewUser99", 40000, 789, tx)
```

**Tree Members (Excluding Direct Referrer Zaman75):**
- Bushra750 (Sapphire Diamond)
- Touseef231 (Royal Ambassador)

**Highest Rank in Eligible Members:** Royal Ambassador (Touseef231)

**Indirect Commission:**

| User | Commission Type | Amount | Balance Change |
|------|----------------|--------|----------------|
| **Touseef231** | Indirect Commission | PKR 40,000 | PKR 250,000 → **PKR 290,000** |

✅ Touseef231 (highest rank excluding direct referrer) received PKR 40,000 indirect commission

**Earnings Record Created:**
```javascript
Earnings {
  id: 457,
  userId: 1,  // Touseef231
  amount: 40000,
  type: "indirect_commission",
  description: "Indirect commission from package approval (Royal Ambassador)",
  packageRequestId: 789
}
```

---

### STEP 3: Update Package Request Status

```javascript
await tx.packageRequest.update({
  where: { id: 789 },
  data: {
    status: "approved",
    updatedAt: new Date()
  }
});
```

✅ Package request status changed: `pending` → `approved`

---

### Final Results Summary

#### NewUser99 (Purchaser)
- ✅ Package: Combo Package (PKR 400,000)
- ✅ Package Expiry: December 31, 2025
- ✅ Shopping Amount: PKR 0 (balance payment)
- ✅ Points: 500 → 600 (+100)
- ✅ Balance: PKR 450,000 → PKR 50,000 (-400,000)
- ✅ Rank: Consultant (unchanged)

#### Zaman75 (Direct Referrer, Level 1)
- ✅ Points: 12,700 → 12,800 (+100)
- ✅ Balance: PKR 15,000 → PKR 65,000 (**+PKR 50,000** direct commission)
- ✅ Total Earnings: +PKR 50,000
- ✅ Rank: Sapphire Manager (unchanged)

#### Bushra750 (Level 2)
- ✅ Points: 45,000 → 45,100 (+100)
- ✅ Balance: No change (not eligible for indirect commission)
- ✅ Rank: Sapphire Diamond (unchanged)

#### Touseef231 (Root, Level 3)
- ✅ Points: 75,000 → 75,100 (+100)
- ✅ Balance: PKR 250,000 → PKR 290,000 (**+PKR 40,000** indirect commission)
- ✅ Total Earnings: +PKR 40,000
- ✅ Rank: Royal Ambassador (unchanged)

---

### Total Distribution Summary

| Benefit | Recipient | Amount/Points |
|---------|-----------|---------------|
| **Package Cost** | NewUser99 (deducted) | -PKR 400,000 |
| **Points** | All 4 upline members | +100 each |
| **Direct Commission** | Zaman75 | +PKR 50,000 |
| **Indirect Commission** | Touseef231 | +PKR 40,000 |
| **Total Commissions Paid** | - | **PKR 90,000** |
| **Company Profit** | Platform | **PKR 310,000** |

---

## Shopping Amount Logic

### Balance Payment vs External Payment

#### If User Pays from Balance:
```javascript
isBalancePayment = true
effectiveShoppingAmount = 0  // User already "paid" from balance
```

**Reason:** User spent their balance (which they earned from commissions). They should not get additional shopping credit.

#### If User Pays via External Payment (Bank/JazzCash):
```javascript
isBalancePayment = false
effectiveShoppingAmount = packageData.shopping_amount  // Full shopping amount
```

**Reason:** User paid real money. They get the full shopping amount as a benefit.

### Example:

**Combo Package:**
- Package Amount: PKR 400,000
- Shopping Amount: PKR 500,000

**Scenario A: User pays from balance**
```javascript
User Balance: PKR 400,000 → PKR 0
Shopping Amount Available: PKR 0
```

**Scenario B: User pays via bank transfer**
```javascript
User Balance: No change
Shopping Amount Available: PKR 500,000
```

---

## Package Expiry & Renewal

### Expiry Logic
- Package expires **1 year** after activation
- After expiry, user can:
  1. Renew same package
  2. Upgrade to higher package
  3. Continue without package (limited features)

### Renewal Check
```javascript
// Check if user already has active package
if (existingUser.currentPackageId && existingUser.currentPackage) {
  const now = new Date();
  const expiryDate = new Date(existingUser.packageExpiryDate);
  
  if (now <= expiryDate) {
    return NextResponse.json({ 
      error: 'User already has an active package',
      currentPackage: existingUser.currentPackage.package_name,
      expiryDate: existingUser.packageExpiryDate
    }, { status: 400 });
  }
}

// If expired, user can purchase new package
```

### Renewal vs Upgrade Detection
```javascript
if (user.currentPackageId === packageData.id) {
  console.log(`🔄 This is a package renewal`);
} else if (user.currentPackageId && user.currentPackageId !== packageData.id) {
  console.log(`⬆️ This is a package upgrade`);
} else {
  console.log(`🆕 This is a new package assignment`);
}
```

---

## Transaction Isolation & Timeout

### Transaction Configuration
```javascript
await prisma.$transaction(async (tx) => {
  // All operations here
}, { 
  timeout: 300000,  // 5 minutes (300 seconds)
  maxWait: 30000,   // 30 seconds max wait to start
  isolationLevel: 'ReadCommitted'  // Balance between consistency and performance
});
```

### Why Long Timeout?
- Complex MLM calculations traverse entire upline tree
- Large networks (e.g., Bushra750 with 10,000+ downline) take time
- Points distribution to all upline members
- Multiple rank updates
- Commission calculations

### Fallback Mechanism
If transaction times out:
1. Try sequential operations (without transaction)
2. Log warning about fallback approach
3. Still complete all operations
4. Mark result as using fallback

---

## Testing Package Activation

### Test Script Location
`scripts/test-admin-approve-package.js`

### Manual Testing Steps

1. **Create Test User**
```sql
INSERT INTO User (username, fullname, email, password, referredBy, status)
VALUES ('testuser123', 'Test User', 'test@example.com', 'hashed_password', 'Bushra750', 'active');
```

2. **Add Balance to Test User**
```sql
UPDATE User SET balance = 500000 WHERE username = 'testuser123';
```

3. **Purchase Package via API**
```http
POST /api/user/subscribe-balance
Content-Type: application/json

{
  "userId": 1234,  // Test user ID
  "packageId": 3   // Combo package ID
}
```

4. **Verify Results**
```sql
-- Check user's package
SELECT username, currentPackageId, packageExpiryDate, balance, points
FROM User WHERE username = 'testuser123';

-- Check upline points
SELECT username, points, rankId
FROM User WHERE username IN ('Bushra750', 'Touseef231');

-- Check commissions
SELECT * FROM Earnings
WHERE packageRequestId = (
  SELECT id FROM PackageRequest
  WHERE userId = 1234
  ORDER BY createdAt DESC
  LIMIT 1
);
```

---

## Troubleshooting

### Issue: Package Approval Fails

**Symptoms:**
- Package request status shows `failed`
- Error message in `adminNotes`

**Solutions:**
1. Check user status is `active`
2. Check package status is `active`
3. Verify referral tree is valid (no circular references)
4. Check database connection timeout settings
5. Review server logs for detailed error

### Issue: Commissions Not Distributed

**Symptoms:**
- Package approved but no earnings records
- Upline balances unchanged

**Solutions:**
1. Check if `calculateMLMCommissionsInTransaction` completed
2. Verify package has `package_direct_commission` and `package_indirect_commission` set
3. Check if upline users exist and are active
4. Review `Earnings` table for commission records

### Issue: Ranks Not Updated

**Symptoms:**
- Points added but rank stays same
- Should qualify for higher rank but didn't upgrade

**Solutions:**
1. Check if downline requirements are met (for Diamond+)
2. Verify `rankUtils.js` is working correctly
3. Run manual rank update: `await updateUserRank(userId)`
4. Check if rank thresholds in database are correct

---

## Related Documentation

- [Rank Update Logic](./RANK_UPDATE_LOGIC_EXPLAINED.md)
- [Points Removed from Higher Ranks](./POINTS_REMOVED_FROM_HIGHER_RANKS.md)
- [MLM Commission System](./docs/rank-upgrading-logic.md)
- [Withdrawal System](./WITHDRAWAL_SYSTEM_UPDATE.md)
- [Order Completion Logic](./ORDER_COMPLETION_POINTS_LOGIC.md)

---

## Changelog

### 2025-01-15
- ✅ Initial package activation system created
- ✅ MLM commission distribution implemented
- ✅ Rank update system integrated
- ✅ Transaction-based approach for atomicity

### 2025-01-20
- ✅ Added balance payment support
- ✅ Shopping amount logic updated (balance vs external payment)
- ✅ Package expiry and renewal logic

### 2025-01-21
- ✅ Points criteria removed for ranks above Diamond
- ✅ Only downline requirements for Sapphire Diamond and above
- ✅ Optimized rank checking with `newRankLogicOptimized.js`

---

**Generated:** January 2025  
**Version:** 2.0  
**System:** Leadora Global MLM Platform

