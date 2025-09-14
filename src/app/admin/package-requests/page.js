"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PackageRequests() {
  const router = useRouter();
  const [packageRequests, setPackageRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchPackageRequests();
  }, [selectedStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPackageRequests = async (page = 1) => {
    try {
      setLoading(true);
      let url = `/api/admin/package-requests?page=${page}&limit=20`;
      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPackageRequests(data.packageRequests || []);
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 20,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else if (response.status === 401) {
        // Handle authentication error
        alert('Session expired. Please login again.');
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error fetching package requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetails = async (requestId) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/package-requests/${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedRequest(data.packageRequest);
        setShowDetailModal(true);
      } else if (response.status === 401) {
        // Handle authentication error
        alert('Session expired. Please login again.');
        router.push('/admin/login');
      } else {
        alert('Failed to fetch request details');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      alert('Error fetching request details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus, adminNotes = '') => {
    try {
      const response = await fetch(`/api/admin/package-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes
        })
      });

      if (response.ok) {
        alert(`Package request ${newStatus} successfully!`);
        fetchPackageRequests(); // Refresh the list
        setShowDetailModal(false); // Close modal after update
      } else if (response.status === 401) {
        // Handle authentication error
        alert('Session expired. Please login again.');
        router.push('/admin/login');
      } else {
        alert('Failed to update package request status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating package request status');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
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

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-28"></div>
            </div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-36"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-40 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-48"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  );

  if (loading && packageRequests.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>

        {/* Skeleton Cards */}
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Package Requests</h1>
            <p className="text-gray-600 mt-2">Manage user package subscription requests</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={() => fetchPackageRequests(pagination.currentPage)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Package Requests List */}
      <div className="space-y-4">
        {loading && packageRequests.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        )}
        
        {packageRequests.length === 0 && !loading ? (
          <div className="bg-white rounded-xl p-12 border border-gray-200 shadow-lg text-center">
            <p className="text-gray-600 text-lg">No package requests found.</p>
          </div>
        ) : (
          packageRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200 cursor-pointer" onClick={() => fetchRequestDetails(request.id)}>
              {/* Request Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Request #{request.id} - {request.user.fullname}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Submitted on {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    <span className="text-blue-600 text-sm font-medium">Click to view details</span>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* User Information */}
                  <div>
                    <h4 className="text-gray-900 font-medium mb-3">User Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Username:</span>
                        <span className="text-gray-900">{request.user.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="text-gray-900">{request.user.fullname}</span>
                      </div>
                    </div>
                  </div>

                  {/* Package Information */}
                  <div>
                    <h4 className="text-gray-900 font-medium mb-3">Package Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Package:</span>
                        <span className="text-gray-900">{request.package.package_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="text-gray-900">PKR {parseFloat(request.package.package_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="mb-6">
                  <h4 className="text-gray-900 font-medium mb-3">Transaction Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="text-gray-900 font-mono">{request.transactionId}</span>
                    </div>
                    {request.notes && (
                      <div>
                        <span className="text-gray-600">User Notes:</span>
                        <p className="text-gray-900 mt-1">{request.notes}</p>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Receipt:</span>
                      <span className="text-blue-600 text-sm">Available in details view</span>
                    </div>
                  </div>
                </div>

                {/* Quick Status Info */}
                {request.status === 'pending' && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-yellow-600 font-medium">
                      ⚠️ Action required: Click to view details and take action
                    </div>
                  </div>
                )}

                {request.adminNotes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <strong>Admin Notes:</strong> {request.adminNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} requests
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchPackageRequests(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchPackageRequests(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                        pageNum === pagination.currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => fetchPackageRequests(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Package Request Details - #{selectedRequest.id}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">Loading details...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* User Information */}
                    <div>
                      <h4 className="text-gray-900 font-medium mb-3">User Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Username:</span>
                          <span className="text-gray-900">{selectedRequest.user.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="text-gray-900">{selectedRequest.user.fullname}</span>
                        </div>
                      </div>
                    </div>

                    {/* Package Information */}
                    <div>
                      <h4 className="text-gray-900 font-medium mb-3">Package Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Package:</span>
                          <span className="text-gray-900">{selectedRequest.package.package_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="text-gray-900">PKR {parseFloat(selectedRequest.package.package_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="mb-6">
                    <h4 className="text-gray-900 font-medium mb-3">Transaction Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="text-gray-900 font-mono">{selectedRequest.transactionId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="text-gray-900">{formatDate(selectedRequest.createdAt)}</span>
                      </div>
                      {selectedRequest.notes && (
                        <div>
                          <span className="text-gray-600">User Notes:</span>
                          <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{selectedRequest.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Receipt Image */}
                  {selectedRequest.transactionReceipt && (
                   <div className="mb-6">
                     <h4 className="text-gray-900 font-medium mb-3">Transaction Receipt</h4>
                      <div className="max-w-md">
                        <Image
                          src={selectedRequest.transactionReceipt}
                         alt="Transaction Receipt"
                          width={400}
                          height={300}
                         className="w-full h-auto rounded-lg border border-gray-300"
                         onError={(e) => {
                           e.target.style.display = 'none';
                           e.target.nextSibling.style.display = 'block';
                         }}
                       />
                       <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 hidden">
                         <p className="text-gray-600 text-center">Image not available</p>
                         <a
                            href={selectedRequest.transactionReceipt}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-blue-600 hover:text-blue-700 text-sm text-center block mt-2"
                         >
                           View Receipt
                         </a>
                       </div>
                     </div>
                   </div>
                 )}

                  {/* Admin Notes */}
                  {selectedRequest.adminNotes && (
                    <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                      <h4 className="text-gray-900 font-medium mb-2">Admin Notes</h4>
                      <p className="text-gray-700 text-sm">{selectedRequest.adminNotes}</p>
                   </div>
                 )}

                {/* Admin Actions */}
                  {selectedRequest.status === 'pending' && (
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Action required: Approve or reject this request
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          const notes = prompt('Add admin notes (optional):');
                            handleStatusUpdate(selectedRequest.id, 'rejected', notes);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Add admin notes (optional):');
                            handleStatusUpdate(selectedRequest.id, 'approved', notes);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                )}
                </>
                )}
              </div>
            </div>
        </div>
        )}
    </div>
  );
}
