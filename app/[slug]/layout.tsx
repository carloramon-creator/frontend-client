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
    let logo = tenant?.logo_url || '/icon-192.png';

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
        title: name, // Título limpo para o ícone
        description: `Agendamento online para ${name}.`,
        manifest: `/api/manifest/${slug}`,
        appleWebApp: {
            capable: true,
            statusBarStyle: "black-translucent",
            title: name,
        },
        icons: {
            apple: [
                { url: logo, sizes: '180x180', type: 'image/png' },
            ],
            shortcut: logo,
            icon: logo,
            other: [
                {
                    rel: 'apple-touch-icon',
                    url: logo,
                },
                {
                    rel: 'apple-touch-icon-precomposed',
                    url: logo,
                }
            ],
        }
    };
}

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* O Next.js já injetará as tags metadata, mas o layout permite envolver os filhos */}
            {children}
        </>
    );
}
