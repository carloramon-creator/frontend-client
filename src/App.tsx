import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useSearchParams } from 'react-router-dom';
import { Api } from './lib/api';
import { User, ChevronRight, Scissors, Clock, CheckCircle2 } from 'lucide-react';
import { AppointmentWizard } from './components/AppointmentWizard';
import { RegistrationForm } from './components/RegistrationForm';

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
    const [currentFlow, setCurrentFlow] = useState<'main' | 'registration' | 'queue' | 'appointment' | 'success'>('main');
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

    if (loading) return <LoadingScreen />;
    if (error) return <ErrorScreen slug={slug || ''} />;

    return (
        <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full relative overflow-hidden min-h-screen">

            {/* BACKGROUND DECOR */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-blue-600/5 blur-[120px] rounded-full -z-10" />

            {/* HEADER DINÂMICO */}
            <div className="flex flex-col items-center text-center mt-8 mb-10">
                <div className="w-20 h-20 bg-slate-900 rounded-2xl border border-slate-800 p-3 shadow-2xl mb-4">
                    <img src={shopInfo?.logo_url || '/icon-192.png'} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">{shopInfo?.name}</h1>
                <p className="text-blue-500 font-bold text-[9px] tracking-[0.3em] uppercase mt-2">Experience Excellence</p>
            </div>

            {/* FLUXOS */}
            <div className="flex-1 flex flex-col">
                {currentFlow === 'registration' && (
                    <RegistrationForm
                        slug={slug!}
                        clientId={clientId || undefined}
                        onComplete={(data) => {
                            setClientData(data);
                            // Decide após registro
                            if (shopInfo.module_queue_enabled && !shopInfo.module_appointments_enabled) setCurrentFlow('queue');
                            else if (shopInfo.module_appointments_enabled && !shopInfo.module_queue_enabled) setCurrentFlow('appointment');
                            else setCurrentFlow('main');
                        }}
                    />
                )}

                {currentFlow === 'main' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-6">
                            <p className="text-slate-400 font-medium">Bem-vindo de volta, <span className="text-white font-bold">{clientData?.name?.split(' ')[0]}</span>!</p>
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">O que deseja fazer hoje?</p>
                        </div>

                        {shopInfo?.module_queue_enabled && (
                            <button
                                onClick={() => setCurrentFlow('queue')}
                                className="group relative overflow-hidden bg-slate-900 border border-slate-800 p-6 rounded-3xl text-left transition-all active:scale-[0.98] hover:border-blue-500/50"
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                            <Scissors size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase italic group-hover:text-blue-400 transition-colors">Fila Digital</h3>
                                            <p className="text-xs text-slate-500 font-medium">Entre na fila agora mesmo.</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-800 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </button>
                        )}

                        {shopInfo?.module_appointments_enabled && (
                            <button
                                onClick={() => setCurrentFlow('appointment')}
                                className="group relative overflow-hidden bg-slate-900 border border-slate-800 p-6 rounded-3xl text-left transition-all active:scale-[0.98] hover:border-emerald-500/50"
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase italic group-hover:text-emerald-400 transition-colors">Agendamento</h3>
                                            <p className="text-xs text-slate-500 font-medium">Reserve seu horário favorito.</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-800 group-hover:text-emerald-500 transition-colors" />
                                </div>
                            </button>
                        )}
                    </div>
                )}

                {currentFlow === 'appointment' && (
                    <AppointmentWizard
                        slug={slug!}
                        clientData={clientData}
                        onCancel={() => setCurrentFlow('main')}
                        onComplete={() => setCurrentFlow('success')}
                    />
                )}

                {currentFlow === 'success' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
                            <CheckCircle2 className="text-white w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Sucesso!</h2>
                        <p className="text-slate-400 font-medium mb-12">Seu horário foi reservado. Você receberá uma confirmação em breve.</p>
                        <button
                            onClick={() => setCurrentFlow('main')}
                            className="px-12 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black uppercase italic tracking-widest transition-all"
                        >
                            Voltar
                        </button>
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
                <Route path="*" element={<div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-600 font-black uppercase tracking-widest text-xs italic">Selecione uma barbearia para continuar</div>} />
            </Routes>
        </BrowserRouter>
    );
}
