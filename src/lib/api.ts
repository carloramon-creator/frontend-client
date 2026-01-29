import axios from 'axios';

// Backend URL - Updated to use the consolidated production backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.NEXT_PUBLIC_BACKEND_URL || 'https://791barber.com';

const api = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const Api = {
    /** Busca informações da barbearia e status da fila (PÚBLICO) */
    getShopInfo: async (slug: string) => {
        const res = await api.get(`/api/public/queue?tenantId=${slug}`);
        return res.data;
    },

    /** Identifica o cliente via ID da URL (PÚBLICO) */
    identifyClient: async (clientId: string, slug: string) => {
        const res = await api.get(`/api/public/client?id=${clientId}&slug=${slug}`);
        return res.data;
    },

    /** Entra na fila (PÚBLICO) */
    enterQueue: async (data: {
        tenant_id: string;
        barber_id?: string;
        client_name: string;
        client_phone: string;
        cpf?: string;
        photo_url?: string;
        is_priority?: boolean;
        fcm_token?: string | null;
    }) => {
        const res = await api.post('/api/public/queue/enter', data);
        return res.data;
    },

    /** AGENDAMENTOS: Busca serviços (PÚBLICO) */
    getServices: async (slug: string) => {
        const res = await api.get(`/api/public/services?slug=${slug}`);
        return res.data;
    },

    /** AGENDAMENTOS: Busca barbeiros (PÚBLICO) */
    getBarbers: async (slug: string) => {
        const res = await api.get(`/api/public/barbers?slug=${slug}`);
        return res.data;
    },

    /** AGENDAMENTOS: Busca horários disponíveis (PÚBLICO) */
    getAvailability: async (date: string, barberId: string, duration: number, slug: string) => {
        const res = await api.get(`/api/public/availability`, {
            params: { date, barberId, duration, slug }
        });
        return res.data;
    },

    /** AGENDAMENTOS: Cria agendamento (PÚBLICO) */
    createAppointment: async (data: any) => {
        const res = await api.post('/api/public/appointments', data);
        return res.data;
    },

    /** AGENDAMENTOS: Busca agendamentos do cliente (PÚBLICO) */
    getMyAppointments: async (phone: string, slug: string) => {
        const res = await api.get(`/api/public/appointments`, {
            params: { phone, slug }
        });
        return res.data;
    },

    /** BUSCA STATUS DO TICKET (PÚBLICO) */
    getTicketStatus: async (ticketId: string) => {
        const res = await api.get(`/api/public/queue/ticket?id=${ticketId}`);
        return res.data;
    },

    /** CANCELAR/SAIR DA FILA (PÚBLICO) */
    cancelQueue: async (ticketId: string) => {
        const res = await api.put(`/api/public/queue/cancel`, { ticketId });
        return res.data;
    }
};
