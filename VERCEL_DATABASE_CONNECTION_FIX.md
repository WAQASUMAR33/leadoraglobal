# Vercel Database Connection Fix

## Date: October 11, 2025

## Problem

**Login page not working on production (Vercel deployment)**

### Error Message
```
Invalid `prisma.user.findUnique()` invocation:
Can't reach database server at `148.222.53.5:3306`
```

### Testing Results
- ✅ **Local Development**: Database connection works perfectly
- ❌ **Production (Vercel)**: Cannot reach database server

### Diagnosis
This is a **Vercel environment configuration issue**, NOT a code problem.

---

## Root Causes

### **Cause 1: Missing/Incorrect Environment Variable on Vercel** ⚠️

Vercel deployment doesn't have `DATABASE_URL` set or it's incorrect.

### **Cause 2: Database Firewall Blocking Vercel IPs** 🔥

Your MySQL server at `148.222.53.5` might be blocking Vercel's IP addresses.

### **Cause 3: Connection Pool Exhaustion** 📊

Too many Prisma connections on serverless platform.

---

## Solutions

### **Solution 1: Update Vercel Environment Variables** ✅

#### **Step 1: Go to Vercel Dashboard**
```
https://vercel.com/your-username/leadoraglobal/settings/environment-variables
```

#### **Step 2: Add DATABASE_URL**

**Variable Name:**
```
DATABASE_URL
```

**Value:**
```
mysql://YOUR_USERNAME:YOUR_PASSWORD@148.222.53.5:3306/YOUR_DATABASE_NAME
```

**Example:**
```
mysql://u482922175:YourPassword123@148.222.53.5:3306/u482922175_leadoraglobal
```

**Important Settings:**
- ✅ Environment: **Production**, **Preview**, **Development** (check all)
- ✅ Apply to all deployments
- ✅ Save changes

#### **Step 3: Redeploy**
```bash
# After saving environment variables, redeploy:
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

**Or manually redeploy in Vercel Dashboard:**
```
Deployments → Three dots (•••) → Redeploy
```

---

### **Solution 2: Whitelist Vercel IP Addresses** 🔐

If your hosting provider has IP-based firewall, you need to whitelist Vercel's IPs.

#### **For cPanel/Hostinger/etc:**

**Step 1: Get Vercel IP Ranges**

Vercel uses dynamic IPs, so you need to whitelist all possible IPs:
```
https://vercel.com/guides/how-to-allowlist-deployment-ip-address
```

**Step 2: Add to MySQL Remote Access**

In your hosting control panel:
```
cPanel → Remote MySQL → Add Access Host

Add:
- 0.0.0.0/0 (allow all - not recommended for production)
Or
- Specific Vercel IP ranges
```

**Step 3: Check Firewall Rules**

Ensure port **3306** is open for external connections.

---

### **Solution 3: Use Connection Pooling** 📊

Vercel serverless functions create many connections. Fix with Prisma connection pooling:

#### **Update `prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  
  // Add connection pooling
  relationMode = "prisma"
}
```

#### **Or use PlanetScale/Connection Pooler:**

**DATABASE_URL format:**
```
mysql://user:password@148.222.53.5:3306/database?connection_limit=1
```

---

### **Solution 4: Check Database Server Status** 🔍

#### **Verify MySQL is running:**

**SSH into your server:**
```bash
ssh user@148.222.53.5
sudo systemctl status mysql
```

**If stopped, start it:**
```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### **Check if port 3306 is open:**
```bash
# From local machine:
telnet 148.222.53.5 3306

# Or use:
nc -zv 148.222.53.5 3306
```

**Expected output if working:**
```
Connection to 148.222.53.5 3306 port [tcp/mysql] succeeded!
```

---

### **Solution 5: Test from Vercel** 🧪

Create a test endpoint to verify connection from Vercel:

#### **Create `src/app/api/test-db-vercel/route.js`:**
```javascript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test connection
    await prisma.$connect();
    
    // Test query
    const count = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connected',
      userCount: count,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set',
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}
```

