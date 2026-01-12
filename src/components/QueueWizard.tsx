import { useState, useEffect } from 'react';
import { Api } from '../lib/api';
import { User, CheckCircle2, ChevronRight, Loader2, Users } from 'lucide-react';

interface QueueWizardProps {
    slug: string;
    shopInfo: any;
    clientData: any;
    onCancel: () => void;
    onComplete: () => void;
}

export function QueueWizard({ slug, shopInfo, clientData, onCancel, onComplete }: QueueWizardProps) {
    const [step, setStep] = useState<'barber' | 'confirm' | 'ticket'>('barber');
    const [barbers, setBarbers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedBarber, setSelectedBarber] = useState<any>(null);
    const [ticket, setTicket] = useState<any>(null);

    useEffect(() => {
        loadBarbers();
    }, []);

    async function loadBarbers() {
        try {
            setLoading(true);
            const data = await Api.getBarbers(slug);
            // Filtra apenas barbeiros online/disponíveis se necessário
            setBarbers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleEnterQueue() {
        if (!clientData) return;
        setLoading(true);
        try {
            const result = await Api.enterQueue({
                tenant_id: shopInfo.id, // ID real do tenant vindo do shopInfo
                barber_id: selectedBarber?.id,
                client_name: clientData.name,
                client_phone: clientData.phone,
                cpf: clientData.cpf,
                photo_url: clientData.photo_url
            });
            setTicket(result);
            setStep('ticket');
            // Notificar pai se necessário, ou apenas mostrar ticket aqui
        } catch (error) {
            alert('Erro ao entrar na fila. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    if (step === 'ticket') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-blue-600/20 animate-bounce">
                    <span className="text-4xl font-black text-white">#{ticket?.position || '1'}</span>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Você está na fila!</h2>
                <p className="text-slate-400 font-medium mb-8">
                    Tempo estimado: <span className="text-white font-bold">{ticket?.estimated_wait || '15 min'}</span>
                </p>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xs mb-8">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                        <span className="text-slate-500 text-xs uppercase font-bold">Barbeiro</span>
                        <span className="text-slate-200 font-bold">{selectedBarber?.name || 'Qualquer um'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs uppercase font-bold">Status</span>
                        <span className="text-emerald-400 font-bold text-xs bg-emerald-400/10 px-2 py-1 rounded-full">Aguardando</span>
                    </div>
                </div>

                <button
                    onClick={onComplete}
                    className="px-12 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                    Voltar ao Início
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-8 duration-500 w-full max-w-md mx-auto h-full">
            {/* Header Steps */}
            <div className="flex items-center gap-2 mb-8">
                <button onClick={onCancel} className="p-2 -ml-2 hover:bg-white/5 rounded-full text-slate-400">
                    <ChevronRight className="rotate-180" />
                </button>
                <h2 className="text-xl font-black uppercase tracking-tighter">Entrar na Fila</h2>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-6">

                {/* User Info Card */}
                <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500">
                        {clientData?.photo_url ? (
                            <img src={clientData.photo_url} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-6 h-6 m-auto text-blue-200" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-blue-200">{clientData?.name}</p>
                        <p className="text-xs text-blue-400">{clientData?.phone}</p>
                    </div>
                </div>

                {/* Barber Selection */}
                <div className="space-y-3">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Escolha o Profissional</label>

                    <button
                        onClick={() => setSelectedBarber(null)}
                        className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${!selectedBarber ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!selectedBarber ? 'bg-white/20' : 'bg-slate-800'}`}>
                            <Users size={20} />
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-bold uppercase text-sm">Qualquer Profissional</p>
                            <p className={`text-[10px] ${!selectedBarber ? 'text-blue-200' : 'text-slate-600'}`}>Menor tempo de espera</p>
                        </div>
                        {!selectedBarber && <CheckCircle2 size={20} />}
                    </button>

                    {loading ? (
                        <div className="text-center py-8 text-slate-600 flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin" />
                            <span className="text-xs">Carregando barbeiros...</span>
                        </div>
                    ) : (
                        barbers.map(barber => (
                            <button
                                key={barber.id}
                                onClick={() => setSelectedBarber(barber)}
                                className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${selectedBarber?.id === barber.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-slate-800">
                                    {barber.photo_url ? (
                                        <img src={barber.photo_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 m-auto text-slate-500" />
                                    )}
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-bold uppercase text-sm">{barber.name}</p>
                                    <p className={`text-[10px] ${selectedBarber?.id === barber.id ? 'text-blue-200' : 'text-slate-600'}`}>{barber.is_online ? 'Online' : 'Offline'}</p>
                                </div>
                                {selectedBarber?.id === barber.id && <CheckCircle2 size={20} />}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Footer Action */}
            <div className="mt-8">
                <button
                    onClick={handleEnterQueue}
                    disabled={loading}
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Entrar na Fila'}
                </button>
            </div>
        </div>
    );
}
