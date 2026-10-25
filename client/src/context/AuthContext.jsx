import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadUserDataFromDb, API_BASE } from '../services/api';

const AuthContext = createContext(null);

const DEFAULT_DEMO_USER = {
  id: 'user-demo-1',
  name: 'Vikas Kori',
  email: 'demo@finsafe.com',
  businessName: 'FinSafe Enterprise Hub',
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
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('aurum_auth_token', token);
      loadUserDataFromDb().catch(() => {});
    } else {
      localStorage.removeItem('aurum_auth_token');
    }
  }, [token]);

  // Sync user and profile to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('aurum_auth_user', JSON.stringify(user));
      if (user.businessType) {
        localStorage.setItem('aurum_business_type', user.businessType);
        try {
          const prof = JSON.parse(localStorage.getItem('aurum_profile_info') || '{}');
          prof.businessType = user.businessType;
          if (user.businessName) prof.businessName = user.businessName;
          if (user.name) prof.name = user.name;
          if (user.phone) prof.phone = user.phone;
          if (user.email) prof.email = user.email;
          localStorage.setItem('aurum_profile_info', JSON.stringify(prof));
        } catch (e) {}
        window.dispatchEvent(new Event('aurum_business_type_updated'));
      }
    } else {
      localStorage.removeItem('aurum_auth_user');
    }
  }, [user]);

  // Login
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email?.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('aurum_auth_token', data.token);
      localStorage.setItem('aurum_auth_user', JSON.stringify(data.user));
      try {
        await loadUserDataFromDb();
      } catch (loadErr) {
        console.warn('Initial data sync warning:', loadErr);
      }
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
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      // Clear out any previous demo hardcoded data for fresh user
      localStorage.setItem('aurum_ekhata_data', '[]');
      localStorage.setItem('aurum_ekhata_customers', '[]');
      localStorage.setItem('aurum_all_income_records', '[]');
      localStorage.setItem('aurum_today_income', '[]');
      localStorage.setItem('aurum_fixed_expenses', '[]');
      localStorage.setItem('aurum_upcoming_expenses', '[]');
      localStorage.setItem('aurum_other_receivables', '[]');
      localStorage.removeItem('aurum_today_gross_profit_entered');
      localStorage.removeItem('aurum_cashflow_settings');

      // Initialize fresh profile for this user
      const userProfile = {
        name: data.user.name,
        initials: data.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
        businessName: data.user.businessName,
        businessType: data.user.businessType,
        phone: data.user.phone || '+91 98765 43210',
        email: data.user.email,
        upiId: data.user.upiId || '',
        role: 'Owner & Primary Operator',
        currency: '₹',
        dailyGoal: data.user.dailyGoal || 10000,
        joinedDate: 'October 2026',
      };
      localStorage.setItem('aurum_profile_info', JSON.stringify(userProfile));
      localStorage.setItem('aurum_business_type', data.user.businessType || 'Retail');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('aurum_auth_token', data.token);
      localStorage.setItem('aurum_auth_user', JSON.stringify(data.user));

      window.dispatchEvent(new Event('aurum_ekhata_updated'));
      window.dispatchEvent(new Event('aurum_fixed_expenses_updated'));
      window.dispatchEvent(new Event('aurum_expenses_updated'));
      window.dispatchEvent(new Event('aurum_income_updated'));
      window.dispatchEvent(new Event('storage'));

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
      const res = await fetch(`${API_BASE}/auth/demo`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('aurum_auth_token', data.token);
        localStorage.setItem('aurum_auth_user', JSON.stringify(data.user));
        await loadUserDataFromDb();
        return { success: true, user: data.user };
      }
    } catch (err) {
      // Local fallback
    }
    setUser(DEFAULT_DEMO_USER);
    setToken('demo-jwt-token-local');
    localStorage.setItem('aurum_auth_user', JSON.stringify(DEFAULT_DEMO_USER));
    localStorage.setItem('aurum_auth_token', 'demo-jwt-token-local');
    setLoading(false);
    return { success: true, user: DEFAULT_DEMO_USER };
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('aurum_auth_token');
    localStorage.removeItem('aurum_auth_user');
    localStorage.removeItem('aurum_ekhata_data');
    localStorage.removeItem('aurum_all_income_records');
    localStorage.removeItem('aurum_today_income');
    localStorage.removeItem('aurum_fixed_expenses');
    localStorage.removeItem('aurum_upcoming_expenses');
    localStorage.removeItem('aurum_profile_info');
    window.dispatchEvent(new Event('storage'));
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
