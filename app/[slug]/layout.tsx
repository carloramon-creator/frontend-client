import { Metadata } from 'next';

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    return {
        manifest: `/api/manifest/${slug}`,
    };
}

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
