import { redirect } from 'next/navigation';

interface ShopPageProps {
  params: Promise<{
    locale: string;
    username: string;
  }>;
}

// Legacy route - redirect to new shop route
export default async function ShopPage({ params }: ShopPageProps) {
  const { username, locale } = await params;
  redirect(`/${locale}/${username}`);
}
