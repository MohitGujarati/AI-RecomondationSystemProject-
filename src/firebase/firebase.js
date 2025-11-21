import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDA1AWkInecligq0CtotrgI60L1HuFtybY",
  authDomain: "the-cognito-times.firebaseapp.com",
  projectId: "the-cognito-times",
  storageBucket: "the-cognito-times.firebasestorage.app",
  messagingSenderId: "471057406373",
  appId: "1:471057406373:web:d069719b90c16d10d1304c",
  measurementId: "G-7Z3497VS3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Now correctly export firestore
export { app, auth, firestore };