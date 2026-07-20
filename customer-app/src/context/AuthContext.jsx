import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    setAccessToken(token);
    authApi
      .getMe()
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        // Token invalid/expired — clear
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setAccessToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogin = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    const { accessToken: token, refreshToken, user: userData } = res.data;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    setAccessToken(token);
    setUser(userData);
    return userData;
  }, []);

  const handleRegister = useCallback(async (data) => {
    // Register doesn't return token — so login automatically after
    await authApi.register(data);
    // Auto-login with same credentials
    return await handleLogin({ email: data.email, password: data.password });
  }, [handleLogin]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
