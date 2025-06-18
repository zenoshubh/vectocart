// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth/web-extension";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAtH8JNp5pPetQNa_jsrAoM5ncMksINc5E",
  authDomain: "vectocart-8b068.firebaseapp.com",
  projectId: "vectocart-8b068",
  storageBucket: "vectocart-8b068.firebasestorage.app",
  messagingSenderId: "529205551001",
  appId: "1:529205551001:web:54dbedf465d1f8c06cbd08",
  measurementId: "G-1BNS8KDRJ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only if supported)
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.log('Analytics not available in extension context');
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth with proper error handling
let auth;
try {
  auth = getAuth(app);
  console.log('Firebase Auth initialized successfully');
} catch (error) {
  console.error('Firebase Auth initialization error:', error);
  throw error;
}

export { db, auth };