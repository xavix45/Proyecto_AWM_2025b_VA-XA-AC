
import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({
    provincia: '',
    categorias: []
  });

  const login = (userData) => setUser(userData);
  const logout = () => {
    setUser(null);
    setPreferences({ provincia: '', categorias: [] });
  };

  const updatePreferences = (newPrefs) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  };

  return (
    <UserContext.Provider value={{ user, preferences, login, logout, updatePreferences }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
