// firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";  // if you're using Realtime DB
import { getFirestore } from "firebase/firestore"; // for Firestore

const firebaseConfig = {
  apiKey: "AIzaSyAI1oPe7OL78JQtFjscD5y_Wdp5NqoB-J0",
  authDomain: "iq4u-chess-b2835.firebaseapp.com",
  databaseURL: "https://iq4u-chess-b2835-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iq4u-chess-b2835",
  storageBucket: "iq4u-chess-b2835.firebasestorage.app",
  messagingSenderId: "1029237519163",
  appId: "1:1029237519163:web:2b060008c0f11bfe5a3d1e"
};

const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app); // optional
