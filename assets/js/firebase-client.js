import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCh6zl37v0F1ZnBUSSRs5HuTjWc9nENJUg",
  authDomain: "tp1977-7eca3.firebaseapp.com",
  projectId: "tp1977-7eca3",
  storageBucket: "tp1977-7eca3.firebasestorage.app",
  messagingSenderId: "522876294990",
  appId: "1:522876294990:web:a50d22a69ec32dd67ab01f"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
