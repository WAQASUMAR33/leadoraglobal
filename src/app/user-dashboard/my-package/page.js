"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { UserContext } from "../../../lib/userContext";

export default function MyPackage() {
  const { user, isAuthenticated } = useContext(UserContext);
  const [userPackage, setUserPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [packageDetails, setPackageDetails] = useState(null);
  const [packageRequests, setPackageRequests] = useState([]);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    if (user && isAuthenticated) {
      console.log('🔄 useEffect triggered - fetching data for user');
      console.log('🔄 User context data:', user);
      fetchUserPackage(user.id);
      fetchPackageRequests(user.id);
      fetchUserBalance(user.id);
      
      // Also check if balance is available in user context
      if (user.balance !== undefined) {
        console.log('🔄 Balance from user context:', user.balance);
        setUserBalance(parseFloat(user.balance || 0));
      }
    } else {
      console.log('🔄 useEffect - user or auth not ready:', { user: !!user, isAuthenticated });
    }
  }, [user, isAuthenticated]);

  // Force fetch on component mount if user is available
  useEffect(() => {
    if (user?.id && !loading) {
      console.log('🔄 Component mounted - fetching package requests');
      fetchPackageRequests(user.id);
    }
  }, [loading, user?.id]); // Only run when loading changes

  const fetchUserPackage = async (userId) => {
    try {
      // Fetch user's package subscription
      const response = await fetch(`/api/user/package?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserPackage(data.userPackage);
        if (data.packageDetails) {
          setPackageDetails(data.packageDetails);
        }
      } else {
        console.error('Failed to fetch user package:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user package:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageRequests = async (userId) => {
    try {
      console.log('Fetching package requests for user');
      const response = await fetch(`/api/package-requests?userId=${userId}`);
      console.log('Package requests response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Package requests data received:', data);
        
        // Handle different possible response structures
        if (data.packageRequests) {
          setPackageRequests(data.packageRequests);
        } else if (Array.isArray(data)) {
          setPackageRequests(data);
        } else if (data.data && Array.isArray(data.data)) {
          setPackageRequests(data.data);
        } else {
          console.log('No package requests found in response:', data);
          setPackageRequests([]);
        }
        
        console.log('Package requests state set to:', data.packageRequests || data || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch package requests:', response.status, errorData);
        setPackageRequests([]);
      }
    } catch (error) {
      console.error('Error fetching package requests:', error);
      setPackageRequests([]);
    }
  };

  const fetchUserBalance = async (userId) => {
    try {
      console.log('🔍 Fetching user balance for user:', userId);
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      });
      
      console.log('🔍 Balance API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Balance API response data:', data);
        
        if (data.success && data.user) {
          const balance = data.user.balance;
          console.log('🔍 Raw balance from API:', balance, 'Type:', typeof balance);
          
          const parsedBalance = parseFloat(balance || 0);
          console.log('🔍 Parsed balance:', parsedBalance);
          
          setUserBalance(parsedBalance);
        } else {
          console.log('🔍 No balance data found in response:', data);
          setUserBalance(0);
        }
      } else {
        console.error('🔍 Failed to fetch user balance:', response.status);
        const errorData = await response.text();
        console.error('🔍 Error response:', errorData);
        setUserBalance(0);
      }
    } catch (error) {
      console.error('🔍 Error fetching user balance:', error);
      setUserBalance(0);
    }
  };



  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'expired':
        return 'bg-red-500';
      case 'suspended':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'No Status';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userPackage) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">My Package</h1>
              <p className="text-gray-400 mt-2">View your current package subscription and details</p>
            </div>
            <Link
              href="/user-dashboard/subscribe"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Subscribe to Package
            </Link>
          </div>
        </div>

        {/* Account Balance */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Account Balance</h2>
              <p className="text-green-100">Your available wallet balance</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">
                PKR {userBalance.toFixed(2)}
              </div>
              <p className="text-green-100 text-sm">Available Balance</p>
            </div>
          </div>
        </div>
        
        {/* No Package Message */}
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Active Package</h3>
          <p className="text-gray-400 mb-6">You don&apos;t have an active package subscription yet.</p>
          <Link
            href="/user-dashboard/subscribe"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
          >
            Browse Available Packages
          </Link>
        </div>

        {/* Package Requests Section - Always Visible Even Without Active Package */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Package Requests</h3>
            <Link
              href="/user-dashboard/subscribe"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
            >
              + New Request
            </Link>
          </div>
          
          
          {/* Package Requests Summary */}
          {packageRequests.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{packageRequests.length}</div>
                <div className="text-gray-400 text-sm">Total Requests</div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {packageRequests.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-yellow-300 text-sm">Pending</div>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {packageRequests.filter(r => r.status === 'approved').length}
                </div>
                <div className="text-green-300 text-sm">Approved</div>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {packageRequests.filter(r => r.status === 'rejected').length}
                </div>
                <div className="text-red-300 text-sm">Rejected</div>
              </div>
            </div>
          )}
          
          {packageRequests.length > 0 ? (
            <div className="space-y-4">
              {packageRequests.map((request) => (
                <div key={request.id} className="bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-lg mb-2">
                        {request.package?.package_name || 'Package Name Not Available'}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-white ml-2 font-medium">
                            PKR {request.package?.package_amount ? parseFloat(request.package.package_amount).toFixed(2) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Transaction ID:</span>
                          <span className="text-white ml-2 font-medium font-mono">
                            {request.transactionId || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium text-white ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                      <p className="text-gray-400 text-xs mt-2">
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status-specific information */}
                  {request.status === 'pending' && (
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 mb-3">
                      <p className="text-yellow-300 text-sm">
                        ⏳ Your package request is pending admin approval. You&apos;ll be notified once it&apos;s reviewed.
                      </p>
                    </div>
                  )}
                  
                  {request.status === 'approved' && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded p-3 mb-3">
                      <p className="text-green-300 text-sm">
                        ✅ Your package request has been approved! Your package is now active.
                      </p>
                    </div>
                  )}
                  
                  {request.status === 'rejected' && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded p-3 mb-3">
                      <p className="text-red-300 text-sm">
                        ❌ Your package request was rejected. Please check admin notes below.
                      </p>
                    </div>
                  )}
                  
                  {request.notes && (
                    <div className="bg-gray-600 rounded p-3 mb-3">
                      <p className="text-gray-300 text-sm">
                        <span className="text-gray-400 font-medium">Your Notes:</span> {request.notes}
                      </p>
                    </div>
                  )}
                  
                  {request.adminNotes && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                      <p className="text-blue-300 text-sm">
                        <span className="text-blue-400 font-medium">Admin Response:</span> {request.adminNotes}
                      </p>
                    </div>
                  )}
                  
                  {/* Request details footer */}
                  <div className="mt-4 pt-3 border-t border-gray-600">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Request ID: #{request.id}</span>
                      <span>Submitted: {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}</span>
                      {request.updatedAt && request.updatedAt !== request.createdAt && (
                        <span>Updated: {new Date(request.updatedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">No Package Requests Yet</h4>
              <p className="text-gray-400 mb-6">You haven&apos;t submitted any package requests yet.</p>
              <Link
                href="/user-dashboard/subscribe"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                Browse Available Packages
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Package</h1>
            <p className="text-gray-400 mt-2">View your current package subscription and details</p>
          </div>
          <Link
            href="/user-dashboard/subscribe"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Change Package
          </Link>
        </div>
      </div>

      {/* Account Balance */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Account Balance</h2>
            <p className="text-green-100">Your available wallet balance</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">
              PKR {userBalance.toFixed(2)}
            </div>
            <p className="text-green-100 text-sm">Available Balance</p>
          </div>
        </div>
      </div>

      {/* Package Status Overview - Enhanced */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Current Package</h2>
            <p className="text-blue-100 text-lg">
              {packageDetails ? packageDetails.package_name : 'Package Details Loading...'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">
              PKR {packageDetails ? parseFloat(packageDetails.package_amount).toFixed(2) : '0.00'}
            </div>
            <p className="text-blue-100 text-sm">Package Value</p>
          </div>
        </div>
        
        {/* Status Badge - Prominent Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-white font-semibold ${getStatusColor(userPackage.status)}`}>
              {getStatusText(userPackage.status)}
            </div>
            <span className="text-blue-100">
              {userPackage.status === 'active' ? '✅ Package is Active' : 
               userPackage.status === 'pending' ? '⏳ Awaiting Approval' :
               userPackage.status === 'expired' ? '❌ Package Expired' :
               '⚠️ Package Status Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Package Details Grid - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(userPackage.status)}`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Status</p>
              <p className={`text-lg font-bold capitalize ${getStatusColor(userPackage.status).replace('bg-', 'text-')}`}>
                {getStatusText(userPackage.status)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Start Date</p>
              <p className="text-lg font-bold text-white">
                {userPackage.startDate ? new Date(userPackage.startDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>


      </div>

      {/* Package Benefits - Enhanced */}
      {packageDetails && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">Package Benefits & Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Shopping Amount:</span>
              <span className="text-blue-400 font-semibold">
                PKR {parseFloat(packageDetails.shopping_amount).toFixed(2)}
              </span>
            </div>
            {packageDetails.rank && (
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span className="text-gray-300">Rank:</span>
                <span className="text-purple-400 font-semibold">
                  {packageDetails.rank.title}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

            {/* Package Requests Section - Always Visible */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Package Requests</h3>
          <Link
            href="/user-dashboard/subscribe"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
          >
            + New Request
          </Link>
        </div>
        
        
        {/* Package Requests Summary */}
        {packageRequests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{packageRequests.length}</div>
              <div className="text-gray-400 text-sm">Total Requests</div>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {packageRequests.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-yellow-300 text-sm">Pending</div>
            </div>
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {packageRequests.filter(r => r.status === 'approved').length}
              </div>
              <div className="text-green-300 text-sm">Approved</div>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">
                {packageRequests.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-red-300 text-sm">Rejected</div>
            </div>
          </div>
        )}
        
        {packageRequests.length > 0 ? (
          <div className="space-y-4">
            {packageRequests.map((request) => (
              <div key={request.id} className="bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-lg mb-2">
                      {request.package?.package_name || 'Package Name Not Available'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white ml-2 font-medium">
                          PKR {request.package?.package_amount ? parseFloat(request.package.package_amount).toFixed(2) : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Transaction ID:</span>
                        <span className="text-white ml-2 font-medium font-mono">
                          {request.transactionId || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium text-white ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                    <p className="text-gray-400 text-xs mt-2">
                      {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {/* Status-specific information */}
                {request.status === 'pending' && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 mb-3">
                    <p className="text-yellow-300 text-sm">
                      ⏳ Your package request is pending admin approval. You&apos;ll be notified once it&apos;s reviewed.
                    </p>
                  </div>
                )}
                
                {request.status === 'approved' && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded p-3 mb-3">
                    <p className="text-green-300 text-sm">
                      ✅ Your package request has been approved! Your package is now active.
                    </p>
                  </div>
                )}
                
                {request.status === 'rejected' && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded p-3 mb-3">
                    <p className="text-red-300 text-sm">
                      ❌ Your package request was rejected. Please check admin notes below.
                    </p>
                  </div>
                )}
                
                {request.notes && (
                  <div className="bg-gray-600 rounded p-3 mb-3">
                    <p className="text-gray-300 text-sm">
                      <span className="text-gray-400 font-medium">Your Notes:</span> {request.notes}
                    </p>
                  </div>
                )}
                
                {request.adminNotes && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                    <p className="text-blue-300 text-sm">
                      <span className="text-blue-400 font-medium">Admin Response:</span> {request.adminNotes}
                    </p>
                  </div>
                )}
                
                {/* Request details footer */}
                <div className="mt-4 pt-3 border-t border-gray-600">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Request ID: #{request.id}</span>
                    <span>Submitted: {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}</span>
                    {request.updatedAt && request.updatedAt !== request.createdAt && (
                      <span>Updated: {new Date(request.updatedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">No Package Requests Yet</h4>
            <p className="text-gray-400 mb-6">You haven&apos;t submitted any package requests yet.</p>
            <Link
              href="/user-dashboard/subscribe"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              Browse Available Packages
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}


