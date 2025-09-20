const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

class UserRecreationTool {
  constructor() {
    this.requiredFields = ['fullname', 'username', 'password'];
    this.optionalFields = [
      'email', 'phoneNumber', 'emailVerified', 'status', 'balance', 
      'points', 'packageId', 'rankId', 'referredBy', 'referralCount', 
      'totalEarnings', 'currentPackageId', 'packageExpiryDate'
    ];
  }

  // Validate user data
  validateUserData(userData) {
    const errors = [];
    
    // Check required fields
    for (const field of this.requiredFields) {
      if (!userData[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate username uniqueness
    if (userData.username) {
      // This will be checked in the database, but we can validate format
      if (userData.username.length < 3) {
        errors.push('Username must be at least 3 characters long');
      }
    }

    // Validate email format if provided
    if (userData.email && !this.isValidEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    return errors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  // Check if username already exists
  async checkUsernameExists(username) {
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    return !!existingUser;
  }

  // Check if email already exists
  async checkEmailExists(email) {
    if (!email) return false;
    
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    });
    return !!existingUser;
  }

  // Recreate a user record
  async recreateUser(userData, options = {}) {
    try {
      console.log('🔧 Recreating user record...');
      console.log(`   Username: ${userData.username}`);
      console.log(`   Full Name: ${userData.fullname}`);

      // Validate input data
      const validationErrors = this.validateUserData(userData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Check for existing users
      const usernameExists = await this.checkUsernameExists(userData.username);
      if (usernameExists && !options.force) {
        throw new Error(`Username '${userData.username}' already exists. Use --force to override.`);
      }

      const emailExists = await this.checkEmailExists(userData.email);
      if (emailExists && !options.force) {
        throw new Error(`Email '${userData.email}' already exists. Use --force to override.`);
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Prepare user data
      const userCreateData = {
        fullname: userData.fullname,
        username: userData.username.toLowerCase(),
        password: hashedPassword,
        email: userData.email?.toLowerCase() || null,
        phoneNumber: userData.phoneNumber || null,
        emailVerified: userData.emailVerified || false,
        emailVerificationToken: userData.emailVerificationToken || null,
        status: userData.status || 'active',
        balance: parseFloat(userData.balance) || 0.00,
        points: parseInt(userData.points) || 0,
        packageId: userData.packageId ? parseInt(userData.packageId) : null,
        rankId: userData.rankId ? parseInt(userData.rankId) : null,
        referredBy: userData.referredBy || null,
        referralCount: parseInt(userData.referralCount) || 0,
        totalEarnings: parseFloat(userData.totalEarnings) || 0.00,
        currentPackageId: userData.currentPackageId ? parseInt(userData.currentPackageId) : null,
        packageExpiryDate: userData.packageExpiryDate ? new Date(userData.packageExpiryDate) : null
      };

      // Create the user
      const newUser = await prisma.user.create({
        data: userCreateData,
        include: {
          package: true,
          rank: true,
          currentPackage: true
        }
      });

      console.log('✅ User record recreated successfully!');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Username: ${newUser.username}`);
      console.log(`   Full Name: ${newUser.fullname}`);
      console.log(`   Email: ${newUser.email || 'Not provided'}`);
      console.log(`   Status: ${newUser.status}`);
      console.log(`   Balance: $${newUser.balance}`);
      console.log(`   Package: ${newUser.package?.package_name || 'None'}`);
      console.log(`   Rank: ${newUser.rank?.title || 'None'}`);

      return newUser;

    } catch (error) {
      console.error('❌ Failed to recreate user:', error.message);
      throw error;
    }
  }

  // Recreate user from template
  async recreateFromTemplate(templateName, customData = {}) {
    const templates = {
      'basic_user': {
        fullname: 'Basic User',
        username: 'basic_user',
        password: 'password123',
        email: 'basic@example.com',
        status: 'active',
        balance: 0.00,
        points: 0
      },
      'premium_user': {
        fullname: 'Premium User',
        username: 'premium_user',
        password: 'password123',
        email: 'premium@example.com',
        status: 'active',
        balance: 1000.00,
        points: 100,
        packageId: 1,
        rankId: 1
      },
      'admin_user': {
        fullname: 'Admin User',
        username: 'admin_user',
        password: 'admin123',
        email: 'admin@example.com',
        status: 'active',
        balance: 5000.00,
        points: 500,
        packageId: 2,
        rankId: 2
      }
    };

    if (!templates[templateName]) {
      throw new Error(`Template '${templateName}' not found. Available templates: ${Object.keys(templates).join(', ')}`);
    }

    const templateData = { ...templates[templateName], ...customData };
    return await this.recreateUser(templateData);
  }

  // Bulk recreate users from JSON file
  async bulkRecreateFromFile(filePath) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const usersData = JSON.parse(fileContent);

      if (!Array.isArray(usersData)) {
        throw new Error('File must contain an array of user objects');
      }

      console.log(`📁 Processing ${usersData.length} users from file...`);

      const results = {
        successful: [],
        failed: []
      };

      for (let i = 0; i < usersData.length; i++) {
        const userData = usersData[i];
        console.log(`\n[${i + 1}/${usersData.length}] Processing: ${userData.username || 'Unknown'}`);

        try {
          const newUser = await this.recreateUser(userData, { force: true });
          results.successful.push({
            index: i,
            username: newUser.username,
            id: newUser.id
          });
        } catch (error) {
          results.failed.push({
            index: i,
            username: userData.username || 'Unknown',
            error: error.message
          });
        }
      }

      console.log('\n📊 Bulk Recreation Results:');
      console.log(`   Successful: ${results.successful.length}`);
      console.log(`   Failed: ${results.failed.length}`);

      if (results.failed.length > 0) {
        console.log('\n❌ Failed Recreations:');
        results.failed.forEach(failure => {
          console.log(`   - ${failure.username}: ${failure.error}`);
        });
      }

      return results;

    } catch (error) {
      console.error('❌ Bulk recreation failed:', error.message);
      throw error;
    }
  }

  // Generate sample data file
  generateSampleFile(filePath) {
    const fs = require('fs');
    const path = require('path');

    const sampleUsers = [
      {
        fullname: 'John Doe',
        username: 'john_doe',
        password: 'password123',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        status: 'active',
        balance: 100.00,
        points: 50
      },
      {
        fullname: 'Jane Smith',
        username: 'jane_smith',
        password: 'password123',
        email: 'jane@example.com',
        phoneNumber: '+1234567891',
        status: 'active',
        balance: 250.00,
        points: 100,
        packageId: 1,
        rankId: 1
      }
    ];

    const sampleContent = JSON.stringify(sampleUsers, null, 2);
    fs.writeFileSync(filePath, sampleContent);

    console.log(`📝 Sample file created: ${filePath}`);
    console.log('   Edit this file with your user data and use --bulk-recreate to process it');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const recreationTool = new UserRecreationTool();

  try {
    if (args.includes('--recreate')) {
      // Interactive recreation
      const userData = {
        fullname: args[args.indexOf('--fullname') + 1] || 'Recovered User',
        username: args[args.indexOf('--username') + 1] || 'recovered_user',
        password: args[args.indexOf('--password') + 1] || 'password123',
        email: args[args.indexOf('--email') + 1] || null,
        phoneNumber: args[args.indexOf('--phone') + 1] || null,
        status: args[args.indexOf('--status') + 1] || 'active',
        balance: args[args.indexOf('--balance') + 1] || 0.00,
        points: args[args.indexOf('--points') + 1] || 0
      };

      const options = {
        force: args.includes('--force')
      };

      await recreationTool.recreateUser(userData, options);

    } else if (args.includes('--template')) {
      const templateName = args[args.indexOf('--template') + 1];
      if (!templateName) {
        console.log('❌ Please specify template name');
        return;
      }

      await recreationTool.recreateFromTemplate(templateName);

    } else if (args.includes('--bulk-recreate')) {
      const filePath = args[args.indexOf('--bulk-recreate') + 1];
      if (!filePath) {
        console.log('❌ Please specify file path');
        return;
      }

      await recreationTool.bulkRecreateFromFile(filePath);

    } else if (args.includes('--generate-sample')) {
      const filePath = args[args.indexOf('--generate-sample') + 1] || 'sample_users.json';
      recreationTool.generateSampleFile(filePath);

    } else {
      console.log('🔧 User Recreation Tool');
      console.log('======================');
      console.log('');
      console.log('Usage:');
      console.log('  --recreate [options]           Recreate a single user');
      console.log('  --template <name>              Recreate from template');
      console.log('  --bulk-recreate <file>         Recreate from JSON file');
      console.log('  --generate-sample [file]       Generate sample JSON file');
      console.log('');
      console.log('Options for --recreate:');
      console.log('  --fullname <name>              User full name');
      console.log('  --username <username>          Username');
      console.log('  --password <password>          Password');
      console.log('  --email <email>                Email address');
      console.log('  --phone <phone>                Phone number');
      console.log('  --status <status>              Account status');
      console.log('  --balance <amount>             Account balance');
      console.log('  --points <points>              User points');
      console.log('  --force                        Force recreation (override conflicts)');
      console.log('');
      console.log('Available templates:');
      console.log('  basic_user, premium_user, admin_user');
      console.log('');
      console.log('Examples:');
      console.log('  node recreate-deleted-user.js --recreate --username john_doe --fullname "John Doe" --email john@example.com');
      console.log('  node recreate-deleted-user.js --template premium_user');
      console.log('  node recreate-deleted-user.js --bulk-recreate users.json');
      console.log('  node recreate-deleted-user.js --generate-sample my_users.json');
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

module.exports = UserRecreationTool;



