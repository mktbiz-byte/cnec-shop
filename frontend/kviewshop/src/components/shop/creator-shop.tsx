'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, type Locale } from '@/lib/i18n/config';
import { useCartStore } from '@/lib/store/auth';
import {
  ShoppingCart,
  Plus,
  Minus,
  Instagram,
  Youtube,
  Twitter,
  ExternalLink,
  Bell,
  BellOff,
  Award,
  MessageSquare,
  Music2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product, SocialLinks, Country } from '@/types/database';
import { LegalFooter } from '@/components/shop/legal-footer';
import { getClient } from '@/lib/supabase/client';

const levelColors: Record<string, { color: string; name: string }> = {
  bronze: { color: '#CD7F32', name: 'Bronze' },
  silver: { color: '#C0C0C0', name: 'Silver' },
  gold: { color: '#FFD700', name: 'Gold' },
  platinum: { color: '#E5E4E2', name: 'Platinum' },
  diamond: { color: '#B9F2FF', name: 'Diamond' },
};

interface ShopSettings {
  show_footer: boolean;
  show_social_links: boolean;
  show_subscriber_count: boolean;
  layout: 'grid' | 'list';
  products_per_row: number;
  show_prices: boolean;
  announcement: string;
  announcement_active: boolean;
}

interface CreatorShopProps {
  creator: {
    id: string;
    username: string;
    displayName?: string;
    profileImage?: string;
    bio?: string;
    themeColor: string;
    backgroundColor?: string;
    textColor?: string;
    country: Country;
    socialLinks?: SocialLinks;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    level?: string;
    communityEnabled?: boolean;
    shopSettings?: ShopSettings;
  };
  products: (Product & { displayOrder: number; isFeatured: boolean })[];
  locale: string;
}

function ProductCard({
  product,
  locale,
  creatorId,
  onAddToCart,
}: {
  product: Product & { isFeatured: boolean };
  locale: string;
  creatorId: string;
  onAddToCart: (productId: string) => void;
}) {
  const t = useTranslations('shop');
  const currency = locale === 'ja' ? 'JPY' : 'USD';
  const price = currency === 'JPY' ? product.price_jpy : product.price_usd;
  const originalPrice =
    currency === 'JPY' ? product.original_price_jpy : product.original_price_usd;

  const productName =
    locale === 'ja'
      ? product.name_jp || product.name_en
      : product.name_en;

  return (
    <Card className="card-hover overflow-hidden group">
      <div className="relative aspect-square overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={productName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No Image</span>
          </div>
        )}
        {product.isFeatured && (
          <Badge className="absolute top-2 left-2 bg-primary">
            {t('featured')}
          </Badge>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="destructive">{t('outOfStock')}</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium line-clamp-2 min-h-[2.5rem]">{productName}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(price, currency)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(originalPrice, currency)}
            </span>
          )}
        </div>
        <Button
          className="w-full mt-4 btn-gold"
          disabled={product.stock === 0}
          onClick={() => onAddToCart(product.id)}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {t('addToCart')}
        </Button>
      </CardContent>
    </Card>
  );
}

