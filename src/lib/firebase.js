// src/lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAJS3VeBuIzoUGa48RZHXHoatH0QGnhZUw",
  authDomain: "eventbuddy-4f576.firebaseapp.com",
  projectId: "eventbuddy-4f576",
  storageBucket: "eventbuddy-4f576.firebasestorage.app",
  messagingSenderId: "669503905415",
  appId: "1:669503905415:web:05f2fe9e5910ad8f76e222"
};
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

export const firebaseReady = true
