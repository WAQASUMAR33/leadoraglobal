const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function recoverDeletedRecords() {
  try {
    console.log('🔍 Database Recovery Assistant');
    console.log('================================\n');

    // 1. Check if we can connect to database
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // 2. Check for recent backups
    console.log('💾 Checking for database backups...');
    const backupDir = path.join(__dirname, '..', 'backups');
    if (fs.existsSync(backupDir)) {
      const backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.sql') || file.endsWith('.dump'))
        .sort()
        .reverse();
      
      if (backupFiles.length > 0) {
        console.log(`✅ Found ${backupFiles.length} backup files:`);
        backupFiles.slice(0, 5).forEach((file, index) => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          console.log(`   ${index + 1}. ${file} (${new Date(stats.mtime).toLocaleString()})`);
        });
      } else {
        console.log('❌ No backup files found in backups directory');
      }
    } else {
      console.log('❌ No backups directory found');
    }

    // 3. Check MySQL binary logs (if available)
    console.log('\n📋 Checking for MySQL binary logs...');
    try {
      const binaryLogs = await prisma.$queryRaw`
        SHOW BINARY LOGS
      `;
      if (binaryLogs && binaryLogs.length > 0) {
        console.log(`✅ Found ${binaryLogs.length} binary log files`);
        console.log('   Binary logs can be used to recover deleted records');
        console.log('   Latest log:', binaryLogs[binaryLogs.length - 1].Log_name);
      } else {
        console.log('❌ No binary logs found or binary logging disabled');
      }
    } catch (error) {
      console.log('❌ Cannot access binary logs:', error.message);
    }

    // 4. Check for transaction logs
    console.log('\n📊 Checking for transaction logs...');
    try {
      const transactionLogs = await prisma.$queryRaw`
        SELECT * FROM information_schema.INNODB_TRX
      `;
      if (transactionLogs && transactionLogs.length > 0) {
        console.log(`✅ Found ${transactionLogs.length} active transactions`);
      } else {
        console.log('ℹ️  No active transactions found');
      }
    } catch (error) {
      console.log('❌ Cannot access transaction logs:', error.message);
    }

    // 5. Provide recovery options
    console.log('\n🛠️  RECOVERY OPTIONS:');
    console.log('====================');
    
    console.log('\n1. 📦 DATABASE BACKUP RESTORE:');
    console.log('   If you have a recent backup:');
    console.log('   - Stop the application');
    console.log('   - Restore from backup: mysql -u username -p database_name < backup_file.sql');
    console.log('   - Restart the application');

    console.log('\n2. 📋 BINARY LOG RECOVERY:');
    console.log('   If binary logging is enabled:');
    console.log('   - Find the time when record was deleted');
    console.log('   - Use mysqlbinlog to extract changes');
    console.log('   - Apply changes up to the deletion point');

    console.log('\n3. 🔧 MANUAL RECREATION:');
    console.log('   If you know the record details:');
    console.log('   - Use the manual recreation script');
    console.log('   - Recreate the record with known data');

    console.log('\n4. 🚨 EMERGENCY RECOVERY:');
    console.log('   For critical data loss:');
    console.log('   - Contact database administrator');
    console.log('   - Check for point-in-time recovery options');
    console.log('   - Consider professional data recovery services');

    // 6. Check current database state
    console.log('\n📈 CURRENT DATABASE STATE:');
    console.log('==========================');
    
    const userCount = await prisma.user.count();
    const adminCount = await prisma.admin.count();
    const packageRequestCount = await prisma.packageRequest.count();
    
    console.log(`👥 Total Users: ${userCount}`);
    console.log(`👨‍💼 Total Admins: ${adminCount}`);
    console.log(`📦 Total Package Requests: ${packageRequestCount}`);

    // 7. Show recent activity
    console.log('\n⏰ RECENT ACTIVITY:');
    console.log('==================');
    
    const recentUsers = await prisma.user.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        username: true,
        fullname: true,
        updatedAt: true
      }
    });

    console.log('Recent user updates:');
    recentUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.fullname}) - ${user.updatedAt.toLocaleString()}`);
    });

    console.log('\n💡 PREVENTION TIPS:');
    console.log('===================');
    console.log('1. Enable binary logging for point-in-time recovery');
    console.log('2. Set up automated daily backups');
    console.log('3. Implement soft delete instead of hard delete');
    console.log('4. Use database transactions for critical operations');
    console.log('5. Test backup and recovery procedures regularly');

  } catch (error) {
    console.error('❌ Recovery check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to manually recreate a user record
async function recreateUserRecord(userData) {
  try {
    console.log('🔧 Manually recreating user record...');
    
    const newUser = await prisma.user.create({
      data: {
        fullname: userData.fullname,
        username: userData.username,
        email: userData.email || null,
        phoneNumber: userData.phoneNumber || null,
        password: userData.password, // Should be hashed
        emailVerified: userData.emailVerified || false,
        status: userData.status || 'active',
        balance: userData.balance || 0.00,
        points: userData.points || 0,
        packageId: userData.packageId || null,
        rankId: userData.rankId || null,
        referredBy: userData.referredBy || null,
        referralCount: userData.referralCount || 0,
        totalEarnings: userData.totalEarnings || 0.00,
        currentPackageId: userData.currentPackageId || null,
        packageExpiryDate: userData.packageExpiryDate || null
      }
    });

    console.log('✅ User record recreated successfully:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Username: ${newUser.username}`);
    console.log(`   Full Name: ${newUser.fullname}`);
    
    return newUser;
  } catch (error) {
    console.error('❌ Failed to recreate user record:', error);
    throw error;
  }
}

// Function to check for orphaned records
async function checkOrphanedRecords() {
  try {
    console.log('🔍 Checking for orphaned records...');
    
    // Check for package requests without users
    const orphanedPackageRequests = await prisma.packageRequest.findMany({
      where: {
        user: null
      },
      include: {
        package: true
      }
    });

    if (orphanedPackageRequests.length > 0) {
      console.log(`⚠️  Found ${orphanedPackageRequests.length} orphaned package requests`);
      orphanedPackageRequests.forEach(req => {
        console.log(`   - Package Request ID: ${req.id}, Package: ${req.package?.package_name}`);
      });
    } else {
      console.log('✅ No orphaned package requests found');
    }

    // Check for earnings without users
    const orphanedEarnings = await prisma.earnings.findMany({
      where: {
        user: null
      }
    });

    if (orphanedEarnings.length > 0) {
      console.log(`⚠️  Found ${orphanedEarnings.length} orphaned earnings records`);
    } else {
      console.log('✅ No orphaned earnings found');
    }

  } catch (error) {
    console.error('❌ Failed to check orphaned records:', error);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--check-orphaned')) {
    checkOrphanedRecords();
  } else if (args.includes('--recreate-user')) {
    // Example usage: node recover-deleted-records.js --recreate-user
    const userData = {
      fullname: 'Recovered User',
      username: 'recovered_user',
      email: 'recovered@example.com',
      password: '$2a$12$hashedpasswordhere', // Should be properly hashed
      status: 'active'
    };
    recreateUserRecord(userData);
  } else {
    recoverDeletedRecords();
  }
}

module.exports = {
  recoverDeletedRecords,
  recreateUserRecord,
  checkOrphanedRecords
};



