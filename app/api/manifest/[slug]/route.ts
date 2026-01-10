import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        // Busca a barbearia pelo slug para pegar o nome e logo corretos
        const { data: tenant } = await supabase
            .from('tenants')
            .select('name, logo_url')
            .ilike('slug', slug)
            .maybeSingle();

        const name = tenant?.name || '791 Barber';
        const logo = tenant?.logo_url || '/icon-192.png';

        const manifest = {
            name: `${name} | Fila Digital`,
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
                    "sizes": "512x512",
                    "type": "image/png",
                    "purpose": "any"
                },
                {
                    "src": logo,
                    "sizes": "1024x1024",
                    "type": "image/png",
                    "purpose": "any"
                }
            ]
        };

        return NextResponse.json(manifest, {
            headers: {
                'Content-Type': 'application/manifest+json',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to generate manifest' }, { status: 500 });
    }
}
