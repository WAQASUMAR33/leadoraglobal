'use client';

import { useState, useEffect } from 'react';

export default function AdminAuthDebug() {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // Check localStorage
      const adminData = localStorage.getItem('admin');
      const adminToken = localStorage.getItem('adminToken');
      
      // Check cookies
      const cookies = document.cookie;
      
      // Test API endpoints
      const [statsResponse, packageRequestsResponse] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/package-requests', { credentials: 'include' })
      ]);
      
      const statsData = await statsResponse.json();
      let packageRequestsData = null;
      
      if (packageRequestsResponse.ok) {
        packageRequestsData = await packageRequestsResponse.json();
      }
      
      setDebugInfo({
        localStorage: {
          admin: adminData ? JSON.parse(adminData) : null,
          token: adminToken ? 'exists' : 'missing'
        },
        cookies: cookies,
        api: {
          stats: {
            status: statsResponse.status,
            data: statsData
          },
          packageRequests: {
            status: packageRequestsResponse.status,
            data: packageRequestsData
          }
        }
      });
    } catch (error) {
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-token');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Admin Auth Debug</h1>
        <button
          onClick={clearAuth}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Clear Auth Data
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Debug Information</h2>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="space-y-2">
          <a 
            href="/admin/login" 
            className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center"
          >
            Go to Admin Login
          </a>
          <a 
            href="/admin/dashboard" 
            className="block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-center"
          >
            Go to Admin Dashboard
          </a>
          <a 
            href="/admin/package-requests" 
            className="block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-center"
          >
            Go to Package Requests
          </a>
        </div>
      </div>
    </div>
  );
}
