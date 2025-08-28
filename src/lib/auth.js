// Enhanced authentication utility with better session management
export const auth = {
  // Store comprehensive user data in localStorage
  setUser: (userData) => {
    if (typeof window !== 'undefined') {
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Store individual fields for easy access
      if (userData.id) localStorage.setItem('userId', userData.id);
      if (userData.email) localStorage.setItem('userEmail', userData.email);
      if (userData.fullName) localStorage.setItem('userFullName', userData.fullName);
      
      // Store login timestamp
      localStorage.setItem('loginTime', new Date().toISOString());
      
      // Store session expiry (7 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      localStorage.setItem('sessionExpiry', expiryDate.toISOString());
    }
  },

  // Get user data from localStorage
  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  // Get specific user field
  getUserField: (field) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`user${field.charAt(0).toUpperCase() + field.slice(1)}`);
    }
    return null;
  },

  // Remove user data (logout)
  logout: () => {
    if (typeof window !== 'undefined') {
      // Remove all user-related data
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userFullName');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('sessionExpiry');
      localStorage.removeItem('token');
      
      // Clear any other auth-related data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('user') || key === 'token') {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  },

  // Enhanced logout with API call
  logoutWithAPI: async () => {
    try {
      // Call logout API
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.warn('Failed to call logout API:', error);
    } finally {
      // Always clear local storage
      auth.logout();
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const expiry = localStorage.getItem('sessionExpiry');
      
      if (!user || !expiry) return false;
      
      // Check if session has expired
      const now = new Date();
      const expiryDate = new Date(expiry);
      
      if (now > expiryDate) {
        // Session expired, clear data
        auth.logout();
        return false;
      }
      
      return true;
    }
    return false;
  },

  // Get auth token
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  // Set auth token
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },

  // Check if session is about to expire (within 1 hour)
  isSessionExpiringSoon: () => {
    if (typeof window !== 'undefined') {
      const expiry = localStorage.getItem('sessionExpiry');
      if (!expiry) return false;
      
      const now = new Date();
      const expiryDate = new Date(expiry);
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      
      return (expiryDate.getTime() - now.getTime()) < oneHour;
    }
    return false;
  },

  // Refresh session (extend expiry)
  refreshSession: () => {
    if (typeof window !== 'undefined') {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      localStorage.setItem('sessionExpiry', expiryDate.toISOString());
    }
  },

  // Get session info
  getSessionInfo: () => {
    if (typeof window !== 'undefined') {
      const loginTime = localStorage.getItem('loginTime');
      const expiry = localStorage.getItem('sessionExpiry');
      
      return {
        loginTime: loginTime ? new Date(loginTime) : null,
        expiry: expiry ? new Date(expiry) : null,
        isExpiringSoon: auth.isSessionExpiringSoon()
      };
    }
    return null;
  }
};

// Enhanced hook for authentication state
export const useAuth = () => {
  return {
    user: auth.getUser(),
    isAuthenticated: auth.isAuthenticated(),
    login: auth.setUser,
    logout: auth.logout,
    logoutWithAPI: auth.logoutWithAPI,
    getToken: auth.getToken,
    setToken: auth.setToken,
    getSessionInfo: auth.getSessionInfo,
    refreshSession: auth.refreshSession
  };
};

