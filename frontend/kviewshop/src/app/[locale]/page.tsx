import { redirect } from 'next/navigation';

// Main page redirects to buyer login
// Buyers are the primary users accessing creator malls
export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  // Redirect to buyer login as the main entry point
  redirect(`/${locale}/buyer/login`);
}
