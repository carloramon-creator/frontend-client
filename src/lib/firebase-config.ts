import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// PREENCHA COM SEUS DADOS DO CONSOLE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyAY8k2dCjoewStc_vTsTKETMAGXnAj2AZA",
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
        console.log('[FCM] Solicitando permissão...');
        const permission = await Notification.requestPermission();
        console.log('[FCM] Status da permissão:', permission);

        if (permission === 'granted') {
            const regs = await navigator.serviceWorker.getRegistrations();
            console.log('[FCM] Registrations encontradas:', regs.length);

            // Busca o registro específico do nosso arquivo de mensagens
            let registration = regs.find(r => r.active && r.active.scriptURL.includes('firebase-messaging-sw.js'));

            if (registration) {
                console.log('[FCM] SW Ativo encontrado:', registration.scope);
            } else {
                console.warn('[FCM] Nenhum SW ativo com firebase-messaging-sw.js. Aguardando ready...');
                registration = await navigator.serviceWorker.ready;
                console.log('[FCM] SW Ready:', registration?.scope || 'NENHUM');
            }

            console.log('[FCM] Chamando getToken com VAPID:', VAPID_KEY.substring(0, 10) + '...');
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            if (token) {
                console.log('[FCM] Token gerado:', token);
            } else {
                console.error('[FCM] getToken retornou NULL (sem erro)');
            }
            return token;
        } else {
            console.log('[FCM] Permissão de notificação negada/default');
            return null;
        }
    } catch (error: any) {
        console.error('[FCM] Erro CRÍTICO no processo de token:', error);
        throw error;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
