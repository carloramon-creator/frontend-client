'use client';

import { useState, useEffect } from 'react';
import { Api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Calendar,
    Clock,
    ChevronRight,
    ChevronLeft,
    Check,
    User,
    Scissors,
    Loader2,
    CalendarCheck,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfDay, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentWizardProps {
    slug: string;
    clientData: {
        name: string;
        phone: string;
        cpf?: string;
        photo_url?: string;
    };
    onComplete: () => void;
    onCancel: () => void;
}

export function AppointmentWizard({ slug, clientData, onComplete, onCancel }: AppointmentWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data
    const [services, setServices] = useState<any[]>([]);
    const [barbers, setBarbers] = useState<any[]>([]);

    // Selections
    const [selectedServices, setSelectedServices] = useState<any[]>([]);
    const [selectedBarber, setSelectedBarber] = useState<any | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Initial load
    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [servicesData, barbersData] = await Promise.all([
                    Api.getServices(slug),
                    Api.getBarbers(slug)
                ]);
                setServices(servicesData || []);

                // Fetch barber services to know who does what
                const barbersWithServices = await Promise.all((barbersData || []).map(async (b: any) => {
                    try {
                        const sIds = await Api.getBarberServices(b.id);
                        return { ...b, serviceIds: sIds || [] };
                    } catch {
                        return { ...b, serviceIds: [] };
                    }
                }));
                setBarbers(barbersWithServices);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [slug]);

    // Fetch availability when date/barber/services change
    useEffect(() => {
        if (step === 3 && selectedBarber && selectedDate && selectedServices.length > 0) {
            fetchAvailability();
        }
    }, [step, selectedDate, selectedBarber, selectedServices]);

    const fetchAvailability = async () => {
        setLoadingSlots(true);
        setAvailableSlots([]);
        try {
            const duration = selectedServices.reduce((acc, s) => acc + (s.duration_minutes || 30), 0);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const slots = await Api.getAvailability(dateStr, selectedBarber.id, duration, slug);
            setAvailableSlots(slots || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedBarber || selectedServices.length === 0 || !selectedTime || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const duration = selectedServices.reduce((acc, s) => acc + (s.duration_minutes || 30), 0);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const startISO = new Date(`${dateStr}T${selectedTime}:00`).toISOString();
            const endISO = new Date(new Date(startISO).getTime() + duration * 60000).toISOString();

            await Api.createAppointment({
                tenant_slug: slug,
                client_name: clientData.name,
                client_phone: clientData.phone.replace(/\D/g, ''),
                cpf: clientData.cpf?.replace(/\D/g, ''),
                photo_url: clientData.photo_url,
                barber_id: selectedBarber.id,
                start_time: startISO,
                end_time: endISO,
                service_ids: selectedServices.map(s => s.id),
                status: 'scheduled'
            });

            onComplete();
        } catch (err: any) {
            alert('Erro ao agendar: ' + (err.message || 'Tente novamente.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Carregando serviços disponíveis...</p>
            </div>
        );
    }

    const totalDuration = selectedServices.reduce((acc, s) => acc + (s.duration_minutes || 30), 0);
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);

    // Filter barbers by selected services
    const filteredBarbers = barbers.filter(b =>
        selectedServices.every(s => b.serviceIds.includes(s.id))
    );

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Step Header */}
            <div className="text-center mb-6">
                <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">
                    {step === 1 && "Escolha os Serviços"}
                    {step === 2 && "Escolha o Profissional"}
                    {step === 3 && "Data e Horário"}
                    {step === 4 && "Confirmar Agendamento"}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            step === i ? "bg-emerald-500 w-6" : step > i ? "bg-emerald-800" : "bg-slate-800"
                        )} />
                    ))}
                </div>
            </div>

            {/* STEP CONTENT */}
            <div className="flex-1 overflow-y-auto min-h-[40vh] mb-6">

                {/* STEP 1: SERVICES */}
                {step === 1 && (
                    <div className="grid gap-3">
                        {services.length === 0 ? (
                            <p className="text-center py-10 text-slate-600">Nenhum serviço disponível no momento.</p>
                        ) : (
                            services.map(s => {
                                const isSelected = selectedServices.some(sel => sel.id === s.id);
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            if (isSelected) setSelectedServices(selectedServices.filter(sel => sel.id !== s.id));
                                            else setSelectedServices([...selectedServices, s]);
                                        }}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                                            isSelected ? "bg-emerald-600/10 border-emerald-500" : "bg-slate-900 border-slate-800 hover:border-slate-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                isSelected ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500"
                                            )}>
                                                <Scissors size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-100">{s.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.duration_minutes || 30} MIN</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-emerald-400">R$ {s.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* STEP 2: BARBER */}
                {step === 2 && (
                    <div className="grid gap-3">
                        {filteredBarbers.length === 0 ? (
                            <div className="text-center py-10 space-y-2">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs tracking-tighter">Nenhum profissional realiza todos os serviços selecionados.</p>
                                <Button variant="link" className="text-emerald-500" onClick={() => setStep(1)}>Voltar e ajustar serviços</Button>
                            </div>
                        ) : (
                            filteredBarbers.map(b => (
                                <div
                                    key={b.id}
                                    onClick={() => {
                                        setSelectedBarber(b);
                                        setStep(3);
                                    }}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                                        selectedBarber?.id === b.id ? "bg-emerald-600/10 border-emerald-500" : "bg-slate-900 border-slate-800 hover:border-slate-700"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0">
                                            {b.photo_url ? (
                                                <img src={b.photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-full h-full p-3 text-slate-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-100 text-lg leading-tight">{b.nickname || b.name}</h4>
                                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em] mt-1">Disponível Hoje</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-800" size={20} />
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* STEP 3: DATE & TIME */}
                {step === 3 && (
                    <div className="space-y-6">
                        {/* Compact Calendar Row */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(offset => {
                                const day = addDays(new Date(), offset);
                                const isSelected = isSameDay(day, selectedDate);
                                return (
                                    <div
                                        key={offset}
                                        onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                                        className={cn(
                                            "flex flex-col items-center justify-center min-w-[65px] h-20 rounded-2xl border-2 transition-all cursor-pointer snap-center",
                                            isSelected ? "bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/50"
                                        )}
                                    >
                                        <span className="text-[9px] uppercase font-black tracking-widest leading-none mb-1 opacity-60">
                                            {format(day, 'EEE', { locale: ptBR })}
                                        </span>
                                        <span className="text-2xl font-black leading-none uppercase">
                                            {format(day, 'dd')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Slots */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Horários Disponíveis</h4>
                            {loadingSlots ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                    <Loader2 className="animate-spin text-emerald-500" size={24} />
                                    <p className="text-[10px] text-slate-600 font-bold uppercase">Buscando horários...</p>
                                </div>
                            ) : availableSlots.length === 0 ? (
                                <p className="text-center py-10 text-slate-600 text-xs italic">Nenhum horário disponível para esta combinação.</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {availableSlots.map(slot => (
                                        <div
                                            key={slot.time}
                                            onClick={() => slot.available && setSelectedTime(slot.time)}
                                            className={cn(
                                                "py-3 rounded-xl border-2 text-center transition-all cursor-pointer font-mono font-bold",
                                                !slot.available ? "opacity-30 border-slate-900 bg-slate-950 text-slate-800 pointer-events-none" :
                                                    selectedTime === slot.time ? "bg-emerald-500 border-emerald-400 text-white shadow-lg" : "bg-slate-900 border-slate-800 text-emerald-500 hover:border-emerald-600/50"
                                            )}
                                        >
                                            {slot.time}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 4: REVIEW */}
                {step === 4 && (
                    <div className="space-y-4">
                        <div className="bg-slate-900/50 rounded-3xl border-2 border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <CalendarCheck size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-100 uppercase tracking-tight">Data e Hora</h4>
                                        <p className="text-sm text-slate-400 font-medium">
                                            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0">
                                        {selectedBarber?.photo_url ? (
                                            <img src={selectedBarber.photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="p-2 text-slate-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Profissional</p>
                                        <p className="text-lg font-black text-slate-100 uppercase italic leading-none">{selectedBarber?.nickname || selectedBarber?.name}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800/50">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Serviços Selecionados</p>
                                    <div className="space-y-2">
                                        {selectedServices.map(s => (
                                            <div key={s.id} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-300 font-medium">{s.name}</span>
                                                <span className="font-mono text-emerald-400">R$ {s.price.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase space-y-1">
                                        <p>Total {totalDuration} min</p>
                                        <p className="text-slate-600">Lembrete via WhatsApp</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-500 uppercase font-black block">Total</span>
                                        <span className="text-3xl font-black text-emerald-500 tracking-tighter leading-tight">R$ {totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ACTION FOOTER */}
            <div className="py-4 border-t border-slate-900 flex flex-col gap-3">
                {step < 4 ? (
                    <div className="flex gap-3">
                        {step > 1 && (
                            <Button
                                variant="outline"
                                onClick={() => setStep(step - 1)}
                                className="h-14 flex-1 border-slate-800 text-slate-400 font-black uppercase italic rounded-2xl"
                            >
                                <ChevronLeft size={18} className="mr-2" /> Voltar
                            </Button>
                        )}
                        <Button
                            onClick={() => {
                                if (step === 3) setStep(4);
                                else if (step === 1 && selectedServices.length > 0) setStep(2);
                                else if (step === 2 && selectedBarber) setStep(3);
                            }}
                            disabled={
                                (step === 1 && selectedServices.length === 0) ||
                                (step === 2 && !selectedBarber) ||
                                (step === 3 && !selectedTime)
                            }
                            className="h-14 flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/10"
                        >
                            Próximo <ChevronRight size={18} className="ml-2" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 group overflow-hidden relative"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                                {isSubmitting ? "Processando..." : "Confirmar Agendamento"}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setStep(3)}
                            disabled={isSubmitting}
                            className="text-slate-600 font-bold uppercase text-[10px] tracking-widest"
                        >
                            Alterar Horário
                        </Button>
                    </div>
                )}

                {step === 1 && (
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="text-slate-800 font-bold uppercase text-[10px] tracking-widest h-auto py-2"
                    >
                        Cancelar escolha
                    </Button>
                )}
            </div>
        </div>
    );
}
