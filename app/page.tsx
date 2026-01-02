'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Api } from '@/lib/api';
import { BarberCard } from '@/components/barber/barber-card';
import { BarberList } from '@/components/barber/barber-list';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { User, Sparkles, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [issubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await Api.getQueueStatus(''); // Vazio busca o primeiro tenant ou via query string
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
    if (!clientName.trim()) {
      alert('Por favor, digite seu nome primeiro.');
      return;
    }

    // Validar telefone (mínimo de dígitos para ser válido no Brasil)
    const rawPhone = clientPhone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      alert('Por favor, digite um telefone válido com DDD.');
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      // Enviar telefone limpo sem máscara
      if (barberId) {
        res = await Api.enterQueueForBarber('', barberId, clientName, rawPhone);
      } else {
        res = await Api.enterQueueForBarber('', 'any', clientName, rawPhone);
      }

      // Redirecionar para a tela da fila
      router.push(`/fila/${res.id}`);
    } catch (err: any) {
      // Se já estiver na fila, redirecionar para ela
      if (err.data?.error === 'CLIENT_ALREADY_IN_QUEUE' && err.data?.ticketId) {
        router.push(`/fila/${err.data.ticketId}`);
        return;
      }

      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Carregando Barbeiros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4">
      <section className="space-y-6 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1 rounded-full">
          <Sparkles className="text-blue-500" size={14} />
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Bem-vindo à Experiência 791</span>
        </div>
        <h2 className="text-4xl font-black text-slate-100 italic uppercase leading-none">
          Garanta seu <br /><span className="text-blue-600">Lugar na Fila</span>
        </h2>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1 italic">
            Como podemos te chamar?
          </Label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
            <Input
              placeholder="Digite seu nome aqui..."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="h-14 pl-12 bg-slate-900 border-slate-800 text-lg font-bold placeholder:text-slate-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1 italic">
            Telefone (WhatsApp) <span className="text-red-500">*</span>
          </Label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors text-sm font-bold">📱</span>
            <Input
              type="tel"
              placeholder="(00) 00000-0000"
              value={clientPhone}
              onChange={(e) => {
                // Máscara simples
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 11) v = v.slice(0, 11);
                if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                if (v.length > 9) v = `${v.slice(0, 9)}-${v.slice(9)}`;
                setClientPhone(v);
              }}
              className="h-14 pl-12 bg-slate-900 border-slate-800 text-lg font-bold placeholder:text-slate-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 italic">
            Escolha um Barbeiro
          </h3>
          <span className="h-px bg-slate-900 flex-1 ml-4" />
        </div>

        <div className="space-y-4">
          {/* Opção Rápida: Qualquer Barbeiro */}
          <Card
            className="cursor-pointer border-2 border-dashed border-blue-600/30 bg-blue-600/5 hover:bg-blue-600/10 hover:border-blue-600/50 transition-all p-4 rounded-xl flex items-center justify-between"
            onClick={() => handleEnterQueue()}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Sparkles size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-black text-slate-100 uppercase italic">Próximo Disponível</h4>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-tighter italic">Menor tempo de espera</p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 font-black italic uppercase rounded-lg px-6">
              Entrar
            </Button>
          </Card>

          <BarberList
            barbers={barbers}
            onSelect={(id) => handleEnterQueue(id)}
          />
        </div>
      </section>

      {issubmitting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
          <p className="text-slate-100 font-black uppercase text-sm italic tracking-widest">Processando sua ficha...</p>
        </div>
      )}
    </div>
  );
}
