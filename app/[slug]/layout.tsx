import { Metadata } from 'next';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const version = Date.now(); // Cache busting

    // Busca dados básicos do tenant para o head (SEO e Apple Icon)
    const { data: tenant } = await supabase
        .from('tenants')
        .select('name, logo_url')
        .ilike('slug', slug)
        .maybeSingle();

    const name = tenant?.name || '791 Barber';
    let logo = tenant?.logo_url || '/icon-192.png';

    // Garantir URL absoluta para a logo (iPhone exige)
    if (logo && !logo.startsWith('http')) {
        const headerList = await headers();
        const host = headerList.get('host') || '791barber.com';
        const proto = headerList.get('x-forwarded-proto') || 'https';
        const path = logo.startsWith('/') ? logo : `/${logo}`;
        logo = `${proto}://${host}${path}`;
    }

    return {
        title: `${name} | Fila Digital`,
        description: `Sistema de fila digital e agendamento para ${name}.`,
        manifest: `/api/manifest/${slug}?v=${version}`,
        appleWebApp: {
            capable: true,
            statusBarStyle: "black-translucent",
            title: name,
        },
        icons: {
            apple: logo,
            shortcut: logo,
            icon: logo,
            other: [
                {
                    rel: 'apple-touch-icon-precomposed',
                    url: logo,
                },
            ],
        }
    };
}

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
