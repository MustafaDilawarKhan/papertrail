import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../apiConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const warmBootstrap = async (tokenOverride) => {
    const token = tokenOverride || localStorage.getItem('aid_token');
    if (!token) {
      sessionStorage.removeItem('aid_bootstrap');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/bootstrap`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) return;

      const data = await response.json();
      sessionStorage.setItem('aid_bootstrap', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to warm bootstrap data:', error);
    }
  };

  const fetchUser = async (tokenOverride) => {
    const token = tokenOverride || localStorage.getItem('aid_token');

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Token might be expired or invalid
        localStorage.removeItem('aid_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    warmBootstrap();
  }, []);

  const login = async (token) => {
    localStorage.setItem('aid_token', token);
    await Promise.all([
      fetchUser(token),
      warmBootstrap(token),
    ]);
  };

  const logout = () => {
    localStorage.removeItem('aid_token');
    sessionStorage.removeItem('aid_bootstrap');
    setUser(null);
  };

  const refreshUser = () => {
    fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
