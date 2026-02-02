import { useState, useEffect } from 'react';
import { Api } from '../lib/api';
import { CalendarCheck, Clock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MyAppointmentsProps {
    slug: string;
    clientData: {
        name: string;
        phone: string;
    };
    onBack: () => void;
}

export function MyAppointments({ slug, clientData, onBack }: MyAppointmentsProps) {
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<any[]>([]);

    useEffect(() => {
        loadAppointments();
    }, []);

    async function loadAppointments() {
        try {
            setLoading(true);
            const data = await Api.getMyAppointments(clientData.phone, slug);
            // Mostrar apenas agendamentos pendentes (não concluídos e não cancelados)
            const pending = (data || []).filter((a: any) =>
                a.status !== 'completed' &&
                a.status !== 'finished' &&
                a.status !== 'cancelled'
            );
            setAppointments(pending);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Buscando agendamentos...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto h-full animate-in fade-in slide-in-from-bottom-8 duration-500 p-6">
            <div className="flex items-center gap-2 mb-8">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/5 rounded-full text-slate-400">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-black uppercase tracking-tighter">Meus Agendamentos</h2>
            </div>

            {appointments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <CalendarCheck className="w-16 h-16 text-slate-600 mb-4" />
                    <p className="text-slate-400 font-bold">Nenhum agendamento futuro.</p>
                </div>
            ) : (
                <div className="space-y-4 overflow-y-auto pb-4">
                    {appointments.map(apt => (
                        <div key={apt.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4" />

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                                        {apt.barbers?.users?.photo_url ? (
                                            <img src={apt.barbers.users.photo_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-full h-full p-2 text-slate-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Profissional</p>
                                        <p className="font-bold text-slate-200">{apt.barbers?.nickname || apt.barbers?.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Data</p>
                                    <p className="font-bold text-emerald-400">
                                        {format(new Date(apt.start_time), "dd/MM", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm font-bold text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                                <Clock size={16} className="text-blue-500" />
                                <span>{format(new Date(apt.start_time), "HH:mm")}</span>
                                <span className="text-slate-600 mx-1">•</span>
                                <span className="text-slate-500 line-clamp-1 flex-1">
                                    {apt.services_details?.map((s: any) => s.name).join(', ') || 'Serviços do Salão'}
                                </span>
                            </div>

                            {/* Status Badge */}
                            <div className="absolute bottom-5 right-5">
                                {apt.status === 'scheduled' && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
