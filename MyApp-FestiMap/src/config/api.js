
// CONFIGURACIÓN CENTRALIZADA DE LA API (MONGODB + EXPRESS)
// Asegúrate de que esta IP sea la de tu adaptador Wi-Fi real

export const YOUR_COMPUTER_IP = '192.168.0.149'; // <--- VERIFICA ESTA IP CON IPCONFIG

export const API_BASE_URL = `http://${YOUR_COMPUTER_IP}:8000/api`; 

export const ENDPOINTS = {
  eventos: `${API_BASE_URL}/eventos`,
  comentarios: (eventoId) => `${API_BASE_URL}/eventos/${eventoId}/comentarios`,
  checkin: (eventoId) => `${API_BASE_URL}/eventos/${eventoId}/checkin`,
  login: `${API_BASE_URL}/login`,
  register: `${API_BASE_URL}/register`,
  usuarios: `${API_BASE_URL}/usuarios`, // Endpoint base para CRUD de usuarios
  planes: `${API_BASE_URL}/planes`
};

// --- CONFIGURACIÓN DE IA ---
export const GEMINI_API_KEY = process.env.API_KEY || "";
