"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { UserContext } from "../../../lib/userContext";

export default function SubscribePackage() {
  const { user, isAuthenticated } = useContext(UserContext);
  const [packages, setPackages] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('request'); // 'request' or 'balance'
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch packages and user balance from API
    fetchPackages();
    if (user && isAuthenticated) {
      fetchUserBalance();
      
      // Also check if balance is available in user context
      if (user.balance !== undefined) {
        console.log('🔍 Subscribe page - Balance from user context:', user.balance);
        setUserBalance(parseFloat(user.balance || 0));
      }
    }
  }, [user, isAuthenticated]);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      } else {
        console.error('Failed to fetch packages:', response.status);
        setPackages([]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      console.log('🔍 Subscribe page - Fetching user balance for user:', user.id);
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      });
      console.log('🔍 Subscribe page - Balance API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Subscribe page - Balance API response data:', data);
        
        if (data.success && data.user && data.user.balance !== undefined) {
          const balance = parseFloat(data.user.balance || 0);
          console.log('🔍 Subscribe page - Parsed balance:', balance);
          setUserBalance(balance);
        } else {
          console.log('🔍 Subscribe page - No balance data found in response:', data);
          setUserBalance(0);
        }
      } else {
        console.error('🔍 Subscribe page - Failed to fetch user balance:', response.status);
        setUserBalance(0);
      }
    } catch (error) {
      console.error('🔍 Subscribe page - Error fetching user balance:', error);
      setUserBalance(0);
    }
  };

  const handleBalancePayment = async (packageId) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setProcessing(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/user/subscribe-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          userId: user.id,
          packageId: packageId 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Package subscribed successfully using your balance!');
        setUserBalance(data.data.newBalance);
        setSelectedPackage(null);
        setPaymentMethod('request');
        setTimeout(() => {
          window.location.href = '/user-dashboard/my-package';
        }, 2000);
      } else {
        setError(data.error || 'Failed to subscribe to package');
      }
    } catch (error) {
      console.error('Error subscribing to package:', error);
      setError('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePackageRequest = (packageId) => {
    // Redirect to package request page
    window.location.href = `/user-dashboard/package-request?packageId=${packageId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Subscribe to a Package</h1>
              <p className="text-gray-400 mt-2">Choose a package that suits your needs and start earning</p>
            </div>
            <Link
              href="/user-dashboard/my-package"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              My Package
            </Link>
          </div>
        </div>
        
        {/* No Packages Message */}
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
          <p className="text-gray-400 text-lg mb-4">No packages available at the moment.</p>
          <p className="text-gray-500 text-sm">Please check back later or contact support for assistance.</p>
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
            <h1 className="text-2xl font-bold text-white">Subscribe to a Package</h1>
            <p className="text-gray-400 mt-2">Choose a package that suits your needs and start earning</p>
            {user && (
              <div className="mt-3 flex items-center gap-4">
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg px-3 py-2">
                  <span className="text-green-300 text-sm font-medium">
                    Current Balance: PKR {userBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
          <Link
            href="/user-dashboard/my-package"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            My Package
          </Link>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-300">{message}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages && packages.length > 0 ? packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-gray-800 rounded-xl p-6 border-2 transition-all duration-200 ${
              selectedPackage?.id === pkg.id
                ? 'border-blue-500 bg-gray-750'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            {/* Package Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{pkg.package_name}</h3>
              <div className="text-3xl font-bold text-blue-400 mb-1">
                ₨{parseFloat(pkg.package_amount).toFixed(2)}
              </div>
              <p className="text-sm text-gray-400">One-time payment</p>
            </div>

            {/* Package Features */}
            <div className="space-y-3 mb-6">
              {pkg.rank && (
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">Rank: {pkg.rank.title}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setSelectedPackage(pkg)}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  selectedPackage?.id === pkg.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                {selectedPackage?.id === pkg.id ? 'Selected' : 'Select Package'}
              </button>
              
              {selectedPackage?.id === pkg.id && (
                <div className="space-y-2">
                  {/* Balance Payment Option */}
                  {userBalance >= parseFloat(pkg.package_amount) ? (
                    <button
                      onClick={() => handleBalancePayment(pkg.id)}
                      disabled={processing}
                      className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : `Pay from Balance (PKR ${parseFloat(pkg.package_amount).toLocaleString()})`}
                    </button>
                  ) : (
                    <div className="w-full py-2 px-4 bg-gray-600 text-gray-400 rounded-lg text-center text-sm">
                      Insufficient Balance (Need: PKR {parseFloat(pkg.package_amount).toLocaleString()})
                    </div>
                  )}
                  
                  {/* Package Request Option */}
                  <button
                    onClick={() => handlePackageRequest(pkg.id)}
                    className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                  >
                    Send Payment Proof
                  </button>
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 text-lg">No packages available at the moment.</p>
          </div>
        )}
      </div>


      {/* Payment Options Info */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Payment Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-green-300 font-semibold">Pay from Balance</h3>
            </div>
            <p className="text-gray-400 text-sm">
              If you have sufficient balance, you can subscribe to a package instantly without waiting for admin approval.
            </p>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-blue-300 font-semibold">Send Payment Proof</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Make payment through bank transfer and send proof to admin for manual approval and activation.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Why Subscribe to a Package?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Earn Commissions</h3>
              <p className="text-gray-400 text-sm">Start earning direct and indirect commissions from your referrals</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Build Network</h3>
              <p className="text-gray-400 text-sm">Grow your referral network and increase your earning potential</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Exclusive Benefits</h3>
              <p className="text-gray-400 text-sm">Access exclusive products and special discounts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
