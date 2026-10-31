import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBLg82Ar7-LkzINrKrRVGlx_NieJcpy4a",
  authDomain: "saving-water-magazine.firebaseapp.com",
  projectId: "saving-water-magazine",
  storageBucket: "saving-water-magazine.firebasestorage.app",
  messagingSenderId: "636651836141",
  appId: "1:636651836141:web:4c39b1bd5c70ab8221f2e4",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
