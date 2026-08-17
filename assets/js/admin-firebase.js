import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCh6zl37v0F1ZnBUSSRs5HuTjWc9nENJUg",
  authDomain: "tp1977-7eca3.firebaseapp.com",
  projectId: "tp1977-7eca3",
  storageBucket: "tp1977-7eca3.firebasestorage.app",
  messagingSenderId: "522876294990",
  appId: "1:522876294990:web:a50d22a69ec32dd67ab01f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase Authentication requires an email-style account.
// The admin UI still accepts the simple ID "tp1977" and maps it internally.
const ADMIN_ID = "tp1977";
const ADMIN_EMAIL = "tp1977@admin.invalid";

const loginScreen = document.querySelector('[data-admin-login-screen]');
const adminApp = document.querySelector('[data-admin-app]');
const loginForm = document.querySelector('[data-admin-login-form]');
const idInput = document.querySelector('[data-admin-id]');
const passwordInput = document.querySelector('[data-admin-password]');
const loginMessage = document.querySelector('[data-admin-login-message]');
const loginButton = document.querySelector('[data-admin-login-button]');
const logoutButton = document.querySelector('[data-admin-logout]');

function setMessage(message = '', type = '') {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.dataset.type = type;
  loginMessage.hidden = !message;
}

function showLogin() {
  document.body.classList.remove('admin-authenticated');
  document.body.classList.add('admin-guest');
  if (loginScreen) loginScreen.hidden = false;
  if (adminApp) adminApp.hidden = true;
  requestAnimationFrame(() => idInput?.focus());
}

function showAdmin() {
  document.body.classList.remove('admin-guest');
  document.body.classList.add('admin-authenticated');
  if (loginScreen) loginScreen.hidden = true;
  if (adminApp) adminApp.hidden = false;
  setMessage('');
}

await setPersistence(auth, browserLocalPersistence);

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const adminId = idInput?.value.trim() || '';
  const password = passwordInput?.value || '';

  if (adminId !== ADMIN_ID) {
    setMessage('아이디 또는 비밀번호를 확인해 주세요.', 'error');
    return;
  }

  if (loginButton) loginButton.disabled = true;
  setMessage('로그인 중입니다.', 'loading');

  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
  } catch (error) {
    console.error('[Taepyung Admin] login failed', error?.code || error);
    setMessage('아이디 또는 비밀번호를 확인해 주세요.', 'error');
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.focus();
    }
  } finally {
    if (loginButton) loginButton.disabled = false;
  }
});

logoutButton?.addEventListener('click', async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user && user.email === ADMIN_EMAIL) {
    showAdmin();
  } else {
    if (user) signOut(auth).catch(() => {});
    showLogin();
  }
});

window.TP_ADMIN_FIREBASE = { app, auth, db };
