'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../lib/interceptor';

const isBrowser = typeof window !== 'undefined';
const getToken = () => (isBrowser ? localStorage.getItem('authToken') : null);
const setToken = (token: string) => isBrowser && localStorage.setItem('authToken', token);
const removeToken = () => isBrowser && localStorage.removeItem('authToken');

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        removeToken();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string) => {
    const { data } = await api.post('/auth/register', { email, password });
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    // Clear user-specific queries
    queryClient.removeQueries({ queryKey: ['favorites'] });
    queryClient.removeQueries({ queryKey: ['favorite'] });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
