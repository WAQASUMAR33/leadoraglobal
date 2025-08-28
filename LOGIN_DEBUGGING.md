# Login Redirection Debugging Guide

## Issue: Login page not redirecting to dashboard properly

### Current Implementation Status ✅

The login system has been properly implemented with:

1. **Enhanced Auth Utility** (`src/lib/auth.js`)
   - ✅ Comprehensive session management
   - ✅ Session expiry handling
   - ✅ User data storage

2. **Login Page** (`src/app/login/page.js`)
   - ✅ Proper imports (`useSearchParams`, `useRouter`)
   - ✅ Form validation
   - ✅ Error handling
   - ✅ Success message display
   - ✅ `window.location.href` for redirection (ensures cookies are set)
   - ✅ Demo login functionality

3. **Login API** (`src/app/api/login/route.js`)
   - ✅ JWT token generation
   - ✅ HTTP-only cookie setting
   - ✅ User data response
   - ✅ Session creation

4. **Middleware** (`src/middleware.js`)
   - ✅ Token verification
   - ✅ Route protection
   - ✅ Automatic redirects

### Debugging Steps

#### 1. Check Browser Console
Open browser developer tools and check for any JavaScript errors:
```javascript
// Check if auth utility is working
console.log('Auth state:', auth.isAuthenticated());
console.log('User data:', auth.getUser());
```

#### 2. Check Network Tab
1. Open Network tab in developer tools
2. Attempt to login
3. Check the `/api/login` request:
   - Status should be 200
   - Response should contain `user` and `token`
   - Check if cookies are being set

#### 3. Check Cookies
In browser developer tools → Application → Cookies:
- Look for `auth-token` cookie
- Should be HttpOnly and have proper domain/path

#### 4. Test Demo Login
Use the "Try Demo Login" button to test without database:
- Should set demo user data
- Should redirect to dashboard
- Should work even without real database

#### 5. Check Local Storage
In browser developer tools → Application → Local Storage:
- Should contain user data after login
- Check for `user`, `userId`, `userEmail`, etc.

### Common Issues and Solutions

#### Issue 1: Cookie Not Being Set
**Symptoms**: Login succeeds but redirects back to login
**Solution**: 
- Check if `JWT_SECRET` environment variable is set
- Verify cookie domain/path settings
- Check browser security settings

#### Issue 2: Middleware Blocking
**Symptoms**: Redirects to login even after successful login
**Solution**:
- Check middleware token verification
- Verify JWT secret matches between API and middleware
- Check cookie name matches (`auth-token`)

#### Issue 3: Database Connection
**Symptoms**: Login API returns 500 error
**Solution**:
- Check database connection
- Verify Prisma schema is migrated
- Check environment variables

#### Issue 4: Session Expiry
**Symptoms**: Login works but session expires immediately
**Solution**:
- Check session expiry settings in auth utility
- Verify timezone settings
- Check session cleanup logic

### Testing Commands

#### Test Login API Directly
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Test Middleware
```bash
curl -H "Cookie: auth-token=your-token-here" \
  http://localhost:3000/dashboard
```

### Environment Variables Required

```env
DATABASE_URL="your-database-connection-string"
JWT_SECRET="your-secret-key-change-in-production"
```

### Quick Fixes

1. **Clear Browser Data**: Clear cookies and local storage
2. **Restart Development Server**: `npm run dev`
3. **Check Database**: Ensure database is running and accessible
4. **Verify Environment**: Check all environment variables are set

### Expected Flow

1. User enters credentials
2. Form submits to `/api/login`
3. API validates credentials and returns user data + token
4. Cookie is set with token
5. User data stored in localStorage
6. Page redirects to dashboard using `window.location.href`
7. Middleware verifies token and allows access to dashboard

### If Still Not Working

1. Check browser console for errors
2. Verify all files are saved and server restarted
3. Test with demo login first
4. Check if database has valid user records
5. Verify email verification status (if required)

### Contact Support

If issues persist, provide:
- Browser console errors
- Network tab screenshots
- Environment variables (without sensitive data)
- Database connection status
