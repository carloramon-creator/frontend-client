const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

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

export const ClientApi = {
    // Lista status dos barbeiros + fila + tempos (PÚBLICO)
    getQueueStatus: () => apiFetch('/api/public/queue'),

    // Cliente entra na fila de um barbeiro específico (PÚBLICO)
    enterQueueForBarber: (barberId: string, clientName: string, clientPhone?: string) =>
        apiFetch('/api/public/queue/enter', {
            method: 'POST',
            body: JSON.stringify({ barber_id: barberId, client_name: clientName, client_phone: clientPhone }),
        }),

    // Cliente entra em "Qualquer barbeiro" (menor espera) (PÚBLICO)
    enterQueueAnyBarber: (clientName: string, clientPhone?: string) =>
        apiFetch('/api/public/queue/enter', {
            method: 'POST',
            body: JSON.stringify({ client_name: clientName, client_phone: clientPhone }),
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
};
