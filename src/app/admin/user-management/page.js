'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showUpdateWalletModal, setShowUpdateWalletModal] = useState(false);
  const [showUpdatePointsModal, setShowUpdatePointsModal] = useState(false);
  const [showUpdateRankModal, setShowUpdateRankModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [newRankId, setNewRankId] = useState('');
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);
  const [walletUpdateLoading, setWalletUpdateLoading] = useState(false);
  const [pointsUpdateLoading, setPointsUpdateLoading] = useState(false);
  const [rankUpdateLoading, setRankUpdateLoading] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState('');
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState('');
  const [walletUpdateError, setWalletUpdateError] = useState('');
  const [walletUpdateSuccess, setWalletUpdateSuccess] = useState('');
  const [pointsUpdateError, setPointsUpdateError] = useState('');
  const [pointsUpdateSuccess, setPointsUpdateSuccess] = useState('');
  const [rankUpdateError, setRankUpdateError] = useState('');
  const [rankUpdateSuccess, setRankUpdateSuccess] = useState('');
  const [ranks, setRanks] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });

  // Remove pagination state - we'll show all records

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem('admin');
    const adminToken = localStorage.getItem('adminToken');
    
    console.log('Admin data in localStorage:', adminData ? 'Present' : 'Missing');
    console.log('Admin token in localStorage:', adminToken ? 'Present' : 'Missing');
    
    if (!adminData || !adminToken) {
      console.error('Admin not logged in, redirecting to login');
      window.location.href = '/admin/login';
      return;
    }
    
    fetchUsers();
    fetchRanks();
  }, []);

  // Helper function to get authenticated headers
  const getAuthHeaders = () => {
    const adminToken = localStorage.getItem('adminToken');
    console.log('Admin token from localStorage:', adminToken ? 'Present' : 'Missing');
    return {
      'Content-Type': 'application/json',
      ...(adminToken && { 'Authorization': `Bearer ${adminToken}` }),
    };
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users without pagination
      const response = await fetch(`/api/admin/users?limit=all`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      
      console.log('Fetch users response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users fetched successfully:', data);
        setUsers(Array.isArray(data.users) ? data.users : []);
      } else if (response.status === 401) {
        console.error('Authentication failed, redirecting to login');
        // Clear invalid tokens
        localStorage.removeItem('admin');
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response data:', errorData);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRanks = async () => {
    try {
      const response = await fetch('/api/admin/ranks', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRanks(data.ranks || []);
      } else {
        console.error('Failed to fetch ranks:', response.status);
      }
    } catch (error) {
      console.error('Error fetching ranks:', error);
    }
  };

  const applyFilters = useCallback(() => {
    if (!users || !Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = [...users];

    if (filters.search) {
      filtered = filtered.filter(user =>
        user?.fullname?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user?.username?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user?.email?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user?.status === filters.status);
    }

    setFilteredUsers(filtered);
  }, [users, filters]);

  useEffect(() => {
    applyFilters();
  }, [users, filters, applyFilters]);

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
    });
  };

  const openUpdatePasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordUpdateError('');
    setPasswordUpdateSuccess('');
    setShowUpdatePasswordModal(true);
  };

  const openUpdateWalletModal = (user) => {
    setSelectedUser(user);
    setNewWalletBalance(user.balance || 0);
    setWalletUpdateError('');
    setWalletUpdateSuccess('');
    setShowUpdateWalletModal(true);
  };

  const openUpdatePointsModal = (user) => {
    setSelectedUser(user);
    setNewPoints(user.points || 0);
    setPointsUpdateError('');
    setPointsUpdateSuccess('');
    setShowUpdatePointsModal(true);
  };

  const openUpdateRankModal = (user) => {
    setSelectedUser(user);
    setNewRankId(user.rankId || '');
    setRankUpdateError('');
    setRankUpdateSuccess('');
    setShowUpdateRankModal(true);
  };

  const openUserDetailsModal = (user) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordUpdateLoading(true);
    setPasswordUpdateError('');
    setPasswordUpdateSuccess('');

    if (newPassword.length < 6) {
      setPasswordUpdateError('Password must be at least 6 characters long.');
      setPasswordUpdateLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordUpdateError('Passwords do not match.');
      setPasswordUpdateLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setPasswordUpdateSuccess('Password updated successfully!');
        setShowUpdatePasswordModal(false);
        fetchUsers(); // Refresh user list
      } else {
        setPasswordUpdateError(data.error || data.message || 'Failed to update password.');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordUpdateError('An unexpected error occurred.');
    } finally {
      setPasswordUpdateLoading(false);
    }
  };

  const handleUpdateWallet = async (e) => {
    e.preventDefault();
    setWalletUpdateLoading(true);
    setWalletUpdateError('');
    setWalletUpdateSuccess('');

    const balance = parseFloat(newWalletBalance);
    if (isNaN(balance) || balance < 0) {
      setWalletUpdateError('Please enter a valid balance amount.');
      setWalletUpdateLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ balance: balance }),
      });

      const data = await response.json();
      if (response.ok) {
        setWalletUpdateSuccess('Wallet balance updated successfully!');
        setShowUpdateWalletModal(false);
        fetchUsers(); // Refresh user list
      } else {
        setWalletUpdateError(data.error || data.message || 'Failed to update wallet balance.');
      }
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      setWalletUpdateError('An unexpected error occurred.');
    } finally {
      setWalletUpdateLoading(false);
    }
  };

  const handleUpdatePoints = async (e) => {
    e.preventDefault();
    setPointsUpdateLoading(true);
    setPointsUpdateError('');
    setPointsUpdateSuccess('');

    const points = parseInt(newPoints);
    if (isNaN(points) || points < 0) {
      setPointsUpdateError('Please enter a valid points amount.');
      setPointsUpdateLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ points: points }),
      });

      const data = await response.json();
      if (response.ok) {
        setPointsUpdateSuccess('Points updated successfully!');
        setShowUpdatePointsModal(false);
        fetchUsers(); // Refresh user list
      } else {
        setPointsUpdateError(data.error || data.message || 'Failed to update points.');
      }
    } catch (error) {
      console.error('Error updating points:', error);
      setPointsUpdateError('An unexpected error occurred.');
    } finally {
      setPointsUpdateLoading(false);
    }
  };

  const handleUpdateRank = async (e) => {
    e.preventDefault();
    setRankUpdateLoading(true);
    setRankUpdateError('');
    setRankUpdateSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ rankId: newRankId ? parseInt(newRankId) : null }),
      });

      const data = await response.json();
      if (response.ok) {
        setRankUpdateSuccess('Rank updated successfully!');
        setShowUpdateRankModal(false);
        fetchUsers(); // Refresh user list
      } else {
        setRankUpdateError(data.error || data.message || 'Failed to update rank.');
      }
    } catch (error) {
      console.error('Error updating rank:', error);
      setRankUpdateError('An unexpected error occurred.');
    } finally {
      setRankUpdateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination removed - showing all records

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Safety check to prevent rendering errors
  if (!Array.isArray(users)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading user data</p>
          <button 
            onClick={fetchUsers}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600 mt-2">View all users and manage their accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Users</label>
            <input
              type="text"
              placeholder="Search by name, username, or email..."
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
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
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
          Showing {filteredUsers.length} users (All records)
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(filteredUsers) && filteredUsers.map((user) => user && (
                <tr key={user.id} className="hover:bg-gray-50">
                  {/* Name Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.fullname?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-800">
                          {user.fullname || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Username Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-800 font-medium">{user.username || 'Unknown'}</div>
                  </td>
                  
                  {/* Points Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-800 font-medium">
                      {user.points || 0}
                    </div>
                  </td>
                  
                  {/* Wallet Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-800 font-medium">
                      {formatCurrency(user.balance)}
                    </div>
                  </td>
                  
                  {/* Rank Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-800">
                      {user.rank?.title || 'No Rank'}
                    </div>
                  </td>
                  
                  {/* Actions Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => openUserDetailsModal(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openUpdateWalletModal(user)}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                        title="Update Wallet"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openUpdatePointsModal(user)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                        title="Update Points"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openUpdateRankModal(user)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="Update Rank"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openUpdatePasswordModal(user)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Update Password"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2v5a2 2 0 01-2 2h-2a2 2 0 01-2-2v-5a2 2 0 012-2h2zm-2 0V4a2 2 0 012-2h2a2 2 0 012 2v3m-2 0h-2m-4 0H7a2 2 0 00-2 2v5a2 2 0 002 2h2a2 2 0 002-2v-5a2 2 0 00-2-2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">User Details</h3>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{selectedUser.fullname || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{selectedUser.username || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{selectedUser.email || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{selectedUser.phoneNumber || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{selectedUser.id}</div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Financial Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Balance</label>
                    <div className="text-lg font-semibold text-green-600">{formatCurrency(selectedUser.balance)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                    <div className="text-lg font-semibold text-blue-600">{selectedUser.points || 0}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Earnings</label>
                    <div className="text-lg font-semibold text-purple-600">{formatCurrency(selectedUser.totalEarnings)}</div>
                  </div>
                </div>
              </div>

              {/* Referral Info */}
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Referral Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referred By</label>
                    <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{selectedUser.referredBy || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referral Count</label>
                    <div className="text-lg font-semibold text-orange-600">{selectedUser.referralCount || 0}</div>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{formatDate(selectedUser.createdAt)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{formatDate(selectedUser.updatedAt)}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowUserDetailsModal(false);
                      openUpdatePasswordModal(selectedUser);
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Update Password
                  </button>
                  <button
                    onClick={() => setShowUserDetailsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      {showUpdatePasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Update Password for {selectedUser.username}</h3>
              <button
                onClick={() => setShowUpdatePasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {passwordUpdateError && (
                <p className="text-red-600 text-sm">{passwordUpdateError}</p>
              )}
              {passwordUpdateSuccess && (
                <p className="text-green-600 text-sm">{passwordUpdateSuccess}</p>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdatePasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordUpdateLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed"
                >
                  {passwordUpdateLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Wallet Modal */}
      {showUpdateWalletModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Update Wallet Balance for {selectedUser.username}</h3>
              <button
                onClick={() => setShowUpdateWalletModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateWallet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                  {formatCurrency(selectedUser.balance)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Balance</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-800"
                  value={newWalletBalance}
                  onChange={(e) => setNewWalletBalance(e.target.value)}
                />
              </div>
              {walletUpdateError && (
                <p className="text-red-600 text-sm">{walletUpdateError}</p>
              )}
              {walletUpdateSuccess && (
                <p className="text-green-600 text-sm">{walletUpdateSuccess}</p>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdateWalletModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walletUpdateLoading}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed"
                >
                  {walletUpdateLoading ? 'Updating...' : 'Update Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Points Modal */}
      {showUpdatePointsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Update Points for {selectedUser.username}</h3>
              <button
                onClick={() => setShowUpdatePointsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdatePoints} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Points</label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                  {selectedUser.points || 0}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Points</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                />
              </div>
              {pointsUpdateError && (
                <p className="text-red-600 text-sm">{pointsUpdateError}</p>
              )}
              {pointsUpdateSuccess && (
                <p className="text-green-600 text-sm">{pointsUpdateSuccess}</p>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdatePointsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pointsUpdateLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed"
                >
                  {pointsUpdateLoading ? 'Updating...' : 'Update Points'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Rank Modal */}
      {showUpdateRankModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Update Rank for {selectedUser.username}</h3>
              <button
                onClick={() => setShowUpdateRankModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateRank} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Rank</label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                  {selectedUser.rank?.title || 'No Rank'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Rank</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                  value={newRankId}
                  onChange={(e) => setNewRankId(e.target.value)}
                >
                  <option value="">No Rank</option>
                  {ranks.map((rank) => (
                    <option key={rank.id} value={rank.id}>
                      {rank.title} (Required: {rank.required_points} points)
                    </option>
                  ))}
                </select>
              </div>
              {rankUpdateError && (
                <p className="text-red-600 text-sm">{rankUpdateError}</p>
              )}
              {rankUpdateSuccess && (
                <p className="text-green-600 text-sm">{rankUpdateSuccess}</p>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdateRankModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rankUpdateLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {rankUpdateLoading ? 'Updating...' : 'Update Rank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}