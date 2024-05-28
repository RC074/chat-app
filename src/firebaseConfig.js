import{ initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDWKRwRkDzeq8rsiAjQwroZ0BDyZjA3Ewg",
  authDomain: "chat-app-c7d09.firebaseapp.com",
  projectId: "chat-app-c7d09",
  storageBucket: "chat-app-c7d09.appspot.com",
  messagingSenderId: "229498101287",
  appId: "1:229498101287:web:ec18a56884bb227b72f802",
  measurementId: "G-J2DS5M5ZF3"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db };
