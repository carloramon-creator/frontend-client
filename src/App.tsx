// --- EMERGENCY ROLLBACK: 16/01/2026 16:05 ---
import { useState, useEffect } from 'react';
import { DebugNotification } from './components/DebugNotification';
import { BrowserRouter, Routes, Route, useParams, useSearchParams } from 'react-router-dom';
import { Api } from './lib/api';
import { User, Scissors, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from './lib/utils';
import { AppointmentWizard } from './components/AppointmentWizard';
import { QueueWizard } from './components/QueueWizard';
import { RegistrationForm } from './components/RegistrationForm';
import { MyAppointments } from './components/MyAppointments';
import { getBusinessTexts } from './lib/business-dictionary';
import { getBusinessTheme } from './lib/business-theme';

// --- COMPONENTES AUXILIARES ---

function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-medium animate-pulse">Sintonizando estabelecimento...</p>
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
                Não encontramos nenhum estabelecimento com o link <code className="text-slate-200">/{slug}</code>.
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
    document.title = `${tenant.name} | 791 ${tenant.business_type === 'beauty_salon' ? 'Beauty' : 'Barber'}`;

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

    // Atualiza Manifest Dinâmico
    const clientId = new URLSearchParams(window.location.search).get('c');
    const manifestUrl = `https://api.791barber.com/api/public/manifest/${tenant.slug}${clientId ? `?c=${clientId}` : ''}`;

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
        manifestLink.href = manifestUrl;
    } else {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestUrl;
        document.head.appendChild(manifestLink);
    }
}

