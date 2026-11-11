import { auth } from "./firebase.js";

import {
GoogleAuthProvider,
signInWithPopup,
createUserWithEmailAndPassword,
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

document
.getElementById("signupBtn")
.addEventListener("click", async () => {

 const email =
 document.getElementById("email").value;

 const password =
 document.getElementById("password").value;

 try {

   await createUserWithEmailAndPassword(
      auth,
      email,
      password
   );

   alert("Account Created Successfully");

 } catch(error) {

   alert(error.message);

 }

});

document
.getElementById("loginBtn")
.addEventListener("click", async () => {

 const email =
 document.getElementById("email").value;

 const password =
 document.getElementById("password").value;

 try {

   await signInWithEmailAndPassword(
      auth,
      email,
      password
   );

   window.location.href = "index.html";

 } catch(error){

   alert(error.message);

 }

});

document
.getElementById("googleBtn")
.addEventListener("click", async () => {

 try {

   await signInWithPopup(
      auth,
      provider
   );

   window.location.href = "index.html";

 } catch(error){

   alert(error.message);

 }

});