import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueueStatusCardProps {
    ticket: {
        client_name: string;
        status: 'waiting' | 'attending' | 'finished';
        real_position: number;
        estimated_wait_minutes: number;
        barbers?: {
            name: string;
            photo_url?: string;
        };
    };
}

export function QueueStatusCard({ ticket }: QueueStatusCardProps) {
    const getStatusConfig = () => {
        switch (ticket.status) {
            case 'attending':
                return {
                    title: "Sua vez chegou!",
                    description: "Você está sendo atendido agora. Aproveite!",
                    color: "bg-emerald-500",
                    icon: <CheckCircle2 className="text-emerald-500" size={48} />,
                    badge: "Em Atendimento"
                };
            case 'finished':
                return {
                    title: "Atendimento concluído",
                    description: "Obrigado pela preferência! Nos vemos na próxima.",
                    color: "bg-slate-500",
                    icon: <CheckCircle2 className="text-slate-500" size={48} />,
                    badge: "Finalizado"
                };
            default:
                return {
                    title: "Você está na fila",
                    description: "Acompanhe sua posição abaixo em tempo real.",
                    color: "bg-amber-500",
                    icon: <Clock className="text-amber-500" size={48} />,
                    badge: "Aguardando"
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className="space-y-6">
            <Card className="bg-slate-900 border-2 border-slate-800 overflow-hidden">
                <div className={cn("h-1", config.color)} />
                <CardContent className="p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        {config.icon}
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-100 italic uppercase">
                            {config.title}
                        </h2>
                        <p className="text-slate-400 font-medium">
                            {config.description}
                        </p>
                    </div>

                    <Badge className={cn("font-black uppercase tracking-widest px-4 py-1", config.color)}>
                        {config.badge}
                    </Badge>
                </CardContent>
            </Card>

            {ticket.status === 'waiting' && (
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6 text-center space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Posição Atual</p>
                            <p className="text-4xl font-black text-blue-500 italic">{ticket.real_position}º</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6 text-center space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Espera Estimada</p>
                            <p className="text-4xl font-black text-blue-500 italic">~{ticket.estimated_wait_minutes}<span className="text-lg">m</span></p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {ticket.barbers && (
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="p-4 border-b border-slate-800">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Seu Barbeiro</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                            {ticket.barbers.photo_url ? (
                                <img src={ticket.barbers.photo_url} alt={ticket.barbers.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    <User size={24} />
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-100 uppercase italic">{ticket.barbers.name}</p>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Profissional selecionado</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {ticket.status === 'waiting' && (
                <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <AlertCircle className="text-blue-500 shrink-0" size={20} />
                    <p className="text-[11px] text-blue-400 font-medium leading-tight italic">
                        O tempo é estimado e pode variar de acordo com a duração dos atendimentos anteriores. Fique atento!
                    </p>
                </div>
            )}
        </div>
    );
}
