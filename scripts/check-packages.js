import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPackages() {
  try {
    const packages = await prisma.package.findMany({
      select: { 
        id: true, 
        package_name: true, 
        package_amount: true,
        rankId: true,
        rank: { select: { title: true } }
      },
      orderBy: { id: 'asc' }
    });
    
    console.log('Current packages in database:');
    packages.forEach(pkg => {
      console.log(`ID ${pkg.id}: ${pkg.package_name} (₦${pkg.package_amount}) - Rank: ${pkg.rank?.title || 'None'} (RankID: ${pkg.rankId || 'None'})`);
    });
    
    // Check specifically for package ID 8
    const package8 = packages.find(p => p.id === 8);
    if (package8) {
      console.log(`\n✅ Package ID 8 found: ${package8.package_name}`);
      console.log(`   Amount: ₦${package8.package_amount}`);
      console.log(`   Assigned Rank: ${package8.rank?.title || 'None'} (RankID: ${package8.rankId || 'None'})`);
    } else {
      console.log('\n❌ Package ID 8 not found!');
    }
    
  } catch (error) {
    console.error('Error checking packages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPackages();

