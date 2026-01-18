import { useState, useEffect } from 'react';
import { Share, PlusSquare } from 'lucide-react';

export function AddToHomeScreen() {
    const [canInstall, setCanInstall] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);

        // Detect Standalone (PWA installed)
        // @ts-ignore
        const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

        // Show card if iOS and NOT standalone
        if (ios && !standalone) {
            setCanInstall(true);
        }
    }, []);

    if (!canInstall) return null;

    return (
        <div className="w-full pb-6 pt-2 animate-in slide-in-from-bottom-4 duration-700">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mx-auto max-w-sm relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl" />

                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                        <Share className="text-blue-500 w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm mb-1">Instale o App</h3>
                        <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
                            Adicione à tela de início para a melhor experiência.
                        </p>

                        <div className="space-y-2 text-[10px] text-slate-300 font-medium">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500">1</span>
                                <span>Toque em <span className="text-blue-400 font-bold">Compartilhar</span> <Share className="inline w-3 h-3 ml-0.5" /></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500">2</span>
                                <span>Escolha <span className="text-white font-bold">Adicionar à Tela de Início</span> <PlusSquare className="inline w-3 h-3 ml-0.5" /></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
