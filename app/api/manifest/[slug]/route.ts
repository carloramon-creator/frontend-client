import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const url = new URL(req.url);

    // Detecta o domínio correto para URLs absolutas (essencial para iPhone)
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host') || url.host;
    const domain = `${proto}://${host}`;

    console.log(`[MANIFEST] Generating for slug: ${slug}`);

    try {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('name, logo_url')
            .ilike('slug', slug)
            .maybeSingle();

        const name = tenant?.name || '791 Barber';

        // Garantir que a logo seja uma URL absoluta para o iPhone
        let logo = tenant?.logo_url || '/icon-192.png';
        if (logo && !logo.startsWith('http')) {
            const host = req.headers.get('host') || url.host;
            const proto = req.headers.get('x-forwarded-proto') || 'https';
            const path = logo.startsWith('/') ? logo : `/${logo}`;
            logo = `${proto}://${host}${path}`;
        }

        const iconUrl = `${logo}${logo.includes('?') ? '&' : '?'}v=100`;
        console.log(`[MANIFEST] Found tenant: ${tenant?.name}, logo: ${iconUrl}`);

        const manifest = {
            name: `${name} | Fila Digital`,
            short_name: name,
            description: `Acompanhe seu lugar na fila da ${name} em tempo real.`,
            start_url: `/${slug}`,
            scope: `/${slug}/`,
            display: "standalone",
            orientation: "portrait",
            background_color: "#020617",
            theme_color: "#020617",
            icons: [
                {
                    "src": iconUrl,
                    "sizes": "180x180",
                    "type": "image/png",
                    "purpose": "any"
                },
                {
                    "src": iconUrl,
                    "sizes": "192x192",
                    "type": "image/png",
                    "purpose": "any"
                },
                {
                    "src": iconUrl,
                    "sizes": "192x192",
                    "type": "image/png",
                    "purpose": "maskable"
                },
                {
                    "src": iconUrl,
                    "sizes": "512x512",
                    "type": "image/png",
                    "purpose": "any"
                }
            ]
        };

        return new NextResponse(JSON.stringify(manifest), {
            headers: {
                'Content-Type': 'application/manifest+json',
                'Cache-Control': 'no-store, no-cache, must-revalidate' // Força renovação sempre
            }
        });
    } catch (e) {
        console.error('[MANIFEST ERROR]', e);
        return NextResponse.json({ error: 'Failed to generate manifest' }, { status: 500 });
    }
}
