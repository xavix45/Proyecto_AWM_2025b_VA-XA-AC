
// CONFIGURACIÓN CENTRALIZADA DE LA API
export const API_BASE_URL = 'http://192.168.0.149:8000'; 

export const ENDPOINTS = {
  eventos: `${API_BASE_URL}/eventos`,
  usuarios: `${API_BASE_URL}/usuarios`,
};

// --- CONFIGURACIÓN DE IA (GEMINI) ---
// INSTRUCCIÓN: Borra el texto "PEGAR_AQUI_TU_CLAVE" (incluyendo las comillas si quieres, o déjalas)
// y pon tu API Key real que empieza con "AIza...".
// Si usas variables de entorno, puedes dejar: process.env.API_KEY || "PEGAR_AQUI_TU_CLAVE"
export const GEMINI_API_KEY = "AIzaSyCFNPXoZBP6BLlw99r4W4-x6LQ3q69nlFc";
