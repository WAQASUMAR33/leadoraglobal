"use client";

import { useState, useEffect } from "react";
import { auth } from "../../../lib/auth";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    email: '',
    phoneNumber: ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Get user from auth utility
    const currentUser = auth.getUser();
    console.log('Profile page - Current user data:', currentUser);
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        fullname: currentUser.fullname || currentUser.firstname || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        phoneNumber: currentUser.phoneNumber || ''
      });
      console.log('Profile page - Form data set:', {
        fullname: currentUser.fullname || currentUser.firstname || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        phoneNumber: currentUser.phoneNumber || ''
      });
    }
    setLoading(false);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          fullName: formData.fullname,
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Update local storage with new user data
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Error updating profile' });
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Error changing password' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Please log in to view your profile.</p>
        <button 
          onClick={() => window.location.href = '/login'} 
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-gray-400 mt-2">Manage your account information and settings</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              editing
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-900 border border-green-700 text-green-100' 
            : 'bg-red-900 border border-red-700 text-red-100'
        }`}>
          {message.text}
        </div>
      )}

             {/* Profile Information */}
       <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
         <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
        
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleInputChange}
                disabled={!editing}
                className={`w-full px-4 py-3 rounded-lg border ${
                  editing
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    : 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={true}
                className="w-full px-4 py-3 rounded-lg border bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed"
                placeholder="Username cannot be changed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!editing}
                className={`w-full px-4 py-3 rounded-lg border ${
                  editing
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    : 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={!editing}
                className={`w-full px-4 py-3 rounded-lg border ${
                  editing
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    : 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed'
                }`}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {editing && (
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>
        
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 rounded-lg border bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 rounded-lg border bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 rounded-lg border bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* Account Stats */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Account Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{user.username || 'N/A'}</div>
            <p className="text-gray-400 text-sm">Username</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{user.referralCount || 0}</div>
            <p className="text-gray-400 text-sm">Total Referrals</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              ${parseFloat(user.totalEarnings || 0).toFixed(2)}
            </div>
            <p className="text-gray-400 text-sm">Total Earnings</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {user.packageId ? 'Active' : 'None'}
            </div>
            <p className="text-sm">Package Status</p>
          </div>
        </div>
      </div>
    </div>
  );
}
