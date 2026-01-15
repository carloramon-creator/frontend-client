import { useState, useEffect } from 'react';
import { Api } from '../lib/api';
import { User, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { getBusinessTexts } from '../lib/business-dictionary';
import { requestNotificationPermission } from '../lib/firebase-config';

interface QueueWizardProps {
    slug: string;
    shopInfo: any;
    clientData: any;
    onCancel: () => void;
    onComplete: () => void;
}

export function QueueWizard({ slug, shopInfo, clientData, onCancel, onComplete }: QueueWizardProps) {
    const texts = getBusinessTexts(shopInfo?.business_type);
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
            // Tenta obter permissão de notificação antes de entrar, mas NÃO trava se falhar
            let fcmToken = null;
            try {
                fcmToken = await requestNotificationPermission();
            } catch (notiError) {
                console.error("Erro (não-crítico) ao obter permissão de notificação:", notiError);
                // Prossegue sem token fcm
            }

            const result = await Api.enterQueue({
                tenant_id: shopInfo.id,
                barber_id: selectedBarber?.id,
                client_name: clientData.name,
                client_phone: clientData.phone,
                cpf: clientData.cpf,
                photo_url: clientData.photo_url,
                fcm_token: fcmToken
            });
            setTicket(result);
            setStep('ticket');
        } catch (error) {
            console.error("Erro ao entrar na fila:", error);
            alert('Erro ao entrar na fila. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    // Polling for ticket status updates
    useEffect(() => {
        if (step !== 'ticket' || !ticket?.id) return;

        const poll = setInterval(async () => {
            try {
                const update = await Api.getTicketStatus(ticket.id);
                if (update) setTicket((prev: any) => ({ ...prev, ...update }));
            } catch (e) {
                console.error("Erro ao atualizar ticket", e);
            }
        }, 5000);
        return () => clearInterval(poll);
    }, [step, ticket?.id]);

    if (step === 'ticket') {
        // Tela de "CHEGOU SUA VEZ"
        if (ticket?.status === 'attending') {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.5)] animate-bounce">
                        <CheckCircle2 className="text-white w-16 h-16" />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white">Sua Vez Chegou!</h2>
                    <p className="text-slate-300 font-medium text-lg leading-relaxed max-w-xs mx-auto mb-12">
                        O profissional <span className="text-emerald-400 font-bold">{ticket?.barbers?.name || 'seu barbeiro'}</span> já está te aguardando na cadeira.
                    </p>

                    <button
                        onClick={onCancel}
                        className="w-full h-16 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black uppercase tracking-widest transition-all border border-slate-700 text-white"
                    >
                        Voltar ao Início
                    </button>
                    <p className="mt-6 text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Dirija-se à cadeira agora</p>
                </div>
            );
        }

        // Tela de "ATENDIMENTO CONCLUÍDO"
        if (ticket?.status === 'completed' || ticket?.status === 'finished') {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                        <CheckCircle2 className="text-white w-16 h-16" />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white">Atendimento Concluído!</h2>
                    <p className="text-slate-300 font-medium text-lg leading-relaxed max-w-xs mx-auto mb-12">
                        Obrigado por utilizar nossos serviços. Esperamos vê-lo novamente em breve!
                    </p>

                    <button
                        onClick={onCancel}
                        className="w-full h-16 bg-primary-custom hover:opacity-90 rounded-2xl font-black uppercase tracking-widest transition-all text-white"
                    >
                        Voltar ao Início
                    </button>
                </div>
            );
        }

        // Tela de Aguardando na Fila
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary-custom/20 blur-2xl rounded-full animate-pulse" />
                    <div className="w-32 h-32 bg-slate-900 border-4 border-primary-custom rounded-full flex items-center justify-center shadow-2xl relative z-10">
                        <div className="text-center">
                            <span className="block text-5xl font-black text-white leading-none">#{ticket?.real_position || ticket?.position || '?'}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sua Posição</span>
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Você está na fila!</h2>
                <div className="flex items-baseline justify-center gap-1 mb-12">
                    <p className="text-slate-400 font-medium">Tempo estimado:</p>
                    <span className="text-white font-bold text-xl">{ticket?.estimated_wait_minutes || ticket?.estimated_wait || 0} min</span>
                </div>

                {/* Card do Profissional */}
                <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-6 w-full max-w-xs mb-8">
                    <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-6">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700">
                            {ticket?.barbers?.photo_url || selectedBarber?.photo_url ? (
                                <img src={ticket?.barbers?.photo_url || selectedBarber?.photo_url} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 m-auto text-slate-500 mt-2.5" />
                            )}
                        </div>
                        <div className="text-left">
                            <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">{texts.professional}</span>
                            <span className="block text-white font-black text-lg leading-none">{ticket?.barbers?.name || selectedBarber?.name || 'Qualquer um'}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 rounded-xl p-4">
                        <span className="text-slate-500 text-xs uppercase font-bold">Status Atual</span>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-400 font-bold text-xs uppercase">Aguardando</span>
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-3">
                    <button
                        onClick={onComplete}
                        className="w-full py-4 rounded-xl text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors"
                    >
                        Sair da Tela (Manter lugar)
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm('Tem certeza que deseja sair da fila? Você perderá sua posição.')) {
                                try {
                                    await Api.cancelQueue(ticket.id);
                                    onComplete();
                                } catch (e) {
                                    alert('Erro ao sair da fila. Tente novamente.');
                                }
                            }
                        }}
                        className="w-full py-4 rounded-xl bg-red-500/10 text-red-500 font-bold uppercase text-xs tracking-widest hover:bg-red-500/20 transition-colors border border-red-500/20"
                    >
                        Desistir / Sair da Fila
                    </button>
                </div>
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
                <div className="bg-primary-custom/10 border border-primary-custom/20 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-custom">
                        {clientData?.photo_url ? (
                            <img src={clientData.photo_url} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-6 h-6 m-auto text-primary-custom/50" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-100">{clientData?.name}</p>
                        <p className="text-xs text-slate-500">{clientData?.phone}</p>
                    </div>
                </div>

                {/* Barber Selection Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setSelectedBarber({ id: null, name: `Qualquer ${texts.professional}`, is_online: true })}
                        className={`col-span-2 p-3 rounded-xl border flex items-center justify-center transition-all ${!selectedBarber || selectedBarber.id === null ? 'bg-primary-custom border-primary-custom text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                        <span className="font-bold uppercase text-sm tracking-widest">Qualquer {texts.professional} (Rápido)</span>
                    </button>

                    {loading ? (
                        <div className="col-span-2 text-center py-8 text-slate-600 flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin" />
                            <span className="text-xs">Carregando...</span>
                        </div>
                    ) : (
                        barbers.map(barber => (
                            <button
                                key={barber.id}
                                onClick={() => setSelectedBarber(barber)}
                                className={`relative flex flex-col items-center justify-center p-4 rounded-3xl border transition-all aspect-square bg-slate-900 border-slate-800 text-slate-100 hover:border-primary-custom/50 hover:bg-slate-800`}
                            >
                                <div className="absolute top-3 right-3">
                                    <div className={`w-3 h-3 rounded-full ${barber.is_online ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                                </div>

                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-700 mb-3 shadow-xl">
                                    {barber.photo_url ? (
                                        <img src={barber.photo_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 m-auto text-slate-500" />
                                    )}
                                </div>
                                <p className="font-black uppercase text-sm text-center leading-tight">{barber.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{barber.people_waiting || 0} na fila</p>
                            </button>
                        ))
                    )}
                </div>

                {/* Selected Barber Modal */}
                {selectedBarber && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
                            <button
                                onClick={() => setSelectedBarber(null)}
                                className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"
                            >
                                <ChevronRight className="rotate-90" />
                            </button>

                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-custom mx-auto mb-4 shadow-2xl">
                                {selectedBarber.photo_url ? (
                                    <img src={selectedBarber.photo_url} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 m-auto text-slate-500 mt-6" />
                                )}
                            </div>

                            <h3 className="text-2xl font-black text-center text-white uppercase tracking-tight mb-1">{selectedBarber.name}</h3>
                            <p className={`text-xs font-bold text-center uppercase tracking-widest mb-8 ${selectedBarber.is_online ? 'text-emerald-500' : 'text-slate-500'}`}>
                                {selectedBarber.id === null ? 'Disponível Agora' : (selectedBarber.is_online ? 'Disponível Agora' : 'Indisponível')}
                            </p>

                            {selectedBarber.id !== null && (
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-950/50 rounded-2xl p-4 text-center border border-slate-800">
                                        <p className="text-3xl font-black text-white">{selectedBarber.people_waiting || 0}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Pessoas na Fila</p>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-2xl p-4 text-center border border-slate-800">
                                        <p className="text-3xl font-black text-white">{selectedBarber.estimated_wait || 0}<span className="text-sm align-top ml-1">min</span></p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Tempo Estimado</p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleEnterQueue}
                                disabled={loading || !selectedBarber.is_online}
                                className="w-full h-16 bg-primary-custom hover:opacity-90 text-white font-black uppercase tracking-wider text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group transition-all active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        Entrar na Fila
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
