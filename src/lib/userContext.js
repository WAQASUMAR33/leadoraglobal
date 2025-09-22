"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './auth';

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const checkLocalAuth = () => {
      try {
        console.log('Checking local authentication...');
        const localUser = auth.getUser();
        const isAuth = auth.isAuthenticated();
        
        console.log('Local user:', localUser);
        console.log('Is authenticated:', isAuth);
        
        if (isAuth && localUser) {
          console.log('User authenticated from localStorage:', localUser);
          setUser(localUser);
          setError(null);
        } else {
          console.log('No local authentication found');
          setUser(null);
          setError('Not authenticated');
        }
      } catch (error) {
        console.error('Local auth check error:', error);
        setUser(null);
        setError('Error checking local authentication');
      } finally {
        setLoading(false);
      }
    };

    checkLocalAuth();
  }, []);

  const login = (userData, token) => {
    try {
      // Store in localStorage using existing auth system
      auth.setUser(userData);
      if (token) {
        auth.setToken(token);
      }
      
      setUser(userData);
      setError(null);
      console.log('User logged in:', userData);
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to store authentication data');
    }
  };

  const logout = () => {
    try {
      // Clear localStorage using existing auth system
      auth.logout();
      setUser(null);
      setError(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshAuth = () => {
    try {
      const localUser = auth.getUser();
      const isAuth = auth.isAuthenticated();
      
      if (isAuth && localUser) {
        setUser(localUser);
        setError(null);
      } else {
        setUser(null);
        setError('Not authenticated');
      }
    } catch (error) {
      console.error('Refresh auth error:', error);
      setUser(null);
      setError('Error refreshing authentication');
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Update localStorage with fresh user data
          auth.setUser(data.user);
          setUser(data.user);
          setError(null);
          return data.user;
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
    return null;
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      error,
      refreshAuth,
      refreshUserData,
      isAuthenticated: !!user 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

