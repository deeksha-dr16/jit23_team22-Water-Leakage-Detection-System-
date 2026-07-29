// src/firebase.js
// Replace ALL values below with YOUR project's actual config.
// Find these at: Firebase Console -> Project Settings (gear icon) -> General -> "Your apps"

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "enter_ your_details",
  authDomain: "enter_ your_details",
  databaseURL: "enter_ your_details",
  projectId: "enter_ your_details",
  storageBucket: "enter_ your_details",
  messagingSenderId: "enter_ your_details",
  appId: "enter_ your_details",
  measurementId: "enter_ your_details"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;

/*WaterShield2026*/