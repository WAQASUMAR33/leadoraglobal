"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { auth } from "../../lib/auth";
import SessionManager from "../../components/SessionManager";
import { UserProvider } from "../../lib/userContext";

// Menu items for user dashboard
const menuItems = [
  {
    label: "Dashboard",
    href: "/user-dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
      </svg>
    ),
    description: "Overview and analytics"
  },
  {
    label: "My Package",
    href: "/user-dashboard/my-package",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    description: "View and manage your package"
  },
  {
    label: "Subscribe Package",
    href: "/user-dashboard/subscribe",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    description: "Subscribe to a new package"
  },
  {
    label: "Shop",
    href: "/user-dashboard/shop",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    description: "Browse and purchase products"
  },
  {
    label: "My Orders",
    href: "/user-dashboard/orders",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    description: "View your order history"
  },
  {
    label: "Cart",
    href: "/user-dashboard/cart",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
      </svg>
    ),
    description: "Shopping cart"
  },
  {
    label: "Referrals",
    href: "/user-dashboard/referrals",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    description: "Manage your referrals"
  },
  {
    label: "Earnings",
    href: "/user-dashboard/earnings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    description: "View your earnings"
  },
  {
    label: "Profile",
    href: "/user-dashboard/profile",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    description: "Manage your profile"
  },
  {
    label: "KYC Verification",
    href: "/user-dashboard/kyc",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: "Complete KYC verification"
  },
  {
    label: "Withdraw",
    href: "/user-dashboard/withdraw",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    description: "Withdraw your earnings"
  }
];

export default function UserDashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const pathname = usePathname();

  useEffect(() => {
    // Get user from auth utility
    const currentUser = auth.getUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      // Redirect to login if no user
      window.location.href = "/login";
    }
  }, []);

  const handleLogout = async () => {
    try {
      await auth.logoutWithAPI();
    } catch (error) {
      console.warn('Failed to call logout API:', error);
    } finally {
      auth.logout();
      window.location.href = "/login";
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:relative sm:translate-x-0`}>
          {/* Sidebar Header with Ledora Global Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg mr-3">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LEADORA</h1>
                <p className="text-xs text-blue-400">GLOBAL</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="sm:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile */}
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.fullname?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {user?.fullname}
                </p>
                <p className="text-xs text-gray-400">Member</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  title={item.description}
                >
                  <span className={`mr-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-gray-800 shadow-sm border-b border-gray-700">
            <div className="flex items-center justify-between h-16 px-6">
              {/* Left side */}
              <div className="flex items-center">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 sm:hidden"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="ml-4 sm:ml-0">
                  <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                  <p className="text-sm text-gray-400">Welcome back, {user?.fullname || "User"}!</p>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Session Manager */}
                <SessionManager />

                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4.19A2 2 0 006 3h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.fullname?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-white">{user?.fullname}</p>
                      <p className="text-xs text-gray-400">Member</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-900">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 sm:hidden"
            onClick={toggleSidebar}
          />
        )}
      </div>
    </div>
    </UserProvider>
  );
}

