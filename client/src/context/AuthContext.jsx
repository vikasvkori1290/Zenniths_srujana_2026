import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEFAULT_DEMO_USER = {
  id: 'user-demo-1',
  name: 'Vikas Kori',
  email: 'demo@aurumflow.com',
  businessName: 'Aurum Enterprise Hub',
  businessType: 'Retail & Wholesale',
  dailyGoal: 10000,
  phone: '+91 98765 43210',
  role: 'merchant',
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('aurum_auth_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('aurum_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default to demo merchant for a seamless instant experience
    return DEFAULT_DEMO_USER;
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync token and user to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('aurum_auth_token', token);
    } else {
      localStorage.removeItem('aurum_auth_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('aurum_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aurum_auth_user');
    }
  }, [user]);

  // Login
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (userData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Instant Demo Login
  const demoLogin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/v1/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
    } catch (err) {
      // Local fallback
    }
    setUser(DEFAULT_DEMO_USER);
    setToken('demo-jwt-token-local');
    setLoading(false);
    return { success: true, user: DEFAULT_DEMO_USER };
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('aurum_auth_token');
    localStorage.removeItem('aurum_auth_user');
  };

  // Update profile
  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        authError,
        login,
        register,
        demoLogin,
        logout,
        updateUser,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
