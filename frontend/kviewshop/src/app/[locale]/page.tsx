import { redirect } from 'next/navigation';

// KviewShop is strictly private - no main page
// All access must be through creator shop links
export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  // Redirect to login for now, or show a minimal landing page
  redirect(`/${locale}/login`);
}
