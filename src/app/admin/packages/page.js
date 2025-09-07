'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    rankId: 'all',
    minAmount: '',
    maxAmount: ''
  });
  const [formData, setFormData] = useState({
    package_name: '',
    package_amount: '',
    package_direct_commission: '',
    package_indirect_commission: '',
    d_crages: '',
    shopping_amount: '',
    package_points: '',
    status: 'active',
    rankId: ''
  });

  useEffect(() => {
    fetchPackages();
    fetchRanks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [packages, filters]);

  const applyFilters = () => {
    let filtered = [...packages];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(pkg => 
        pkg.package_name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(pkg => pkg.status === filters.status);
    }

    // Rank filter
    if (filters.rankId !== 'all') {
      if (filters.rankId === '') {
        // Filter for packages with no rank
        filtered = filtered.filter(pkg => !pkg.rankId || pkg.rankId === null);
      } else {
        // Filter for packages with specific rank
        filtered = filtered.filter(pkg => pkg.rankId === parseInt(filters.rankId));
      }
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(pkg => parseFloat(pkg.package_amount) >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(pkg => parseFloat(pkg.package_amount) <= parseFloat(filters.maxAmount));
    }

    setFilteredPackages(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      rankId: 'all',
      minAmount: '',
      maxAmount: ''
    });
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRanks = async () => {
    try {
      const response = await fetch('/api/admin/ranks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRanks(data.ranks || []);
      }
    } catch (error) {
      console.error('Error fetching ranks:', error);
    }
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          package_name: '',
          package_amount: '',
          package_direct_commission: '',
          package_indirect_commission: '',
          d_crages: '',
          shopping_amount: '',
          package_points: '',
          status: 'active',
          rankId: ''
        });
        fetchPackages();
      }
    } catch (error) {
      console.error('Error adding package:', error);
    }
  };

  const handleEditPackage = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/packages/${selectedPackage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedPackage(null);
        setFormData({
          package_name: '',
          package_amount: '',
          package_direct_commission: '',
          package_indirect_commission: '',
          d_crages: '',
          shopping_amount: '',
          package_points: '',
          status: 'active',
          rankId: ''
        });
        fetchPackages();
      }
    } catch (error) {
      console.error('Error updating package:', error);
    }
  };

  const handleDeletePackage = async () => {
    try {
      const response = await fetch(`/api/packages/${selectedPackage.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedPackage(null);
        fetchPackages();
      }
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  const openEditModal = (packageItem) => {
    setSelectedPackage(packageItem);
    setFormData({
      package_name: packageItem.package_name || '',
      package_amount: packageItem.package_amount?.toString() || '',
      package_direct_commission: packageItem.package_direct_commission?.toString() || '',
      package_indirect_commission: packageItem.package_indirect_commission?.toString() || '',
      d_crages: packageItem.d_crages?.toString() || '',
      shopping_amount: packageItem.shopping_amount?.toString() || '',
      package_points: packageItem.package_points?.toString() || '',
      status: packageItem.status || 'active',
      rankId: packageItem.rankId?.toString() || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (packageItem) => {
    setSelectedPackage(packageItem);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      inactive: { color: 'bg-red-100 text-red-800', text: 'Inactive' },
      draft: { color: 'bg-yellow-100 text-yellow-800', text: 'Draft' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
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
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Package Management</h1>
          <p className="text-gray-600">Manage subscription packages and plans</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Package</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Packages</label>
            <input
              type="text"
              placeholder="Search by package name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800"
            />
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Rank Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Alloted Rank</label>
            <select
              value={filters.rankId}
              onChange={(e) => setFilters({ ...filters, rankId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800"
            >
              <option value="all">All Ranks</option>
              <option value="">No Rank</option>
              {ranks.map((rank) => (
                <option key={rank.id} value={rank.id}>
                  {rank.title}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Range */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Range (PKR)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>
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
          Showing {filteredPackages.length} of {packages.length} packages
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((packageItem) => (
          <div key={packageItem.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{packageItem.package_name}</h3>
                {getStatusBadge(packageItem.status)}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Package Amount:</span>
                  <span className="text-lg font-semibold text-purple-600">₨{packageItem.package_amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Direct Commission:</span>
                  <span className="text-sm font-medium text-green-600">₨{packageItem.package_direct_commission}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Indirect Commission:</span>
                  <span className="text-sm font-medium text-blue-600">₨{packageItem.package_indirect_commission}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">D Crages:</span>
                  <span className="text-sm font-medium text-yellow-600">₨{packageItem.d_crages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Shopping Amount:</span>
                  <span className="text-sm font-medium text-orange-600">₨{packageItem.shopping_amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Package Points:</span>
                  <span className="text-sm font-medium text-indigo-600">{packageItem.package_points || 0}</span>
                </div>
                {packageItem.rank && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Alloted Rank:</span>
                    <span className="text-sm font-medium text-purple-600">{packageItem.rank.title} ({packageItem.rank.required_points} pts)</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(packageItem)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal(packageItem)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg text-sm transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPackages.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8 max-w-md mx-auto">
            <svg className="w-16 h-16 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No packages found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first package</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Add Package
            </button>
          </div>
        </div>
      )}

      {/* Add Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-purple-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-3xl">
              <h2 className="text-2xl font-bold">Add New Package</h2>
              <p className="text-purple-100 mt-1">Create a new subscription package</p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleAddPackage} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Package Name</label>
                    <input
                      type="text"
                      required
                      value={formData.package_name}
                      onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800"
                      placeholder="Enter package name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Package Amount (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.package_amount}
                      onChange={(e) => setFormData({ ...formData, package_amount: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800"
                      placeholder="₨0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Direct Commission (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.package_direct_commission}
                      onChange={(e) => setFormData({ ...formData, package_direct_commission: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="₨0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Indirect Commission (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.package_indirect_commission}
                      onChange={(e) => setFormData({ ...formData, package_indirect_commission: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="₨0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">D Crages (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.d_crages}
                      onChange={(e) => setFormData({ ...formData, d_crages: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="₨0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Shopping Amount (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.shopping_amount}
                      onChange={(e) => setFormData({ ...formData, shopping_amount: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="₨0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Package Points</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={formData.package_points}
                      onChange={(e) => setFormData({ ...formData, package_points: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Alloted Rank</label>
                    <select
                      value={formData.rankId}
                      onChange={(e) => setFormData({ ...formData, rankId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800"
                    >
                      <option value="">No Rank Alloted</option>
                      {ranks.map((rank) => (
                        <option key={rank.id} value={rank.id}>
                          {rank.title} ({rank.required_points} pts)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    Create Package
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl transition-all duration-300 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {showEditModal && selectedPackage && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-purple-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-3xl">
              <h2 className="text-2xl font-bold">Edit Package</h2>
              <p className="text-blue-100 mt-1">Update package information</p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleEditPackage} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Package Name</label>
                    <input
                      type="text"
                      required
                      value={formData.package_name}
                      onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800"
                      placeholder="Enter package name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Package Amount (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.package_amount}
                      onChange={(e) => setFormData({ ...formData, package_amount: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800"
                      placeholder="₨0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Direct Commission (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.package_direct_commission}
                      onChange={(e) => setFormData({ ...formData, package_direct_commission: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="₨0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Indirect Commission (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.package_indirect_commission}
                      onChange={(e) => setFormData({ ...formData, package_indirect_commission: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="₨0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">D Crages (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.d_crages}
                      onChange={(e) => setFormData({ ...formData, d_crages: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="₨0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Shopping Amount (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.shopping_amount}
                      onChange={(e) => setFormData({ ...formData, shopping_amount: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="₨0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Package Points</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={formData.package_points}
                      onChange={(e) => setFormData({ ...formData, package_points: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Alloted Rank</label>
                    <select
                      value={formData.rankId}
                      onChange={(e) => setFormData({ ...formData, rankId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800"
                    >
                      <option value="">No Rank Alloted</option>
                      {ranks.map((rank) => (
                        <option key={rank.id} value={rank.id}>
                          {rank.title} ({rank.required_points} pts)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    Update Package
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl transition-all duration-300 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPackage && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-red-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-3xl">
              <h2 className="text-2xl font-bold">Delete Package</h2>
              <p className="text-red-100 mt-1">This action cannot be undone</p>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &quot;<span className="font-semibold">{selectedPackage.package_name}</span>&quot;? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeletePackage}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
