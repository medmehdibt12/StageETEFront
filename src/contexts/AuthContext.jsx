/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser } from '../services/auth.service'; // ⬅️ use service

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // ✅ Don't make the request if not logged in
  
    try {
      const data = await getCurrentUser();
      setUser(data);
    } catch (err) {
      console.error('Failed to refresh user', err);
      setUser(null);
    }
  };
  

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
