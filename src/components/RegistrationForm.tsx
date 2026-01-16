import { useState } from 'react';
import { User, Phone, FileText, Camera, Loader2, Check } from 'lucide-react';

interface RegistrationFormProps {
    slug: string;
    clientId?: string;
    initialData?: any;
    onComplete: (data: any) => void;
}

export function RegistrationForm({ slug, clientId, initialData, onComplete }: RegistrationFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        cpf: initialData?.cpf || '',
        photo_url: initialData?.photo_url || ''
    });

    const handlePhotoClick = () => {
        document.getElementById('photo-input')?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            // Lógica de registro/atualização aqui
            // Por enquanto, apenas simulamos e guardamos no local
            const completeData = { ...formData, id: clientId || 'new-' + Date.now() };
            localStorage.setItem(`791_${slug}_client_data`, JSON.stringify(completeData));
            onComplete(completeData);
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar cadastro.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex-1 flex flex-col justify-center p-6 animate-in fade-in duration-500">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Quase lá!</h2>
                <p className="text-slate-500 text-sm font-medium">Complete seu perfil para um atendimento premium.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-custom transition-colors" size={20} />
                        <input
                            required
                            type="text"
                            placeholder="Nome Completo"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl h-14 pl-12 focus:border-primary-custom outline-none transition-all font-bold"
                        />
                    </div>

                    <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-custom transition-colors" size={20} />
                        <input
                            required
                            type="tel"
                            placeholder="Telefone / WhatsApp"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl h-14 pl-12 focus:border-primary-custom outline-none transition-all font-bold"
                        />
                    </div>

                    <div className="relative group">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-custom transition-colors" size={20} />
                        <input
                            required
                            type="text"
                            placeholder="CPF (Para notas fiscais)"
                            value={formData.cpf}
                            onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl h-14 pl-12 focus:border-primary-custom outline-none transition-all font-bold"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 py-4">
                    <input
                        type="file"
                        id="photo-input"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <div
                        onClick={handlePhotoClick}
                        className="w-24 h-24 bg-slate-900 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary-custom transition-colors"
                    >
                        {formData.photo_url ? (
                            <img src={formData.photo_url} className="w-full h-full object-cover" />
                        ) : (
                            <Camera className="text-slate-700 group-hover:text-primary-custom transition-colors" size={32} />
                        )}
                    </div>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Sua Foto de Perfil</p>
                </div>

                <button
                    disabled={loading}
                    className="w-full h-16 bg-primary-custom hover:opacity-90 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Concluir Cadastro</>}
                </button>
            </form>
        </div>
    );
}
