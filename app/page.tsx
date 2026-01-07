'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Api } from '@/lib/api';
import { BarberCard } from '@/components/barber/barber-card';
import { BarberList } from '@/components/barber/barber-list';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { User, Sparkles, Loader2, Camera, Fingerprint, Phone, CreditCard, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration State
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCpf, setClientCpf] = useState('');
  const [clientPhoto, setClientPhoto] = useState<string | null>(null);

  const [issubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load existing data from localStorage if available
    const savedName = localStorage.getItem('791_client_name');
    const savedPhone = localStorage.getItem('791_client_phone');
    const savedCpf = localStorage.getItem('791_client_cpf');
    const savedPhoto = localStorage.getItem('791_client_photo');

    if (savedName) setClientName(savedName);
    if (savedPhone) setClientPhone(savedPhone);
    if (savedCpf) setClientCpf(savedCpf);
    if (savedPhoto) setClientPhoto(savedPhoto);

    async function load() {
      try {
        const data = await Api.getQueueStatus('');
        setBarbers(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleEnterQueue = async (barberId?: string) => {
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Nome e telefone são obrigatórios.');
      setStep(1);
      return;
    }

    const rawPhone = clientPhone.replace(/\D/g, '');
    const rawCpf = clientCpf.replace(/\D/g, '');

    setIsSubmitting(true);
    try {
      // Save for next time
      localStorage.setItem('791_client_name', clientName);
      localStorage.setItem('791_client_phone', clientPhone);
      localStorage.setItem('791_client_cpf', clientCpf);
      if (clientPhoto) localStorage.setItem('791_client_photo', clientPhoto);

      const res = await Api.enterQueueForBarber(
        '',
        barberId || 'any',
        clientName,
        rawPhone,
        rawCpf,
        clientPhoto || undefined
      );

      router.push(`/fila/${res.id}`);
    } catch (err: any) {
      if (err.data?.error === 'CLIENT_ALREADY_IN_QUEUE' && err.data?.ticketId) {
        router.push(`/fila/${err.data.ticketId}`);
        return;
      }
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClientPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <Loader2 className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={24} />
        </div>
        <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">
          Sincronizando com a Barbearia...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Progress Indicator */}
      <div className="flex justify-between items-center px-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 border-2",
              step === s ? "bg-blue-600 border-blue-400 text-white scale-110 shadow-lg shadow-blue-900/40" :
                step > s ? "bg-green-500 border-green-400 text-white" : "border-slate-800 text-slate-600"
            )}>
              {step > s ? <Check size={14} strokeWidth={4} /> : s}
            </div>
            {s < 3 && (
              <div className={cn(
                "h-0.5 flex-1 mx-2 transition-all duration-500",
                step > s ? "bg-green-500" : "bg-slate-800"
              )} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-100 italic uppercase">
              Quem <span className="text-blue-500 tracking-tighter">é você?</span>
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Vamos começar sua experiência</p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div
                onClick={handlePhotoClick}
                className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/50 transition-all overflow-hidden relative group"
              >
                {clientPhoto ? (
                  <img src={clientPhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="text-slate-600 group-hover:text-blue-500 transition-colors" size={32} />
                    <span className="text-[10px] font-black uppercase text-slate-500 mt-2">Sua Foto</span>
                  </>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[8px] text-center font-black text-white uppercase tracking-tighter">Mudar Foto</p>
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Nome Completo</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <Input
                    placeholder="Ex: João da Silva"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="h-14 pl-12 bg-slate-900 border-slate-800 text-lg font-bold placeholder:text-slate-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-2xl"
                  />
                </div>
              </div>

              <Button
                onClick={() => clientName && setStep(2)}
                disabled={!clientName}
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-900/20 group text-lg"
              >
                Próximo Passo
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-100 italic uppercase">
              Dados de <span className="text-blue-500 tracking-tighter">Contato</span>
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Para NF-e e notificações</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">WhatsApp (DDD)</Label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={clientPhone}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                    if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                    if (v.length > 9) v = `${v.slice(0, 9)}-${v.slice(9)}`;
                    setClientPhone(v);
                  }}
                  className="h-14 pl-12 bg-slate-900 border-slate-800 text-lg font-bold focus:border-blue-500 focus:ring-blue-500/20 rounded-2xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">CPF (Opcional)</Label>
              <div className="relative group">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                <Input
                  placeholder="000.000.000-00"
                  value={clientCpf}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                    if (v.length > 3) v = `${v.slice(0, 3)}.${v.slice(3)}`;
                    if (v.length > 7) v = `${v.slice(0, 7)}.${v.slice(7)}`;
                    if (v.length > 11) v = `${v.slice(0, 11)}-${v.slice(11)}`;
                    setClientCpf(v);
                  }}
                  className="h-14 pl-12 bg-slate-900 border-slate-800 text-lg font-bold focus:border-blue-500 focus:ring-blue-500/20 rounded-2xl"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-16 border-slate-800 text-slate-400 font-black uppercase italic rounded-2xl hover:bg-slate-900"
              >
                Voltar
              </Button>
              <Button
                onClick={() => clientPhone.length >= 14 && setStep(3)}
                disabled={clientPhone.length < 14}
                className="flex-[2] h-16 bg-blue-600 hover:bg-blue-700 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-900/20 group text-lg"
              >
                Continuar
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-black text-slate-100 italic uppercase">
              Escolha seu <span className="text-blue-500 tracking-tighter">Artista</span>
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Quem vai cuidar do seu estilo hoje?</p>
          </div>

          <div className="space-y-4 pb-10">
            {/* Opção Rápida: Qualquer Barbeiro */}
            <div
              className="cursor-pointer border-2 border-dashed border-blue-600/30 bg-blue-600/5 hover:bg-blue-600/10 hover:border-blue-600/50 transition-all p-6 rounded-3xl flex items-center justify-between group"
              onClick={() => handleEnterQueue()}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <Sparkles size={28} />
                </div>
                <div className="text-left">
                  <h4 className="font-black text-slate-100 uppercase italic text-lg leading-tight">Próximo Disponível</h4>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest italic mt-1">Menor tempo de espera</p>
                </div>
              </div>
              <ChevronRight className="text-blue-600 group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="relative pt-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-900"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-950 px-4 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Ou escolha um profissional</span>
              </div>
            </div>

            <BarberList
              barbers={barbers}
              onSelect={(id) => handleEnterQueue(id)}
            />

            <Button
              variant="link"
              onClick={() => setStep(2)}
              className="w-full text-slate-600 font-bold uppercase text-[10px] tracking-[0.2em] mt-4"
            >
              ← Revisar meus dados
            </Button>
          </div>
        </section>
      )}

      {issubmitting && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-blue-500 animate-pulse" size={32} />
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-100 italic uppercase">Preparando sua <span className="text-blue-500">experiência...</span></h3>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 animate-bounce">Aguarde um momento</p>
        </div>
      )}
    </div>
  );
}

