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
import { User, Users, Sparkles, Loader2, Camera, Fingerprint, Phone, CreditCard, ChevronRight, Check, Calendar, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InstallPWA } from '@/components/pwa/install-button';
import { use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface TenantInfo {
  name: string;
  slug: string;
  logo_url?: string;
  address_street?: string;
  address_city?: string;
  module_queue_enabled?: boolean;
  module_appointments_enabled?: boolean;
}

function HomePageContent({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('c');

  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState<TenantInfo | null>(null);

  // Registration State
  // Step 0: Landing (Fila vs Agendamento)
  // Step 1: Identification (Name + Photo)
  // Step 2: Details (Phone + CPF)
  // Step 3: Barber Selection (Fila)
  const [step, setStep] = useState(0);
  const [flow, setFlow] = useState<'queue' | 'appointment' | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCpf, setClientCpf] = useState('');
  const [clientPhoto, setClientPhoto] = useState<string | null>(null);

  const [issubmitting, setIsSubmitting] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. CARREGAMENTO INSTANTÂNEO (CACHE FIRST)
    try {
      const cachedShopInfo = localStorage.getItem('791_shop_info');
      if (cachedShopInfo) {
        const parsed = JSON.parse(cachedShopInfo);
        if (parsed && parsed.name) {
          setShopInfo(parsed);
          setLoading(false);
        }
      }
    } catch (e) { }

    // Load existing client data (SCOPED BY SLUG)
    const savedName = localStorage.getItem(`791_${slug}_client_name`);
    const savedPhone = localStorage.getItem(`791_${slug}_client_phone`);
    const savedCpf = localStorage.getItem(`791_${slug}_client_cpf`);
    const savedPhoto = localStorage.getItem(`791_${slug}_client_photo`);

    if (savedName) setClientName(savedName);
    if (savedPhone) setClientPhone(savedPhone);
    if (savedCpf) setClientCpf(savedCpf);
    if (savedPhoto) setClientPhoto(savedPhoto);

    async function load() {
      try {
        setLoading(true);
        let identifiedData = null;

        // Identify client if ID is present
        if (clientId) {
          setIsIdentifying(true);
          try {
            // Fix: Compare ID with cache to avoid data mixture if switching links
            const cachedId = localStorage.getItem(`791_${slug}_client_id`);
            if (cachedId && cachedId !== clientId) {
              console.log("[CLIENT] New ID detected, clearing local cache.");
              localStorage.removeItem(`791_${slug}_client_name`);
              localStorage.removeItem(`791_${slug}_client_phone`);
              localStorage.removeItem(`791_${slug}_client_cpf`);
              localStorage.removeItem(`791_${slug}_client_photo`);
            }

            const clientData = await Api.identifyClient(clientId, slug);
            if (clientData) {
              identifiedData = clientData;
              setClientName(clientData.name);
              setClientPhone(clientData.phone);
              setClientPhoto(clientData.photo_url || null);

              localStorage.setItem(`791_${slug}_client_id`, clientData.id);
              localStorage.setItem(`791_${slug}_client_name`, clientData.name);
              localStorage.setItem(`791_${slug}_client_phone`, clientData.phone);

              if (clientData.cpf) localStorage.setItem(`791_${slug}_client_cpf`, clientData.cpf);
              else localStorage.removeItem(`791_${slug}_client_cpf`);

              if (clientData.photo_url) localStorage.setItem(`791_${slug}_client_photo`, clientData.photo_url);
              else localStorage.removeItem(`791_${slug}_client_photo`);
            }
          } catch (e) {
            console.error("Identificação falhou", e);
          } finally {
            setIsIdentifying(false);
          }
        }

        const response = await Api.getQueueStatus(slug);
        setBarbers(response.barbers || []);

        if (response.tenant) {
          const tenant = response.tenant;
          setShopInfo(tenant);
          localStorage.setItem('791_shop_info', JSON.stringify(tenant));

          // LOGICA DE REDIRECIONAMENTO INTELIGENTE
          const name = identifiedData?.name || localStorage.getItem(`791_${slug}_client_name`);
          const phone = identifiedData?.phone || localStorage.getItem(`791_${slug}_client_phone`);
          const photo = identifiedData?.photo_url || localStorage.getItem(`791_${slug}_client_photo`);
          const cpf = identifiedData?.cpf || localStorage.getItem(`791_${slug}_client_cpf`);

          if (name && phone) {
            // FIX: Enforce BOTH photo and CPF for "complete" status
            const hasPhoto = photo && photo !== 'null';
            const hasCpf = cpf && cpf !== 'null' && cpf.length >= 14;

            if (hasPhoto && hasCpf) {
              // Perfil completo, go to choice or direct
              if (tenant.module_queue_enabled && tenant.module_appointments_enabled) {
                setStep(0); // Choose Flow
              } else if (tenant.module_queue_enabled) {
                setFlow('queue');
                setStep(3); // Barber Selection
              } else if (tenant.module_appointments_enabled) {
                setFlow('appointment');
                setStep(4); // Appointment wizard
              }
            } else {
              // Perfil incompleto, go to registration steps
              setStep(1);
            }
          } else {
            // New user, start at registration
            setStep(1);
          }

          window.dispatchEvent(new CustomEvent('791_tenant_found', { detail: tenant }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clientId, slug]);

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
      localStorage.setItem(`791_${slug}_client_name`, clientName);
      localStorage.setItem(`791_${slug}_client_phone`, clientPhone);
      localStorage.setItem(`791_${slug}_client_cpf`, clientCpf);
      if (clientPhoto) localStorage.setItem(`791_${slug}_client_photo`, clientPhoto);

      const res = await Api.enterQueueForBarber(
        slug,
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

  // Flexible container
  const containerClasses = "min-h-[calc(100vh-140px)] flex flex-col py-4";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <Loader2 className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={24} />
        </div>
        <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse text-center">
          Sincronizando com <br /> {shopInfo?.name || 'sua Barbearia'}...
        </p>
      </div>
    );
  }

  return (
    <div className={cn("animate-in fade-in slide-in-from-bottom-4 duration-700", containerClasses)}>
      {/* Progress Indicator - Compact */}
      <div className="flex justify-between items-center px-4 mb-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 border-2",
              step === s ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40 scale-110" :
                step > s ? "bg-green-500 border-green-400 text-white" : "border-slate-800 text-slate-600"
            )}>
              {step > s ? <Check size={12} strokeWidth={4} /> : s}
            </div>
            {s < 3 && (
              <div className={cn(
                "h-0.5 flex-1 mx-2",
                step > s ? "bg-green-500" : "bg-slate-800"
              )} />
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {step === 0 && (
          <section className="space-y-4 flex flex-col h-full animate-in fade-in zoom-in duration-500">
            <div className="space-y-1 text-center py-4">
              <h2 className="text-3xl font-black text-slate-100 uppercase leading-tight">
                Como deseja <span className="text-blue-500">ser atendido?</span>
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Escolha a melhor opção para hoje</p>
            </div>

            <div className="grid gap-4 mt-4">
              {/* Fallback para sempre mostrar pelo menos a Fila se nada estiver habilitado explicitamente */}
              {(shopInfo?.module_queue_enabled || (!shopInfo?.module_queue_enabled && !shopInfo?.module_appointments_enabled) || shopInfo === null) && (
                <div
                  onClick={() => {
                    setFlow('queue');
                    setStep(3);
                  }}
                  className="bg-slate-900 border-2 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all p-6 rounded-3xl flex flex-col gap-4 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                      <Users size={28} />
                    </div>
                    <ChevronRight className="text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-100 uppercase">Entrar na Fila</h3>
                    <p className="text-slate-500 text-xs font-medium">Atendimento imediato por ordem de chegada.</p>
                  </div>
                </div>
              )}

              {(shopInfo?.module_appointments_enabled) && (
                <div
                  onClick={() => {
                    setFlow('appointment');
                    // setStep(4); // To implement
                    alert('Módulo de Agendamentos em breve!');
                  }}
                  className="bg-slate-900 border-2 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all p-6 rounded-3xl flex flex-col gap-4 group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                      <Calendar size={28} />
                    </div>
                    <ChevronRight className="text-slate-700 group-hover:text-emerald-500 group-hover:translate-x-1" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-100 uppercase">Agendar Horário</h3>
                    <p className="text-slate-500 text-xs font-medium">Escolha o melhor dia e hora para você.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4 flex flex-col h-full">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-100 uppercase leading-tight">
                {clientId ? 'Conclua seu' : 'Quem'} <span className="text-blue-500">{clientId ? 'Perfil' : 'é você?'}</span>
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                {clientId ? 'Sua barbearia te aguarda! Só falta a foto.' : 'Inicie sua experiência premium'}
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4 py-2">
              <div
                onClick={handlePhotoClick}
                className="w-24 h-24 rounded-full border-2 border-dashed border-slate-700 bg-slate-900 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/50 transition-all overflow-hidden relative group shadow-inner"
              >
                {clientPhoto ? (
                  <img src={clientPhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="text-slate-600 group-hover:text-blue-500 transition-colors" size={24} />
                    <span className="text-[8px] font-black uppercase text-slate-500 mt-1 text-center px-2">Adicionar Foto</span>
                  </>
                )}
                {clientPhoto && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="text-white" size={20} />
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" capture="user" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

              <div className="w-full space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">Nome Completo</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <Input
                    placeholder="Ex: João da Silva"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="h-12 pl-11 bg-slate-900 border-slate-800 text-base font-bold placeholder:text-slate-700 focus:border-blue-500 rounded-2xl"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                const hasPhoto = clientPhoto && clientPhoto !== 'null';
                const hasCpf = clientCpf && clientCpf.length >= 14;

                if (clientName && hasPhoto && hasCpf) {
                  // Perfil completo, decide fluxo
                  if (shopInfo?.module_queue_enabled && shopInfo?.module_appointments_enabled) {
                    setStep(0);
                  } else if (shopInfo?.module_queue_enabled) {
                    setFlow('queue');
                    setStep(3);
                  } else if (shopInfo?.module_appointments_enabled) {
                    setFlow('appointment');
                    setStep(4);
                  }
                } else if (clientName) {
                  setStep(2);
                }
              }}
              disabled={!clientName}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-lg mt-4"
            >
              {(clientPhoto && clientCpf.length >= 14) ? 'Continuar' : 'Próximo'}
              <ChevronRight className="ml-2" size={18} />
            </Button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4 flex flex-col h-full">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-100 uppercase">
                {clientId ? 'Confirme seus' : 'Seus'} <span className="text-blue-500">Dados</span>
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Para NF-e e notificações</p>
            </div>

            <div className="space-y-4 flex-1 justify-center flex flex-col py-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">WhatsApp (DDD)</Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <Input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={clientPhone}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                      let masked = raw;
                      if (raw.length > 2) {
                        masked = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                      }
                      if (raw.length > 7) {
                        masked = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                      }
                      setClientPhone(masked);
                    }}
                    className="h-12 pl-11 bg-slate-900 border-slate-800 text-base font-bold focus:border-blue-500 rounded-2xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">CPF (NF-e)</Label>
                <div className="relative group">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={16} />
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
                    className="h-12 pl-11 bg-slate-900 border-slate-800 text-base font-bold focus:border-blue-500 rounded-2xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-auto">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-14 border-slate-800 text-slate-400 font-black uppercase italic rounded-2xl"
              >
                Voltar
              </Button>
              <Button
                onClick={() => {
                  if (clientPhone.length >= 14) {
                    if (shopInfo?.module_queue_enabled && shopInfo?.module_appointments_enabled) {
                      setStep(0);
                    } else if (shopInfo?.module_queue_enabled) {
                      setFlow('queue');
                      setStep(3);
                    } else if (shopInfo?.module_appointments_enabled) {
                      setFlow('appointment');
                      setStep(4);
                    }
                  }
                }}
                disabled={clientPhone.length < 14}
                className="flex-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-lg"
              >
                Continuar
              </Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4 flex flex-col h-full">
            <div className="space-y-1 text-center">
              <h2 className="text-2xl font-black text-slate-100 uppercase">
                Escolha seu <span className="text-blue-500">Artista</span>
              </h2>
              {clientName && <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Bem-vindo de volta, {clientName.split(' ')[0]}!</p>}
            </div>

            <div className="space-y-3 pb-4">
              <div
                className="cursor-pointer border-2 border-dashed border-blue-600/30 bg-blue-600/5 hover:bg-blue-600/10 hover:border-blue-600/50 transition-all p-4 rounded-3xl flex items-center justify-between group"
                onClick={() => handleEnterQueue()}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Sparkles size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-black text-slate-100 uppercase text-base leading-tight">Próximo Disponível</h4>
                    <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">Menor tempo</p>
                  </div>
                </div>
                <ChevronRight className="text-blue-600 group-hover:translate-x-1" size={16} />
              </div>

              <div className="overflow-y-auto max-h-[35vh] pr-1 custom-scrollbar">
                <BarberList
                  barbers={barbers}
                  onSelect={(id) => handleEnterQueue(id)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 h-14 border-slate-800 text-slate-400 font-black uppercase rounded-2xl"
                >
                  Voltar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    localStorage.removeItem(`791_${slug}_client_name`);
                    localStorage.removeItem(`791_${slug}_client_phone`);
                    localStorage.removeItem(`791_${slug}_client_cpf`);
                    localStorage.removeItem(`791_${slug}_client_photo`);
                    window.location.reload();
                  }}
                  className="flex-1 text-slate-700 font-bold uppercase text-[8px] tracking-[0.2em] h-auto"
                >
                  Limpar dados
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>

      <InstallPWA tenant={shopInfo} />

      {issubmitting && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
          <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mb-6" />
          <h3 className="text-lg font-black text-slate-100 uppercase">Preparando sua <span className="text-blue-500">cadeira...</span></h3>
        </div>
      )}
    </div>
  );
}

export default function HomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <HomePageContent slug={slug} />
    </Suspense>
  );
}
