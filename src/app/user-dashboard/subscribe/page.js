"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SubscribePackage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    // Fetch packages from API
    fetchPackages();
  }, []);

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

  const handleSubscribe = async (packageId) => {
    try {
      const response = await fetch('/api/user/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      });

      if (response.ok) {
        alert('Package subscribed successfully!');
        // Redirect to my package page
        window.location.href = '/user-dashboard/my-package';
      } else {
        alert('Failed to subscribe to package');
      }
    } catch (error) {
      console.error('Error subscribing to package:', error);
      alert('Error subscribing to package');
    }
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
          </div>
          <Link
            href="/user-dashboard/my-package"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            My Package
          </Link>
        </div>
      </div>

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
                <Link
                  href={`/user-dashboard/package-request?packageId=${pkg.id}`}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 text-center block"
                >
                  Buy Package
                </Link>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 text-lg">No packages available at the moment.</p>
          </div>
        )}
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
