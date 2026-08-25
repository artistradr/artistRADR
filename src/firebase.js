import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCPE2kU4u1pvMusB6npILtt6K8lsxdgQok",
  authDomain: "artistradr-2159f.firebaseapp.com",
  projectId: "artistradr-2159f",
  storageBucket: "artistradr-2159f.firebasestorage.app",
  messagingSenderId: "887980759193",
  appId: "1:887980759193:web:3042b241a5f532ee2ac008",
  measurementId: "G-G7W7G51F3X",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export default app;