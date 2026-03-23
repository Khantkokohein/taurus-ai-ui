// public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDjowhLt-pq5DKd-phnS1Hwx7tdRomJCNQ",
  authDomain: "taurus-calling.firebaseapp.com",
  projectId: "taurus-calling",
  storageBucket: "taurus-calling.firebasestorage.app",
  messagingSenderId: "846393681682",
  appId: "1:846393681682:web:9c39fe6c96162f4073b5cb",
});

const messaging = firebase.messaging();

// 🔔 Background notification
messaging.onBackgroundMessage(function (payload) {
  console.log("[firebase-messaging-sw.js] Received:", payload);

  const notificationTitle = payload?.notification?.title || "Incoming Call";
  const notificationOptions = {
    body: payload?.notification?.body || "Taurus Calling...",
    icon: "/icon-192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});