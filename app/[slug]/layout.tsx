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
                { url: logo, sizes: '180x180' },
            ],
            shortcut: logo,
            icon: [
                { url: logo, sizes: '192x192' },
                { url: logo, sizes: '512x512' },
            ],
        },
    };
}

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* O Next.js já injetará as tags metadata automaticamente */}
            {children}
        </>
    );
}
