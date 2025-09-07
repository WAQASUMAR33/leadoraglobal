"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { UserContext } from "../../lib/userContext";

export default function UserDashboardHome() {
  const { user, isAuthenticated } = useContext(UserContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/user/dashboard', {
          credentials: 'include'
        });

        if (response.ok) {
          const result = await response.json();
          setDashboardData(result.data);
        } else {
          setError('Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user]);

  const quickActions = [
    {
      title: "Subscribe Package",
      description: "Choose and subscribe to a new package",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      href: "/user-dashboard/subscribe",
      color: "from-blue-600 to-blue-700"
    },
    {
      title: "Shop Products",
      description: "Browse and purchase products",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      href: "/user-dashboard/shop",
      color: "from-green-600 to-green-700"
    },
    {
      title: "Invite Friends",
      description: "Share your referral code",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: "/user-dashboard/referrals",
      color: "from-purple-600 to-purple-700"
    },
    {
      title: "Withdraw Earnings",
      description: "Withdraw your earnings",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      href: "/user-dashboard/withdraw",
      color: "from-yellow-600 to-yellow-700"
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-400">No dashboard data available</p>
        </div>
      </div>
    );
  }

  const { user: userData, stats, recentActivity } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {userData?.fullname || "User"}!</h1>
            <p className="text-blue-100">
              {userData?.hasActivePackage 
                ? "Your package is active and earning!" 
                : "Complete your package subscription to start earning!"
              }
            </p>
            {userData?.hasActivePackage && userData?.packageExpiryDate && (
              <p className="text-blue-200 text-sm mt-1">
                Package expires: {new Date(userData.packageExpiryDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold text-white">PKR {stats.balance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Points</p>
              <p className="text-2xl font-bold text-white">{stats.points}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-white">PKR {stats.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Referrals</p>
              <p className="text-2xl font-bold text-white">{stats.referralCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Orders</p>
              <p className="text-2xl font-bold text-white">{stats.ordersCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all duration-200 border border-gray-600 hover:border-gray-500"
            >
              <div className="flex items-center">
                <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  {action.icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors duration-200">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((activity) => {
              const getActivityIcon = (type) => {
                switch (type) {
                  case 'order':
                    return (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-4"></div>
                    );
                  case 'package':
                    return (
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-4"></div>
                    );
                  case 'withdrawal':
                    return (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                    );
                  case 'referral':
                    return (
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-4"></div>
                    );
                  default:
                    return (
                      <div className="w-2 h-2 bg-gray-500 rounded-full mr-4"></div>
                    );
                }
              };

              const getStatusColor = (status) => {
                switch (status) {
                  case 'completed':
                  case 'approved':
                  case 'delivered':
                    return 'text-green-400';
                  case 'pending':
                    return 'text-yellow-400';
                  case 'rejected':
                  case 'cancelled':
                    return 'text-red-400';
                  default:
                    return 'text-gray-400';
                }
              };

              const formatTimeAgo = (date) => {
                const now = new Date();
                const activityDate = new Date(date);
                const diffInHours = Math.floor((now - activityDate) / (1000 * 60 * 60));
                
                if (diffInHours < 1) return 'Just now';
                if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
                const diffInDays = Math.floor(diffInHours / 24);
                if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
                return activityDate.toLocaleDateString();
              };

              return (
                <div key={activity.id} className="flex items-center p-4 bg-gray-700 rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-xs text-gray-400">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.createdAt)}</p>
                  </div>
                  {activity.amount && (
                    <span className={`text-sm ${getStatusColor(activity.status)}`}>
                      {activity.type === 'withdrawal' ? `PKR ${activity.amount}` : `PKR ${activity.amount}`}
                    </span>
                  )}
                  {!activity.amount && (
                    <span className={`text-sm ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 text-4xl mb-4">📊</div>
              <p className="text-gray-400">No recent activity</p>
              <p className="text-gray-500 text-sm mt-1">Your activity will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
