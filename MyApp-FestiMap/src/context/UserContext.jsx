
import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import { Alert } from 'react-native';
import { ENDPOINTS } from '../config/api.js';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); 
  const [preferences, setPreferences] = useState({
    provincia: '',
    categorias: []
  });

  const login = (userData, userToken) => {
    // Asegurar que guardamos el ID real de MongoDB
    const userId = userData.id || userData._id;
    
    setUser({
      ...userData,
      id: userId
    });
    
    if (userToken) setToken(userToken);
    
    if (userData.preferencias) {
      setPreferences(userData.preferencias);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPreferences({ provincia: '', categorias: [] });
  };

  const updatePreferences = (newPrefs) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  };

  const syncUserWithServer = async (updatedData = null, directPrefs = null) => {
    const userId = user?.id;
    
    if (!userId || !token) {
      console.warn("⚠️ No se puede sincronizar: No hay ID o Token.");
      return false;
    }

    try {
      const payload = {
        ...(updatedData || {}),
        preferencias: directPrefs || preferences
      };

      console.log(`📤 Sincronizando con ID: ${userId}`);

      const res = await axios.put(`${ENDPOINTS.usuarios}/${userId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 200) {
        // Guardamos la respuesta fresca del servidor
        const freshUser = { ...res.data, id: res.data._id };
        setUser(freshUser);
        return true;
      }
    } catch (e) {
      const status = e.response?.status;
      
      if (status === 404) {
        Alert.alert(
          "🚨 Sesión Inválida",
          `El usuario con ID ${userId} ya no existe en el servidor. Esto pasa si migraste la base de datos.\n\nPor favor, Cierra Sesión y crea una cuenta nueva.`
        );
      } else {
        console.error("❌ Error de red:", e.message);
      }
      return false;
    }
    return false;
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      token, 
      preferences, 
      login, 
      logout, 
      updatePreferences,
      syncUserWithServer,
      isAuthenticated: !!token 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
