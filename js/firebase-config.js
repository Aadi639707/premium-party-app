import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPopup, signInWithPhoneNumber, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBEUHICLM_3ynHWwnrvVSZuGd34ti590lk",
  authDomain: "recoverpro-7591d.firebaseapp.com",
  databaseURL: "https://recoverpro-7591d-default-rtdb.firebaseio.com",
  projectId: "recoverpro-7591d",
  storageBucket: "recoverpro-7591d.firebasestorage.app",
  messagingSenderId: "793303842896",
  appId: "1:793303842896:web:c5c0dfc443cd3ec11f9155"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

export { auth, database, googleProvider, RecaptchaVerifier, signInWithPopup, signInWithPhoneNumber, onAuthStateChanged, signOut, ref, set, get, onValue, push, serverTimestamp };
