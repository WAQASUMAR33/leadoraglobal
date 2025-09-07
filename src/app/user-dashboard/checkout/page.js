"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "../../../lib/userContext";

export default function Checkout() {
  const { user, loading: authLoading, error: authError, isAuthenticated } = useUser();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
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
      setLoading(false);
    }
  }, [mounted]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.phone || !formData.address || !formData.city || 
        !formData.country || !formData.zipCode) {
      alert('Please fill in all required fields');
      return;
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
        totalAmount: getTotal()
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
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">Authentication Required</h3>
          <p className="text-gray-400 mb-6">
            {authError || 'You need to be logged in to place an order'}
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
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
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
          <p className="text-gray-400 mb-6">Add items to your cart before checkout</p>
          <Link
            href="/user-dashboard/shop"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Browse Products
          </Link>
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
                         <h1 className="text-2xl font-bold text-white">Place Order</h1>
             <p className="text-gray-400 mt-2">Complete your order details</p>
          </div>
          <Link
            href="/user-dashboard/cart"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            Back to Cart
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checkout Form */}
        <div className="space-y-6">
          {/* Shipping Information */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Shipping Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Country *</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ZIP Code *</label>
                <input
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>


        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-6">
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-3 mb-6">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden mr-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-sm">{item.title}</h4>
                      <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-white font-medium">
                    PKR {((item.sale_price || item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">PKR {getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping</span>
                <span className="text-white">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tax</span>
                <span className="text-white">PKR 0.00</span>
              </div>
              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-white">Total</span>
                                       <span className="text-lg font-bold text-white">PKR {getTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handleSubmit}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200"
            >
              Place Order
            </button>

                           <div className="mt-4 text-center">
                 <p className="text-sm text-gray-400">
                   Order will be processed after confirmation
                 </p>
               </div>
          </div>
        </div>
      </div>
    </div>
  );
}
