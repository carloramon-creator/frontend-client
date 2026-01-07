'use client';

import { useState, useEffect } from "react";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [tenant, setTenant] = useState<{ name: string; logo_url?: string } | null>(null);

  useEffect(() => {
    const handleTenant = (e: any) => {
      setTenant(e.detail);
      if (e.detail.name) {
        document.title = `${e.detail.name} | Agendamento`;
      }
    };
    window.addEventListener('791_tenant_found', handleTenant);
    return () => window.removeEventListener('791_tenant_found', handleTenant);
  }, []);

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased selection:bg-blue-500/30 overflow-x-hidden bg-slate-950">
        <div className="min-h-screen flex flex-col max-h-screen overflow-hidden">
          {/* Main Header - Dynamic Branding */}
          <header className="py-4 px-4 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-2xl mx-auto flex flex-col items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center font-black text-white italic shadow-xl relative overflow-hidden group">
                  {tenant?.logo_url ? (
                    <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="relative z-10 text-lg">{tenant?.name?.[0] || '791'}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg font-black text-slate-100 uppercase tracking-tighter leading-none">
                    {tenant?.name || "791 Barber"}
                  </h1>
                  <span className="text-[9px] text-blue-500 font-bold tracking-[0.2em] uppercase mt-1">Experience Excellence</span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-2xl mx-auto w-full p-0">
            {children}
          </main>

          <footer className="py-2 border-t border-slate-950 text-center bg-slate-950/50">
            <p className="text-[8px] text-slate-700 uppercase font-black tracking-widest italic">
              Powered by <span className="text-slate-800">791 Solutions</span>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}

