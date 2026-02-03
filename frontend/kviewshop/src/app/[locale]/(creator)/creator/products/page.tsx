'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Plus, Search, X, GripVertical, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { toast } from 'sonner';

// Mock data for available products
const mockAvailableProducts = [
  {
    id: '1',
    name_en: 'Glow Serum',
    name_jp: 'グローセラム',
    brand_name: 'Beauty Lab Korea',
    price_usd: 50,
    price_jpy: 7500,
    commission_rate: 25,
    image: 'https://via.placeholder.com/200',
    is_picked: false,
  },
  {
    id: '2',
    name_en: 'Hydra Cream',
    name_jp: 'ハイドラクリーム',
    brand_name: 'Beauty Lab Korea',
    price_usd: 45,
    price_jpy: 6750,
    commission_rate: 25,
    image: 'https://via.placeholder.com/200',
    is_picked: true,
  },
  {
    id: '3',
    name_en: 'Vitamin C Toner',
    name_jp: 'ビタミンCトナー',
    brand_name: 'Glow Essence',
    price_usd: 38,
    price_jpy: 5700,
    commission_rate: 30,
    image: 'https://via.placeholder.com/200',
    is_picked: false,
  },
  {
    id: '4',
    name_en: 'Snail Mucin Essence',
    name_jp: 'カタツムリムチンエッセンス',
    brand_name: 'K-Skin Pro',
    price_usd: 55,
    price_jpy: 8250,
    commission_rate: 20,
    image: 'https://via.placeholder.com/200',
    is_picked: true,
  },
  {
    id: '5',
    name_en: 'Rose Water Mist',
    name_jp: 'ローズウォーターミスト',
    brand_name: 'Beauty Lab Korea',
    price_usd: 28,
    price_jpy: 4200,
    commission_rate: 25,
    image: 'https://via.placeholder.com/200',
    is_picked: false,
  },
];

// Mock data for picked products
const mockPickedProducts = mockAvailableProducts.filter((p) => p.is_picked);

interface ProductCardProps {
  product: typeof mockAvailableProducts[0];
  onPick: (id: string) => void;
  onUnpick: (id: string) => void;
  locale: string;
}

function ProductCard({ product, onPick, onUnpick, locale }: ProductCardProps) {
  const t = useTranslations('creator');
  const currency = locale === 'ja' ? 'JPY' : 'USD';
  const price = currency === 'JPY' ? product.price_jpy : product.price_usd;
  const commission = price * (product.commission_rate / 100);

  return (
    <Card className="card-hover">
      <div className="relative aspect-square">
        <Image
          src={product.image}
          alt={locale === 'ja' ? product.name_jp : product.name_en}
          fill
          className="object-cover rounded-t-lg"
        />
        {product.is_picked && (
          <Badge className="absolute top-2 right-2 bg-primary">
            <Check className="h-3 w-3 mr-1" />
            Picked
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{product.brand_name}</p>
        <h3 className="font-medium line-clamp-1">
          {locale === 'ja' ? product.name_jp : product.name_en}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(price, currency)}
            </p>
            <p className="text-xs text-success">
              +{formatCurrency(commission, currency)} commission ({product.commission_rate}%)
            </p>
          </div>
        </div>
        <Button
          className={`w-full mt-4 ${product.is_picked ? '' : 'btn-gold'}`}
          variant={product.is_picked ? 'outline' : 'default'}
          onClick={() => product.is_picked ? onUnpick(product.id) : onPick(product.id)}
        >
          {product.is_picked ? (
            <>
              <X className="mr-2 h-4 w-4" />
              {t('unpickProduct')}
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {t('pickProduct')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function PickedProductItem({
  product,
  onUnpick,
  onToggleFeatured,
  locale,
}: {
  product: typeof mockAvailableProducts[0] & { is_featured?: boolean };
  onUnpick: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  locale: string;
}) {
  const currency = locale === 'ja' ? 'JPY' : 'USD';
  const price = currency === 'JPY' ? product.price_jpy : product.price_usd;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group">
      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
      <div className="relative h-12 w-12 rounded overflow-hidden">
        <Image
          src={product.image}
          alt={locale === 'ja' ? product.name_jp : product.name_en}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {locale === 'ja' ? product.name_jp : product.name_en}
        </p>
        <p className="text-sm text-primary font-bold">
          {formatCurrency(price, currency)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onToggleFeatured(product.id)}
        className={product.is_featured ? 'text-warning' : 'text-muted-foreground'}
      >
        <Star className={`h-4 w-4 ${product.is_featured ? 'fill-current' : ''}`} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onUnpick(product.id)}
        className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function CreatorProductsPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = useTranslations('creator');
  const tCommon = useTranslations('common');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState(mockAvailableProducts);

  const handlePick = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_picked: true } : p))
    );
    toast.success('Product added to your shop');
  };

  const handleUnpick = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_picked: false } : p))
    );
    toast.success('Product removed from your shop');
  };

  const handleToggleFeatured = (id: string) => {
    // Toggle featured status logic
    toast.success('Featured status updated');
  };

  const pickedProducts = products.filter((p) => p.is_picked);
  const availableProducts = products.filter(
    (p) =>
      !p.is_picked &&
      (p.name_en.toLowerCase().includes(search.toLowerCase()) ||
        p.name_jp.includes(search))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('pickProducts')}</h1>
        <p className="text-muted-foreground">
          Select products to display in your shop
        </p>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          <TabsTrigger value="picked">
            {t('pickedProducts')} ({pickedProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={`${tCommon('search')} products...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {availableProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPick={handlePick}
                onUnpick={handleUnpick}
                locale={params.locale}
              />
            ))}
          </div>

          {availableProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {search
                  ? 'No products found matching your search'
                  : 'All available products have been picked'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="picked">
          <Card>
            <CardHeader>
              <CardTitle>{t('pickedProducts')}</CardTitle>
              <CardDescription>
                Drag to reorder. Star to feature a product at the top of your shop.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pickedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No products picked yet. Browse products to add them to your shop.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {pickedProducts.map((product) => (
                      <PickedProductItem
                        key={product.id}
                        product={product}
                        onUnpick={handleUnpick}
                        onToggleFeatured={handleToggleFeatured}
                        locale={params.locale}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
