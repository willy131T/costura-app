import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace the following values with your Firebase project's credentials.
// You can find these details in the Firebase console under Project Settings > General > Your apps.
const firebaseConfig = {
  apiKey: "TODO:_API_KEY_",
  authDomain: "TODO:_AUTH_DOMAIN_",
  projectId: "TODO:_PROJECT_ID_",
  storageBucket: "TODO:_STORAGE_BUCKET_",
  messagingSenderId: "TODO:_MESSAGING_SENDER_ID_",
  appId: "TODO:_APP_ID_"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export the Firestore instance and the app instance just in case
export { app, db };
