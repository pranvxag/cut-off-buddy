import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // For demo purposes - replace with your actual Firebase config
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com", 
  projectId: "demo-college-cutoff",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);