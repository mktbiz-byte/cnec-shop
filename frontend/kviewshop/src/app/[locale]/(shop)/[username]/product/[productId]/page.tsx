import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductDetailPage } from '@/components/shop/product-detail';
import type { Metadata } from 'next';
import type {
  Product,
  Campaign,
  CampaignProduct,
  Creator,
} from '@/types/database';

interface ProductPageProps {
  params: Promise<{
    locale: string;
    username: string;
    productId: string;
  }>;
  searchParams: Promise<{
    campaign?: string;
  }>;
}

async function getCreatorByShopId(shopId: string) {
  const supabase = await createClient();

  const { data: creator, error } = await supabase
    .from('creators')
    .select('*')
    .ilike('shop_id', shopId)
    .maybeSingle();

  if (error || !creator) return null;
  return creator as Creator;
}

async function getProduct(productId: string) {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands (
        id,
        brand_name,
        logo_url
      )
    `)
    .eq('id', productId)
    .maybeSingle();

  if (error || !product) return null;
  return product as Product;
}

async function getCampaignProduct(productId: string, campaignId: string) {
  const supabase = await createClient();

  const { data: campaignProduct, error } = await supabase
    .from('campaign_products')
    .select(`
      *,
      campaign:campaigns (*)
    `)
    .eq('product_id', productId)
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error || !campaignProduct) return null;
  return campaignProduct as CampaignProduct;
}

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { productId, username } = await params;
  const product = await getProduct(productId);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.name} | CNEC`,
    description: product.description
      ? product.description.replace(/<[^>]*>/g, '').substring(0, 160)
      : `${product.name} - CNEC Commerce`,
    openGraph: {
      title: `${product.name} | CNEC Commerce`,
      description: product.description
        ? product.description.replace(/<[^>]*>/g, '').substring(0, 160)
        : `${product.name}`,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { locale, username, productId } = await params;
  const { campaign: campaignId } = await searchParams;

  const [creator, product] = await Promise.all([
    getCreatorByShopId(username),
    getProduct(productId),
  ]);

  if (!creator || !product) {
    notFound();
  }

  let campaignProduct: CampaignProduct | null = null;
  if (campaignId) {
    campaignProduct = await getCampaignProduct(productId, campaignId);
  }

  return (
    <ProductDetailPage
      product={product}
      campaignProduct={campaignProduct}
      creator={creator}
      locale={locale}
      username={username}
    />
  );
}
