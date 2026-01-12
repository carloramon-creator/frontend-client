import { useState, useEffect } from 'react';
import { Api } from '../lib/api';
import {
    ChevronRight,
    ChevronLeft,
    User,
    Users,
    Scissors,
    Loader2,
    CheckCircle2,
    CalendarCheck,
} from 'lucide-react';
import { getBusinessTexts } from '../lib/business-dictionary';
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
    hasPendingAppointments?: boolean;
    onComplete: () => void;
    onCancel: () => void;
    onViewAppointments?: () => void;
    business_type?: any;
}

export function AppointmentWizard({ slug, clientData, hasPendingAppointments, onComplete, onCancel, onViewAppointments, business_type }: AppointmentWizardProps) {
    const texts = getBusinessTexts(business_type);
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
        setAvailableSlots([]);
        try {
            const duration = selectedServices.reduce((acc, s) => acc + (s.duration_minutes || 30), 0);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const slots = await Api.getAvailability(dateStr, selectedBarber.id, duration, slug);
            setAvailableSlots(slots || []);
        } catch (err) {
            console.error(err);
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
                <Loader2 className="w-10 h-10 animate-spin text-primary-custom" />
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
                    {step === 1 && `Escolha os ${texts.services}`}
                    {step === 2 && `Escolha o ${texts.professional}`}
                    {step === 3 && "Data e Horário"}
                    {step === 4 && "Confirmar Agendamento"}
                </h3>
                {step === 3 && (
                    <div className="flex items-center justify-center gap-4 mt-2 mb-4">
                        <button onClick={() => setSelectedDate(addDays(selectedDate, -30))} className="p-2 hover:bg-white/10 rounded-full">
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <span className="text-sm font-bold uppercase text-slate-300 capitalize">{format(selectedDate, 'MMMM yyyy', { locale: ptBR })}</span>
                        <button onClick={() => setSelectedDate(addDays(selectedDate, 30))} className="p-2 hover:bg-white/10 rounded-full">
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                )}
                {step !== 3 && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${step === i ? "bg-primary-custom w-6" : step > i ? "opacity-30 bg-primary-custom" : "bg-slate-800"}`} />
                        ))}
                    </div>
                )}

                {step === 1 && hasPendingAppointments && onViewAppointments && (
                    <button
                        onClick={onViewAppointments}
                        className="mt-4 px-4 py-2 bg-slate-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-yellow-500 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <CalendarCheck size={14} />
                        Ver Meus Agendamentos
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto mb-6 px-1">
                {step === 1 && (
                    <div className="grid grid-cols-2 gap-3">
                        {services.map(s => {
                            const isSelected = selectedServices.some(sel => sel.id === s.id);
                            return (
                                <div
                                    key={s.id}
                                    onClick={() => isSelected ? setSelectedServices(selectedServices.filter(sel => sel.id !== s.id)) : setSelectedServices([...selectedServices, s])}
                                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between h-24 ${isSelected ? "bg-primary-custom/10 border-primary-custom" : "bg-slate-900 border-slate-800"}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "bg-primary-custom text-white" : "bg-slate-800 text-slate-500"}`}>
                                            <Scissors size={16} />
                                        </div>
                                        {isSelected && <div className="w-2 h-2 bg-primary-custom rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-100 text-xs leading-tight line-clamp-2">{s.name}</p>
                                        <div className="flex justify-between items-end mt-1">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{s.duration_minutes || 30} min</p>
                                            <p className="font-black text-primary-custom text-xs">R$ {s.price.toFixed(0)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {step === 2 && (
                    <div className="grid gap-3">
                        <button
                            onClick={() => { setSelectedBarber(null); setStep(3); }}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${!selectedBarber ? "bg-primary-custom/10 border-primary-custom" : "bg-slate-900 border-slate-800"}`}
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700">
                                <Users className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-black text-slate-100 text-sm uppercase">Qualquer {texts.professional}</h4>
                                <p className="text-xs text-slate-500">Maior disponibilidade de horários</p>
                            </div>
                            {!selectedBarber && <CheckCircle2 className="ml-auto text-primary-custom" size={20} />}
                        </button>

                        {barbers
                            .filter(b => selectedServices.every(s => b.service_ids?.includes(s.id)))
                            .map(b => (
                                <div
                                    key={b.id}
                                    onClick={() => { setSelectedBarber(b); setStep(3); }}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedBarber?.id === b.id ? "bg-primary-custom/10 border-primary-custom" : "bg-slate-900 border-slate-800"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0">
                                            {b.photo_url ? <img src={b.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-slate-600" />}
                                        </div>
                                        <h4 className="font-black text-slate-100 text-sm uppercase">{b.nickname || b.name}</h4>
                                    </div>
                                    <ChevronRight className="text-slate-800" size={20} />
                                </div>
                            ))}
                        {barbers.filter(b => selectedServices.every(s => b.service_ids?.includes(s.id))).length === 0 && (
                            <div className="text-center p-8 text-slate-500 text-sm">
                                Nenhum {texts.professional.toLowerCase()} disponível para todos os {texts.services.toLowerCase()} selecionados.
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                                <span key={d} className="text-[10px] font-bold text-slate-600 uppercase py-2">{d}</span>
                            ))}
                            {Array.from({ length: 35 }).map((_, i) => {
                                const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                                const startDay = startOfMonth.getDay(); // 0 = Sunday
                                const dayOffset = i - startDay;
                                const date = addDays(startOfMonth, dayOffset);
                                const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                                const isSelected = isSameDay(date, selectedDate);
                                const isPast = date < new Date() && !isSameDay(date, new Date());

                                if (!isCurrentMonth) return <div key={i} />;

                                return (
                                    <button
                                        key={i}
                                        disabled={isPast}
                                        onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                                        className={`
                                            h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all relative
                                            ${isSelected ? "bg-primary-custom text-white shadow-lg shadow-primary-custom/50 z-10 scale-110" : "text-slate-300 hover:bg-slate-800"}
                                            ${isPast ? "opacity-20 cursor-not-allowed" : ""}
                                        `}
                                    >
                                        {format(date, 'd')}
                                        {isSelected && <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="h-px bg-slate-800 w-full" />

                        {/* Slots */}
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            <p className="text-center text-xs font-bold uppercase text-slate-500 tracking-widest">Horários Disponíveis</p>
                            {availableSlots.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2">
                                    {availableSlots.map(slot => (
                                        <div
                                            key={slot.time}
                                            onClick={() => slot.available && setSelectedTime(slot.time)}
                                            className={`py-2 rounded-xl border-2 text-center transition-all cursor-pointer font-mono font-bold text-xs ${!slot.available ? "opacity-30 border-slate-900 bg-slate-950 text-slate-800 pointer-events-none" : selectedTime === slot.time ? "bg-primary-custom border-primary-custom text-white shadow-lg" : "bg-slate-900 border-slate-800 text-primary-custom"}`}
                                        >
                                            {slot.time}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                                    <p className="text-slate-500 text-xs">Selecione uma data para ver os horários.</p>
                                </div>
                            )}
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
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{texts.professional}</p>
                                <p className="text-xl font-black text-slate-100 uppercase leading-none">{selectedBarber?.nickname || selectedBarber?.name || `Qualquer ${texts.professional}`}</p>
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
                                        <span className="font-mono text-primary-custom font-bold">R$ {s.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-end pt-4 border-t border-slate-800">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Duração: {totalDuration} min</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Total</p>
                                    <p className="text-3xl font-black text-primary-custom tracking-tighter">R$ {totalPrice.toFixed(2)}</p>
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
                        className={`h-14 flex-[2] bg-primary-custom hover:opacity-90 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 pointer-events-none' : ''}`}
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
