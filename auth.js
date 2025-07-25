import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

window.login = function () {
  const email = emailInput.value;
  const password = passwordInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCred) => {
      const uid = userCred.user.uid;
      const userDoc = await getDoc(doc(db, "users", uid));
      
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === "admin") {
          window.location.href = "admin.html";
        } else if (role === "student") {
          window.location.href = "student.html";
        } else {
          alert("Unknown role");
        }
      } else {
        alert("User role not found in database");
      }
    })
    .catch((error) => {
      alert("Login failed: " + error.message);
    });
};
