import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  });

  const login = async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    const userStr = JSON.stringify(data);
    localStorage.setItem('user', userStr);
    // Verify it was written before proceeding
    const stored = localStorage.getItem('user');
    if (!stored) throw new Error('Failed to persist session');
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
