import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDtSJOvvOcakG3ZzxAZcC8wwCHBJoSIxE",
  authDomain: "qrcheck-4db34.firebaseapp.com",
  projectId: "qrcheck-4db34",
  storageBucket: "qrcheck-4db34.firebasestorage.app",
  messagingSenderId: "187674911175",
  appId: "1:187674911175:web:714ea8a1ce52f38070f9e2",
  measurementId: "G-4PL87N83M7"
};


// Initialize Firebase
// FIX: Use v8 compat library for initialization to fix import errors.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Cloud Firestore and get a reference to the service
export const db = firebase.firestore();
