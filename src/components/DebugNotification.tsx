import { useState } from 'react';
import { requestNotificationPermission } from '../lib/firebase-config';
import { Bell, Copy, Send } from 'lucide-react';

export function DebugNotification() {
    const [token, setToken] = useState<string>('');
    const [log, setLog] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

    const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const handleGetToken = async () => {
        setLoading(true);
        addLog('Solicitando permissão...');
        try {
            const t = await requestNotificationPermission();
            if (t) {
                setToken(t);
                addLog('Token gerado com sucesso!');
                console.log('Token:', t);
            } else {
                addLog('Permissão dada, mas falhou ao obter Token (null).');
            }
        } catch (e: any) {
            console.error(e);
            addLog('Erro Detalhado: ' + (e.message || JSON.stringify(e)));
        } finally {
            setLoading(false);
        }
    };

    const handleTestBackend = async () => {
        if (!token) return alert('Gere o token primeiro');
        setLoading(true);
        addLog('Enviando requisição ao Backend...');
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'https://api.791barber.com';
            const res = await fetch(`${baseUrl}/api/debug/firebase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const data = await res.json();
            addLog('Resposta Backend: ' + JSON.stringify(data));
        } catch (e: any) {
            addLog('Erro Backend: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const unregisterSW = async () => {
        addLog('Removendo todos os Service Workers...');
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let reg of regs) {
            await reg.unregister();
            addLog('Removido: ' + reg.scope);
        }
        addLog('Tudo limpo. Recarregue o app.');
    };

    const checkSW = async () => {
        addLog('Verificando Service Worker...');
        if (!('serviceWorker' in navigator)) {
            addLog('ERRO: Não suportado!');
            return;
        }
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length === 0) {
            addLog('Nenhum SW. Re-registrando...');
            const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js?v=2');
            addLog('Registrado: ' + reg.scope);
        } else {
            regs.forEach(r => addLog(`Ativo: ${r.scope}`));
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-6 text-emerald-500 flex items-center gap-2">
                <Bell /> Debug Notificações
            </h1>

            {isIOS && !isPWA && (
                <div className="w-full max-w-md bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-xl mb-4 text-sm text-yellow-200">
                    <p className="font-bold mb-1">⚠️ Notificações no iPhone:</p>
                    <p>Você está no Safari. No iPhone, notificações <strong>só funcionam</strong> se você clicar em "Compartilhar" e depois em "Adicionar à Tela de Início".</p>
                </div>
            )}

            <div className="w-full max-w-md space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={checkSW} className="py-2 bg-slate-800 rounded-xl font-bold text-[10px]">0. Verificar SW</button>
                    <button onClick={unregisterSW} className="py-2 bg-red-900/30 text-red-400 rounded-xl font-bold text-[10px]">Resetar Sistema</button>
                </div>

                <button
                    onClick={handleGetToken}
                    className="w-full py-4 bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                    1. Gerar Token FCM
                </button>

                {token && (
                    <div className="bg-slate-900 p-4 rounded-xl break-all text-xs font-mono border border-slate-800">
                        {token}
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => navigator.clipboard.writeText(token)} className="flex-1 py-2 bg-slate-800 rounded flex items-center justify-center gap-2">
                                <Copy size={14} /> Copiar
                            </button>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleTestBackend}
                    disabled={!token || loading}
                    className="w-full py-4 bg-emerald-600 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Send size={18} /> 2. Testar Envio (Backend)
                </button>

                <div className="mt-8 bg-black/50 p-4 rounded-xl min-h-[200px] text-xs font-mono overflow-y-auto border border-slate-800">
                    <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2">Logs:</div>
                    {log.map((l, i) => (
                        <div key={i} className="mb-1">{l}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
