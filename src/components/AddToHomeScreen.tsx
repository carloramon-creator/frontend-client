import { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function AddToHomeScreen() {
    const [showInstructions, setShowInstructions] = useState(false);
    const [canInstall, setCanInstall] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);

        // Detect Standalone (PWA installed)
        // @ts-ignore
        const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

        // Show button if iOS and NOT standalone
        if (ios && !standalone) {
            setCanInstall(true);
        }
    }, []);

    if (!canInstall) return null;

    return (
        <>
            {/* Floating Install Button */}
            {!showInstructions && (
                <button
                    onClick={() => setShowInstructions(true)}
                    className="fixed bottom-6 right-6 z-40 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-700 hover:scale-105 transition-transform"
                >
                    <PlusSquare className="text-blue-500" size={20} />
                    <span className="font-bold text-xs uppercase tracking-wider">Instalar App</span>
                </button>
            )}

            {/* Instruction Drawer */}
            {showInstructions && (
                <div className={cn(
                    "fixed bottom-0 left-0 right-0 z-50 p-4 pb-8",
                    "bg-slate-900/95 backdrop-blur-md border-t border-slate-800",
                    "animate-in slide-in-from-bottom-full duration-500",
                    "shadow-2xl"
                )}>
                    <div className="max-w-md mx-auto relative cursor-default">
                        <button
                            onClick={() => setShowInstructions(false)}
                            className="absolute -top-2 right-0 p-2 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-start gap-4 pr-8">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                                <Share className="text-blue-500 w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg leading-tight mb-1">Instale o App</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    Para uma melhor experiência, adicione este app à sua tela de início.
                                </p>

                                <div className="space-y-3 text-sm text-slate-300">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold text-slate-500">1</span>
                                        <span>Toque no botão <span className="text-blue-400 font-bold">Compartilhar</span> <Share className="inline w-4 h-4 ml-1 mb-1" /> abaixo</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold text-slate-500">2</span>
                                        <span>Role e escolha <span className="text-white font-bold">Adicionar à Tela de Início</span> <PlusSquare className="inline w-4 h-4 ml-1 mb-1" /></span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold text-slate-500">3</span>
                                        <span>Toque em <span className="text-blue-400 font-bold">Adicionar</span> no canto superior</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Little pointer arrow at the bottom center to point to Safari's share button on phones */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-slate-500 animate-bounce">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
                                <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
