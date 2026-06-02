/**
 * Grand Global Travels – Firebase Integration
 * Uses Firebase CDN compat (v9 compat) – works in plain HTML without a bundler.
 * Included AFTER the Firebase CDN scripts on every page.
 */

// ── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyB-zCOoA1IjEyMb5I5oFYArJX2l-PPaW2g",
  authDomain: "grand-global-travels-b9fa9.firebaseapp.com",
  projectId: "grand-global-travels-b9fa9",
  storageBucket: "grand-global-travels-b9fa9.firebasestorage.app",
  messagingSenderId: "426147244360",
  appId: "1:426147244360:web:ab241db43094b87347eb7d",
  measurementId: "G-JHHT59PRG2"
};

// Initialise Firebase (safe to call multiple times – compat handles dedup)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db   = firebase.firestore();
const auth = firebase.auth();

// Enable analytics only in production (non-localhost)
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  firebase.analytics();
}

// ── Server Timestamp helper ──────────────────────────────────────────────────
const serverNow = () => firebase.firestore.FieldValue.serverTimestamp();

// ── Auth State helper ────────────────────────────────────────────────────────
/**
 * Returns the currently signed-in user object, or null.
 */
function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Listen for auth state changes.
 * callback(user) – user is null when signed out.
 */
function onAuthChange(callback) {
  auth.onAuthStateChanged(callback);
}

// ── Firestore helpers ────────────────────────────────────────────────────────

/**
 * Save a contact-form submission to Firestore.
 * Returns a Promise.
 */
function saveContact({ name, email, phone, service, destination, message }) {
  return db.collection('contacts').add({
    name, email, phone,
    service:     service     || '',
    destination: destination || '',
    message:     message     || '',
    source:      'contact-form',
    status:      'new',
    createdAt:   serverNow()
  });
}

/**
 * Save a booking-form submission to Firestore.
 * Returns a Promise.
 */
function saveBooking(data) {
  const uid = auth.currentUser ? auth.currentUser.uid : null;
  return db.collection('bookings').add({
    ...data,
    userId:    uid,
    status:    'pending',
    createdAt: serverNow()
  });
}

/**
 * Save a newsletter subscriber.
 * Returns a Promise.
 */
function saveSubscriber(email) {
  return db.collection('subscribers').add({
    email,
    source:    'newsletter-footer',
    createdAt: serverNow()
  });
}

// ── Toast notification ───────────────────────────────────────────────────────
/**
 * Show a brief toast message on screen.
 * type: 'success' | 'error' | 'info'
 */
function showToast(message, type = 'success') {
  // Remove any existing toast
  const old = document.getElementById('gg-toast');
  if (old) old.remove();

  const colours = {
    success: 'linear-gradient(135deg,#0B1F5B,#1a3070)',
    error:   'linear-gradient(135deg,#c0392b,#e74c3c)',
    info:    'linear-gradient(135deg,#1a3070,#D4AF37)'
  };
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.id = 'gg-toast';
  toast.style.cssText = `
    position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
    background:${colours[type]};color:#fff;
    padding:14px 28px;border-radius:50px;
    font-family:'Inter',sans-serif;font-size:.95rem;font-weight:600;
    box-shadow:0 8px 30px rgba(0,0,0,.25);
    z-index:9999;display:flex;align-items:center;gap:10px;
    animation:ggToastIn .35s ease;
    border:1.5px solid rgba(212,175,55,.4);
  `;
  toast.innerHTML = `${icons[type]} ${message}`;

  // Inject keyframe once
  if (!document.getElementById('gg-toast-style')) {
    const s = document.createElement('style');
    s.id = 'gg-toast-style';
    s.textContent = `@keyframes ggToastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
    document.head.appendChild(s);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Navigation helper ───────────────────────────────────────────────────────
/**
 * Redirect to auth page with a return URL.
 */
function redirectToAuth(destination) {
  sessionStorage.setItem('authReturnUrl', destination);
  window.location.href = 'auth.html';
}
