import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB_UPlAIDxD4bcXKzS2v6fKcGspXNcjl9g",
  authDomain: "logistica-cesfam.firebaseapp.com",
  projectId: "logistica-cesfam",
  storageBucket: "logistica-cesfam.firebasestorage.app",
  messagingSenderId: "1013387789446",
  appId: "1:1013387789446:web:31811b89e9a9ace576bd07"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
