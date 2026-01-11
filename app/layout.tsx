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

  let host = '791barber.com';
  let proto = 'https';

  try {
    const headerList = await headers();
    host = headerList.get('host') || '791barber.com';
    proto = headerList.get('x-forwarded-proto') || 'https';
  } catch (e) { }

  // URL Absoluta para iPhone e OG
  if (logo && !logo.startsWith('http')) {
    const path = logo.startsWith('/') ? logo : `/${logo}`;
    logo = `${proto}://${host}${path}`;
  }

  const iconUrl = `${logo}${logo.includes('?') ? '&' : '?'}v=200`;

  return {
    title: name,
    description: "Sistema de fila digital e agendamento",
    metadataBase: new URL(`${proto}://${host}`),
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: name,
    },
    openGraph: {
      title: name,
      description: "Sistema de fila digital e agendamento",
      images: [{ url: iconUrl, width: 1200, height: 630, alt: name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: "Sistema de fila digital e agendamento",
      images: [iconUrl],
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
