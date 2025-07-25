// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAI1oPe7OL78JQtFjscD5y_Wdp5NqoB-J0",
  authDomain: "iq4u-chess-b2835.firebaseapp.com",
  databaseURL: "https://iq4u-chess-b2835-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iq4u-chess-b2835",
  storageBucket: "iq4u-chess-b2835.appspot.com",
  messagingSenderId: "1029237519163",
  appId: "1:1029237519163:web:2b060008c0f11bfe5a3d1e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Login Function
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Get role from Firestore
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      if (role === "admin") {
        window.location.href = "admin.html";
      } else if (role === "student") {
        window.location.href = "student.html";
      } else {
        errorEl.innerText = "Unknown role!";
      }
    } else {
      errorEl.innerText = "User data not found in Firestore.";
    }
  } catch (error) {
    errorEl.innerText = "Login failed: " + error.message;
  }
};
