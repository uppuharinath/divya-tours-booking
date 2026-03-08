import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLuQMd_CXqj7CROPx1fJzASAHWUpZF8kI",
  authDomain: "divya-tours-and-travels.firebaseapp.com",
  projectId: "divya-tours-and-travels",
  storageBucket: "divya-tours-and-travels.firebasestorage.app",
  messagingSenderId: "316775446024",
  appId: "1:316775446024:web:8943ec46bbbd216908c3bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);