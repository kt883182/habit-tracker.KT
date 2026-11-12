import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4GmXg6Ikfvr4vvywrAPNJvbSJgt7M2bo",
  authDomain: "habit-tracker-4473e.firebaseapp.com",
  projectId: "habit-tracker-4473e",
  storageBucket: "habit-tracker-4473e.firebasestorage.app",
  messagingSenderId: "1026028932024",
  appId: "1:1026028932024:web:ede00ec10ed612d4d69d4d",
  measurementId: "G-T6XZMX3E0V"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
