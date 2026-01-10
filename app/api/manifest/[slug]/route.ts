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

    try {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('name, logo_url')
            .ilike('slug', slug)
            .maybeSingle();

        const name = tenant?.name || '791 Barber';

        // Garantir que a logo seja uma URL absoluta para o iPhone
        let logo = tenant?.logo_url || `${domain}/icon-192.png`;
        if (logo && !logo.startsWith('http')) {
            logo = `${domain}${logo.startsWith('/') ? logo : '/' + logo}`;
        }

        const manifest = {
            name: `${name} | Fila Digital`,
            short_name: name,
            description: `Sistema de fila digital e agendamento para ${name}.`,
            start_url: `/${slug}`,
            scope: `/`, // Escopo raiz para garantir que navegação interna funcione
            display: "standalone",
            orientation: "portrait",
            background_color: "#020617",
            theme_color: "#020617",
            icons: [
                {
                    "src": logo,
                    "sizes": "192x192",
                    "type": "image/png",
                    "purpose": "any"
                },
                {
                    "src": logo,
                    "sizes": "192x192",
                    "type": "image/png",
                    "purpose": "maskable"
                },
                {
                    "src": logo,
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
