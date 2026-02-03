import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreatorShop } from '@/components/shop/creator-shop';

interface ShopPageProps {
  params: Promise<{
    locale: string;
    username: string;
  }>;
}

async function getCreatorData(username: string) {
  const supabase = await createClient();

  // Fetch creator by username
  const { data: creator, error } = await supabase
    .from('creators')
    .select(`
      *,
      creator_products (
        *,
        product:products (
          *,
          brand:brands (
            id,
            company_name,
            company_name_en,
            company_name_jp
          )
        )
      )
    `)
    .eq('username', username.toLowerCase())
    .single();

  if (error || !creator) {
    return null;
  }

  return creator;
}

export async function generateMetadata({ params }: ShopPageProps) {
  const { username, locale } = await params;
  const creator = await getCreatorData(username);

  if (!creator) {
    return {
      title: 'Shop Not Found',
    };
  }

  const displayName = creator.display_name || `@${creator.username}`;

  return {
    title: `${displayName}'s Shop`,
    description: creator.bio || `Shop curated K-Beauty products from ${displayName}`,
    openGraph: {
      title: `${displayName}'s Shop | KviewShop`,
      description: creator.bio || `Shop curated K-Beauty products from ${displayName}`,
      images: creator.profile_image ? [creator.profile_image] : [],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { username, locale } = await params;
  const creator = await getCreatorData(username);

  if (!creator) {
    notFound();
  }

  // Transform products data
  const products = creator.creator_products
    ?.map((cp: any) => ({
      ...cp.product,
      displayOrder: cp.display_order,
      isFeatured: cp.is_featured,
    }))
    .sort((a: any, b: any) => a.displayOrder - b.displayOrder) || [];

  return (
    <CreatorShop
      creator={{
        id: creator.id,
        username: creator.username,
        displayName: creator.display_name,
        profileImage: creator.profile_image,
        bio: locale === 'ja' ? creator.bio_jp : locale === 'en' ? creator.bio_en : creator.bio,
        themeColor: creator.theme_color,
        backgroundColor: creator.background_color || '#1a1a1a',
        country: creator.country,
        socialLinks: creator.social_links,
      }}
      products={products}
      locale={locale}
    />
  );
}
