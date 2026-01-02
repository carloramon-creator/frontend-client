import { BarberCard } from "./barber-card";

interface BarberListProps {
    barbers: any[];
    onSelect: (barberId: string) => void;
}

export function BarberList({ barbers, onSelect }: BarberListProps) {
    if (barbers.length === 0) {
        return (
            <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Nenhum barbeiro online no momento.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {barbers.map((barber) => (
                <BarberCard
                    key={barber.barber_id}
                    barber={barber}
                    isSelected={false}
                    onSelect={() => onSelect(barber.barber_id)}
                />
            ))}
        </div>
    );
}
