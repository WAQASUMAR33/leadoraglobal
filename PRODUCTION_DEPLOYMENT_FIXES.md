# Production Deployment Fixes for Admin Dashboard

## Common Production Issues and Solutions

### 1. Cookie Security Issues
**Problem**: Cookies not being set in production due to security settings
**Solution**: Fix cookie configuration for production

### 2. Environment Variables
**Problem**: Missing or incorrect environment variables
**Solution**: Ensure all required env vars are set

### 3. Database Connection
**Problem**: Database not accessible in production
**Solution**: Verify database connection and migrations

### 4. HTTPS/SSL Issues
**Problem**: Secure cookies not working on HTTP
**Solution**: Proper cookie configuration for production

## Required Environment Variables

```env
# Database
DATABASE_URL="your-production-database-url"

# JWT Secret (MUST be the same across all instances)
JWT_SECRET="your-super-secure-jwt-secret-key"

# Node Environment
NODE_ENV="production"

# Optional: Domain for cookies
NEXT_PUBLIC_DOMAIN="yourdomain.com"
```

## Cookie Configuration Fixes

The main issue is likely with cookie settings. Here are the fixes needed:

1. **Domain Configuration**: Set proper domain for cookies
2. **Secure Flag**: Only use Secure flag when actually on HTTPS
3. **SameSite Policy**: Adjust for production environment
4. **Path Configuration**: Ensure cookies are accessible across routes

## Testing Production Deployment

1. Check browser developer tools → Application → Cookies
2. Verify cookies are being set with correct domain/path
3. Check Network tab for failed API requests
4. Verify JWT_SECRET is consistent across all services
5. Test admin login flow step by step

## Quick Production Fixes

1. **Clear all cookies and localStorage**
2. **Restart the production server**
3. **Verify environment variables**
4. **Check database connectivity**
5. **Test with fresh browser session**
