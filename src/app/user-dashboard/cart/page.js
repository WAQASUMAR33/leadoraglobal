"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setLoading(false);
  }, []);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
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

  const handleCheckout = () => {
    // Redirect to checkout page
    window.location.href = '/user-dashboard/checkout';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
            <p className="text-gray-400 mt-2">
              {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
                     <div className="flex space-x-3">
             <Link
               href="/user-dashboard/orders"
               className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
             >
               My Orders
             </Link>
             <Link
               href="/user-dashboard/shop"
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
             >
               Continue Shopping
             </Link>
           </div>
        </div>
      </div>

      {cart.length === 0 ? (
        /* Empty Cart */
        <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
          <p className="text-gray-400 mb-6">Start shopping to add items to your cart</p>
          <Link
            href="/user-dashboard/shop"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden mr-4">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">{item.description}</p>
                    
                    {/* Price */}
                    <div className="flex items-center space-x-2">
                      {item.sale_price ? (
                        <>
                                                     <span className="text-lg font-bold text-white">
                             PKR {parseFloat(item.sale_price).toFixed(2)}
                           </span>
                           <span className="text-sm text-gray-400 line-through">
                             PKR {parseFloat(item.price).toFixed(2)}
                           </span>
                        </>
                      ) : (
                                                 <span className="text-lg font-bold text-white">
                           PKR {parseFloat(item.price).toFixed(2)}
                         </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2 mr-4">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-white font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                    >
                      +
                    </button>
                  </div>

                  {/* Total Price */}
                  <div className="text-right mr-4">
                                       <div className="text-lg font-bold text-white">
                     PKR {((item.sale_price || item.price) * item.quantity).toFixed(2)}
                   </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-300 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-6">
              <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
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
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-white">Total</span>
                                         <span className="text-lg font-bold text-white">PKR {getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200"
              >
                Proceed to Checkout
              </button>

                             <div className="mt-4 text-center">
                 <p className="text-sm text-gray-400">
                   Order will be processed after confirmation
                 </p>
               </div>
            </div>


          </div>
        </div>
      )}
    </div>
  );
}


