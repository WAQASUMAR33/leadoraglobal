'use client';

import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../../lib/userContext';

export default function PaymentMethodsPage() {
  const context = useContext(UserContext);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [filteredPaymentMethods, setFilteredPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    bankName: ''
  });
  const [formData, setFormData] = useState({
    type: 'bank_transfer',
    bankName: '',
    accountName: '',
    accountNumber: '',
    ibanNumber: '',
    branchCode: '',
    mobileNumber: '',
    email: '',
    isDefault: false
  });

  useEffect(() => {
    setLoading(true);
    if (context?.isAuthenticated && context?.user) {
      fetchPaymentMethods();
    }
  }, [context?.isAuthenticated, context?.user]);

  useEffect(() => {
    applyFilters();
  }, [paymentMethods, filters]);

  const applyFilters = () => {
    let filtered = [...paymentMethods];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(method => 
        method.bankName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        method.accountName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        method.accountNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        method.ibanNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        method.mobileNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        method.email?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(method => method.type === filters.type);
    }

    // Bank name filter
    if (filters.bankName) {
      filtered = filtered.filter(method => 
        method.bankName?.toLowerCase().includes(filters.bankName.toLowerCase())
      );
    }

    setFilteredPaymentMethods(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      bankName: ''
    });
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/user/payment-methods', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const response = await fetch('/api/user/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
    setFormData({
          type: 'bank_transfer', 
          bankName: '', 
      accountName: '',
      accountNumber: '',
          ibanNumber: '', 
      branchCode: '',
      mobileNumber: '',
      email: '',
      isDefault: false
    });
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditPaymentMethod = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const response = await fetch(`/api/user/payment-methods/${selectedPaymentMethod.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedPaymentMethod(null);
        setFormData({ 
          type: 'bank_transfer', 
          bankName: '', 
          accountName: '', 
          accountNumber: '', 
          ibanNumber: '', 
          branchCode: '', 
          mobileNumber: '', 
          email: '', 
          isDefault: false 
        });
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePaymentMethod = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/user/payment-methods/${selectedPaymentMethod.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedPaymentMethod(null);
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (paymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setFormData({
      type: paymentMethod.type,
      bankName: paymentMethod.bankName || '',
      accountName: paymentMethod.accountName || '',
      accountNumber: paymentMethod.accountNumber || '',
      ibanNumber: paymentMethod.ibanNumber || '',
      branchCode: paymentMethod.branchCode || '',
      mobileNumber: paymentMethod.mobileNumber || '',
      email: paymentMethod.email || '',
      isDefault: paymentMethod.isDefault || false
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (paymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setShowDeleteModal(true);
  };

  const getPaymentMethodTypeLabel = (type) => {
    switch (type) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'easypaisa': return 'EasyPaisa';
      case 'jazzcash': return 'JazzCash';
      case 'paypal': return 'PayPal';
      default: return type;
    }
  };

  const getPaymentMethodDetails = (method) => {
    switch (method.type) {
      case 'bank_transfer':
        return `${method.bankName} - ${method.accountNumber}`;
      case 'easypaisa':
      case 'jazzcash':
        return method.mobileNumber;
      case 'paypal':
        return method.email;
      default:
        return method.accountNumber || method.mobileNumber || method.email;
    }
  };

  // Safety check for context
  if (!context) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Payment Methods</h1>
          <p className="text-gray-300">Manage your payment methods for withdrawals</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Payment Method</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Search Payment Methods</label>
            <input
              type="text"
              placeholder="Search by bank name, account title, account number, IBAN, mobile, or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
            />
          </div>

          {/* Type Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Payment Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            >
              <option value="">All Types</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="easypaisa">EasyPaisa</option>
              <option value="jazzcash">JazzCash</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          {/* Bank Name Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Bank Name</label>
            <input
              type="text"
              placeholder="Filter by bank name..."
              value={filters.bankName}
              onChange={(e) => setFilters({ ...filters, bankName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
            />
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl transition-all duration-300 font-semibold"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredPaymentMethods.length} of {paymentMethods.length} payment methods
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPaymentMethods.map((paymentMethod) => (
          <div key={paymentMethod.id} className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{getPaymentMethodTypeLabel(paymentMethod.type)}</h3>
                <div className="flex items-center space-x-2">
                  {paymentMethod.isDefault && (
                    <span className="bg-green-900 text-green-300 text-xs font-medium px-2 py-1 rounded-full">
                      Default
                    </span>
                  )}
                  <span className="bg-blue-900 text-blue-300 text-xs font-medium px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Account Title</p>
                  <p className="text-white font-medium">{paymentMethod.accountName}</p>
                </div>
                {paymentMethod.type === 'bank_transfer' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-400">Bank Name</p>
                      <p className="text-white font-medium">{paymentMethod.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Account Number</p>
                      <p className="text-white font-mono text-sm">{paymentMethod.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">IBAN</p>
                      <p className="text-white font-mono text-sm">{paymentMethod.ibanNumber}</p>
                    </div>
                  </>
                )}
                {(paymentMethod.type === 'easypaisa' || paymentMethod.type === 'jazzcash') && (
                  <div>
                    <p className="text-sm text-gray-400">Mobile Number</p>
                    <p className="text-white font-mono text-sm">{paymentMethod.mobileNumber}</p>
                  </div>
                )}
                {paymentMethod.type === 'paypal' && (
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white font-mono text-sm">{paymentMethod.email}</p>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(paymentMethod)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal(paymentMethod)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPaymentMethods.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">No payment methods found</h3>
          <p className="text-gray-400 mb-4">Get started by adding your first payment method</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Add Payment Method
          </button>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-purple-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Add New Payment Method</h2>
            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bank Title</label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                  placeholder="e.g., HBL Bank, UBL Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Title</label>
                <input
                  type="text"
                  required
                value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                  placeholder="Account holder name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                  placeholder="Account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">IBAN Number</label>
                <input
                  type="text"
                required
                  value={formData.ibanNumber}
                  onChange={(e) => setFormData({ ...formData, ibanNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                  placeholder="IBAN number"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
                >
                  {addLoading ? 'Adding...' : 'Add Payment Method'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Method Modal */}
      {showEditModal && selectedPaymentMethod && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-purple-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Edit Payment Method</h2>
            <form onSubmit={handleEditPaymentMethod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bank Title</label>
                <input
                  type="text"
                    required
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Title</label>
                <input
                  type="text"
                    required
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">IBAN Number</label>
                <input
                  type="text"
                  required
                  value={formData.ibanNumber}
                  onChange={(e) => setFormData({ ...formData, ibanNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
                >
                  {editLoading ? 'Updating...' : 'Update Payment Method'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPaymentMethod && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-red-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Delete Payment Method</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the payment method for &quot;{getPaymentMethodTypeLabel(selectedPaymentMethod.type)}&quot;? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeletePaymentMethod}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-gray-200 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
