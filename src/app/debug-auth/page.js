"use client";

import { useUser } from "../../lib/userContext";

export default function DebugAuth() {
  const { user, loading, error, isAuthenticated } = useUser();

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Authentication Debug</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Current State</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Loading:</span>
                <span className="text-white">{loading ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Authenticated:</span>
                <span className="text-white">{isAuthenticated ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Error:</span>
                <span className="text-white">{error || 'None'}</span>
              </div>
            </div>
          </div>

          {user && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">User Data</h2>
              <pre className="text-sm text-gray-300 bg-gray-900 p-4 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Actions</h2>
            <div className="space-y-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh Page
              </button>
              
              <div className="text-sm text-gray-400">
                <p>Check the browser console for authentication logs.</p>
                <p>Make sure you're logged in at /login first.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
