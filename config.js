/* ===== FIREBASE CONFIGURATION ===== */
const firebaseConfig = {
  apiKey: "AIzaSyC3-ioQy1d6PzXm2fB6J1P6RIZjjlcLprM",
  authDomain: "spaarsh-9ba01.firebaseapp.com",
  projectId: "spaarsh-9ba01",
  storageBucket: "spaarsh-9ba01.firebasestorage.app",
  messagingSenderId: "179297442506",
  appId: "1:179297442506:web:93814818dca74978633233"
};

let db = null, firebaseReady = false;
try{
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  firebaseReady = true;
}catch(e){ console.error("Firebase init failed:", e); }

const auth = firebaseReady ? firebase.auth() : null;
const FV = firebaseReady ? firebase.firestore.FieldValue : null;
const el = id => document.getElementById(id);

/* Shared app state */
let myUid = null, myProfile = null;
