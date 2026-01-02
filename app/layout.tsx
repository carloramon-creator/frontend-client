import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "791 Barber | Agendamento",
  description: "Entre na fila e acompanhe seu atendimento em tempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased selection:bg-blue-500/30">
        <div className="min-h-screen bg-slate-950 flex flex-col">
          <header className="py-6 px-4 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-2xl mx-auto flex justify-center items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-900/40">
                791
              </div>
              <h1 className="text-xl font-black text-slate-100 italic uppercase tracking-tighter">
                Barber <span className="text-blue-500">Client</span>
              </h1>
            </div>
          </header>

          <main className="flex-1 max-w-2xl mx-auto w-full p-4 pb-20">
            {children}
          </main>

          <footer className="py-8 border-t border-slate-900 text-center">
            <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest italic mb-2">
              Desenvolvido por <span className="text-blue-900">791 Solutions</span>
            </p>
            <a href="/barbeiro" className="text-[10px] text-slate-800 hover:text-blue-600 font-bold uppercase tracking-widest transition-colors">
              Sou Barbeiro
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}
