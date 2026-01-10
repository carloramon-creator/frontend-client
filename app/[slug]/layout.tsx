import { Metadata } from 'next';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;

    // Busca dados básicos do tenant para o head (SEO e Apple Icon)
    const { data: tenant } = await supabase
        .from('tenants')
        .select('name, logo_url')
        .ilike('slug', slug)
        .maybeSingle();

    const name = tenant?.name || '791 Barber';
    const logo = tenant?.logo_url || '/icon-192.png';

    return {
        title: `${name} | Fila Digital`,
        manifest: `/api/manifest/${slug}`,
        appleWebApp: {
            capable: true,
            statusBarStyle: "black-translucent",
            title: name,
        },
        icons: {
            apple: logo,
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
