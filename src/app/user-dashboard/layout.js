"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { auth } from "../../lib/auth";
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
    description: "View and manage your package",
    hasSubmenu: true,
    submenuItems: [
      {
        label: "My Package",
        href: "/user-dashboard/my-package",
        description: "View your current package"
      },
      {
        label: "Buy Package",
        href: "/user-dashboard/subscribe",
        description: "Purchase a new package"
      },
      {
        label: "Upgrade Package",
        href: "/user-dashboard/upgrade-package",
        description: "Upgrade your current package"
      }
    ]
  },
  {
    label: "Downline",
    href: "/user-dashboard/referrals",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    description: "Manage your downline",
    hasSubmenu: true,
    submenuItems: [
      {
        label: "Downlist",
        href: "/user-dashboard/downlist",
        description: "View your downline list"
      },
      {
        label: "Free Accounts",
        href: "/user-dashboard/free-accounts",
        description: "Manage free accounts"
      }
    ]
  },
  {
    label: "Shop",
    href: "/user-dashboard/shop",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    description: "Browse and purchase products",
    hasSubmenu: true,
    submenuItems: [
      {
        label: "Browse Products",
        href: "/user-dashboard/shop",
        description: "Browse and purchase products"
      },
      {
        label: "Cart",
        href: "/user-dashboard/cart",
        description: "View your shopping cart"
      },
      {
        label: "My Orders",
        href: "/user-dashboard/orders",
        description: "View your order history"
      }
    ]
  },
  {
    label: "My Earnings",
    href: "/user-dashboard/earnings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    description: "View your earnings",
    hasSubmenu: true,
    submenuItems: [
      {
        label: "Direct Earning",
        href: "/user-dashboard/earnings/direct",
        description: "View your direct earnings"
      },
      {
        label: "Indirect Earning",
        href: "/user-dashboard/earnings/indirect",
        description: "View your indirect earnings"
      },
      {
        label: "Transfer to Wallet",
        href: "/user-dashboard/earnings/transfer",
        description: "Transfer earnings to wallet"
      },
      {
        label: "Transfer to Others",
        href: "/user-dashboard/transfer-to-others",
        description: "Send money to other users"
      }
    ]
  },
  {
    label: "Withdrawals",
    href: "/user-dashboard/withdraw",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    description: "Withdraw your earnings",
    hasSubmenu: true,
    submenuItems: [
      {
        label: "Withdraw Request",
        href: "/user-dashboard/withdraw",
        description: "Submit a new withdrawal request"
      },
      {
        label: "Withdraw History",
        href: "/user-dashboard/withdrawals",
        description: "View your withdrawal history"
      },
      {
        label: "My Payment Methods",
        href: "/user-dashboard/payment-methods",
        description: "Manage your payment methods"
      }
    ]
  },
  {
    label: "KYC",
    href: "/user-dashboard/kyc",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: "Complete KYC verification",
    hasSubmenu: true,
    submenuItems: [
      {
        label: "My Profile",
        href: "/user-dashboard/profile",
        description: "Manage your profile information"
      },
      {
        label: "KYC Verification",
        href: "/user-dashboard/kyc",
        description: "Complete KYC verification"
      }
    ]
  }
];

export default function UserDashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [packageSubmenuOpen, setPackageSubmenuOpen] = useState(false);
  const [downlineSubmenuOpen, setDownlineSubmenuOpen] = useState(false);
  const [shopSubmenuOpen, setShopSubmenuOpen] = useState(false);
  const [earningsSubmenuOpen, setEarningsSubmenuOpen] = useState(false);
  const [withdrawalsSubmenuOpen, setWithdrawalsSubmenuOpen] = useState(false);
  const [kycSubmenuOpen, setKycSubmenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // CRITICAL: Clear any admin sessions when accessing user dashboard
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
    
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
      // CRITICAL: Clear ALL authentication data
      auth.logout();
      localStorage.removeItem('admin');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
      
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
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:relative sm:translate-x-0`}>
          {/* Sidebar Header with Ledora Global Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700 flex-shrink-0">
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
          <div className="px-6 py-4 border-b border-gray-700 flex-shrink-0">
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

          {/* Navigation - Scrollable Area */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto sidebar-scrollbar min-h-0">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.hasSubmenu && item.submenuItems?.some(subItem => pathname === subItem.href));
              const isPackageItem = item.label === "My Package";
              const isDownlineItem = item.label === "Downline";
              const isShopItem = item.label === "Shop";
              const isEarningsItem = item.label === "My Earnings";
              const isWithdrawalsItem = item.label === "Withdrawals";
              const isKycItem = item.label === "KYC";
              
              return (
                <div key={item.label}>
                  {item.hasSubmenu ? (
                    <div>
                      <button
                        onClick={() => {
                          if (isPackageItem) {
                            setPackageSubmenuOpen(!packageSubmenuOpen);
                          } else if (isDownlineItem) {
                            setDownlineSubmenuOpen(!downlineSubmenuOpen);
                          } else if (isShopItem) {
                            setShopSubmenuOpen(!shopSubmenuOpen);
                          } else if (isEarningsItem) {
                            setEarningsSubmenuOpen(!earningsSubmenuOpen);
                          } else if (isWithdrawalsItem) {
                            setWithdrawalsSubmenuOpen(!withdrawalsSubmenuOpen);
                          } else if (isKycItem) {
                            setKycSubmenuOpen(!kycSubmenuOpen);
                          }
                        }}
                        className={`group w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}
                        title={item.description}
                      >
                        <span className={`mr-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                          {item.icon}
                        </span>
                        <span className="flex-1 text-left">{item.label}</span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${
                            (isPackageItem && packageSubmenuOpen) || 
                            (isDownlineItem && downlineSubmenuOpen) || 
                            (isShopItem && shopSubmenuOpen) || 
                            (isEarningsItem && earningsSubmenuOpen) || 
                            (isWithdrawalsItem && withdrawalsSubmenuOpen) || 
                            (isKycItem && kycSubmenuOpen) ? 'rotate-180' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Submenu */}
                      {((isPackageItem && packageSubmenuOpen) || 
                        (isDownlineItem && downlineSubmenuOpen) || 
                        (isShopItem && shopSubmenuOpen) || 
                        (isEarningsItem && earningsSubmenuOpen) || 
                        (isWithdrawalsItem && withdrawalsSubmenuOpen) || 
                        (isKycItem && kycSubmenuOpen)) && (
                        <div className="ml-6 mt-2 space-y-1">
                          {item.submenuItems.map((subItem) => {
                            const isSubActive = pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.label}
                                href={subItem.href}
                                className={`block px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                  isSubActive
                                    ? "bg-blue-600/20 text-blue-300 border-l-2 border-blue-400"
                                    : "text-gray-400 hover:bg-gray-700/50 hover:text-gray-200"
                                }`}
                                title={subItem.description}
                              >
                                {subItem.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
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
                  )}
                </div>
              );
            })}
          </nav>

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
                {/* User Menu */}
                <div className="relative group">
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
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">{user?.fullname}</p>
                      <p className="text-xs text-gray-400">Member</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-900 dark-scrollbar">
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

