"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "../../../lib/userContext";

export default function Orders() {
  const { user, loading: authLoading, error: authError, isAuthenticated } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchOrders();
    }
  }, [mounted]);

  const fetchOrders = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/orders?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading orders...</p>
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
            {authError || 'You need to be logged in to view your orders'}
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
        <p className="text-gray-400 mt-4">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Orders</h1>
            <p className="text-gray-400 mt-2">Track your order history and status</p>
          </div>
          <Link
            href="/user-dashboard/shop"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Shop Now
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        /* Empty State */
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No orders yet</h3>
          <p className="text-gray-400 mb-6">Start shopping to see your orders here</p>
          <Link
            href="/user-dashboard/shop"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {/* Order Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Order #{order.orderNumber}</h3>
                    <p className="text-gray-400 text-sm">Placed on {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className="text-lg font-bold text-white">
                      PKR {parseFloat(order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <div className="space-y-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden mr-4">
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder-product.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{item.product.title}</h4>
                        <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-medium">
                          PKR {parseFloat(item.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Actions */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Total: <span className="text-white font-medium">PKR {parseFloat(order.totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200">
                        Track Order
                      </button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
