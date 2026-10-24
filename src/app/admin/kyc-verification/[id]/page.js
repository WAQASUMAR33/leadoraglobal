'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function KYCDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [kycSubmission, setKycSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchKYCDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/kyc/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setKycSubmission(data.kycSubmission);
      } else if (response.status === 401) {
        window.location.href = '/admin/login';
      } else {
        alert('KYC submission not found');
        router.push('/admin/kyc-verification');
      }
    } catch (error) {
      console.error('Error fetching KYC detail:', error);
      alert('Error loading KYC details');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (params.id) {
      fetchKYCDetail();
    }
  }, [params.id, fetchKYCDetail]);

  const handleStatusUpdate = async (newStatus) => {
    if (!confirm(`Are you sure you want to ${newStatus} this KYC submission?`)) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/kyc/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setKycSubmission(data.kycSubmission);
        alert(`KYC ${newStatus} successfully!`);
        router.push('/admin/kyc-verification');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      alert('An error occurred while updating KYC status');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!kycSubmission) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">KYC Submission Not Found</h1>
          <Link
            href="/admin/kyc-verification"
            className="text-purple-600 hover:text-purple-800"
          >
            ← Back to KYC Verification
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/kyc-verification"
              className="text-purple-600 hover:text-purple-800 mb-2 inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to KYC Verification
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">KYC Review</h1>
            <p className="text-gray-600">Detailed review of user KYC submission</p>
          </div>
          <div className="text-right">
            {getStatusBadge(kycSubmission.kyc_status)}
            <div className="text-sm text-gray-500 mt-1">
              Submitted: {formatDate(kycSubmission.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.user.fullname}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <p className="mt-1 text-sm text-gray-900">@{kycSubmission.user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.user.phoneNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Status</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.user.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(kycSubmission.user.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name (KYC)</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.fullname}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Father&apos;s Name</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.father_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.gender}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CNIC Number</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.cnic_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CNIC Expiry Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(kycSubmission.cnic_expiry_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email (KYC)</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number (KYC)</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.phoneNumber}</p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Address Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.country}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Current Address</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.current_address}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Permanent Address</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.permanent_address}</p>
              </div>
            </div>
          </div>

          {/* Beneficiary Information */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Beneficiary Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Beneficiary Name</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.beneficiary_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Beneficiary Phone</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.beneficiary_phone_mobile}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Relation</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.beneficiary_relation}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Beneficiary Address</label>
                <p className="mt-1 text-sm text-gray-900">{kycSubmission.beneficiary_address}</p>
              </div>
            </div>
          </div>

          {/* Document Images */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                {kycSubmission.profile_image ? (
                  <div className="relative aspect-square border-2 border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={kycSubmission.profile_image}
                      alt="Profile Image"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 hidden">
                      Image not available
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No image uploaded</span>
                  </div>
                )}
              </div>

              {/* ID Card Front */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Card Front</label>
                {kycSubmission.id_card_front ? (
                  <div className="relative aspect-[3/2] border-2 border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={kycSubmission.id_card_front}
                      alt="ID Card Front"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 hidden">
                      Image not available
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/2] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No image uploaded</span>
                  </div>
                )}
              </div>

              {/* ID Card Back */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Card Back</label>
                {kycSubmission.id_card_back ? (
                  <div className="relative aspect-[3/2] border-2 border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={kycSubmission.id_card_back}
                      alt="ID Card Back"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 hidden">
                      Image not available
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/2] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No image uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Summary */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Balance:</span>
                <span className="text-sm font-medium">${parseFloat(kycSubmission.user.balance || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Points:</span>
                <span className="text-sm font-medium">{kycSubmission.user.points}</span>
              </div>
              {kycSubmission.user.rank && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rank:</span>
                  <span className="text-sm font-medium">{kycSubmission.user.rank.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Notes</h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this KYC review..."
              className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          {kycSubmission.kyc_status === 'pending' && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Approve KYC'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={processing}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Reject KYC'}
                </button>
              </div>
            </div>
          )}

          {/* Status History */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status History</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-600">Submitted:</span>
                <span className="ml-2 font-medium">{formatDate(kycSubmission.createdAt)}</span>
              </div>
              {kycSubmission.updatedAt !== kycSubmission.createdAt && (
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 font-medium">{formatDate(kycSubmission.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
