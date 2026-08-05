import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: 'patient' | 'admin' | 'responder';
  profile_photo?: string;
  hospital_id?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<UserProfile>;
  registerUser: (details: any) => Promise<UserProfile>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      setToken(storedToken);
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
      } else {
        throw new Error('Verification failed');
      }
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', credentials);
      if (res.data.success) {
        const { token: jwtToken, user: profile } = res.data.data;
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(profile));
        setToken(jwtToken);
        setUser(profile);
        return profile;
      } else {
        throw new Error(res.data.message || 'Login failed');
      }
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (details: any) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', details);
      if (res.data.success) {
        const { token: jwtToken, user: profile } = res.data.data;
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(profile));
        setToken(jwtToken);
        setUser(profile);
        return profile;
      } else {
        throw new Error(res.data.message || 'Registration failed');
      }
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Silent fallback on backend session logout clearance', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerUser,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
