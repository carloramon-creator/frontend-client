
export const maskPhone = (value: string | undefined | null) => {
    if (!value) return '';
    const clean = value.replace(/\D/g, '');

    // (11) 91234-5678 -> 11 chars
    // (11) 1234-5678 -> 10 chars

    if (clean.length <= 2) return `(${clean}`;
    if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
};

export const maskCPF = (value: string | undefined | null) => {
    if (!value) return '';
    const clean = value.replace(/\D/g, '');

    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
};

export const unmask = (value: string) => {
    return value.replace(/\D/g, '');
};

/**
 * Normaliza o telefone para o formato E.164 (apenas números).
 * Heurística:
 * - Se tiver 10 ou 11 dígitos, assume Brasil e adiciona 55.
 * - Caso contrário, mantém o que foi digitado (internacional).
 */
export const normalizePhone = (value: string | undefined | null) => {
    if (!value) return '';
    const clean = value.replace(/\D/g, '');

    if (clean.length === 10 || clean.length === 11) {
        return `55${clean}`;
    }

    return clean;
};
