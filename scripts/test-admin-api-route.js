// Test the admin API route directly to simulate what happens when admin approves
import jwt from 'jsonwebtoken';

async function testAdminAPIRoute() {
  try {
    console.log('🧪 Testing admin API route for package approval...\n');
    
    // Create a test admin token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const adminToken = jwt.sign({ adminId: 1 }, jwtSecret);
    
    console.log('✅ Generated admin token');
    
    // Test with a pending package request
    const requestId = 2362; // Use a pending request ID
    const testUrl = `http://localhost:3000/api/admin/package-requests/${requestId}`;
    
    console.log(`📋 Testing approval for package request ID: ${requestId}`);
    console.log(`   URL: ${testUrl}\n`);
    
    // Make the API call
    const response = await fetch(testUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `admin-token=${adminToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        adminNotes: 'Test approval from script'
      })
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const responseData = await response.json();
    console.log('\n📦 Response Data:');
    console.log(JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Package approved successfully via admin API!');
    } else {
      console.log('\n❌ Package approval failed via admin API');
    }
    
  } catch (error) {
    console.error('\n❌ Error testing admin API route:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testAdminAPIRoute();

