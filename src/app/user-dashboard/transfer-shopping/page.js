"use client";

import { useState, useEffect, useContext } from 'react';
import { UserContext } from "../../../lib/userContext";

export default function TransferShoppingPage() {
  const { user, isAuthenticated } = useContext(UserContext) || {};
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [transferDialog, setTransferDialog] = useState(false);
  const [transferForm, setTransferForm] = useState({
    username: '',
    amount: '',
    description: ''
  });
  const [shoppingAmount, setShoppingAmount] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState('all'); // 'all', 'sent', 'received'

  // Fetch shopping transfers
  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: filterType
      });

      const response = await fetch(`/api/user/shopping-transfers?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setTransfers(result.data.transfers);
      } else {
        setError('Failed to fetch transfer history');
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setError('Error loading transfer history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user shopping amount
  const fetchShoppingAmount = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setShoppingAmount(parseFloat(data.user.shoppingAmount || 0));
        }
      }
    } catch (error) {
      console.error('Error fetching shopping amount:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchShoppingAmount();
      fetchTransfers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, filterType]);

  // Handle transfer form submission
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/shopping-transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(transferForm)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        setTransferDialog(false);
        setTransferForm({ username: '', amount: '', description: '' });
        fetchShoppingAmount(); // Refresh shopping amount
        fetchTransfers(); // Refresh the list
      } else {
        setError(result.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setError('Error processing transfer');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-400">Please log in to access this page</p>
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
            <h1 className="text-2xl font-bold text-white">Transfer Shopping Amount</h1>
            <p className="text-gray-400 mt-2">Send shopping amount to other users</p>
          </div>
          <button
            onClick={() => setTransferDialog(true)}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send Shopping Amount
          </button>
        </div>
      </div>

      {/* Current Shopping Amount */}
      <div className="bg-gradient-to-r from-cyan-900 to-blue-900 rounded-xl p-6 border border-cyan-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-cyan-300 font-semibold mb-1">Current Shopping Amount</h3>
            <p className="text-3xl font-bold text-white">
              PKR {shoppingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-16 h-16 bg-cyan-500 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-300">{message}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'all' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Transfers
          </button>
          <button
            onClick={() => setFilterType('sent')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'sent' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Sent
          </button>
          <button
            onClick={() => setFilterType('received')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'received' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Received
          </button>
          <button
            onClick={fetchTransfers}
            className="ml-auto px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Transfer History Table */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Transfer History</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-400">Loading...</td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-400">No transfers found</td>
                </tr>
              ) : (
                transfers.map((transfer) => {
                  const isSent = transfer.fromUserId === user?.id;
                  return (
                    <tr key={transfer.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">#{transfer.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isSent ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'
                        }`}>
                          {isSent ? 'Sent' : 'Received'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div>
                          <div className="font-medium">{transfer.fromUser?.fullname || 'N/A'}</div>
                          <div className="text-gray-400">@{transfer.fromUser?.username || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div>
                          <div className="font-medium">{transfer.toUser?.fullname || 'N/A'}</div>
                          <div className="text-gray-400">@{transfer.toUser?.username || 'N/A'}</div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        isSent ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {isSent ? '-' : '+'}PKR {parseFloat(transfer.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{transfer.description || 'No description'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transfer.status === 'completed' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
                        }`}>
                          {transfer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(transfer.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Dialog */}
      {transferDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Shopping Amount
            </h2>
            <form onSubmit={handleTransferSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Username</label>
                  <input
                    type="text"
                    value={transferForm.username}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, username: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount (PKR)</label>
                  <input
                    type="number"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    min="0"
                    step="0.01"
                    max={shoppingAmount}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-gray-400 mt-1">Available: PKR {shoppingAmount.toFixed(2)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                  <textarea
                    value={transferForm.description}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Enter description"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setTransferDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

