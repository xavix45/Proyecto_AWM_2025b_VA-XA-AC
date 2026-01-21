
import React, { createContext, useState, useContext } from 'react';

// FASE 5: Elevación de Estado Avanzada (PDF 1 pág. 45-46)
const AgendaContext = createContext();

export const AgendaProvider = ({ children }) => {
  const [agenda, setAgenda] = useState([]);
  const [planes, setPlanes] = useState([]); // Nuevo estado para planes de ruta

  const agregarEvento = (evento) => {
    if (!agenda.some(e => e.id === evento.id)) {
      setAgenda([...agenda, evento]);
    }
  };

  const quitarEvento = (id) => {
    setAgenda(agenda.filter(e => e.id !== id));
  };

  const estaEnAgenda = (id) => {
    return agenda.some(e => e.id === id);
  };

  // Gestión de Planes de Viaje
  const guardarPlan = (nuevoPlan) => {
    setPlanes([...planes, { ...nuevoPlan, idPlan: Date.now() }]);
  };

  const eliminarPlan = (idPlan) => {
    setPlanes(planes.filter(p => p.idPlan !== idPlan));
  };

  return (
    <AgendaContext.Provider value={{ 
      agenda, 
      agregarEvento, 
      quitarEvento, 
      estaEnAgenda,
      planes,
      guardarPlan,
      eliminarPlan
    }}>
      {children}
    </AgendaContext.Provider>
  );
};

export const useAgenda = () => useContext(AgendaContext);
