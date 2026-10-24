'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalPackages: 0,
    totalRanks: 0
  });

  useEffect(() => {
    // Get admin data from localStorage
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        setAdmin(parsedAdmin);
      } catch (error) {
        console.error('Error parsing admin data:', error);
      }
    }
    
    // Fetch dashboard stats
    fetchDashboardStats();
    setLoading(false);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // First test the headers endpoint
      console.log('Testing admin headers...');
      const headersResponse = await fetch('/api/admin/test-headers');
      if (headersResponse.ok) {
        const headersData = await headersResponse.json();
        console.log('Headers test result:', headersData);
      }
      
      const response = await fetch('/api/admin/stats');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        // Handle authentication error
        console.log('Admin session expired, redirecting to login');
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 lg:p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl lg:text-3xl font-bold mb-2 truncate">Welcome back, {admin?.fullName || admin?.username || "Admin"}!</h1>
            <p className="text-purple-100 text-sm lg:text-base">Here&apos;s what&apos;s happening with your system today.</p>
          </div>
          <div className="hidden md:block flex-shrink-0 ml-4">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
          <div className="p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 lg:ml-5 w-0 flex-1 min-w-0">
                <dl>
                  <dt className="text-xs lg:text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
          <div className="p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 lg:ml-5 w-0 flex-1 min-w-0">
                <dl>
                  <dt className="text-xs lg:text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalProducts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
          <div className="p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 lg:ml-5 w-0 flex-1 min-w-0">
                <dl>
                  <dt className="text-xs lg:text-sm font-medium text-gray-500 truncate">Total Packages</dt>
                  <dd className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalPackages}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
          <div className="p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 lg:ml-5 w-0 flex-1 min-w-0">
                <dl>
                  <dt className="text-xs lg:text-sm font-medium text-gray-500 truncate">Total Ranks</dt>
                  <dd className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalRanks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <p className="text-sm text-gray-500">Manage your system efficiently</p>
        </div>
        <div className="p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Link 
              href="/admin/user-management" 
              className="group flex items-center p-3 lg:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 lg:mr-4 group-hover:bg-blue-200 transition-colors flex-shrink-0">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-blue-900 text-sm lg:text-base truncate">Manage Users</h4>
                <p className="text-xs lg:text-sm text-blue-600 truncate">View and manage user accounts</p>
              </div>
            </Link>

            <Link 
              href="/admin/products" 
              className="group flex items-center p-3 lg:p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-300"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 lg:mr-4 group-hover:bg-green-200 transition-colors flex-shrink-0">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-green-900 text-sm lg:text-base truncate">Manage Products</h4>
                <p className="text-xs lg:text-sm text-green-600 truncate">Add and edit products</p>
              </div>
            </Link>

            <Link 
              href="/admin/packages" 
              className="group flex items-center p-3 lg:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 border border-purple-200 hover:border-purple-300"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 lg:mr-4 group-hover:bg-purple-200 transition-colors flex-shrink-0">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-purple-900 text-sm lg:text-base truncate">Manage Packages</h4>
                <p className="text-xs lg:text-sm text-purple-600 truncate">Configure packages</p>
              </div>
            </Link>

            <Link 
              href="/admin/ranks" 
              className="group flex items-center p-3 lg:p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-all duration-200 border border-yellow-200 hover:border-yellow-300"
            >
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3 lg:mr-4 group-hover:bg-yellow-200 transition-colors flex-shrink-0">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-yellow-900 text-sm lg:text-base truncate">Manage Ranks</h4>
                <p className="text-xs lg:text-sm text-yellow-600 truncate">Set up user ranks</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500">Latest system activities</p>
        </div>
        <div className="p-4 lg:p-6">
          <div className="text-center py-6 lg:py-8">
            <svg className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 lg:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-sm lg:text-base">No recent activity to display</p>
            <p className="text-xs lg:text-sm text-gray-400 mt-1">Activity will appear here as users interact with the system</p>
          </div>
        </div>
      </div>
    </div>
  );
}
