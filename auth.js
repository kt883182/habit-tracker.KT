import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
const elements = {
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  form: document.getElementById("authForm"),
  submit: document.getElementById("submitBtn"),
  submitLabel: document.getElementById("submitLabel"),
  google: document.getElementById("googleBtn"),
  loginTab: document.getElementById("loginTab"),
  signupTab: document.getElementById("signupTab"),
  title: document.getElementById("form-title"),
  subtitle: document.getElementById("form-subtitle"),
  message: document.getElementById("authMessage"),
  reset: document.getElementById("resetPasswordBtn"),
  passwordToggle: document.getElementById("passwordToggle")
};

const provider = new GoogleAuthProvider();
let isSignup = false;
let isBusy = false;

function showMessage(message, type = "error") {
  elements.message.textContent = message;
  elements.message.className = `auth-message is-${type}`;
  elements.message.hidden = false;
}

function clearMessage() {
  elements.message.textContent = "";
  elements.message.hidden = true;
  elements.message.className = "auth-message";
}

function setBusy(busy) {
  isBusy = busy;
  [
    elements.submit,
    elements.google,
    elements.loginTab,
    elements.signupTab,
    elements.reset,
    elements.passwordToggle
  ].forEach((control) => {
    control.disabled = busy;
  });
  elements.submitLabel.textContent = busy
    ? (isSignup ? "Creating account…" : "Signing in…")
    : (isSignup ? "Create account" : "Sign in");
}

function setMode(signup) {
  if (isBusy || isSignup === signup) return;
  isSignup = signup;
  clearMessage();

  elements.loginTab.classList.toggle("is-active", !signup);
  elements.signupTab.classList.toggle("is-active", signup);
  elements.loginTab.setAttribute("aria-selected", String(!signup));
  elements.signupTab.setAttribute("aria-selected", String(signup));
  elements.title.textContent = signup ? "Create your account" : "Welcome back";
  elements.subtitle.textContent = signup
    ? "Start building habits that last."
    : "Pick up where you left off.";
  elements.submitLabel.textContent = signup ? "Create account" : "Sign in";
  elements.reset.hidden = signup;
  elements.password.autocomplete = signup ? "new-password" : "current-password";
}

function getErrorMessage(error) {
  const messages = {
    "auth/account-exists-with-different-credential": "An account already exists with this email. Try signing in another way.",
    "auth/email-already-in-use": "An account with this email already exists. Sign in instead.",
    "auth/invalid-api-key": "Firebase is not configured correctly. Check the Firebase web app settings.",
    "auth/invalid-credential": "That email and password combination wasn’t recognized. Check them and try again.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/network-request-failed": "Could not connect. Check your internet connection and try again.",
    "auth/operation-not-allowed": "This sign-in method is not enabled. Contact the app administrator.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
    "auth/too-many-requests": "Too many attempts. Wait a little while, then try again.",
    "auth/unauthorized-domain": `This website (${window.location.hostname}) is not authorized in Firebase. Add this hostname under Authentication → Settings → Authorized domains.`,
    "auth/user-disabled": "This account has been disabled. Contact the app administrator.",
    "auth/user-not-found": "No account was found for this email. Create an account to get started.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/wrong-password": "That email and password combination wasn’t recognized. Check them and try again."
  };
  return messages[error.code] || "Sign-in could not be completed. Please try again.";
}

function handleAuthError(error) {
  console.error("Firebase authentication failed:", error);
  showMessage(getErrorMessage(error));
}

function redirectToApp() {
  window.location.replace("./index.html");
}

elements.loginTab.addEventListener("click", () => setMode(false));
elements.signupTab.addEventListener("click", () => setMode(true));

elements.passwordToggle.addEventListener("click", () => {
  const isVisible = elements.password.type === "text";
  elements.password.type = isVisible ? "password" : "text";
  elements.passwordToggle.setAttribute("aria-pressed", String(!isVisible));
  elements.passwordToggle.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!elements.form.reportValidity()) return;

  const email = elements.email.value.trim();
  const password = elements.password.value;
  setBusy(true);

  try {
    if (isSignup) {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    redirectToApp();
  } catch (error) {
    handleAuthError(error);
  } finally {
    setBusy(false);
  }
});

elements.google.addEventListener("click", async () => {
  clearMessage();
  setBusy(true);

  try {
    await signInWithPopup(auth, provider);
    redirectToApp();
  } catch (error) {
    handleAuthError(error);
  } finally {
    setBusy(false);
  }
});

elements.reset.addEventListener("click", async () => {
  clearMessage();
  const email = elements.email.value.trim();

  if (!email || !elements.email.validity.valid) {
    elements.email.focus();
    showMessage("Enter your email address above, then request a password reset.");
    return;
  }

  setBusy(true);
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Password reset instructions have been sent to your email.", "success");
  } catch (error) {
    handleAuthError(error);
  } finally {
    setBusy(false);
  }
});

onAuthStateChanged(
  auth,
  (user) => {
    if (user) redirectToApp();
  },
  (error) => handleAuthError(error)
);

window.habitFlowAuthReady = true;
