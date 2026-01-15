// Firebase Cloud Messaging Service Worker v2.1
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAY8k2dCjoewStc_vTsTKETMAGXnAjZAZA",
    authDomain: "barber-ec79b.firebaseapp.com",
    projectId: "barber-ec79b",
    storageBucket: "barber-ec79b.firebasestorage.app",
    messagingSenderId: "856918849752",
    appId: "1:856918849752:web:1a1728d277723998df7fad"
};

// Inicializa Firebase no Service Worker
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handler para notificações em background
messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png' // Certifique-se de ter um ícone
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
