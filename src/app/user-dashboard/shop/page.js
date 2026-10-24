"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserContext } from '../../../lib/userContext';

export default function Shop() {
  const context = useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [shoppingEligibility, setShoppingEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchProducts();
      fetchShoppingEligibility();
      // Load cart from localStorage only after mounting
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, [mounted]);

  // Safety check for context
  if (!context) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading...</p>
      </div>
    );
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const addToCart = (product) => {
    try {
      // Check if shopping is not allowed (Student package with 0 shopping amount)
      if (shoppingEligibility && !shoppingEligibility.eligible) {
        alert(
          `Shopping Not Available!\n\n` +
          `Your package (${shoppingEligibility.package?.name}) does not include shopping benefits.\n\n` +
          `Please upgrade your package to shop.`
        );
        return;
      }

      // Check if user has active package with shopping amount limit (only enforce if limit not consumed)
      // If limit is consumed, shoppingType will be 'payment_proof_required' and shopping is allowed without limit
      if (shoppingEligibility && 
          shoppingEligibility.shopping && 
          shoppingEligibility.shopping.shoppingType === 'package_benefits' &&
          shoppingEligibility.shopping.remainingAmount !== null) {
        
        // Calculate current cart total
        const currentCartTotal = getCartTotal();
        
        // Calculate new cart total if we add this product
        const productPrice = parseFloat(product.sale_price || product.price);
        const existingItem = cart.find(item => item.id === product.id);
        const newItemTotal = existingItem 
          ? productPrice // Adding 1 more
          : productPrice; // Adding new item
        
        const newCartTotal = currentCartTotal + newItemTotal;
        const remainingAmount = shoppingEligibility.shopping.remainingAmount;
        
        // Check if new cart total exceeds available shopping amount
        if (newCartTotal > remainingAmount) {
          const maxCanAdd = Math.max(0, remainingAmount - currentCartTotal);
          alert(
            `Shopping amount limit reached!\n\n` +
            `Available shopping amount: PKR ${remainingAmount.toFixed(2)}\n` +
            `Current cart total: PKR ${currentCartTotal.toFixed(2)}\n` +
            `You can add products worth: PKR ${maxCanAdd.toFixed(2)}\n\n` +
            `This product costs: PKR ${productPrice.toFixed(2)}`
          );
          return;
        }
      }
      
      // If limit is consumed (shoppingType is 'payment_proof_required'), allow shopping without limit restrictions
      // The checkout page will require payment proof

      // Proceed with adding to cart
      const existingItem = cart.find(item => item.id === product.id);
      if (existingItem) {
        const updatedCart = cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        setCart(updatedCart);
        if (mounted) {
          localStorage.setItem('cart', JSON.stringify(updatedCart));
        }
      } else {
        const updatedCart = [...cart, { ...product, quantity: 1 }];
        setCart(updatedCart);
        if (mounted) {
          localStorage.setItem('cart', JSON.stringify(updatedCart));
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.sale_price || item.price);
      return total + (price * item.quantity);
    }, 0);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading shop...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading products...</p>
      </div>
    );
  }

  return (
    <div key={mounted ? 'mounted' : 'loading'} className="space-y-2 p-1">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-3 md:p-6 border border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Shop Products</h1>
            <p className="text-gray-400 mt-1 md:mt-2 text-sm md:text-base">Browse and purchase products from our catalog</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Link
              href="/user-dashboard/orders"
              className="px-3 md:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm md:text-base text-center"
            >
              My Orders
            </Link>
            <Link
              href="/user-dashboard/cart"
              className="relative px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm md:text-base text-center"
            >
              Cart
              {mounted && getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Info: Shopping limit consumed - payment proof required */}
      {!eligibilityLoading && shoppingEligibility && shoppingEligibility.shopping && shoppingEligibility.shopping.shoppingType === 'payment_proof_required' && shoppingEligibility.package && (
        <div className="bg-gradient-to-r from-orange-900 to-red-900 rounded-xl p-4 md:p-6 border border-orange-700">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Shopping Limit Consumed</h3>
              <p className="text-sm text-gray-300 mb-3">
                Your shopping limit from your package ({shoppingEligibility.package.name}) has been consumed. 
                You can continue shopping by providing payment proof at checkout.
              </p>
              <div className="bg-orange-800/30 border border-orange-600 rounded-lg p-3">
                <p className="text-xs text-orange-200">
                  <strong>Note:</strong> After placing your order, upload payment proof. Your order will be processed after admin approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Amount Display */}
      {!eligibilityLoading && shoppingEligibility && shoppingEligibility.shopping && shoppingEligibility.shopping.shoppingType === 'package_benefits' && shoppingEligibility.shopping.remainingAmount !== null && (
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-4 md:p-6 border border-blue-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Shopping Amount</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Total Limit</p>
                  <p className="text-lg font-bold text-white">PKR {shoppingEligibility.package.shoppingAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Already Spent</p>
                  <p className="text-lg font-bold text-red-400">PKR {shoppingEligibility.shopping.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Current Cart</p>
                  <p className="text-lg font-bold text-yellow-400">PKR {getCartTotal().toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Remaining</p>
                  <p className="text-lg font-bold text-green-400">PKR {Math.max(0, shoppingEligibility.shopping.remainingAmount - getCartTotal()).toLocaleString()}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div className="flex h-full">
                  {/* Already Spent */}
                  {shoppingEligibility.shopping.totalSpent > 0 && (
                    <div 
                      className="bg-red-500 h-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (shoppingEligibility.shopping.totalSpent / shoppingEligibility.package.shoppingAmount) * 100)}%` 
                      }}
                    />
                  )}
                  
                  {/* Current Cart */}
                  {getCartTotal() > 0 && (
                    <div 
                      className="bg-yellow-500 h-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100 - (shoppingEligibility.shopping.totalSpent / shoppingEligibility.package.shoppingAmount) * 100, (getCartTotal() / shoppingEligibility.package.shoppingAmount) * 100)}%` 
                      }}
                    />
                  )}
                  
                  {/* Remaining */}
                  <div 
                    className="bg-green-500 h-full transition-all duration-300"
                    style={{ 
                      width: `${Math.max(0, ((shoppingEligibility.shopping.remainingAmount - getCartTotal()) / shoppingEligibility.package.shoppingAmount) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-300">Spent</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-gray-300">In Cart</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-300">Available</span>
                </div>
              </div>
            </div>

            {/* Warning if close to limit */}
            {(shoppingEligibility.shopping.remainingAmount - getCartTotal()) < (shoppingEligibility.package.shoppingAmount * 0.1) && (
              <div className="flex items-start space-x-2 bg-yellow-900/30 border border-yellow-600 rounded-lg p-3">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-yellow-400">Nearly at limit!</p>
                  <p className="text-xs text-yellow-300 mt-1">You have limited shopping amount remaining.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning for users with package but no shopping amount (Student package) */}
      {!eligibilityLoading && shoppingEligibility && shoppingEligibility.shopping && shoppingEligibility.shopping.shoppingType === 'no_shopping_allowed' && (
        <div className="bg-gradient-to-r from-red-900 to-orange-900 rounded-xl p-4 md:p-6 border border-red-700">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Shopping Not Available</h3>
              <p className="text-sm text-gray-300">
                Your current package ({shoppingEligibility.package?.name}) does not include shopping benefits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info for users without package or with payment proof - removed per request */}

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-xl p-3 md:p-6 border border-gray-700">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 md:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm md:text-base"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-200">
            {/* Product Image */}
            <div className="relative h-40 sm:h-48 bg-gray-700">
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-cover"
                onError={(e) => {
                  e.target.src = '/placeholder-product.jpg';
                }}
              />
              {product.discount && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  -{product.discount}%
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-2 md:p-4">
              <h3 className="text-white font-semibold mb-1 md:mb-2 line-clamp-2 text-xs md:text-base">{product.title}</h3>
              <p className="text-gray-400 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2">{product.description}</p>
              
              {/* Price */}
              <div className="mb-2 md:mb-4">
                <div className="flex flex-col space-y-1">
                  {product.discount ? (
                    <>
                      <span className="text-sm md:text-lg font-bold text-white">
                        PKR {parseFloat(product.sale_price).toFixed(2)}
                      </span>
                      <span className="text-xs md:text-sm text-gray-400 line-through">
                        PKR {parseFloat(product.price).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm md:text-lg font-bold text-white">
                      PKR {parseFloat(product.price).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button - No Restrictions */}
              <button
                onClick={() => addToCart(product)}
                className="w-full py-1.5 md:py-2 px-2 md:px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 text-xs md:text-base"
              >
                {shoppingEligibility?.shopping?.shoppingType === 'payment_proof_required' ? 'Add to Cart (Payment Proof)' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-gray-800 rounded-xl p-6 md:p-12 border border-gray-700 text-center">
          <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No products found</h3>
          <p className="text-gray-400 text-sm md:text-base">Try adjusting your search or filter criteria</p>
        </div>
      )}

      

      {/* Shopping Benefits */}
      <div className="bg-gray-800 rounded-xl p-3 md:p-6 border border-gray-700">
        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Why Shop With Us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="flex items-center">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3 md:mr-4">
              <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm md:text-base">Quality Products</h3>
              <p className="text-gray-400 text-xs md:text-sm">Premium quality products at competitive prices</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3 md:mr-4">
              <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm md:text-base">Fast Delivery</h3>
              <p className="text-gray-400 text-xs md:text-sm">Quick and reliable shipping to your doorstep</p>
            </div>
          </div>
          
          <div className="flex items-center sm:col-span-2 lg:col-span-1">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3 md:mr-4">
              <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm md:text-base">Secure Shopping</h3>
              <p className="text-gray-400 text-xs md:text-sm">Safe and secure payment processing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


