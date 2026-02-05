// src/config/api.js
import { GROQ_API_KEY as GROQ_KEY, GEMINI_API_KEY as GEMINI_KEY, YOUR_COMPUTER_IP as IP } from '@env';
// es la dirección IP de tu computadora donde corre el backend
export const YOUR_COMPUTER_IP = IP || '172.29.45.11'; 
// el a direccion IP de tu computadora donde corre el backend
export const API_BASE_URL = `http://${YOUR_COMPUTER_IP}:8000/api`; 

export const ENDPOINTS = {
  eventos: `${API_BASE_URL}/eventos`,
  comentarios: (eventoId) => `${API_BASE_URL}/eventos/${eventoId}/comentarios`,
  checkin: (eventoId) => `${API_BASE_URL}/eventos/${eventoId}/checkin`,
  login: `${API_BASE_URL}/login`,
  register: `${API_BASE_URL}/register`,
  usuarios: `${API_BASE_URL}/usuarios`, 
  planes: `${API_BASE_URL}/planes`,
  rutasGeocode: `${API_BASE_URL}/rutas/geocode`,
  rutasReverse: `${API_BASE_URL}/rutas/reverse`,
  rutasGenerar: `${API_BASE_URL}/rutas/generar`
};

// ✅ AHORA LAS KEYS VIENEN DEL .env (NO se suben a GitHub)
export const GEMINI_API_KEY = GEMINI_KEY;
export const GROQ_API_KEY = GROQ_KEY;