export function CreatorShop({ creator, products, locale }: CreatorShopProps) {
  const t = useTranslations('shop');
  const [cartOpen, setCartOpen] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore();

  const currency = locale === 'ja' ? 'JPY' : 'USD';
  const shopSettings = creator.shopSettings || {
    show_footer: true,
    show_social_links: true,
    show_subscriber_count: false,
    layout: 'grid',
    products_per_row: 3,
    show_prices: true,
    announcement: '',
    announcement_active: false,
  };

  // Load subscriber count on mount
  useState(() => {
    const loadSubscriberCount = async () => {
      const supabase = getClient();
      const { count } = await supabase
        .from('mall_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creator.id)
        .eq('status', 'active');
      setSubscriberCount(count || 0);
    };
    loadSubscriberCount();
  });

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        toast.error('Please login to subscribe');
        setIsSubscribing(false);
        return;
      }

      // Get buyer
      const { data: buyer } = await supabase
        .from('buyers')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!buyer) {
        toast.error('Buyer account not found');
        setIsSubscribing(false);
        return;
      }

      if (isSubscribed) {
        await supabase
          .from('mall_subscriptions')
          .delete()
          .eq('buyer_id', buyer.id)
          .eq('creator_id', creator.id);

        setIsSubscribed(false);
        setSubscriberCount((c) => Math.max(0, c - 1));
        toast.success('Unsubscribed');
      } else {
        await supabase.from('mall_subscriptions').insert({
          buyer_id: buyer.id,
          creator_id: creator.id,
        });

        setIsSubscribed(true);
        setSubscriberCount((c) => c + 1);
        toast.success('Subscribed!');
      }
    } catch (error) {
      toast.error('Failed to update subscription');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleAddToCart = (productId: string) => {
    addItem({
      productId,
      quantity: 1,
      creatorId: creator.id,
    });
    toast.success('Added to cart');
  };

  const cartItems = items.filter((item) => item.creatorId === creator.id);
  const cartProducts = cartItems.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId),
  }));

  const cartTotal = cartProducts.reduce((total, item) => {
    if (!item.product) return total;
    const price = currency === 'JPY' ? item.product.price_jpy : item.product.price_usd;
    return total + price * item.quantity;
  }, 0);

  const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    instagram: Instagram,
    youtube: Youtube,
    twitter: Twitter,
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: creator.backgroundColor || '#1a1a1a',
        color: creator.textColor || '#ffffff',
      }}
    >
      {/* Announcement Banner */}
      {shopSettings.announcement_active && shopSettings.announcement && (
        <div
          className="p-3 text-center text-sm font-medium text-white"
          style={{ backgroundColor: creator.themeColor || '#d4af37' }}
        >
          {shopSettings.announcement}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href={`/${locale}/shop/${creator.username}`}>
            <span className="font-headline text-2xl font-bold text-gold-gradient">
              CNEC
            </span>
          </Link>

          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t('cart')}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                {cartProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('emptyCart')}
                  </p>
                ) : (
                  <>
                    {cartProducts.map((item) => {
                      if (!item.product) return null;
                      const price =
                        currency === 'JPY'
                          ? item.product.price_jpy
                          : item.product.price_usd;
                      const name =
                        locale === 'ja'
                          ? item.product.name_jp || item.product.name_en
                          : item.product.name_en;

                      return (
                        <div
                          key={item.productId}
                          className="flex gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="relative h-16 w-16 rounded overflow-hidden">
                            {item.product.images?.[0] ? (
                              <Image
                                src={item.product.images[0]}
                                alt={name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-muted" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-1">{name}</p>
                            <p className="text-sm text-primary font-bold">
                              {formatCurrency(price, currency)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  item.quantity > 1
                                    ? updateQuantity(item.productId, item.quantity - 1)
                                    : removeItem(item.productId)
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm w-6 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  updateQuantity(item.productId, item.quantity + 1)
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{t('total')}</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(cartTotal, currency)}
                      </span>
                    </div>
                    <Button className="w-full btn-gold" asChild>
                      <Link
                        href={`/${locale}/shop/${creator.username}/checkout`}
                        onClick={() => setCartOpen(false)}
                      >
                        {t('checkout')}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Creator Profile Section */}
      <section className="py-12 bg-card">
        <div className="container">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={creator.profileImage} alt={creator.displayName || creator.username} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {(creator.displayName || creator.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center justify-center gap-2 mt-4">
              <h1 className="text-3xl font-headline font-bold">
                {creator.displayName || `@${creator.username}`}
              </h1>
              {creator.level && levelColors[creator.level] && (
                <Badge
                  style={{ backgroundColor: levelColors[creator.level].color }}
                  className="text-black font-medium"
                >
                  <Award className="h-3 w-3 mr-1" />
                  {levelColors[creator.level].name}
                </Badge>
              )}
            </div>
            {shopSettings.show_subscriber_count && (
              <p className="text-sm text-muted-foreground mt-1">
                {subscriberCount.toLocaleString()} subscribers
              </p>
            )}
            {creator.bio && (
              <p className="mt-2 text-muted-foreground max-w-md">{creator.bio}</p>
            )}
            {/* Social Links */}
            {shopSettings.show_social_links && (
              <div className="mt-4 flex gap-3">
                {creator.instagram && (
                  <a
                    href={creator.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: creator.themeColor + '30' }}
                  >
                    <Instagram className="h-5 w-5" style={{ color: creator.themeColor }} />
                  </a>
                )}
                {creator.youtube && (
                  <a
                    href={creator.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: creator.themeColor + '30' }}
                  >
                    <Youtube className="h-5 w-5" style={{ color: creator.themeColor }} />
                  </a>
                )}
                {creator.tiktok && (
                  <a
                    href={creator.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: creator.themeColor + '30' }}
                  >
                    <Music2 className="h-5 w-5" style={{ color: creator.themeColor }} />
                  </a>
                )}
                {creator.socialLinks && Object.entries(creator.socialLinks).map(([platform, url]) => {
                  const Icon = socialIcons[platform];
                  if (!Icon || !url) return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
            {/* Action Buttons */}
            <div className="mt-4 flex gap-3 justify-center">
              <Button
                variant={isSubscribed ? 'outline' : 'default'}
                onClick={handleSubscribe}
                disabled={isSubscribing}
                style={!isSubscribed ? { backgroundColor: creator.themeColor || '#d4af37' } : {}}
              >
                {isSubscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isSubscribed ? (
                  <BellOff className="h-4 w-4 mr-2" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </Button>
              {creator.communityEnabled && (
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/@${creator.username}/community`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Community
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-2xl font-headline font-bold mb-8 text-center">
            {t('title')}
          </h2>
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No products yet. Check back soon!
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  creatorId={creator.id}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      {shopSettings.show_footer && (
        <LegalFooter locale={locale} variant="full" />
      )}
      <footer className="border-t border-border py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Powered by <span className="text-primary font-medium">CNEC Commerce</span></p>
          <p className="mt-1">Premium K-Beauty, Curated by Creators</p>
        </div>
      </footer>
    </div>
  );
}
