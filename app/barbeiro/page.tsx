'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { User, Loader2, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BarberSelectPage() {
    const router = useRouter();
    const [barbers, setBarbers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await ClientApi.getQueueStatus();
                setBarbers(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 py-4">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1 rounded-full">
                    <Scissors className="text-amber-500" size={14} />
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest italic">Área do Barbeiro</span>
                </div>
                <h1 className="text-3xl font-black text-slate-100 italic uppercase">
                    Selecione seu Perfil
                </h1>
                <p className="text-slate-500">Escolha seu nome para gerenciar sua fila.</p>
            </div>

            <div className="grid gap-4">
                {barbers.map((barber) => (
                    <Card
                        key={barber.barber_id}
                        className="cursor-pointer bg-slate-900 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all"
                        onClick={() => router.push(`/barbeiro/${barber.barber_id}`)}
                    >
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden">
                                {barber.photo_url ? (
                                    <img src={barber.photo_url} alt={barber.barber_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-500">
                                        <User size={28} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-slate-100 uppercase italic">{barber.barber_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        barber.is_active ? "bg-emerald-500" : "bg-red-500"
                                    )} />
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                        {barber.queue.length} na fila
                                    </span>
                                </div>
                            </div>
                            <div className="text-blue-500">
                                →
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="text-center">
                <button
                    onClick={() => router.push('/')}
                    className="text-[10px] text-slate-600 hover:text-slate-400 uppercase font-black tracking-widest italic"
                >
                    ← Voltar para Clientes
                </button>
            </div>
        </div>
    );
}
