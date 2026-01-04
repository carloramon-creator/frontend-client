'use client';

import { useState, useEffect } from 'react';
import { Api } from '@/lib/api';
import {
    Users,
    Clock,
    Scissors,
    Smartphone,
    ChevronRight,
    UserCheck,
    Phone,
    Crown
} from 'lucide-react';

export default function ShopPage({ params }: { params: { id: string } }) {
    const [shopData, setShopData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isPriority, setIsPriority] = useState(false);
    const [selectedBarber, setSelectedBarber] = useState<string>('any');
    const [joined, setJoined] = useState<any>(null);

    const fetchStatus = async () => {
        try {
            const data = await Api.getShopInfo(params.id);
            setShopData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleJoin = async () => {
        if (!name) return alert('Por favor, digite seu nome');
        if (!phone) return alert('Por favor, digite seu telefone');
        try {
            const res = await Api.joinQueue(params.id, selectedBarber, name, phone, isPriority);
            setJoined(res);
            fetchStatus();
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (joined) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center text-center space-y-8">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 border-2 border-green-500/20">
                    <UserCheck size={48} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black italic">VOCÊ ESTÁ NA FILA!</h1>
                    <p className="text-slate-400">Sua senha é a # {joined.id.slice(-4)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                        <div className="text-slate-500 text-xs uppercase font-bold mb-1">Posição</div>
                        <div className="text-2xl font-black text-blue-500">{joined.position}º</div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                        <div className="text-slate-500 text-xs uppercase font-bold mb-1">Espera Est.</div>
                        <div className="text-2xl font-black text-yellow-500">{joined.estimated_time_minutes} min</div>
                    </div>
                </div>

                <p className="text-slate-500 text-sm max-w-xs">
                    Nós avisaremos quando chegar sua vez. Fique atento ao painel da barbearia!
                </p>

                <button
                    onClick={() => setJoined(null)}
                    className="text-slate-500 text-sm underline"
                >
                    Sair da Fila / Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto border-x border-slate-900">
            {/* Header */}
            <header className="p-8 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Scissors className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">791 Barber</h1>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest leading-none">The Best Shave in Town</p>
                    </div>
                </div>
            </header>

            {/* Hero Stats */}
            <div className="px-8 space-y-6">
                <div className="bg-blue-600 rounded-3xl p-6 shadow-2xl shadow-blue-600/20 space-y-6 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                        <Smartphone size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-blue-100 text-sm font-medium">Fila agora</p>
                        <div className="flex items-end gap-2">
                            <h2 className="text-5xl font-black">{shopData.reduce((acc, b) => acc + b.queue.length, 0)}</h2>
                            <p className="text-blue-200 mb-2 font-bold uppercase text-xs">Pessoas aguardando</p>
                        </div>
                    </div>
                    <div className="flex gap-4 relative z-10">
                        <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                            <Clock size={14} />
                            <span className="text-xs font-bold">~35 min de espera</span>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Digite seu nome aqui"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-100 focus:outline-none focus:border-blue-600 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Seu Telefone</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="tel"
                                placeholder="(00) 00000-0000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 pl-12 text-slate-100 focus:outline-none focus:border-blue-600 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Tipo de Atendimento</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setIsPriority(false)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${!isPriority ? 'bg-slate-800 border-slate-700 ring-2 ring-slate-600' : 'bg-slate-900 border-slate-800 opacity-50'}`}
                            >
                                <Users size={24} className={!isPriority ? 'text-white' : 'text-slate-500'} />
                                <span className={`text-xs font-bold uppercase ${!isPriority ? 'text-white' : 'text-slate-500'}`}>Normal</span>
                            </button>
                            <button
                                onClick={() => setIsPriority(true)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${isPriority ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500' : 'bg-slate-900 border-slate-800 opacity-50'}`}
                            >
                                <Crown size={24} className={isPriority ? 'text-amber-500' : 'text-slate-500'} />
                                <span className={`text-xs font-bold uppercase ${isPriority ? 'text-amber-500' : 'text-slate-500'}`}>Prioritário</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Escolher Barbeiro</label>
                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedBarber('any')}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedBarber === 'any' ? 'bg-blue-600/10 border-blue-600' : 'bg-slate-900 border-slate-800'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${selectedBarber === 'any' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                        <Users size={18} />
                                    </div>
                                    <div className="text-left leading-tight">
                                        <div className="font-bold text-sm">Qualquer um</div>
                                        <div className="text-xs text-slate-500">O que desocupar primeiro</div>
                                    </div>
                                </div>
                                {selectedBarber === 'any' && <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_10px_#2563eb]" />}
                            </button>

                            {shopData.map((barber) => (
                                <button
                                    key={barber.barber_id}
                                    onClick={() => setSelectedBarber(barber.barber_id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedBarber === barber.barber_id ? 'bg-blue-600/10 border-blue-600' : 'bg-slate-900 border-slate-800'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${selectedBarber === barber.barber_id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                            {barber.barber_name.charAt(0)}
                                        </div>
                                        <div className="text-left leading-tight">
                                            <div className="font-bold text-sm">{barber.barber_name}</div>
                                            <div className="text-xs text-slate-500">{barber.queue.length} pessoas na fila</div>
                                        </div>
                                    </div>
                                    {selectedBarber === barber.barber_id && <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_10px_#2563eb]" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleJoin}
                        className="w-full bg-slate-100 text-slate-950 font-black h-16 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform mt-8"
                    >
                        ENTRAR NA FILA AGORA
                        <ChevronRight />
                    </button>
                </div>
            </div>

            <footer className="mt-auto p-12 text-center">
                <p className="text-[10px] text-slate-700 uppercase tracking-widest font-medium">Powered by 791 Solutions</p>
            </footer>
        </div>
    );
}
