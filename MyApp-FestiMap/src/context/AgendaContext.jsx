
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext.jsx';
import { ENDPOINTS } from '../config/api.js';

const AgendaContext = createContext();

export const AgendaProvider = ({ children }) => {
  const { user, token } = useUser();
  const [agenda, setAgenda] = useState([]);
  const [planes, setPlanes] = useState([]);

  // Cargar datos al iniciar o cambiar de usuario
  useEffect(() => {
    if (user && token) {
      cargarPlanes();
    } else {
      setAgenda([]);
      setPlanes([]);
    }
  }, [user, token]);

  const cargarPlanes = async () => {
    try {
      const res = await axios.get(`${ENDPOINTS.planes}/usuario/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlanes(res.data);
    } catch (e) {
      console.error("Error cargando planes desde MongoDB:", e);
    }
  };

  const agregarEvento = (evento) => {
    if (!agenda.some(e => (e._id || e.id) === (evento._id || evento.id))) {
      setAgenda([...agenda, evento]);
    }
  };

  const quitarEvento = (id) => {
    setAgenda(agenda.filter(e => (e._id || e.id) !== id));
  };

  const estaEnAgenda = (id) => {
    return agenda.some(e => (e._id || e.id) === id);
  };

  const guardarPlanDB = async (planData) => {
    if (!token || !user) return false;

    try {
      // Mapeamos los datos del frontend al esquema del backend
      const payload = {
        usuarioId: user.id,
        nombrePlan: planData.nombre,
        origen: planData.origen,
        destino: planData.destino,
        fechaInicio: planData.fechaInicio,
        dias: parseInt(planData.dias),
        radio: planData.radio || 15,
        // El backend espera Map de ObjectIds, enviamos solo IDs
        itinerario: planData.itinerario,
        eventosIds: planData.eventosIds || [], 
        geoData: planData.geoData
      };

      const res = await axios.post(ENDPOINTS.planes, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 201) {
        setPlanes(prev => [res.data.plan, ...prev]);
        return true;
      }
    } catch (e) {
      console.error("Error al persistir plan en MongoDB:", e);
      return false;
    }
    return false;
  };

  const eliminarPlanDB = async (idPlan) => {
    try {
      await axios.delete(`${ENDPOINTS.planes}/${idPlan}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlanes(planes.filter(p => p._id !== idPlan));
      return true;
    } catch (e) {
      console.error("Error al eliminar plan:", e);
      return false;
    }
  };

  return (
    <AgendaContext.Provider value={{ 
      agenda, 
      agregarEvento, 
      quitarEvento, 
      estaEnAgenda,
      planes,
      guardarPlan: guardarPlanDB,
      eliminarPlan: eliminarPlanDB,
      refrescarPlanes: cargarPlanes
    }}>
      {children}
    </AgendaContext.Provider>
  );
};

export const useAgenda = () => useContext(AgendaContext);
