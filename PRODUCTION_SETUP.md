# Production Deployment Setup Guide

## Environment Variables Required

Create a `.env.production` file with these variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database_name"

# JWT Secret (MUST be the same across all instances and very secure)
JWT_SECRET="your-super-secure-jwt-secret-key-at-least-32-characters-long"

# Node Environment
NODE_ENV="production"

# Domain Configuration (for cookies)
NEXT_PUBLIC_DOMAIN="yourdomain.com"
```

## Production Deployment Steps

### 1. Database Setup
```bash
# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 2. Build Application
```bash
# Install dependencies
npm install

# Build for production
npm run build
```

### 3. Start Production Server
```bash
# Start production server
npm start
```

## Common Production Issues & Solutions

### Issue 1: Cookies Not Being Set
**Symptoms**: Login works but redirects back to login page
**Solution**: 
- Check if `NEXT_PUBLIC_DOMAIN` is set correctly
- Verify HTTPS is properly configured
- Check browser developer tools → Application → Cookies

### Issue 2: JWT Token Issues
**Symptoms**: 401 errors on API calls
**Solution**:
- Ensure `JWT_SECRET` is the same across all instances
- Check token expiration settings
- Verify JWT_SECRET is at least 32 characters long

### Issue 3: Database Connection
**Symptoms**: 500 errors on API calls
**Solution**:
- Verify `DATABASE_URL` is correct
- Check database server is accessible
- Run `npx prisma migrate deploy` to ensure schema is up to date

### Issue 4: Admin Dashboard Not Loading
**Symptoms**: Admin dashboard shows loading or redirects to login
**Solution**:
- Clear all browser cookies and localStorage
- Check browser console for JavaScript errors
- Verify admin login API is working: `/api/admin/login`
- Check if admin user exists in database

## Testing Production Deployment

### 1. Test Admin Login
```bash
curl -X POST https://yourdomain.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### 2. Test Admin Dashboard
```bash
curl -H "Cookie: admin-token=your-token-here" \
  https://yourdomain.com/api/admin/stats
```

### 3. Check Browser Console
- Open browser developer tools
- Check for JavaScript errors
- Verify cookies are being set
- Check Network tab for failed requests

## Security Checklist

- [ ] JWT_SECRET is secure and unique
- [ ] Database credentials are secure
- [ ] HTTPS is properly configured
- [ ] Cookies are set with Secure flag in production
- [ ] Domain is correctly configured
- [ ] Admin users have strong passwords
- [ ] Database is accessible only from application server

## Monitoring

Monitor these endpoints for health:
- `/api/admin/stats` - Admin dashboard health
- `/api/admin/login` - Admin authentication
- Database connection status
- JWT token validation

## Troubleshooting Commands

```bash
# Check if database is accessible
npx prisma db pull

# Reset database (CAUTION: This will delete all data)
npx prisma migrate reset

# Check Prisma client
npx prisma generate

# View database schema
npx prisma studio
```
