# Account Recovery System

## Overview

The Account Recovery System provides comprehensive functionality to recover suspended, inactive, deactivated, or banned user and admin accounts in the Ledora platform. This system includes both API endpoints and integrated functionality within the package-requests system.

## Features

- **Bulk Account Recovery**: Recover all suspended/inactive accounts at once
- **Selective Recovery**: Recover specific accounts by ID
- **Account Type Filtering**: Recover only users, only admins, or mixed accounts
- **Force Recovery**: Override safety checks for banned accounts
- **Comprehensive Logging**: Detailed audit trail of all recovery operations
- **Status Verification**: Check current account status before and after recovery

## API Endpoints

### 1. Dedicated Recovery API

**Endpoint**: `POST /api/admin/recover-accounts`

#### Request Body Options:

```json
{
  "accountType": "all|users|admins|specific",
  "specificIds": [1, 2, 3], // Optional: for specific recovery
  "forceRecovery": false // Optional: override safety checks
}
```

#### Examples:

**Recover All Accounts:**
```bash
curl -X POST http://localhost:3000/api/admin/recover-accounts \
  -H "Content-Type: application/json" \
  -d '{"accountType": "all"}'
```

**Recover Only User Accounts:**
```bash
curl -X POST http://localhost:3000/api/admin/recover-accounts \
  -H "Content-Type: application/json" \
  -d '{"accountType": "users"}'
```

**Recover Specific Accounts:**
```bash
curl -X POST http://localhost:3000/api/admin/recover-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "specific",
    "specificIds": [123, 456, 789]
  }'
```

**Force Recovery (including banned accounts):**
```bash
curl -X POST http://localhost:3000/api/admin/recover-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "all",
    "forceRecovery": true
  }'
```

### 2. Package Requests Integration

**Endpoint**: `PUT /api/package-requests/{id}`

#### Request Body:
```json
{
  "status": "pending",
  "recoverAccounts": true
}
```

This endpoint allows account recovery to be triggered as part of package request processing.

### 3. Status Check API

**Endpoint**: `GET /api/admin/recover-accounts?type=all|users|admins`

#### Examples:

**Check All Account Status:**
```bash
curl http://localhost:3000/api/admin/recover-accounts?type=all
```

**Check Only User Status:**
```bash
curl http://localhost:3000/api/admin/recover-accounts?type=users
```

## Account Status Types

### User Account Statuses:
- `active` - Normal, functioning account
- `suspended` - Temporarily suspended
- `inactive` - Inactive for extended period
- `deactivated` - Manually deactivated
- `banned` - Permanently banned (requires force recovery)

### Admin Account Statuses:
- `isActive: true` - Active admin account
- `isActive: false` - Inactive admin account

## Recovery Process

### 1. User Account Recovery
- Changes status from `suspended/inactive/deactivated/banned` to `active`
- Updates `updatedAt` timestamp
- Logs recovery operation with details
- Skips banned accounts unless `forceRecovery: true`

### 2. Admin Account Recovery
- Changes `isActive` from `false` to `true`
- Updates `updatedAt` timestamp
- Logs recovery operation with details

### 3. Safety Features
- **Banned Account Protection**: Banned accounts require explicit `forceRecovery: true`
- **Error Handling**: Individual account failures don't stop the entire process
- **Detailed Logging**: Complete audit trail of all operations
- **Validation**: Checks account existence before attempting recovery

## Response Format

### Successful Recovery Response:
```json
{
  "success": true,
  "message": "Account recovery completed. 15 accounts recovered, 2 failures.",
  "summary": {
    "totalUsersFound": 12,
    "totalAdminsFound": 5,
    "usersRecovered": 10,
    "adminsRecovered": 5,
    "totalRecovered": 15,
    "totalFailures": 2
  },
  "userResults": [
    {
      "id": 123,
      "username": "user123",
      "fullname": "John Doe",
      "previousStatus": "suspended",
      "newStatus": "active",
      "success": true,
      "recoveredAt": "2024-01-15T10:30:00Z"
    }
  ],
  "adminResults": [
    {
      "id": "admin456",
      "username": "admin456",
      "fullName": "Admin User",
      "previousStatus": "inactive",
      "newStatus": "active",
      "success": true,
      "recoveredAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Account recovery failed",
  "error": "Detailed error message"
}
```

## Testing

### Manual Testing Script
Run the provided test script to verify the recovery system:

```bash
node scripts/test-account-recovery.js
```

This script will:
1. Check current account status
2. Test the recovery API endpoints
3. Verify recovery results
4. Test package-requests integration

### Test Scenarios

1. **Normal Recovery**: Recover suspended/inactive accounts
2. **Force Recovery**: Recover banned accounts with force flag
3. **Selective Recovery**: Recover specific accounts by ID
4. **Mixed Recovery**: Recover both users and admins
5. **Error Handling**: Test with invalid IDs and edge cases

## Security Considerations

- **Admin Only**: Recovery endpoints should be protected by admin authentication
- **Audit Trail**: All recovery operations are logged with timestamps
- **Force Recovery**: Banned accounts require explicit permission
- **Validation**: Input validation prevents malicious requests
- **Error Handling**: Graceful handling of database errors

## Monitoring and Logging

### Console Logs
The system provides detailed console logging:
- Recovery process start/completion
- Individual account recovery status
- Error details for failed recoveries
- Summary statistics

### Database Logging
- `updatedAt` timestamps are updated for all recovered accounts
- Recovery operations can be tracked through database audit trails

## Usage Examples

### Emergency Account Recovery
```bash
# Recover all accounts in emergency situation
curl -X POST http://localhost:3000/api/admin/recover-accounts \
  -H "Content-Type: application/json" \
  -d '{"accountType": "all", "forceRecovery": true}'
```

### Scheduled Maintenance Recovery
```bash
# Recover only inactive users (not banned)
curl -X POST http://localhost:3000/api/admin/recover-accounts \
  -H "Content-Type: application/json" \
  -d '{"accountType": "users"}'
```

### Individual Account Recovery
```bash
# Recover specific user accounts
curl -X POST http://localhost:3000/api/admin/recover-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": "specific",
    "specificIds": [123, 456]
  }'
```

## Integration with Package Requests

The account recovery system is integrated with the package-requests API, allowing recovery to be triggered as part of package approval workflows:

```javascript
// In package request processing
const response = await fetch('/api/package-requests/123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'approved',
    recoverAccounts: true  // Trigger account recovery
  })
});
```

This integration allows for automated account recovery as part of business processes, ensuring that users with approved packages have their accounts properly activated.

## Troubleshooting

### Common Issues

1. **No Accounts Found**: Check if accounts actually exist with the specified statuses
2. **Permission Denied**: Ensure admin authentication is properly configured
3. **Database Errors**: Check database connectivity and permissions
4. **Banned Account Recovery**: Use `forceRecovery: true` for banned accounts

### Debug Steps

1. Check account status using GET endpoint
2. Verify admin authentication
3. Review console logs for detailed error messages
4. Test with individual account IDs first
5. Check database constraints and foreign key relationships

## Future Enhancements

- **Scheduled Recovery**: Automatic recovery based on time-based rules
- **Recovery Templates**: Predefined recovery scenarios
- **Email Notifications**: Notify users when accounts are recovered
- **Recovery History**: Persistent storage of recovery operations
- **Bulk Operations**: CSV import/export for large-scale operations



