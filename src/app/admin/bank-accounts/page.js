'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminBankAccounts() {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [filteredBankAccounts, setFilteredBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    bankTitle: '',
    accountTitle: ''
  });
  const [formData, setFormData] = useState({
    bank_title: '',
    bank_accountno: '',
    account_title: '',
    iban_no: ''
  });

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bankAccounts, filters]);

  const applyFilters = () => {
    let filtered = [...bankAccounts];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(account => 
        account.bank_title.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.account_title.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.bank_accountno.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.iban_no.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Bank title filter
    if (filters.bankTitle) {
      filtered = filtered.filter(account => 
        account.bank_title.toLowerCase().includes(filters.bankTitle.toLowerCase())
      );
    }

    // Account title filter
    if (filters.accountTitle) {
      filtered = filtered.filter(account => 
        account.account_title.toLowerCase().includes(filters.accountTitle.toLowerCase())
      );
    }

    setFilteredBankAccounts(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      bankTitle: '',
      accountTitle: ''
    });
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/admin/bank_management', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.bankAccounts || []);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBankAccount = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/bank_management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({ bank_title: '', bank_accountno: '', account_title: '', iban_no: '' });
        fetchBankAccounts();
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
    }
  };

  const handleEditBankAccount = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/bank_management/${selectedBankAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedBankAccount(null);
        setFormData({ bank_title: '', bank_accountno: '', account_title: '', iban_no: '' });
        fetchBankAccounts();
      }
    } catch (error) {
      console.error('Error updating bank account:', error);
    }
  };

  const handleDeleteBankAccount = async () => {
    try {
      const response = await fetch(`/api/admin/bank_management/${selectedBankAccount.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedBankAccount(null);
        fetchBankAccounts();
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
    }
  };

  const openEditModal = (bankAccount) => {
    setSelectedBankAccount(bankAccount);
    setFormData({
      bank_title: bankAccount.bank_title,
      bank_accountno: bankAccount.bank_accountno,
      account_title: bankAccount.account_title,
      iban_no: bankAccount.iban_no
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (bankAccount) => {
    setSelectedBankAccount(bankAccount);
    setShowDeleteModal(true);
  };

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
        <div className="flex items-center space-x-4">
          <Link
            href="https://steelblue-cod-355377.hostingersite.com/uploadImage.php"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bank Account Management</h1>
            <p className="text-gray-600">Manage company bank accounts</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Bank Account</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Bank Accounts</label>
            <input
              type="text"
              placeholder="Search by bank title, account title, account number, or IBAN..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800"
            />
          </div>

          {/* Bank Title Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Title</label>
            <input
              type="text"
              placeholder="Filter by bank title..."
              value={filters.bankTitle}
              onChange={(e) => setFilters({ ...filters, bankTitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800"
            />
          </div>

          {/* Account Title Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Account Title</label>
            <input
              type="text"
              placeholder="Filter by account title..."
              value={filters.accountTitle}
              onChange={(e) => setFilters({ ...filters, accountTitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800"
            />
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 font-semibold"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredBankAccounts.length} of {bankAccounts.length} bank accounts
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBankAccounts.map((bankAccount) => (
          <div key={bankAccount.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{bankAccount.bank_title}</h3>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Account Title</p>
                  <p className="text-gray-800 font-medium">{bankAccount.account_title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="text-gray-800 font-mono text-sm">{bankAccount.bank_accountno}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IBAN</p>
                  <p className="text-gray-800 font-mono text-sm">{bankAccount.iban_no}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(bankAccount)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal(bankAccount)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBankAccounts.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No bank accounts found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first bank account</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Add Bank Account
          </button>
        </div>
      )}

      {/* Add Bank Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-purple-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Bank Account</h2>
            <form onSubmit={handleAddBankAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Title</label>
                <input
                  type="text"
                  required
                  value={formData.bank_title}
                  onChange={(e) => setFormData({ ...formData, bank_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  placeholder="e.g., HBL Bank, UBL Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Title</label>
                <input
                  type="text"
                  required
                  value={formData.account_title}
                  onChange={(e) => setFormData({ ...formData, account_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  placeholder="Account holder name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  value={formData.bank_accountno}
                  onChange={(e) => setFormData({ ...formData, bank_accountno: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  placeholder="Account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN Number</label>
                <input
                  type="text"
                  required
                  value={formData.iban_no}
                  onChange={(e) => setFormData({ ...formData, iban_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  placeholder="IBAN number"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                >
                  Add Bank Account
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

      {/* Edit Bank Account Modal */}
      {showEditModal && selectedBankAccount && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-purple-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Bank Account</h2>
            <form onSubmit={handleEditBankAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Title</label>
                <input
                  type="text"
                  required
                  value={formData.bank_title}
                  onChange={(e) => setFormData({ ...formData, bank_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Title</label>
                <input
                  type="text"
                  required
                  value={formData.account_title}
                  onChange={(e) => setFormData({ ...formData, account_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  value={formData.bank_accountno}
                  onChange={(e) => setFormData({ ...formData, bank_accountno: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN Number</label>
                <input
                  type="text"
                  required
                  value={formData.iban_no}
                  onChange={(e) => setFormData({ ...formData, iban_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                >
                  Update Bank Account
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
      {showDeleteModal && selectedBankAccount && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-red-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Delete Bank Account</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the bank account for &quot;{selectedBankAccount.bank_title}&quot;? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteBankAccount}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg transition-colors"
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
