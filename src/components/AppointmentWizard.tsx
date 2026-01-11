import { useState, useEffect } from 'react';
import { Api } from '../lib/api';
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
import { format, addDays, isSameDay } from 'date-fns';
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
                setBarbers(barbersData || []);
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
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Carregando opções...</p>
            </div>
        );
    }

    const totalDuration = selectedServices.reduce((acc, s) => acc + (s.duration_minutes || 30), 0);
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);

    return (
        <div className="flex flex-col h-full">
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
                        <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${step === i ? "bg-blue-500 w-6" : step > i ? "bg-blue-900" : "bg-slate-800"}`} />
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-6">
                {step === 1 && (
                    <div className="grid gap-3">
                        {services.map(s => {
                            const isSelected = selectedServices.some(sel => sel.id === s.id);
                            return (
                                <div
                                    key={s.id}
                                    onClick={() => isSelected ? setSelectedServices(selectedServices.filter(sel => sel.id !== s.id)) : setSelectedServices([...selectedServices, s])}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${isSelected ? "bg-blue-600/10 border-blue-500" : "bg-slate-900 border-slate-800"}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-500"}`}>
                                            <Scissors size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-100">{s.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{s.duration_minutes || 30} MIN</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-blue-400">R$ {s.price.toFixed(2)}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {step === 2 && (
                    <div className="grid gap-3">
                        {barbers.map(b => (
                            <div
                                key={b.id}
                                onClick={() => { setSelectedBarber(b); setStep(3); }}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedBarber?.id === b.id ? "bg-blue-600/10 border-blue-500" : "bg-slate-900 border-slate-800"}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0">
                                        {b.photo_url ? <img src={b.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-slate-600" />}
                                    </div>
                                    <h4 className="font-black text-slate-100 text-lg uppercase italic">{b.nickname || b.name}</h4>
                                </div>
                                <ChevronRight className="text-slate-800" size={20} />
                            </div>
                        ))}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 no-scrollbar">
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(offset => {
                                const day = addDays(new Date(), offset);
                                const isSelected = isSameDay(day, selectedDate);
                                return (
                                    <div
                                        key={offset}
                                        onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                                        className={`flex flex-col items-center justify-center min-w-[65px] h-20 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? "bg-blue-600 border-blue-400 text-white shadow-lg" : "bg-slate-900 border-slate-800 text-slate-400"}`}
                                    >
                                        <span className="text-[9px] uppercase font-black opacity-60">{format(day, 'EEE', { locale: ptBR })}</span>
                                        <span className="text-2xl font-black">{format(day, 'dd')}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {availableSlots.map(slot => (
                                <div
                                    key={slot.time}
                                    onClick={() => slot.available && setSelectedTime(slot.time)}
                                    className={`py-3 rounded-xl border-2 text-center transition-all cursor-pointer font-mono font-bold ${!slot.available ? "opacity-30 border-slate-900 bg-slate-950 text-slate-800 pointer-events-none" : selectedTime === slot.time ? "bg-blue-500 border-blue-400 text-white shadow-lg" : "bg-slate-900 border-slate-800 text-blue-500"}`}
                                >
                                    {slot.time}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="bg-slate-900/50 rounded-3xl border-2 border-slate-800 p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0">
                                {selectedBarber?.photo_url ? <img src={selectedBarber.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="p-3 text-slate-600" />}
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Profissional</p>
                                <p className="text-xl font-black text-slate-100 uppercase italic leading-none">{selectedBarber?.nickname || selectedBarber?.name}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl">
                                <CalendarCheck className="text-emerald-500" size={20} />
                                <p className="text-sm font-bold uppercase">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}</p>
                            </div>
                            <div className="space-y-2">
                                {selectedServices.map(s => (
                                    <div key={s.id} className="flex justify-between text-sm">
                                        <span className="text-slate-400 font-medium">{s.name}</span>
                                        <span className="font-mono text-blue-400">R$ {s.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-end pt-4 border-t border-slate-800">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Duração: {totalDuration} min</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Total</p>
                                    <p className="text-3xl font-black text-blue-500 tracking-tighter">R$ {totalPrice.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="py-4 flex flex-col gap-3 mt-auto">
                <div className="flex gap-3">
                    {step > 1 && (
                        <button onClick={() => setStep(step - 1)} className="h-14 flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-black uppercase italic rounded-2xl flex items-center justify-center">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (step === 4) handleConfirm();
                            else if (step === 1 && selectedServices.length > 0) setStep(2);
                            else if (step === 2 && selectedBarber) setStep(3);
                            else if (step === 3 && selectedTime) setStep(4);
                        }}
                        disabled={isSubmitting || (step === 1 && selectedServices.length === 0) || (step === 2 && !selectedBarber) || (step === 3 && !selectedTime)}
                        className={`h-14 flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black italic uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 pointer-events-none' : ''}`}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : step === 4 ? "Confirmar" : "Próximo"}
                        {step < 4 && !isSubmitting && <ChevronRight size={18} />}
                    </button>
                </div>
                {step === 1 && <button onClick={onCancel} className="text-slate-600 font-bold uppercase text-[10px] tracking-widest py-2">Cancelar</button>}
            </div>
        </div>
    );
}
