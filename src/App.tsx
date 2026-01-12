import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useSearchParams } from 'react-router-dom';
import { Api } from './lib/api';
import { User, ChevronRight, Scissors, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { AppointmentWizard } from './components/AppointmentWizard';
import { QueueWizard } from './components/QueueWizard';
import { RegistrationForm } from './components/RegistrationForm';
import { MyAppointments } from './components/MyAppointments';

// --- COMPONENTES AUXILIARES ---

function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-medium animate-pulse">Sintonizando barbearia...</p>
        </div>
    );
}

function ErrorScreen({ slug }: { slug: string }) {
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <User className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Ops! Nada por aqui.</h1>
            <p className="text-slate-400 max-w-xs mb-8">
                Não encontramos nenhuma barbearia com o link <code className="text-slate-200">/{slug}</code>.
            </p>
            <button
                onClick={() => window.location.href = '/'}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all"
            >
                Voltar ao Início
            </button>
        </div>
    );
}

function updateMetadata(tenant: any) {
    if (!tenant) return;

    // Atualiza Título
    document.title = `${tenant.name} | 791 Barber`;

    const version = '205'; // Cache buster consistente
    const iconUrl = tenant.logo_url ? `${tenant.logo_url}${tenant.logo_url.includes('?') ? '&' : '?'}v=${version}` : `/icon-192.png?v=${version}`;

    // Atualiza Favicon
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    if (favicon) favicon.href = iconUrl;

    // Atualiza Apple Touch Icon (iPhone)
    const appleIcon = document.getElementById('apple-icon') as HTMLLinkElement;
    if (appleIcon) appleIcon.href = iconUrl;

    // Atualiza nome do web app
    const metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (metaTitle) metaTitle.setAttribute('content', tenant.name);
}

// --- PÁGINA PRINCIPAL (ROTEADOR DE FLUXO) ---

