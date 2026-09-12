import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase para CosturaApp
// Reemplaza estos valores con las credenciales de tu consola de Firebase:
// https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDEMO_KEY_COSTURA_APP_2026",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "costura-app-demo.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "costura-app-demo",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "costura-app-demo.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

let app = null;
let db = null;
let isMockMode = false;

try {
  // Verifica si ya fue inicializada para evitar errores en Hot Reload
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Si usa la clave demo, activamos advertencia de modo desarrollo local
  if (firebaseConfig.apiKey.includes('DEMO_KEY')) {
    console.log('ℹ️ CosturaApp: Ejecutando con configuración Demo/Local. Agrega tus credenciales en .env para sincronizar con Firestore en la nube.');
  }
  
  db = getFirestore(app);
} catch (error) {
  console.warn('⚠️ No se pudo inicializar Firebase en la nube. Activando modo local en memoria:', error.message);
  isMockMode = true;
}

export { app, db, isMockMode, firebaseConfig };
