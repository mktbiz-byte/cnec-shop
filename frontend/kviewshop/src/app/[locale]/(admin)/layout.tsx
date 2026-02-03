import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import type { Locale } from '@/lib/i18n/config';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="light min-h-screen bg-background">
      <Header locale={locale as Locale} />
      <div className="flex">
        <Sidebar role="super_admin" locale={locale as Locale} />
        <main className="ml-64 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
