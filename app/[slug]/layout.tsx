import { Metadata } from 'next';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const version = Date.now();

    // Busca dados básicos do tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('name, logo_url')
        .ilike('slug', slug)
        .maybeSingle();

    const name = tenant?.name || '791 Barber';
    let logo = tenant?.logo_url || '/icon-192.png';

    // Garantir URL absoluta para a logo (iPhone exige URLs completas para não falhar no ícone)
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

    // Logo com versionamento para forçar o Safari a baixar a imagem nova
    const finalIcon = `${logo}${logo.includes('?') ? '&' : '?'}v=${version}`;

    return {
        title: name,
        description: `Fila Digital de ${name}`,
        manifest: `/api/manifest/${slug}?v=${version}`,
        appleWebApp: {
            capable: true,
            statusBarStyle: "black-translucent",
            title: name,
        },
        icons: {
            apple: [
                { url: finalIcon, sizes: '180x180' },
                { url: finalIcon, sizes: '152x152' },
                { url: finalIcon, sizes: '120x120' },
            ],
            icon: [
                { url: finalIcon, sizes: '192x192' },
            ],
            shortcut: finalIcon,
            other: [
                {
                    rel: 'apple-touch-icon-precomposed',
                    url: finalIcon,
                }
            ],
        },
    };
}

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
