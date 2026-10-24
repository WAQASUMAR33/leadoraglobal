"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "../../../lib/userContext";

export default function Checkout() {
  const { user, loading: authLoading, error: authError, isAuthenticated } = useUser();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [shoppingEligibility, setShoppingEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentData, setPaymentData] = useState({
    transactionId: "",
    paymentMethod: "",
    image: null
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    zipCode: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Load cart from localStorage
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
      
      // Fetch shopping eligibility
      fetchShoppingEligibility();
      setLoading(false);
    }
  }, [mounted]);

  const fetchShoppingEligibility = async () => {
    try {
      setEligibilityLoading(true);
      const response = await fetch('/api/user/shopping-eligibility', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setShoppingEligibility(data);
      } else {
        console.error('Failed to fetch shopping eligibility');
        setShoppingEligibility({
          success: false,
          eligible: false,
          reason: 'error',
          message: 'Unable to check shopping eligibility'
        });
      }
    } catch (error) {
      console.error('Error fetching shopping eligibility:', error);
      setShoppingEligibility({
        success: false,
        eligible: false,
        reason: 'error',
        message: 'Unable to check shopping eligibility'
      });
    } finally {
      setEligibilityLoading(false);
    }
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = item.sale_price || item.price;
      return total + (parseFloat(price) * item.quantity);
    }, 0);
  };

  const getTotal = () => {
    return getSubtotal(); // Add shipping/tax if needed
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Only allow images for now (server route expects data:image/*)
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target.result;

        // Upload to server to get a URL instead of storing large base64 in DB
        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });

        if (!uploadRes.ok) {
          throw new Error('Upload failed');
        }

        const uploadJson = await uploadRes.json();
        const imageUrl = uploadJson.url;

        setPaymentProof(imageUrl);
        setPaymentData(prev => ({
          ...prev,
          image: imageUrl
        }));
      } catch (err) {
        console.error('Payment proof upload error:', err);
        alert('Failed to upload payment proof. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentDataChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.phone || !formData.address || !formData.city || 
        !formData.country || !formData.zipCode) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if payment proof is required
    if (shoppingEligibility?.shopping?.shoppingType === 'payment_proof_required') {
      if (!paymentProof) {
        alert('Payment proof image is required for users without active packages. Please upload your payment proof.');
        return;
      }
      if (!paymentData.transactionId) {
        alert('Transaction ID is required. Please enter your transaction ID.');
        return;
      }
      if (!paymentData.paymentMethod) {
        alert('Payment method is required. Please select your payment method.');
        return;
      }
    }

    try {
      if (!user) {
        alert('Please log in to place an order');
        return;
      }
      
      const userId = user.id;
      
      // Prepare order data
      const orderData = {
        userId,
        items: cart,
        shippingInfo: formData,
        totalAmount: getTotal(),
        paymentProof: paymentProof, // Include payment proof if provided
        paymentData: paymentData, // Include payment details
        shoppingType: shoppingEligibility?.shopping?.shoppingType || 'standard'
      };

      // Send order to backend
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Order placed successfully! Thank you for your purchase.');
          
          // Clear cart
          localStorage.removeItem('cart');
          setCart([]);
          
          // Redirect to orders page
          window.location.href = '/user-dashboard/orders';
        } else {
          alert('Failed to place order: ' + result.message);
        }
      } else {
        alert('Failed to place order. Please try again.');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      alert('There was an error processing your order. Please try again.');
    }
  };

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading checkout...</p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-2 p-1">
        <div className="bg-gray-800 rounded-xl p-6 md:p-12 border border-gray-700 text-center">
          <svg className="w-12 h-12 md:w-16 md:h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Authentication Required</h3>
          <p className="text-gray-400 mb-4 md:mb-6 text-sm md:text-base">
            {authError || 'You need to be logged in to place an order'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Link
              href="/login"
              className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm md:text-base"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 md:px-6 py-2 md:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm md:text-base"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading checkout...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="space-y-2 p-1">
        <div className="bg-gray-800 rounded-xl p-6 md:p-12 border border-gray-700 text-center">
          <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
          </svg>
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Your cart is empty</h3>
          <p className="text-gray-400 mb-4 md:mb-6 text-sm md:text-base">Add items to your cart before checkout</p>
          <Link
            href="/user-dashboard/shop"
            className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm md:text-base"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-1">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-3 md:p-6 border border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Place Order</h1>
            <p className="text-gray-400 mt-1 md:mt-2 text-sm md:text-base">Complete your order details</p>
          </div>
          <Link
            href="/user-dashboard/cart"
            className="px-3 md:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm md:text-base text-center"
          >
            Back to Cart
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {/* Checkout Form */}
        <div className="space-y-3 md:space-y-6">
          {/* Shipping Information */}
          <div className="bg-gray-800 rounded-xl p-3 md:p-6 border border-gray-700">
            <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Shipping Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1 md:mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-2 md:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1 md:mb-2">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-2 md:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1 md:mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-2 md:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1 md:mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-2 md:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1 md:mb-2">Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-2 md:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1 md:mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-2 md:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1 md:mb-2">Country *</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-2 md:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1 md:mb-2">ZIP Code *</label>
                <input
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className="w-full px-2 md:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          {/* Payment Proof Section - Only show for users without active packages */}
          {shoppingEligibility?.shopping?.shoppingType === 'payment_proof_required' && (
            <div className="bg-gray-800 rounded-xl p-3 md:p-6 border border-gray-700">
              <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Payment Proof Required</h2>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 md:p-4 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-yellow-200 text-sm md:text-base font-medium mb-1">Payment Proof Required</p>
                    <p className="text-yellow-100 text-xs md:text-sm">
                      {shoppingEligibility?.package 
                        ? 'Your shopping limit has been consumed. Please upload your payment proof to continue shopping. '
                        : 'Since you don\'t have an active package, please upload your payment proof. '
                      }
                      The order amount will be added to your account balance after admin approval.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 md:space-y-4">
                {/* Transaction ID */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1 md:mb-2">
                    Transaction ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.transactionId}
                    onChange={(e) => handlePaymentDataChange('transactionId', e.target.value)}
                    placeholder="Enter your transaction ID"
                    className="w-full px-2 md:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1 md:mb-2">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={paymentData.paymentMethod}
                    onChange={(e) => handlePaymentDataChange('paymentMethod', e.target.value)}
                    className="w-full px-2 md:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm md:text-base"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="upaisa">UPaisa</option>
                    <option value="cash_deposit">Cash Deposit</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Payment Proof Image */}
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-300 mb-1 md:mb-2">
                    Upload Payment Proof *
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handlePaymentProofUpload}
                    className="w-full px-2 md:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm md:text-base file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  {paymentProof && (
                    <div className="mt-2 p-2 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <p className="text-green-200 text-xs md:text-sm">✓ Payment proof uploaded successfully</p>
                    </div>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    Accepted formats: JPG, PNG, PDF. Max size: 5MB
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Order Summary */}
        <div className="space-y-3 md:space-y-6">
          <div className="bg-gray-800 rounded-xl p-3 md:p-6 border border-gray-700 sticky top-6">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-700 rounded-lg overflow-hidden mr-2 md:mr-3 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-medium text-xs md:text-sm truncate">{item.title}</h4>
                      <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-white font-medium text-xs md:text-sm ml-2">
                    PKR {((item.sale_price || item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm md:text-base">Subtotal</span>
                <span className="text-white text-sm md:text-base">PKR {getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm md:text-base">Shipping</span>
                <span className="text-white text-sm md:text-base">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm md:text-base">Tax</span>
                <span className="text-white text-sm md:text-base">PKR 0.00</span>
              </div>
              <div className="border-t border-gray-700 pt-2 md:pt-3">
                <div className="flex justify-between">
                  <span className="text-base md:text-lg font-bold text-white">Total</span>
                  <span className="text-base md:text-lg font-bold text-white">PKR {getTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handleSubmit}
              className="w-full py-2 md:py-3 px-3 md:px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm md:text-base"
            >
              Place Order
            </button>

            <div className="mt-3 md:mt-4 text-center">
              {shoppingEligibility?.shopping?.shoppingType === 'payment_proof_required' ? (
                <p className="text-xs md:text-sm text-yellow-400">
                  Order will be processed after payment proof approval
                </p>
              ) : (
                <p className="text-xs md:text-sm text-gray-400">
                  Order will be processed after confirmation
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
