import "./globals.css";
import { ClientLayoutWrapper } from "@/components/layout/client-wrapper";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "791 Barber",
  description: "Sistema de fila digital e agendamento",
};

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
