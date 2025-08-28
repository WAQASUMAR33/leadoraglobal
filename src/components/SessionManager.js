"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/auth';

export default function SessionManager() {
  const router = useRouter();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get initial session info
    const info = auth.getSessionInfo();
    setSessionInfo(info);

    // Check session status every minute
    const interval = setInterval(() => {
      const currentInfo = auth.getSessionInfo();
      setSessionInfo(currentInfo);
      
      // If session expired, redirect to login
      if (!auth.isAuthenticated()) {
        router.push('/login');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await auth.logoutWithAPI();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to local logout
      auth.logout();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTimeRemaining = () => {
    if (!sessionInfo?.expiry) return 'Unknown';
    
    const now = new Date();
    const expiry = new Date(sessionInfo.expiry);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!sessionInfo) return null;

  return (
    <div className="relative">
      {/* Session Status Button */}
      <button
        onClick={() => setShowSessionInfo(!showSessionInfo)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          sessionInfo.isExpiringSoon
            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${
          sessionInfo.isExpiringSoon ? 'bg-yellow-500' : 'bg-green-500'
        }`}></div>
        <span>Session</span>
        {sessionInfo.isExpiringSoon && (
          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
            Expiring Soon
          </span>
        )}
      </button>

      {/* Session Info Dropdown */}
      {showSessionInfo && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Session Information</h3>
              <button
                onClick={() => setShowSessionInfo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Login Time:</span>
                <span className="text-gray-900">{formatTime(sessionInfo.loginTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expires:</span>
                <span className="text-gray-900">{formatTime(sessionInfo.expiry)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Remaining:</span>
                <span className={`font-medium ${
                  sessionInfo.isExpiringSoon ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {getTimeRemaining()}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    auth.refreshSession();
                    setSessionInfo(auth.getSessionInfo());
                    setShowSessionInfo(false);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Extend Session
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {showSessionInfo && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSessionInfo(false)}
        />
      )}
    </div>
  );
}
