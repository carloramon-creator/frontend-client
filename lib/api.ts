const BACKEND_URL = 'https://791-barbershop-production.up.railway.app';

async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        cache: 'no-store',
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // Se for erro de fila existente, lançar objeto com ticketId
        const error: any = new Error(errorData.error || errorData.message || 'Erro ao comunicar com o servidor.');
        error.data = errorData;
        throw error;
    }
    return res.json();
}

export const Api = {
    // Lista status dos barbeiros + fila + tempos (PÚBLICO)
    getQueueStatus: (tenantId: string) => apiFetch(`/api/public/queue?tenantId=${tenantId}`),

    // Identificar cliente via URL personalizada (PÚBLICO)
    identifyClient: (clientId: string, slug: string) => apiFetch(`/api/public/client?id=${clientId}&slug=${slug}`),

    // Alias para compatibilidade com o que está sendo usado no page.tsx
    getShopInfo: (tenantId: string) => apiFetch(`/api/public/queue?tenantId=${tenantId}`),

    // Cliente entra na fila de um barbeiro específico (PÚBLICO)
    enterQueueForBarber: (tenantId: string, barberId: string, clientName: string, clientPhone?: string, cpf?: string, photo_url?: string) =>
        apiFetch('/api/public/queue/enter', {
            method: 'POST',
            body: JSON.stringify({
                tenant_id: tenantId,
                barber_id: barberId === 'any' ? undefined : barberId,
                client_name: clientName,
                client_phone: clientPhone,
                cpf,
                photo_url
            }),
        }),

    // Alias para compatibilidade com o joinQueue do page.tsx
    joinQueue: (tenantId: string, barberId: string, clientName: string, clientPhone: string, isPriority: boolean = false, cpf?: string, photo_url?: string) =>
        apiFetch('/api/public/queue/enter', {
            method: 'POST',
            body: JSON.stringify({
                tenant_id: tenantId,
                barber_id: barberId === 'any' ? undefined : barberId,
                client_name: clientName,
                client_phone: clientPhone,
                is_priority: isPriority,
                cpf,
                photo_url
            }),
        }),

    // Buscar status da fila de um ticket específico (PÚBLICO)
    getQueueTicket: (ticketId: string) =>
        apiFetch(`/api/public/queue/ticket?id=${ticketId}`),

    // === AÇÕES DO BARBEIRO (PÚBLICO para MVP) ===

    // Barbeiro chama o próximo da fila
    barberCallNext: (barberId: string) =>
        apiFetch(`/api/public/barber/${barberId}/next`, {
            method: 'PUT',
        }),

    // Barbeiro finaliza atendimento
    barberFinishService: (ticketId: string) =>
        apiFetch(`/api/public/barber/finish/${ticketId}`, {
            method: 'PUT',
        }),

    // === AGENDAMENTOS (PÚBLICO) ===

    // Lista serviços disponíveis na barbearia
    getServices: (slug: string) => apiFetch(`/api/public/services?slug=${slug}`),

    // Lista barbeiros disponíveis na barbearia
    getBarbers: (slug: string) => apiFetch(`/api/public/barbers?slug=${slug}`),

    // Busca serviços de um barbeiro específico
    getBarberServices: (barberId: string) => apiFetch(`/api/public/barber/${barberId}/services`),

    // Busca horários disponíveis
    getAvailability: (date: string, barberId: string, duration: number, slug: string) =>
        apiFetch(`/api/public/availability?date=${date}&barberId=${barberId}&duration=${duration}&slug=${slug}`),

    // Cria um agendamento
    createAppointment: (data: any) =>
        apiFetch('/api/public/appointments', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Cliente sai da fila (CANCELAR)
    cancelTicket: (ticketId: string) =>
        apiFetch(`/api/public/queue/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ ticketId }),
        }),
};