function ShopPage() {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [shopInfo, setShopInfo] = useState<any>(null);

    // App States
    const [currentFlow, setCurrentFlow] = useState<'main' | 'registration' | 'queue' | 'appointment' | 'success' | 'my-appointments'>('main');
    const [clientData, setClientData] = useState<any>(null);

    const clientId = searchParams.get('c');

    useEffect(() => {
        if (!slug) return;
        init();
    }, [slug]);

    async function init() {
        try {
            setLoading(true);
            setError(false);

            const response = await Api.getShopInfo(slug!);
            setShopInfo(response.tenant);

            // ATUALIZAÇÃO DE METADADOS (ÍCONES E TÍTULO)
            updateMetadata(response.tenant);

            // LÓGICA DE DETECÇÃO DE CLIENTE
            let detectedClient = null;
            if (clientId) {
                detectedClient = await Api.identifyClient(clientId, slug!);
            } else {
                const cached = localStorage.getItem(`791_${slug}_client_data`);
                if (cached) detectedClient = JSON.parse(cached);
            }

            setClientData(detectedClient);

            // REDIRECIONAMENTO INTELIGENTE
            if (!detectedClient || !detectedClient.name || !detectedClient.phone || !detectedClient.cpf || !detectedClient.photo_url) {
                setCurrentFlow('registration');
            } else {
                // Se a empresa só tem um módulo, vai direto
                const hasQueue = response.tenant.module_queue_enabled;
                const hasAppt = response.tenant.module_appointments_enabled;

                if (hasQueue && !hasAppt) setCurrentFlow('queue');
                else if (hasAppt && !hasQueue) setCurrentFlow('appointment');
                else setCurrentFlow('main');
            }

        } catch (e) {
            console.error("[INIT_ERROR]", e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    // CHECK FOR PENDING APPOINTMENTS
    const [hasPendingAppointments, setHasPendingAppointments] = useState(false);

    useEffect(() => {
        if (!clientData || !slug || !shopInfo?.module_appointments_enabled) return;

        checkPendingAppointments();
    }, [clientData, slug, shopInfo]);

    async function checkPendingAppointments() {
        try {
            const data = await Api.getMyAppointments(clientData.phone, slug!);
            if (data && data.length > 0) {
                // Filtra apenas status 'scheduled' ou validos, embora a API ja traga so futuros
                // Mas garantimos que tem pelo menos um nao-finalizado se a API trouxer historico
                const pending = data.filter((a: any) => a.status === 'scheduled' || a.status === 'in_service');
                setHasPendingAppointments(pending.length > 0);
            } else {
                setHasPendingAppointments(false);
            }
        } catch (error) {
            console.error("Failed to check appointments", error);
        }
    }

    if (loading) return <LoadingScreen />;
    if (error) return <ErrorScreen slug={slug || ''} />;

    return (
        <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full relative overflow-hidden min-h-screen">

            {/* BACKGROUND DECOR */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-blue-600/5 blur-[120px] rounded-full -z-10" />

            {/* CONTEÚDO CENTRALIZADO (HEADER + FLUXOS) */}
            <div className="flex-1 flex flex-col justify-start pt-6 w-full max-w-md mx-auto z-10">

                {/* HEADER */}
                <div className="flex flex-col items-center text-center shrink-0 mb-4">
                    <div className="w-40 h-40 bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl mb-6">
                        <img src={shopInfo?.logo_url || '/icon-192.png'} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase leading-none mb-3">{shopInfo?.name}</h1>
                    <p className="text-blue-500 font-bold text-xs tracking-[0.5em] uppercase">Experience Excellence</p>
                </div>

                {currentFlow === 'registration' && (
                    <div className="flex-1 flex flex-col justify-center">
                        <RegistrationForm
                            slug={slug!}
                            clientId={clientId || undefined}
                            initialData={clientData}
                            onComplete={(data) => {
                                setClientData(data);
                                // Decide após registro
                                if (shopInfo.module_queue_enabled && !shopInfo.module_appointments_enabled) setCurrentFlow('queue');
                                else if (shopInfo.module_appointments_enabled && !shopInfo.module_queue_enabled) setCurrentFlow('appointment');
                                else setCurrentFlow('main');
                            }}
                        />
                    </div>
                )}

                {currentFlow === 'main' && (
                    <div className="flex-1 flex flex-col justify-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                        <div className="text-center mb-8">
                            <p className="text-slate-400 font-medium text-lg leading-relaxed">Bem-vindo de volta, <br /><span className="text-white font-black text-2xl">{clientData?.name?.split(' ')[0]}</span>!</p>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-3">O que deseja fazer hoje?</p>
                        </div>

                        {shopInfo?.module_queue_enabled && (
                            <button
                                onClick={() => setCurrentFlow('queue')}
                                className="group relative overflow-hidden bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full transition-all active:scale-[0.98] hover:border-blue-500/50"
                            >
                                <div className="flex flex-col items-center justify-center relative z-10 text-center gap-3">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-2 group-hover:scale-110 transition-transform">
                                        <Scissors size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase group-hover:text-blue-400 transition-colors">Fila Digital</h3>
                                        <p className="text-sm text-yellow-500 font-bold mt-1">Entre na fila agora mesmo.</p>
                                    </div>
                                </div>
                            </button>
                        )}

                        {shopInfo?.module_appointments_enabled && (
                            <button
                                onClick={() => setCurrentFlow('appointment')}
                                className="group relative overflow-hidden bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full transition-all active:scale-[0.98] hover:border-emerald-500/50"
                            >
                                <div className="flex flex-col items-center justify-center relative z-10 text-center gap-3">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-2 group-hover:scale-110 transition-transform">
                                        <Clock size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase group-hover:text-emerald-400 transition-colors">Agendamento</h3>
                                        <p className="text-sm text-yellow-500 font-bold mt-1">Reserve seu horário favorito.</p>
                                    </div>
                                </div>
                            </button>
                        )}

                        {shopInfo?.module_appointments_enabled && clientData && hasPendingAppointments && (
                            <button
                                onClick={() => setCurrentFlow('my-appointments')}
                                className="group relative overflow-hidden bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full transition-all active:scale-[0.98] hover:border-slate-600/50"
                            >
                                <div className="flex flex-col items-center justify-center relative z-10 text-center gap-3">
                                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-2 group-hover:scale-110 transition-transform">
                                        <Calendar size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase group-hover:text-slate-300 transition-colors">Meus Agendamentos</h3>
                                        <p className="text-sm text-yellow-500 font-bold mt-1">Visualize seus horários marcados.</p>
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>
                )}

                {currentFlow === 'appointment' && (
                    <AppointmentWizard
                        slug={slug!}
                        clientData={clientData}
                        hasPendingAppointments={hasPendingAppointments}
                        onCancel={() => setCurrentFlow('main')}
                        onComplete={() => setCurrentFlow('success')}
                        onViewAppointments={() => setCurrentFlow('my-appointments')}
                    />
                )}

                {currentFlow === 'queue' && (
                    <QueueWizard
                        slug={slug!}
                        shopInfo={shopInfo}
                        clientData={clientData}
                        onCancel={() => setCurrentFlow('main')}
                        onComplete={() => setCurrentFlow('success')}
                    />
                )}

                {/* MEUS AGENDAMENTOS */}
                {currentFlow === 'my-appointments' && clientData && (
                    <MyAppointments
                        slug={slug!}
                        clientData={clientData}
                        onBack={() => setCurrentFlow('main')}
                    />
                )}

                {currentFlow === 'success' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
                            <CheckCircle2 className="text-white w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Sucesso!</h2>
                        <p className="text-slate-400 font-medium mb-12">Seu horário foi reservado. Você receberá uma confirmação em breve.</p>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={() => setCurrentFlow('my-appointments')}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black uppercase tracking-widest transition-all border border-slate-700"
                            >
                                Meus Agendamentos
                            </button>
                            <button
                                onClick={() => setCurrentFlow('main')}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                            >
                                Voltar ao Início
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <footer className="mt-auto pt-10 pb-4 text-center">
                <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.4em]">Powered by 791 Solutions</p>
            </footer>
        </main>
    );
}

// --- APP ROOT ---

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/:slug" element={<ShopPage />} />
                <Route path="*" element={<div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-600 font-black uppercase tracking-widest text-xs">Selecione uma barbearia para continuar</div>} />
            </Routes>
        </BrowserRouter>
    );
}
