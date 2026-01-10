import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfbiwvhxztejuzcasclv.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const url = new URL(req.url);
    const domain = `${url.protocol}//${url.host}`;

    try {
        const { data: tenant } = await supabaseAdmin
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
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
