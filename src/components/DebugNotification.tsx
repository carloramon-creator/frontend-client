import { useState } from 'react';
import { requestNotificationPermission } from '../lib/firebase-config';
import { Bell, Copy, Send } from 'lucide-react';

export function DebugNotification() {
    const [token, setToken] = useState<string>('');
    const [log, setLog] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

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
                addLog('Permissão negada ou falha ao gerar token.');
            }
        } catch (e: any) {
            addLog('Erro: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTestBackend = async () => {
        if (!token) return alert('Gere o token primeiro');
        setLoading(true);
        addLog('Enviando requisição ao Backend...');
        try {
            const res = await fetch('https://api.791barber.com/api/debug/firebase', { // Ajuste para URL real se necessário, mas /api deve funcionar via reverse proxy se estiver no mesmo dominio, ou endpoint completo
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

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-6 text-emerald-500 flex items-center gap-2">
                <Bell /> Debug Notificações
            </h1>

            <div className="w-full max-w-md space-y-4">
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
                            <button
                                onClick={() => navigator.clipboard.writeText(token)}
                                className="flex-1 py-2 bg-slate-800 rounded flex items-center justify-center gap-2 hover:bg-slate-700"
                            >
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
                    <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2">Logs do Sistema:</div>
                    {log.map((l, i) => (
                        <div key={i} className="mb-1">{l}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
