const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class DatabaseBackupRecovery {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.backupDir}`);
    }
  }

  // Create a database backup
  async createBackup(backupName = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = backupName || `backup_${timestamp}.sql`;
      const backupPath = path.join(this.backupDir, backupFileName);

      console.log('💾 Creating database backup...');
      
      // Get database connection details from environment
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable not found');
      }

      // Parse database URL
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || 3306;
      const database = url.pathname.substring(1);
      const username = url.username;
      const password = url.password;

      // Create mysqldump command
      const dumpCommand = `mysqldump -h ${host} -P ${port} -u ${username} -p${password} ${database} > "${backupPath}"`;

      return new Promise((resolve, reject) => {
        exec(dumpCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Backup failed:', error);
            reject(error);
            return;
          }

          if (stderr && !stderr.includes('Warning')) {
            console.error('❌ Backup warning:', stderr);
          }

          const stats = fs.statSync(backupPath);
          console.log(`✅ Backup created successfully: ${backupFileName}`);
          console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`   Path: ${backupPath}`);

          resolve({
            fileName: backupFileName,
            path: backupPath,
            size: stats.size,
            createdAt: new Date()
          });
        });
      });

    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw error;
    }
  }

  // Restore from backup
  async restoreFromBackup(backupFileName) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }

      console.log(`🔄 Restoring from backup: ${backupFileName}`);
      console.log('⚠️  WARNING: This will overwrite the current database!');

      // Get database connection details
      const dbUrl = process.env.DATABASE_URL;
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || 3306;
      const database = url.pathname.substring(1);
      const username = url.username;
      const password = url.password;

      // Create mysql restore command
      const restoreCommand = `mysql -h ${host} -P ${port} -u ${username} -p${password} ${database} < "${backupPath}"`;

      return new Promise((resolve, reject) => {
        exec(restoreCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Restore failed:', error);
            reject(error);
            return;
          }

          if (stderr && !stderr.includes('Warning')) {
            console.error('❌ Restore warning:', stderr);
          }

          console.log('✅ Database restored successfully');
          resolve(true);
        });
      });

    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }

  // List available backups
  async listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            fileName: file,
            size: stats.size,
            createdAt: stats.mtime,
            path: filePath
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      console.log('📋 Available Backups:');
      console.log('====================');
      
      if (files.length === 0) {
        console.log('❌ No backup files found');
        return [];
      }

      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.fileName}`);
        console.log(`   Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Created: ${file.createdAt.toLocaleString()}`);
        console.log('');
      });

      return files;
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      throw error;
    }
  }

  // Point-in-time recovery using binary logs
  async pointInTimeRecovery(targetDateTime) {
    try {
      console.log(`🕐 Attempting point-in-time recovery to: ${targetDateTime}`);
      
      // Get binary logs
      const binaryLogs = await prisma.$queryRaw`SHOW BINARY LOGS`;
      
      if (!binaryLogs || binaryLogs.length === 0) {
        throw new Error('No binary logs available for point-in-time recovery');
      }

      console.log(`📋 Found ${binaryLogs.length} binary log files`);

      // Find the appropriate binary log file
      const targetDate = new Date(targetDateTime);
      let selectedLog = binaryLogs[binaryLogs.length - 1]; // Default to latest

      // This is a simplified approach - in practice, you'd need more sophisticated logic
      console.log(`📝 Using binary log: ${selectedLog.Log_name}`);

      // Create recovery script
      const recoveryScript = `
-- Point-in-time recovery script
-- Target time: ${targetDateTime}
-- Binary log: ${selectedLog.Log_name}

-- Stop here and manually execute:
-- mysqlbinlog --stop-datetime="${targetDateTime}" ${selectedLog.Log_name} | mysql -u username -p database_name
      `;

      const scriptPath = path.join(this.backupDir, `recovery_${Date.now()}.sql`);
      fs.writeFileSync(scriptPath, recoveryScript);

      console.log(`📝 Recovery script created: ${scriptPath}`);
      console.log('⚠️  Manual intervention required for binary log recovery');

      return {
        scriptPath,
        binaryLog: selectedLog.Log_name,
        targetDateTime
      };

    } catch (error) {
      console.error('❌ Point-in-time recovery failed:', error);
      throw error;
    }
  }

  // Check database integrity
  async checkIntegrity() {
    try {
      console.log('🔍 Checking database integrity...');
      
      // Check for missing foreign key references
      const orphanedPackageRequests = await prisma.packageRequest.findMany({
        where: {
          user: null
        }
      });

      const orphanedEarnings = await prisma.earnings.findMany({
        where: {
          user: null
        }
      });

      const orphanedSessions = await prisma.session.findMany({
        where: {
          user: null
        }
      });

      console.log('📊 Integrity Check Results:');
      console.log(`   Orphaned Package Requests: ${orphanedPackageRequests.length}`);
      console.log(`   Orphaned Earnings: ${orphanedEarnings.length}`);
      console.log(`   Orphaned Sessions: ${orphanedSessions.length}`);

      if (orphanedPackageRequests.length > 0 || orphanedEarnings.length > 0 || orphanedSessions.length > 0) {
        console.log('⚠️  Database integrity issues found');
        return false;
      } else {
        console.log('✅ Database integrity check passed');
        return true;
      }

    } catch (error) {
      console.error('❌ Integrity check failed:', error);
      throw error;
    }
  }

  // Clean up old backups
  async cleanupOldBackups(keepDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);

      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return { fileName: file, path: filePath, createdAt: stats.mtime };
        })
        .filter(file => file.createdAt < cutoffDate);

      console.log(`🧹 Cleaning up ${files.length} old backup files...`);

      for (const file of files) {
        fs.unlinkSync(file.path);
        console.log(`   Deleted: ${file.fileName}`);
      }

      console.log('✅ Cleanup completed');

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const backupRecovery = new DatabaseBackupRecovery();

  try {
    if (args.includes('--backup')) {
      const backupName = args[args.indexOf('--backup') + 1];
      await backupRecovery.createBackup(backupName);
    } else if (args.includes('--restore')) {
      const backupName = args[args.indexOf('--restore') + 1];
      if (!backupName) {
        console.log('❌ Please specify backup file name');
        return;
      }
      await backupRecovery.restoreFromBackup(backupName);
    } else if (args.includes('--list')) {
      await backupRecovery.listBackups();
    } else if (args.includes('--check-integrity')) {
      await backupRecovery.checkIntegrity();
    } else if (args.includes('--cleanup')) {
      const days = parseInt(args[args.indexOf('--cleanup') + 1]) || 30;
      await backupRecovery.cleanupOldBackups(days);
    } else if (args.includes('--point-in-time')) {
      const targetDateTime = args[args.indexOf('--point-in-time') + 1];
      if (!targetDateTime) {
        console.log('❌ Please specify target date time (YYYY-MM-DD HH:MM:SS)');
        return;
      }
      await backupRecovery.pointInTimeRecovery(targetDateTime);
    } else {
      console.log('🛠️  Database Backup & Recovery Tool');
      console.log('===================================');
      console.log('');
      console.log('Usage:');
      console.log('  --backup [name]           Create a new backup');
      console.log('  --restore <filename>      Restore from backup');
      console.log('  --list                    List available backups');
      console.log('  --check-integrity         Check database integrity');
      console.log('  --cleanup [days]          Clean up old backups (default: 30 days)');
      console.log('  --point-in-time <datetime> Create point-in-time recovery script');
      console.log('');
      console.log('Examples:');
      console.log('  node database-backup-recovery.js --backup');
      console.log('  node database-backup-recovery.js --backup emergency_backup');
      console.log('  node database-backup-recovery.js --restore backup_2024-01-15T10-30-00-000Z.sql');
      console.log('  node database-backup-recovery.js --list');
      console.log('  node database-backup-recovery.js --point-in-time "2024-01-15 10:30:00"');
    }

  } catch (error) {
    console.error('❌ Operation failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseBackupRecovery;





