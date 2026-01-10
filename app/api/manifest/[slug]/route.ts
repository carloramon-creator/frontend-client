import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const url = new URL(req.url);
    const domain = `${url.protocol}//${url.host}`;

    try {
        // Usa o client público (anon) para buscar dados básicos do tenant
        const { data: tenant } = await supabase
            .from('tenants')
            .select('name, logo_url')
            .ilike('slug', slug)
            .maybeSingle();

        const name = tenant?.name || '791 Barber';

        // Garantir que a logo seja uma URL absoluta para o iPhone
        let logo = tenant?.logo_url || `${domain}/icon-192.png`;
        if (logo.startsWith('/')) {
            logo = `${domain}${logo}`;
        }

        const manifest = {
            name: `${name} | Agendamento`,
            short_name: name,
            description: `Sistema de fila digital e agendamento para ${name}.`,
            start_url: `/${slug}`,
            display: "standalone",
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
                'Cache-Control': 'public, max-age=60'
            }
        });
    } catch (e) {
        console.error('[MANIFEST ERROR]', e);
        return NextResponse.json({ error: 'Failed to generate manifest' }, { status: 500 });
    }
}
