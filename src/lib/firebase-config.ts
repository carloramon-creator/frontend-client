import { initializeApp } from 'firebase/app';
import { getToken, onMessage } from 'firebase/messaging';
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

// Inicialização segura para minimizar "Black Screen" e erros de navegador sem suporte
let app: any;
let messaging: any = null;

// Função para inicializar o Firebase de forma assíncrona e segura
async function initFirebase() {
    if (!firebaseConfig.apiKey) {
        console.warn("Firebase configuration missing. Push notifications will be disabled.");
        return;
    }

    try {
        app = initializeApp(firebaseConfig);

        if (typeof window !== 'undefined') {
            // Inicializa Analytics se disponível
            try {
                getAnalytics(app);
            } catch (e) {
                console.warn("Analytics not supported", e);
            }

            // Verifica suporte para Messaging (Push) antes de tentar instanciar
            const { isSupported, getMessaging } = await import('firebase/messaging');
            const supported = await isSupported();

            if (supported) {
                messaging = getMessaging(app);
                console.log("[FCM] Messaging inicializado com sucesso.");
            } else {
                console.warn("[FCM] Este navegador não suporta as APIs necessárias para Push.");
            }
        }
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
}

// Dispara a inicialização (não bloqueante)
initFirebase();

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
        if (!messaging) {
            resolve(null);
            return;
        }
        onMessage(messaging!, (payload) => {
            resolve(payload);
        });
    });
