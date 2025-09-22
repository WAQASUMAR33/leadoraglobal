export async function GET(request) {
  try {
    // Get all headers
    const headers = Object.fromEntries(request.headers.entries());
    
    // Get specific admin headers
    const adminId = request.headers.get('x-admin-id');
    const adminUsername = request.headers.get('x-admin-username');
    const adminEmail = request.headers.get('x-admin-email');
    const adminRole = request.headers.get('x-admin-role');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Headers test endpoint',
        adminHeaders: {
          'x-admin-id': adminId,
          'x-admin-username': adminUsername,
          'x-admin-email': adminEmail,
          'x-admin-role': adminRole
        },
        allHeaders: headers
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