function RootRedirect() {
    useEffect(() => {
        const lastSlug = localStorage.getItem('791_last_slug');
        if (lastSlug) {
            const search = window.location.search;
            window.location.replace(`/${lastSlug}${search}`);
        }
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
            791 Barber <br />
            <span className="text-[10px] opacity-50 font-normal">Selecione um estabelecimento pelo link oficial.</span>
            <a href="/debug-push" className="mt-10 text-[8px] opacity-20 hover:opacity-100 transition-opacity">Sistema de Debug</a>
        </div>
    );
}

// --- PÁGINA PRINCIPAL (ROTEADOR DE FLUXO) ---

function ShopPage() {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [shopInfo, setShopInfo] = useState<any>(null);
    const texts = getBusinessTexts(shopInfo?.business_type);
    const theme = getBusinessTheme(shopInfo?.business_type);

    // App States
    const [currentFlow, setCurrentFlow] = useState<'main' | 'registration' | 'queue' | 'appointment' | 'success' | 'my-appointments'>('main');
    const [clientData, setClientData] = useState<any>(null);
    const [activeTicket, setActiveTicket] = useState<any>(null);

    const clientId = searchParams.get('c') || searchParams.get('clientId') || localStorage.getItem('791_last_client_id');

    useEffect(() => {
        if (!slug) return;
        init();
    }, [slug]);

    async function init() {
        try {
            setLoading(true);
            setError(false);

            // 1. TENTATIVA INSTANTÂNEA DE CARREGAR CACHE
            let initialClient = null;
            const cached = localStorage.getItem(`791_${slug}_client_data`);
            if (cached) {
                try {
                    initialClient = JSON.parse(cached);
                } catch (e) {
                    console.error("Erro ao ler cache", e);
                }
            }

            // 2. DISPARA CHAMADAS EM PARALELO (GANHO DE PERFORMANCE)
            const shopPromise = Api.getShopInfo(slug!);
            const clientPromise = clientId
                ? Api.identifyClient(clientId, slug!)
                : Promise.resolve(initialClient);

            const activeTicketId = localStorage.getItem(`791_${slug}_active_ticket`);
            let recoveredTicket = null;

            if (activeTicketId) {
                console.log(`[INIT] Tentando recuperar ticket: ${activeTicketId}`);
                try {
                    recoveredTicket = await Api.getTicketStatus(activeTicketId);
                    console.log(`[INIT] Ticket recuperado com status: ${recoveredTicket?.status}`);
                } catch (e: any) {
                    console.error(`[INIT] Erro ao recuperar ticket:`, e);
                    if (e.response?.status === 404) {
                        localStorage.removeItem(`791_${slug}_active_ticket`);
                    }
                }
            }

            // Aguarda outras em paralelo
            const [shopResponse, detectedClient] = await Promise.all([
                shopPromise,
                clientPromise
            ]);

            const tenant = shopResponse.tenant;
            setShopInfo(tenant);
            setClientData(detectedClient);
            setActiveTicket(recoveredTicket);

            // Save as last visited slug for PWA recovery
            localStorage.setItem('791_last_slug', slug!);
            if (detectedClient?.id) {
                localStorage.setItem('791_last_client_id', detectedClient.id);
            }

            // 3. ATUALIZAÇÃO ASSÍNCRONA DE METADADOS
            updateMetadata(tenant);

            // 4. REDIRECIONAMENTO INTELIGENTE
            if (recoveredTicket && (recoveredTicket.status === 'waiting' || recoveredTicket.status === 'attending')) {
                setCurrentFlow('queue');
            } else if (!detectedClient || !detectedClient.name || !detectedClient.phone || !detectedClient.cpf || !detectedClient.photo_url) {
                setCurrentFlow('registration');
            } else {
                const hasQueue = tenant.module_queue_enabled;
                const hasAppt = tenant.module_appointments_enabled;

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
            {/* INJEÇÃO DE CORES DINÂMICAS */}
            <style>{`
                :root {
                    --primary: ${theme.primaryHex};
                    --primary-gradient: ${theme.gradient};
                }
                .bg-primary-custom { background-color: ${theme.primaryHex}; }
                .text-primary-custom { color: ${theme.primaryHex}; }
                .border-primary-custom { border-color: ${theme.primaryHex}; }
            `}</style>

            {/* BACKGROUND DECOR */}
            <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 blur-[120px] rounded-full -z-10 bg-primary-custom/5")} />

            {/* CONTEÚDO CENTRALIZADO (HEADER + FLUXOS) */}
            <div className="flex-1 flex flex-col justify-start pt-6 w-full max-w-md mx-auto z-10">

                {/* HEADER */}
                <div className="flex flex-col items-center text-center shrink-0 mb-4">
                    <div className="w-40 h-40 bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl mb-6">
                        <img src={shopInfo?.logo_url || '/icon-192.png'} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase leading-none mb-3">{shopInfo?.name}</h1>
                    <p className="text-primary-custom font-bold text-xs tracking-[0.5em] uppercase">Experience Excellence</p>
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
                    <div className="flex-1 flex flex-col justify-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
                        <div className="text-center mb-4">
                            <p className="text-slate-400 font-medium text-base leading-relaxed">Bem-vindo de volta, <br /><span className="text-white font-black text-xl">{clientData?.name?.split(' ')[0]}</span>!</p>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">O que deseja fazer hoje?</p>
                        </div>

                        {shopInfo?.module_queue_enabled && (
                            <button
                                onClick={() => setCurrentFlow('queue')}
                                className="group relative overflow-hidden bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full transition-all active:scale-[0.98] hover:border-primary-custom/50"
                            >
                                <div className="flex flex-col items-center justify-center relative z-10 text-center gap-2">
                                    <div className="w-12 h-12 bg-primary-custom/10 rounded-xl flex items-center justify-center text-primary-custom mb-1 group-hover:scale-110 transition-transform">
                                        <Scissors size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase group-hover:text-primary-custom transition-colors">{texts.enterQueue}</h3>
                                        <p className="text-xs text-yellow-500 font-bold mt-0.5">{texts.queueDescription}</p>
                                    </div>
                                </div>
                            </button>
                        )}

                        {shopInfo?.module_appointments_enabled && (
                            <button
                                onClick={() => setCurrentFlow('appointment')}
                                className="group relative overflow-hidden bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full transition-all active:scale-[0.98] hover:border-primary-custom/50"
                            >
                                <div className="flex flex-col items-center justify-center relative z-10 text-center gap-2">
                                    <div className="w-12 h-12 bg-primary-custom/10 rounded-xl flex items-center justify-center text-primary-custom mb-1 group-hover:scale-110 transition-transform">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase group-hover:text-primary-custom transition-colors">{texts.makeAppointment}</h3>
                                        <p className="text-xs text-yellow-500 font-bold mt-0.5">{texts.appointmentDescription}</p>
                                    </div>
                                </div>
                            </button>
                        )}

                        {shopInfo?.module_appointments_enabled && clientData && hasPendingAppointments && (
                            <button
                                onClick={() => setCurrentFlow('my-appointments')}
                                className="group relative overflow-hidden bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full transition-all active:scale-[0.98] hover:border-slate-600/50"
                            >
                                <div className="flex flex-col items-center justify-center relative z-10 text-center gap-2">
                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 mb-1 group-hover:scale-110 transition-transform">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase group-hover:text-slate-300 transition-colors">Meus Agendamentos</h3>
                                        <p className="text-xs text-yellow-500 font-bold mt-0.5">Visualize seus horários marcados.</p>
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
                        business_type={shopInfo?.business_type}
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
                        initialTicket={activeTicket}
                        onCancel={() => {
                            setActiveTicket(null);
                            setCurrentFlow('main');
                        }}
                        onComplete={() => {
                            setActiveTicket(null);
                            setCurrentFlow('success');
                        }}
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
                        <p className="text-slate-400 font-medium mb-12">Tudo certo! Você receberá uma notificação quando chamarmos.</p>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={() => setCurrentFlow('my-appointments')}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black uppercase tracking-widest transition-all border border-slate-700"
                            >
                                Meus Agendamentos
                            </button>
                            <button
                                onClick={() => setCurrentFlow('main')}
                                className="w-full py-4 bg-primary-custom hover:opacity-90 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-lg"
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
                <Route path="/debug-push" element={<DebugNotification />} />
                <Route path="/:slug" element={<ShopPage />} />
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-600 font-black uppercase tracking-widest text-xs">Ops! Caminho não encontrado.</div>} />
            </Routes>
        </BrowserRouter>
    );
}
