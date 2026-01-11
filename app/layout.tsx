import "./globals.css";
import { ClientLayoutWrapper } from "@/components/layout/client-wrapper";
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase-client';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  // Busca o primeiro tenant cadastrado (fallback padrão)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, logo_url')
    .limit(1)
    .maybeSingle();

  const name = tenant?.name || '791 Barber';
  let logo = tenant?.logo_url || '/favicon.ico';

  // URL Absoluta para iPhone
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

  const iconUrl = `${logo}${logo.includes('?') ? '&' : '?'}v=200`;

  return {
    title: name,
    description: "Sistema de fila digital e agendamento",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: name,
    },
    icons: {
      apple: [
        { url: iconUrl, sizes: '180x180', type: 'image/png' },
      ],
      shortcut: iconUrl,
      icon: [
        { url: iconUrl, sizes: '192x192', type: 'image/png' },
        { url: iconUrl, sizes: '512x512', type: 'image/png' },
      ],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased selection:bg-blue-500/30 bg-slate-950">
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
