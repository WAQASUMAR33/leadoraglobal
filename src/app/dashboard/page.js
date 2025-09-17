// app/dashboard/page.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardHome() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/dashboard', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.data);
        } else {
          setError(data.error || 'Failed to fetch dashboard data');
        }
      } else if (response.status === 401) {
        setError('Authentication required. Please login again.');
        // Redirect to login
        window.location.href = '/login';
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No dashboard data available</p>
      </div>
    );
  }

  const { user, stats } = dashboardData;

  const dashboardStats = [
    { 
      label: "Wallet Balance", 
      value: `PKR ${new Intl.NumberFormat('en-PK').format(user.balance)}`,
      icon: "💰",
      color: "text-green-600"
    },
    { 
      label: "Total Points", 
      value: user.points.toLocaleString(),
      icon: "⭐",
      color: "text-blue-600"
    },
    { 
      label: "Total Earnings", 
      value: `PKR ${new Intl.NumberFormat('en-PK').format(user.totalEarnings)}`,
      icon: "💎",
      color: "text-purple-600"
    },
    { 
      label: "Referrals", 
      value: user.referralCount,
      icon: "👥",
      color: "text-orange-600"
    },
    { 
      label: "Current Rank", 
      value: user.rank?.title || "No Rank",
      icon: "🏆",
      color: "text-yellow-600"
    },
    { 
      label: "Package Status", 
      value: user.hasActivePackage ? "Active" : "Inactive",
      icon: user.hasActivePackage ? "✅" : "❌",
      color: user.hasActivePackage ? "text-green-600" : "text-red-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user.fullname}!</h1>
        <p className="text-purple-100 mt-2">Here&apos;s your dashboard overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">{stat.label}</div>
                <div className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</div>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/packages" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">📦</div>
              <div className="text-sm font-medium">Manage Packages</div>
            </div>
          </Link>
          <Link href="/dashboard/withdrawals" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">💸</div>
              <div className="text-sm font-medium">Withdraw Funds</div>
            </div>
          </Link>
          <Link href="/dashboard/referrals" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium">View Referrals</div>
            </div>
          </Link>
          <Link href="/dashboard/earnings" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-sm font-medium">View Earnings</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
