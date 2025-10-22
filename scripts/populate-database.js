import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function populateDatabase() {
  try {
    console.log('🚀 Starting database population...');

    // 1. Create Ranks
    console.log('\n📊 Creating ranks...');
    const ranks = [
      { title: 'Consultant', required_points: 0, details: 'Entry level rank' },
      { title: 'Manager', required_points: 1000, details: 'First management level' },
      { title: 'Sapphire Manager', required_points: 5000, details: 'Advanced management level' },
      { title: 'Diamond', required_points: 8000, details: 'Premium level with downline requirements' },
      { title: 'Sapphire Diamond', required_points: 0, details: 'High level with 3 Diamond+ downlines' },
      { title: 'Ambassador', required_points: 0, details: 'Elite level with 6 Diamond+ downlines' },
      { title: 'Sapphire Ambassador', required_points: 0, details: 'Top level with Ambassador+ or Diamond+ downlines' },
      { title: 'Royal Ambassador', required_points: 0, details: 'Royal level with Sapphire Ambassador+ or Diamond+ downlines' },
      { title: 'Global Ambassador', required_points: 0, details: 'Global level with Royal Ambassador+ or Diamond+ downlines' },
      { title: 'Honory Share Holder', required_points: 0, details: 'Highest level with Global Ambassador+ or Diamond+ downlines' }
    ];

    const createdRanks = [];
    for (const rank of ranks) {
      // Check if rank already exists
      const existing = await prisma.rank.findFirst({
        where: { title: rank.title }
      });
      
      if (!existing) {
        const created = await prisma.rank.create({
          data: rank
        });
        createdRanks.push(created);
        console.log(`✅ Created rank: ${rank.title} (ID: ${created.id})`);
      } else {
        createdRanks.push(existing);
        console.log(`ℹ️ Rank already exists: ${rank.title} (ID: ${existing.id})`);
      }
    }

    // 2. Create Packages
    console.log('\n📦 Creating packages...');
    const packages = [
      {
        package_name: 'Starter Package',
        package_amount: 50000,
        package_direct_commission: 5000,
        package_indirect_commission: 2500,
        d_crages: 0,
        shopping_amount: 0,
        package_points: 50,
        status: 'active',
        rankId: createdRanks.find(r => r.title === 'Consultant')?.id
      },
      {
        package_name: 'Basic Package',
        package_amount: 100000,
        package_direct_commission: 10000,
        package_indirect_commission: 5000,
        d_crages: 0,
        shopping_amount: 0,
        package_points: 100,
        status: 'active',
        rankId: createdRanks.find(r => r.title === 'Manager')?.id
      },
      {
        package_name: 'Combo Package',
        package_amount: 400000,
        package_direct_commission: 50000,
        package_indirect_commission: 40000,
        d_crages: 0,
        shopping_amount: 500000,
        package_points: 100,
        status: 'active',
        rankId: createdRanks.find(r => r.title === 'Sapphire Manager')?.id
      },
      {
        package_name: 'Premium Package',
        package_amount: 800000,
        package_direct_commission: 100000,
        package_indirect_commission: 80000,
        d_crages: 0,
        shopping_amount: 1000000,
        package_points: 150,
        status: 'active',
        rankId: createdRanks.find(r => r.title === 'Diamond')?.id
      },
      {
        package_name: 'Elite Package',
        package_amount: 1500000,
        package_direct_commission: 200000,
        package_indirect_commission: 150000,
        d_crages: 0,
        shopping_amount: 2000000,
        package_points: 200,
        status: 'active',
        rankId: createdRanks.find(r => r.title === 'Sapphire Diamond')?.id
      },
      {
        package_name: 'Sapphire Manager Package',
        package_amount: 500000,
        package_direct_commission: 75000,
        package_indirect_commission: 50000,
        d_crages: 0,
        shopping_amount: 600000,
        package_points: 125,
        status: 'active',
        rankId: createdRanks.find(r => r.title === 'Sapphire Manager')?.id
      },
      {
        package_name: 'Diamond Package',
        package_amount: 1000000,
        package_direct_commission: 150000,
        package_indirect_commission: 100000,
        d_crages: 0,
        shopping_amount: 1200000,
        package_points: 175,
        status: 'active',
        rankId: createdRanks.find(r => r.title === 'Diamond')?.id
      }
    ];

    const createdPackages = [];
    for (const pkg of packages) {
      // Check if package already exists
      const existing = await prisma.package.findFirst({
        where: { package_name: pkg.package_name }
      });
      
      if (!existing) {
        const created = await prisma.package.create({
          data: pkg
        });
        createdPackages.push(created);
        console.log(`✅ Created package: ${pkg.package_name} (ID: ${created.id})`);
      } else {
        createdPackages.push(existing);
        console.log(`ℹ️ Package already exists: ${pkg.package_name} (ID: ${existing.id})`);
      }
    }

    // 3. Create Root Admin User
    console.log('\n👤 Creating root admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    let adminUser;
    if (!existingAdmin) {
      adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          fullname: 'System Administrator',
          email: 'admin@leadoraglobal.com',
          password: hashedPassword,
          status: 'active',
          rankId: createdRanks.find(r => r.title === 'Consultant')?.id
        }
      });
    } else {
      adminUser = existingAdmin;
    }
    console.log(`✅ Created/Updated admin user: ${adminUser.username} (ID: ${adminUser.id})`);

    // 4. Create Root User (Touseef231)
    console.log('\n🌳 Creating root user (Touseef231)...');
    const rootUserPassword = await bcrypt.hash('touseef123', 10);
    
    const existingRootUser = await prisma.user.findUnique({
      where: { username: 'touseef231' }
    });
    
    let rootUser;
    if (!existingRootUser) {
      rootUser = await prisma.user.create({
        data: {
          username: 'touseef231',
          fullname: 'Touseef Ahmed',
          email: 'touseef@leadoraglobal.com',
          password: rootUserPassword,
          status: 'active',
          rankId: createdRanks.find(r => r.title === 'Royal Ambassador')?.id,
          points: 75000,
          balance: 500000
        }
      });
    } else {
      rootUser = existingRootUser;
    }
    console.log(`✅ Created/Updated root user: ${rootUser.username} (ID: ${rootUser.id})`);

    // 5. Create Sample Products
    console.log('\n🛍️ Creating sample products...');
    const products = [
      {
        title: 'Sample Product 1',
        image: '/images/product1.jpg',
        price: 1000,
        description: 'This is a sample product for testing',
        status: 'active'
      },
      {
        title: 'Sample Product 2',
        image: '/images/product2.jpg',
        price: 2500,
        description: 'Another sample product for testing',
        status: 'active'
      },
      {
        title: 'Sample Product 3',
        image: '/images/product3.jpg',
        price: 5000,
        description: 'Premium sample product for testing',
        status: 'active'
      }
    ];

    for (const product of products) {
      const existing = await prisma.product.findFirst({
        where: { title: product.title }
      });
      
      if (!existing) {
        const created = await prisma.product.create({
          data: product
        });
        console.log(`✅ Created product: ${product.title} (ID: ${created.id})`);
      } else {
        console.log(`ℹ️ Product already exists: ${product.title} (ID: ${existing.id})`);
      }
    }

    // 6. Create Company Bank Account
    console.log('\n🏦 Creating company bank account...');
    const existingBankAccount = await prisma.companyBankAccounts.findFirst({
      where: { bank_title: 'Main Bank Account' }
    });
    
    let bankAccount;
    if (!existingBankAccount) {
      bankAccount = await prisma.companyBankAccounts.create({
        data: {
          bank_title: 'Main Bank Account',
          bank_accountno: '1234567890',
          account_title: 'Leadora Global Company',
          iban_no: 'PK36SCBL0000001123456789'
        }
      });
    } else {
      bankAccount = existingBankAccount;
    }
    console.log(`✅ Created/Updated bank account: ${bankAccount.bank_title} (ID: ${bankAccount.id})`);

    console.log('\n🎉 Database population completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`✅ Ranks created: ${createdRanks.length}`);
    console.log(`✅ Packages created: ${createdPackages.length}`);
    console.log(`✅ Admin user: admin (password: admin123)`);
    console.log(`✅ Root user: touseef231 (password: touseef123)`);
    console.log(`✅ Products created: ${products.length}`);
    console.log(`✅ Bank account created: 1`);

    console.log('\n🔑 Login Credentials:');
    console.log('Admin Panel: http://localhost:3000/admin/login');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\nUser Panel: http://localhost:3000/login');
    console.log('Username: touseef231');
    console.log('Password: touseef123');

  } catch (error) {
    console.error('❌ Error populating database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateDatabase();
