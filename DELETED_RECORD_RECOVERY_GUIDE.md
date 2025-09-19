# Deleted Record Recovery Guide

## 🚨 Emergency Recovery for Hard-Deleted Records

If you've accidentally deleted a record directly from the database, here are your recovery options:

## 📋 Immediate Recovery Options

### 1. **Database Backup Recovery** (Recommended)
If you have recent backups, this is the safest option:

```bash
# Check available backups
node scripts/database-backup-recovery.js --list

# Restore from backup (WARNING: This overwrites current database)
node scripts/database-backup-recovery.js --restore backup_2024-01-15T10-30-00-000Z.sql
```

### 2. **Binary Log Recovery** (Advanced)
If binary logging is enabled, you can recover to a specific point in time:

```bash
# Create point-in-time recovery script
node scripts/database-backup-recovery.js --point-in-time "2024-01-15 10:30:00"
```

### 3. **Manual Record Recreation**
If you know the record details, recreate it manually:

```bash
# Recreate a single user
node scripts/recreate-deleted-user.js --recreate \
  --username john_doe \
  --fullname "John Doe" \
  --email john@example.com \
  --password password123

# Recreate from template
node scripts/recreate-deleted-user.js --template premium_user

# Bulk recreate from JSON file
node scripts/recreate-deleted-user.js --bulk-recreate users.json
```

## 🔍 Diagnostic Tools

### Check Database Status
```bash
# Check for orphaned records and integrity issues
node scripts/recover-deleted-records.js --check-orphaned

# Full database integrity check
node scripts/database-backup-recovery.js --check-integrity
```

### Check Recovery Options
```bash
# Comprehensive recovery assessment
node scripts/recover-deleted-records.js
```

## 📊 Recovery Assessment

Run this command to assess your recovery options:

```bash
node scripts/recover-deleted-records.js
```

This will show you:
- Available database backups
- Binary log availability
- Current database state
- Orphaned records
- Recovery recommendations

## 🛠️ Step-by-Step Recovery Process

### Step 1: Assess the Situation
```bash
# Run diagnostic
node scripts/recover-deleted-records.js
```

### Step 2: Choose Recovery Method

#### Option A: Backup Recovery (Safest)
```bash
# List backups
node scripts/database-backup-recovery.js --list

# Restore from most recent backup
node scripts/database-backup-recovery.js --restore [backup_filename]
```

#### Option B: Manual Recreation
```bash
# Generate sample file
node scripts/recreate-deleted-user.js --generate-sample deleted_users.json

# Edit the file with your data, then recreate
node scripts/recreate-deleted-user.js --bulk-recreate deleted_users.json
```

#### Option C: Point-in-Time Recovery
```bash
# Create recovery script for specific time
node scripts/database-backup-recovery.js --point-in-time "2024-01-15 10:30:00"
```

### Step 3: Verify Recovery
```bash
# Check database integrity
node scripts/database-backup-recovery.js --check-integrity

# Check for orphaned records
node scripts/recover-deleted-records.js --check-orphaned
```

## 📝 Manual Record Recreation

### Create Sample Data File
```bash
node scripts/recreate-deleted-user.js --generate-sample my_users.json
```

### Edit the Generated File
```json
[
  {
    "fullname": "John Doe",
    "username": "john_doe",
    "password": "password123",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "status": "active",
    "balance": 100.00,
    "points": 50,
    "packageId": 1,
    "rankId": 1
  }
]
```

### Recreate Users
```bash
node scripts/recreate-deleted-user.js --bulk-recreate my_users.json
```

## 🔧 Advanced Recovery Options

### MySQL Binary Log Recovery
If binary logging is enabled, you can recover deleted records:

```bash
# 1. Find the deletion time
mysql -u username -p -e "SHOW BINARY LOGS;"

# 2. Extract changes up to deletion point
mysqlbinlog --stop-datetime="2024-01-15 10:30:00" mysql-bin.000001 | mysql -u username -p database_name

# 3. Or use the automated script
node scripts/database-backup-recovery.js --point-in-time "2024-01-15 10:30:00"
```

