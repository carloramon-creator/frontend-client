import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// PREENCHA COM SEUS DADOS DO CONSOLE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyAY8k2dCjoewStc_vTsTKETMAGXnAjZAZA",
    authDomain: "barber-ec79b.firebaseapp.com",
    projectId: "barber-ec79b",
    storageBucket: "barber-ec79b.firebasestorage.app",
    messagingSenderId: "856918849752",
    appId: "1:856918849752:web:1a1728d277723998df7fad"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Chave pública VAPID (Gerada em Project Settings > Cloud Messaging > Web Push certificates)
const VAPID_KEY = "BJBbVyUmYAsvG7bce5w95onOxpPiWV2uQkPkhH1qhXYbbVBM2swkiC5DNhuKqGJyireNUZARrL1TsugWeJgrB1g";

export const requestNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // No iOS/Safari, é mais seguro passar o serviceWorkerRegistration explicitamente
            const registration = await navigator.serviceWorker.ready;
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
            });
            console.log('FCM Token:', token);
            return token;
        } else {
            console.log('Permissão de notificação negada');
            return null;
        }
    } catch (error) {
        console.error('Erro ao obter permissão/token:', error);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
