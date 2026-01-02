'use client';

import { useState, useEffect, use } from 'react';
import { ClientApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Play, CheckCircle2, Clock, Phone, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BarberQueuePage({ params }: { params: Promise<{ barberId: string }> }) {
    const { barberId } = use(params);
    const [barberData, setBarberData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        try {
            const allBarbers = await ClientApi.getQueueStatus();
            const myBarber = allBarbers.find((b: any) => b.barber_id === barberId);
            setBarberData(myBarber);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [barberId]);

    const handleCallNext = async () => {
        setActionLoading(true);
        try {
            await ClientApi.barberCallNext(barberId);
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleFinishService = async (ticketId: string) => {
        setActionLoading(true);
        try {
            await ClientApi.barberFinishService(ticketId);
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Carregando Fila...</p>
            </div>
        );
    }

    if (!barberData) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-black text-slate-100 uppercase italic">Barbeiro não encontrado</h2>
                <p className="text-slate-500 mt-2">Verifique se o link está correto.</p>
            </div>
        );
    }

    const attendingClient = barberData.queue.find((q: any) => q.status === 'attending');
    const waitingClients = barberData.queue.filter((q: any) => q.status === 'waiting');

    return (
        <div className="space-y-8 py-4">
            {/* Header do Barbeiro */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-blue-500 overflow-hidden">
                    {barberData.photo_url ? (
                        <img src={barberData.photo_url} alt={barberData.barber_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <User size={32} />
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-100 italic uppercase">{barberData.barber_name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                            "w-2 h-2 rounded-full",
                            barberData.status === 'busy' ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                        )} />
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            {barberData.status === 'busy' ? 'Atendendo' : 'Disponível'}
                        </span>
                    </div>
                </div>
                <button onClick={fetchData} className="ml-auto p-2 text-slate-500 hover:text-blue-500 transition-colors">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Cliente Atual */}
            <Card className="bg-slate-900 border-2 border-blue-500/30 overflow-hidden">
                <div className="bg-blue-600/10 p-2 text-center text-[10px] uppercase font-black tracking-tighter text-blue-500 border-b border-blue-500/20">
                    Atendimento em Curso
                </div>
                <CardContent className="p-6 text-center space-y-4">
                    {attendingClient ? (
                        <>
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                                    <User size={32} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-black text-slate-100 uppercase italic">{attendingClient.client_name}</h3>
                                    {attendingClient.client_phone && (
                                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                                            <Phone size={12} />
                                            <span>{attendingClient.client_phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button
                                onClick={() => handleFinishService(attendingClient.id)}
                                disabled={actionLoading}
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 font-black italic uppercase text-lg"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                                Finalizar Atendimento
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-4 py-4">
                            <p className="text-slate-500 italic">Ninguém sendo atendido agora.</p>
                            <Button
                                onClick={handleCallNext}
                                disabled={actionLoading || waitingClients.length === 0}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 font-black italic uppercase text-lg disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2 fill-current" />}
                                {waitingClients.length > 0 ? 'Chamar Próximo' : 'Fila Vazia'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Lista de Espera */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800">
                    <CardTitle className="text-sm uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Clock size={14} />
                        Fila de Espera ({waitingClients.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {waitingClients.length === 0 ? (
                        <div className="text-center py-10 text-slate-600 italic">
                            Nenhum cliente na fila.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {waitingClients.map((client: any, idx: number) => (
                                <div key={client.id} className="flex items-center gap-4 p-4 hover:bg-slate-800/50 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 font-black text-sm">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-100">{client.client_name}</p>
                                        {client.client_phone && (
                                            <div className="flex items-center gap-1 text-slate-500 text-xs">
                                                <Phone size={10} />
                                                <span>{client.client_phone}</span>
                                            </div>
                                        )}
                                    </div>
                                    <Badge variant="outline" className="text-slate-500 border-slate-700 text-[10px] uppercase">
                                        ~{client.estimated_time_minutes} min
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
