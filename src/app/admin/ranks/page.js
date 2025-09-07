'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminRanks() {
  const [ranks, setRanks] = useState([]);
  const [filteredRanks, setFilteredRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRank, setSelectedRank] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    minPoints: '',
    maxPoints: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    required_points: '',
    details: ''
  });

  useEffect(() => {
    fetchRanks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [ranks, filters]);

  const applyFilters = () => {
    let filtered = [...ranks];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(rank => 
        rank.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        rank.details?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Points range filter
    if (filters.minPoints) {
      filtered = filtered.filter(rank => rank.required_points >= parseInt(filters.minPoints));
    }
    if (filters.maxPoints) {
      filtered = filtered.filter(rank => rank.required_points <= parseInt(filters.maxPoints));
    }

    setFilteredRanks(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      minPoints: '',
      maxPoints: ''
    });
  };

  const fetchRanks = async () => {
    try {
      const response = await fetch('/api/admin/rank_management', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRanks(data || []);
      }
    } catch (error) {
      console.error('Error fetching ranks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRank = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/rank_management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({ title: '', required_points: '', details: '' });
        fetchRanks();
      }
    } catch (error) {
      console.error('Error adding rank:', error);
    }
  };

  const handleEditRank = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/rank_management/${selectedRank.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedRank(null);
        setFormData({ title: '', required_points: '', details: '' });
        fetchRanks();
      }
    } catch (error) {
      console.error('Error updating rank:', error);
    }
  };

  const handleDeleteRank = async () => {
    try {
      const response = await fetch(`/api/admin/rank_management/${selectedRank.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedRank(null);
        fetchRanks();
      }
    } catch (error) {
      console.error('Error deleting rank:', error);
    }
  };

  const openEditModal = (rank) => {
    setSelectedRank(rank);
    setFormData({
      title: rank.title,
      required_points: rank.required_points.toString(),
      details: rank.details || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (rank) => {
    setSelectedRank(rank);
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
            <h1 className="text-3xl font-bold text-gray-800">Rank Management</h1>
            <p className="text-gray-600">Manage user ranks and levels</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Rank</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Ranks</label>
            <input
              type="text"
              placeholder="Search by title or details..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800"
            />
          </div>

          {/* Points Range */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Points Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min Points"
                value={filters.minPoints}
                onChange={(e) => setFilters({ ...filters, minPoints: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
              <input
                type="number"
                placeholder="Max Points"
                value={filters.maxPoints}
                onChange={(e) => setFilters({ ...filters, maxPoints: e.target.value })}
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
          Showing {filteredRanks.length} of {ranks.length} ranks
        </div>
      </div>

      {/* Ranks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRanks.map((rank) => (
          <div key={rank.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{rank.title}</h3>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                  {rank.required_points} pts
                </span>
              </div>
              {rank.details && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{rank.details}</p>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(rank)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal(rank)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRanks.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No ranks found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first rank</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Add Rank
          </button>
        </div>
      )}

      {/* Add Rank Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-purple-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Rank</h2>
            <form onSubmit={handleAddRank} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rank Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  placeholder="e.g., Bronze, Silver, Gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Points</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.required_points}
                  onChange={(e) => setFormData({ ...formData, required_points: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  placeholder="Optional description of the rank"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                >
                  Add Rank
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

      {/* Edit Rank Modal */}
      {showEditModal && selectedRank && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-purple-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Rank</h2>
            <form onSubmit={handleEditRank} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rank Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Points</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.required_points}
                  onChange={(e) => setFormData({ ...formData, required_points: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                >
                  Update Rank
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
      {showDeleteModal && selectedRank && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-red-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Delete Rank</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedRank.title}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteRank}
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

