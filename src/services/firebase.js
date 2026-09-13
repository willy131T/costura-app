import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Configuración de Firebase para CosturaApp en Modo Producción
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCR2fAgSyZWWij1ZteAcSdyJIiT-Vp5aPs",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "costuraapp-6f17b.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "costuraapp-6f17b",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "costuraapp-6f17b.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "121410461291",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:121410461291:web:7aaf4c1c529c01c6dfdb2e",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-VZ975F4PJL"
};

let app = null;
let db = null;
let auth = null;
let isMockMode = false;

try {
  // Inicialización segura contra Hot Reload
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // En React Native / Expo Go, experimentalForceLongPolling evita errores de WebChannel stream
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch (e) {
    db = getFirestore(app);
  }
  
  auth = getAuth(app);

  // Autenticación Silenciosa en Producción (Transparente para tu mamá)
  signInAnonymously(auth)
    .then((userCredential) => {
      console.log('✅ CosturaApp Producción: Sesión autenticada en la nube con éxito. ID de Taller:', userCredential.user.uid);
    })
    .catch((error) => {
      if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
        console.log('ℹ️ [Firebase]: Recuerda activar "Anónimo" en Firebase Console > Authentication > Sign-in method.');
      } else {
        console.log('ℹ️ [Firebase Auth]:', error.message);
      }
    });

} catch (error) {
  console.log('ℹ️ Modo local activo:', error.message);
  isMockMode = true;
}

export { app, db, auth, isMockMode, firebaseConfig };
