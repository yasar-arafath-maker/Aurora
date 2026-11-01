import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('aurora_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('aurora_token');
      if (savedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          setToken(savedToken);
        } catch {
          // Access token might be expired, try to refresh
          const savedRefreshToken = localStorage.getItem('aurora_refresh_token');
          if (savedRefreshToken) {
            try {
              const refreshed = await api.refreshToken(savedRefreshToken);
              localStorage.setItem('aurora_token', refreshed.access_token);
              if (refreshed.refresh_token) {
                localStorage.setItem('aurora_refresh_token', refreshed.refresh_token);
              }
              setToken(refreshed.access_token);
              const profile = await api.getMe();
              setUser(profile);
            } catch {
              localStorage.removeItem('aurora_token');
              localStorage.removeItem('aurora_refresh_token');
              setToken(null);
              setUser(null);
            }
          } else {
            localStorage.removeItem('aurora_token');
            setToken(null);
            setUser(null);
          }
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('aurora_token', res.access_token);
      if (res.refresh_token) {
        localStorage.setItem('aurora_refresh_token', res.refresh_token);
      }
      setToken(res.access_token);
      const profile = await api.getMe();
      setUser(profile);
    } catch (err: any) {
      localStorage.removeItem('aurora_token');
      localStorage.removeItem('aurora_refresh_token');
      setToken(null);
      setUser(null);
      throw new Error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('aurora_token');
    localStorage.removeItem('aurora_refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