**Then visit:**
```
https://leadoraglobal.vercel.app/api/test-db-vercel
```

---

## Quick Checklist

### **Before Contacting Hosting Provider:**

- [ ] ✅ Verify DATABASE_URL is set in Vercel dashboard
- [ ] ✅ Environment variable is applied to Production
- [ ] ✅ Redeployed after setting environment variable
- [ ] ✅ DATABASE_URL format is correct (no typos)
- [ ] ✅ Password doesn't contain special characters that need encoding
- [ ] ✅ Database name is correct

### **Contact Hosting Provider If:**

- [ ] ✅ All environment variables are correct
- [ ] ✅ Local connection works
- [ ] ✅ Vercel deployment still fails
- [ ] ❌ May need to whitelist Vercel IPs
- [ ] ❌ May need to enable remote MySQL access

---

## Password Special Characters

If your password contains special characters, encode them:

**Special Characters to Encode:**
```
@ → %40
# → %23
$ → %24
% → %25
^ → %5E
& → %26
* → %2A
( → %28
) → %29
```

**Example:**
```
Password: MyP@ss#123
Encoded:  MyP%40ss%23123

DATABASE_URL:
mysql://user:MyP%40ss%23123@148.222.53.5:3306/database
```

---

## Vercel Logs

**Check deployment logs:**

1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Deployments"
4. Click on the latest deployment
5. Click "Functions" tab
6. Check error logs

**Look for:**
- Environment variable issues
- Connection timeout errors
- Authentication failures

---

## Testing Commands

### **Test Local Connection:**
```bash
node test-db-connection.js
```

**Expected:** ✅ Connection successful

### **Test Production Endpoint:**
```bash
curl https://leadoraglobal.vercel.app/api/test-db-vercel
```

**Expected:** 
```json
{
  "success": true,
  "message": "Database connected",
  "userCount": 2417
}
```

---

## Most Likely Solution

**99% of the time, the issue is:**

### ⚠️ **Missing DATABASE_URL in Vercel Environment Variables**

**Fix:**
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add `DATABASE_URL` with your MySQL connection string
3. Select all environments (Production, Preview, Development)
4. Save
5. Redeploy

**This should fix the issue immediately!** ✅

---

## Alternative: Use Environment Variable File

If you're deploying via CLI:

**Create `.env.production`:**
```env
DATABASE_URL="mysql://user:password@148.222.53.5:3306/database"
```

**Then link to Vercel:**
```bash
vercel env add DATABASE_URL production
# Paste your connection string when prompted
```

---

## Status Check Script

**Quick test if database is accessible:**

```javascript
// test-vercel-db.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Connected');
    const count = await prisma.user.count();
    console.log(`✅ Users: ${count}`);
    return true;
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

test();
```

---

## Summary

| Issue | Solution | Priority |
|-------|----------|----------|
| Missing DATABASE_URL in Vercel | Add to environment variables | 🔥 HIGH |
| Firewall blocking Vercel IPs | Whitelist IPs in hosting panel | 🔥 HIGH |
| Connection pool exhaustion | Add connection_limit parameter | ⚠️ MEDIUM |
| MySQL server down | Restart MySQL service | 🔥 HIGH |
| Incorrect credentials | Verify username/password | 🔥 HIGH |

---

## Contact Information

**If issue persists after trying all solutions:**

1. **Contact your hosting provider** (where 148.222.53.5 is hosted)
   - Ask them to check if MySQL is running
   - Ask them to whitelist Vercel IP addresses
   - Ask them to verify remote MySQL access is enabled

2. **Check Vercel Support**
   - https://vercel.com/support

---

**Status: READY TO FIX**

**Next Steps:**
1. ✅ Add DATABASE_URL to Vercel environment variables
2. ✅ Redeploy application
3. ✅ Test login page
4. ✅ Verify connection with test endpoint

---

*Last Updated: October 11, 2025*
*Issue: Production database connection failure*
*Platform: Vercel + MySQL*

