// src/firebase/config.js

import { initializeApp } from "firebase/app";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

// ========================================
// FIREBASE CONFIG
// ========================================

const firebaseConfig = {
  apiKey: "AIzaSyCTYK1JRO5ZaBt0YY7dyMlCE4CX-jK8s1c",
  authDomain: "srisaas-1e343.firebaseapp.com",
  projectId: "srisaas-1e343",
  storageBucket: "srisaas-1e343.firebasestorage.app",
  messagingSenderId: "131854556658",
  appId: "1:131854556658:web:28305a16b93644fd479f6b",
  measurementId: "G-0SGPH8CFR1",
};

// ========================================
// INITIALIZE FIREBASE
// ========================================

const app = initializeApp(firebaseConfig);

// ========================================
// AUTHENTICATION
// ========================================

const auth = getAuth(app);

// ========================================
// FIRESTORE
// ========================================

const db = getFirestore(app);

// ========================================
// EXPORT
// ========================================

export {
  app,
  auth,
  db,

  // Authentication
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,

  // Firestore
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
};