### Database Transaction Recovery
For InnoDB tables with transaction logs:

```sql
-- Check for uncommitted transactions
SELECT * FROM information_schema.INNODB_TRX;

-- Check transaction history
SELECT * FROM information_schema.INNODB_LOCKS;
```

## 🚨 Emergency Procedures

### Critical Data Loss
1. **Stop all database operations immediately**
2. **Check for recent backups**
3. **Contact database administrator**
4. **Consider professional data recovery services**

### Partial Data Loss
1. **Assess the scope of deletion**
2. **Check for related orphaned records**
3. **Choose appropriate recovery method**
4. **Test recovery in staging environment first**

## 📋 Prevention Measures

### 1. Enable Binary Logging
Add to MySQL configuration:
```ini
[mysqld]
log-bin=mysql-bin
binlog-format=ROW
expire_logs_days=7
```

### 2. Set Up Automated Backups
```bash
# Create daily backup
node scripts/database-backup-recovery.js --backup daily_backup_$(date +%Y%m%d)

# Schedule in crontab
0 2 * * * /path/to/script/database-backup-recovery.js --backup
```

### 3. Implement Soft Delete
Instead of hard deletes, use soft delete:
```sql
-- Add soft delete fields
ALTER TABLE users ADD COLUMN deletedAt DATETIME NULL;
ALTER TABLE users ADD COLUMN deletedBy VARCHAR(191) NULL;

-- Use soft delete instead of hard delete
UPDATE users SET deletedAt = NOW(), deletedBy = 'admin' WHERE id = ?;
```

### 4. Database Constraints
Add foreign key constraints to prevent orphaned records:
```sql
ALTER TABLE package_requests 
ADD CONSTRAINT fk_package_requests_user 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE RESTRICT;
```

## 🔍 Troubleshooting

### Common Issues

#### "No backup files found"
- Check if backup directory exists
- Verify backup creation process
- Consider manual backup creation

#### "Binary logging disabled"
- Enable binary logging in MySQL configuration
- Restart MySQL service
- Future deletions will be recoverable

#### "Username already exists"
- Use `--force` flag to override
- Choose a different username
- Check for duplicate records

#### "Foreign key constraint violations"
- Check for orphaned related records
- Recreate related records first
- Use proper deletion order

### Error Codes
- `P2025`: Record not found (already deleted)
- `P2002`: Unique constraint violation
- `P2003`: Foreign key constraint violation

## 📞 Support Contacts

### Internal Support
- Database Administrator: [Contact Info]
- System Administrator: [Contact Info]
- Development Team: [Contact Info]

### External Support
- MySQL Support: [Contact Info]
- Data Recovery Services: [Contact Info]
- Cloud Provider Support: [Contact Info]

## 📚 Additional Resources

- [MySQL Backup and Recovery Documentation](https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html)
- [Prisma Database Management](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Database Recovery Best Practices](https://example.com/recovery-best-practices)

## ⚠️ Important Notes

1. **Always test recovery procedures in a staging environment first**
2. **Backup current state before attempting recovery**
3. **Document all recovery actions for audit purposes**
4. **Consider data privacy and security implications**
5. **Notify stakeholders of any data recovery operations**

## 🎯 Quick Reference

| Situation | Command | Notes |
|-----------|---------|-------|
| Check recovery options | `node scripts/recover-deleted-records.js` | Comprehensive assessment |
| List backups | `node scripts/database-backup-recovery.js --list` | Shows available backups |
| Restore from backup | `node scripts/database-backup-recovery.js --restore [file]` | **WARNING: Overwrites database** |
| Recreate single user | `node scripts/recreate-deleted-user.js --recreate --username [name]` | Manual recreation |
| Bulk recreate | `node scripts/recreate-deleted-user.js --bulk-recreate [file]` | From JSON file |
| Check integrity | `node scripts/database-backup-recovery.js --check-integrity` | Database health check |
| Create backup | `node scripts/database-backup-recovery.js --backup` | Emergency backup |


