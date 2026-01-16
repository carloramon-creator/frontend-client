// Firebase Cloud Messaging Service Worker v2.3
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Importa a configuração gerada no build
importScripts('/firebase-config-sw.js');

// CORREÇÃO: Usando a configuração importada do arquivo gerado
// (firebaseConfig já está definido no firebase-config-sw.js)

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
