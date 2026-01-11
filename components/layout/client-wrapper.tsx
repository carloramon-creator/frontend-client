'use client';

import { useState, useEffect } from "react";
import { Zap, FileText } from "lucide-react";

export function ClientLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const [tenant, setTenant] = useState<{ name: string; logo_url?: string } | null>(null);

    useEffect(() => {
        // Load from cache instantly to avoid generic branding
        try {
            // Priority 1: Current active tenant from event (handled below)
            // Priority 2: Last known tenant name from localStorage based on URL slug
            const pathParts = window.location.pathname.split('/');
            const currentSlug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

            if (currentSlug && currentSlug !== 'null' && currentSlug !== '') {
                const cached = localStorage.getItem(`791_shop_info_${currentSlug}`);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && parsed.name) {
                        setTenant(parsed);
                    }
                }
            }
        } catch (e) { }

        const handleTenant = (e: any) => {
            setTenant(e.detail);
            if (e.detail.name) {
                document.title = `${e.detail.name} | Agendamento`;
            }
        };
        window.addEventListener('791_tenant_found', handleTenant);

        /* 
        // Desativado temporariamente para evitar cache de código obsoleto
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(reg => {
                    console.log('SW registered:', reg);
                }).catch(err => {
                    console.log('SW registration failed:', err);
                });
            });
        }
        */

        return () => window.removeEventListener('791_tenant_found', handleTenant);
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Main Header - Dynamic Branding */}
            <header className="py-6 px-4 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl flex items-center justify-center font-black text-white italic shadow-2xl relative overflow-hidden group">
                            {tenant?.logo_url ? (
                                <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <span className="relative z-10 text-3xl">{tenant?.name?.[0] || '791'}</span>
                            )}
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tighter leading-tight">
                                {tenant?.name || "791 Barber"}
                            </h1>
                            <span className="text-xs text-blue-500 font-bold tracking-[0.3em] uppercase mt-2">Experience Excellence</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full p-0">
                {children}
            </main>

            <footer className="py-2 border-t border-slate-950 text-center bg-slate-950/50">
                <p className="text-[8px] text-slate-700 uppercase font-black tracking-widest">
                    Licensed by <span className="text-slate-800">791 Barber</span>
                </p>
            </footer>
        </div>
    );
}
