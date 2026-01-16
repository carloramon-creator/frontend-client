import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';

// DADOS EXTRAÍDOS DIRETAMENTE DO PRINT DO CONSOLE FIREBASE DO USUÁRIO
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicialização segura para evitar "Black Screen" se as variáveis de ambiente não estiverem prontas
let app;
let messaging = null;

if (firebaseConfig.apiKey) {
    try {
        app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);

        // Só inicializa Analytics se estiver no navegador
        if (typeof window !== 'undefined') {
            getAnalytics(app);
        }
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
} else {
    console.warn("Firebase configuration missing. Push notifications will be disabled.");
}

// Chave pública VAPID (Gerada em Project Settings > Cloud Messaging > Web Push certificates)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

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

            if (!messaging || !VAPID_KEY) {
                console.warn('[FCM] Messaging ou VAPID_KEY não inicializados. Abortando geração de token.');
                return null;
            }

            console.log('[FCM] Chamando getToken com VAPID:', VAPID_KEY?.substring(0, 10) + '...');
            const token = await getToken(messaging!, {
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
        if (!messaging) return;
        onMessage(messaging!, (payload) => {
            resolve(payload);
        });
    });
