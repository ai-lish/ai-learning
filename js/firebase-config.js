/* Public Firebase web configuration for the ai-learning-records app. */
(function (global) {
  'use strict';
  if (typeof global === 'undefined') return;

  global.FIREBASE_CONFIG = Object.freeze({
    apiKey: 'AIzaSyA7PM_NoN67kUAzyzssXpppMh924PEWOGU',
    authDomain: 'math-rpg-1eebc.firebaseapp.com',
    projectId: 'math-rpg-1eebc',
    storageBucket: 'math-rpg-1eebc.firebasestorage.app',
    messagingSenderId: '838577745797',
    appId: '1:838577745797:web:2b10e228500e6c91285eec'
  });

  global.AUTHORIZED_EMAIL_DOMAINS = Object.freeze(['gc.hebron.edu.hk', 'lsc.edu.hk']);
})(typeof window !== 'undefined' ? window : this);
