import { Metadata } from 'next';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;

    // Busca dados básicos do tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('name, logo_url')
        .ilike('slug', slug)
        .maybeSingle();

    const name = tenant?.name || '791 Barber';
    // USAMOS UM CAMINHO RELATIVO PADRÃO QUE O IPHONE SEMPRE ACHA SE O BANCO FALHAR
    let logo = tenant?.logo_url || '/favicon.ico';

    // Garantir URL absoluta para a logo (iPhone exige)
    if (logo && !logo.startsWith('http')) {
        try {
            const headerList = await headers();
            const host = headerList.get('host') || '791barber.com';
            const proto = headerList.get('x-forwarded-proto') || 'https';
            const path = logo.startsWith('/') ? logo : `/${logo}`;
            logo = `${proto}://${host}${path}`;
        } catch (e) {
            logo = `https://791barber.com${logo.startsWith('/') ? logo : '/' + logo}`;
        }
    }

    const iconUrl = `${logo}${logo.includes('?') ? '&' : '?'}v=100`;

    return {
        title: name,
        description: `Agendamento online para ${name}.`,
        manifest: `/api/manifest/${slug}`,
        appleWebApp: {
            capable: true,
            statusBarStyle: "black-translucent",
            title: name,
        },
        icons: {
            apple: [
                { url: iconUrl, sizes: '180x180', type: 'image/png' },
            ],
            shortcut: iconUrl,
            icon: [
                { url: iconUrl, sizes: '192x192', type: 'image/png' },
                { url: iconUrl, sizes: '512x512', type: 'image/png' },
            ],
        },
        other: {
            'apple-touch-icon': iconUrl,
            'apple-touch-icon-precomposed': iconUrl,
        }
    };
}

export default function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    return (
        <>
            {children}
        </>
    );
}
