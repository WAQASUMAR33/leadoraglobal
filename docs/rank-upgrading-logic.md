# 🏆 Rank Upgrading Logic in Package Request Approval API

## 📋 Overview
The rank upgrading system automatically promotes users to higher ranks based on their points and downline structure when a package request is approved.

## 🔄 Complete Flow

### 1. **Package Request Approval Trigger**
```javascript
// API Route: /api/package-requests/[id]/route.js
if (status === 'approved') {
  const approvalResult = await approvePackageRequest(packageRequestId);
}
```

### 2. **Main Approval Function** (`src/lib/packageApproval.js`)
```javascript
export async function approvePackageRequest(packageRequestId) {
  // Step 1: Load rank conditions from database
  await loadRankConditions();
  
  // Step 2: Use database transaction
  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Update user's package and rank
    await updateUserPackageAndRankInTransaction(requestId, tx);
    
    // Step 2: Calculate and distribute MLM commissions
    await calculateMLMCommissionsInTransaction(requestId, tx);
    
    // Step 3: Update package request status
    await tx.packageRequest.update({
      where: { id: requestId },
      data: { status: 'approved' }
    });
  }, { timeout: 30000 });
}
```

## 🎯 Rank Upgrading Process

### **Step 1: Points Distribution**
When a package is approved, points are distributed to ALL users in the referral tree:

```javascript
// In calculateMLMCommissionsInTransaction()
await distributePointsToTreeInTransaction(user.username, packagePoints, tx);
```

**Points Distribution Logic:**
- Package buyer gets points from their package
- **ALL users in the upline tree** get the same points
- Points are added to each user's total points

### **Step 2: Rank Calculation** (`src/lib/rankUtils.js`)
After points are distributed, ranks are updated based on total points:

```javascript
export async function updateUserRank(userId) {
  // Get user's current points
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true, rank: { select: { title: true } } }
  });

  // Calculate new rank based on points
  let newRankName = 'Consultant';
  if (user.points >= 24000) newRankName = 'Sapphire Diamond';
  else if (user.points >= 8000) newRankName = 'Diamond';
  else if (user.points >= 2000) newRankName = 'Sapphire Manager';
  else if (user.points >= 1000) newRankName = 'Manager';

  // Update user's rank if changed
  if (!user.rank || user.rank.title !== newRankName) {
    await prisma.user.update({
      where: { id: userId },
      data: { rankId: rank.id }
    });
  }
}
```

## 📊 Rank Hierarchy & Requirements

| Rank | Required Points | Description |
|------|----------------|-------------|
| **Consultant** | 0 | Default rank for new users |
| **Manager** | 1,000 | First promotion level |
| **Sapphire Manager** | 2,000 | Second promotion level |
| **Diamond** | 8,000 | Third promotion level |
| **Sapphire Diamond** | 24,000 | Highest promotion level |

## 🔄 When Ranks Are Updated

### **1. During Package Approval:**
- **Package buyer**: Gets points from their package
- **All upline users**: Get points from the package buyer's package
- **All affected users**: Have their ranks recalculated

### **2. Rank Update Triggers:**
```javascript
// After points distribution
await updateUserRank(user.id);

// After direct commission
await updateUserRank(referrer.id);

// After indirect commission
await updateUserRank(user.id);

// For all users in referral tree
await updateRanksForAllAffectedUsers(packageRequestId, tx);
```

## 🎯 Example Scenario

### **User: bushra750 (Diamond Rank)**
- **Current Points**: 871,345
- **Current Rank**: Diamond
- **Package**: Master Package (2,000 points)

### **When Package is Approved:**

1. **Points Distribution:**
   - bushra750 gets +2,000 points
   - All upline users get +2,000 points

2. **Rank Calculation:**
   - bushra750: 871,345 + 2,000 = 873,345 points
   - Still Diamond (needs 24,000 for Sapphire Diamond)

3. **Upline Rank Updates:**
   - If any upline user reaches 1,000+ points → Manager
   - If any upline user reaches 2,000+ points → Sapphire Manager
   - If any upline user reaches 8,000+ points → Diamond
   - If any upline user reaches 24,000+ points → Sapphire Diamond

## 🔧 Advanced Rank Requirements

### **Higher Ranks (Sapphire Diamond+)**
For ranks above Diamond, additional downline requirements are checked:

```javascript
// In checkRankRequirementsInTransaction()
const rankRequirements = {
  'Sapphire Diamond': { 
    requiredDirectDiamonds: 2, 
    requiredDirectSapphireManagers: 1 
  },
  'Ambassador': { 
    requiredDirectDiamonds: 3, 
    requiredDirectSapphireDiamonds: 1 
  }
};
```

### **Downline Condition Checking:**
- **Direct Trees with Rank**: User must have X direct referrals with specific rank
- **Trees with Rank**: User must have X total referrals with specific rank
- **Trees with Count of Rank**: User must have X trees with Y users of specific rank

## 🚀 Key Features

### **1. Automatic Rank Updates:**
- ✅ Ranks are updated automatically when points change
- ✅ No manual intervention required
- ✅ Real-time rank calculations

### **2. Transaction Safety:**
- ✅ All operations in database transaction
- ✅ 30-second timeout for complex calculations
- ✅ Rollback on any failure

### **3. Comprehensive Coverage:**
- ✅ Package buyer gets rank update
- ✅ All upline users get rank updates
- ✅ Commission recipients get rank updates
- ✅ Entire referral tree is processed

### **4. Performance Optimized:**
- ✅ Batch updates for multiple users
- ✅ Single database queries where possible
- ✅ Efficient tree traversal algorithms

## 📈 Benefits

1. **Fair Promotion System**: Users are promoted based on actual performance
2. **Automatic Processing**: No manual rank management needed
3. **Real-time Updates**: Ranks update immediately after package approval
4. **Comprehensive Coverage**: All affected users get rank updates
5. **Data Integrity**: Transaction-based operations ensure consistency

## 🔍 Monitoring & Logging

The system provides comprehensive logging:
- ✅ Rank change notifications
- ✅ Points distribution tracking
- ✅ Commission calculation details
- ✅ Error handling and rollback logs

This ensures full transparency and debugging capability for the rank upgrading process.
