// src/firebase.js
// Replace ALL values below with YOUR project's actual config.
// Find these at: Firebase Console -> Project Settings (gear icon) -> General -> "Your apps"

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDB0LUVYs_yy7k6KhY2Q1Nez8_8hFL0Jjs",
  authDomain: "leakagedetectionsystem-e7e9f.firebaseapp.com",
  databaseURL: "https://leakagedetectionsystem-e7e9f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "leakagedetectionsystem-e7e9f",
  storageBucket: "leakagedetectionsystem-e7e9f.firebasestorage.app",
  messagingSenderId: "64561764365",
  appId: "1:64561764365:web:cf31c06b275e1f97a31d44",
  measurementId: "G-KTTL2SG93Z"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;

/*WaterShield2026*/