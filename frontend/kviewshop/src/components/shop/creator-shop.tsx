'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
import { formatCurrency } from '@/lib/i18n/config';
import { useCartStore } from '@/lib/store/auth';
import {
  ShoppingCart,
  Plus,
  Minus,
  Instagram,
  Youtube,
  Bell,
  BellOff,
  Award,
  MessageSquare,
  Music2,
  Loader2,
  Share2,
  ChevronRight,
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

function getCurrencyForLocale(locale: string): string {
  const map: Record<string, string> = {
    en: 'USD', ja: 'JPY', ko: 'KRW', es: 'EUR', it: 'EUR',
    fr: 'EUR', de: 'EUR', ru: 'RUB', ar: 'AED', zh: 'CNY', pt: 'BRL',
  };
  return map[locale] || 'USD';
}

function getProductName(product: Product, locale: string): string {
  if (locale === 'ja' && product.name_jp) return product.name_jp;
  if (locale === 'ko' && product.name_ko) return product.name_ko;
  return product.name_en || product.name || '';
}

function getProductPrice(product: Product, currency: string): number {
  if (currency === 'JPY' && product.price_jpy) return product.price_jpy;
  if (currency === 'KRW' && product.price_krw) return product.price_krw;
  if (currency === 'EUR' && product.price_eur) return product.price_eur;
  return product.price_usd || product.price || 0;
}

function MobileProductCard({
  product,
  locale,
  currency,
  themeColor,
  onAddToCart,
}: {
  product: Product & { isFeatured: boolean };
  locale: string;
  currency: string;
  themeColor: string;
  onAddToCart: (productId: string) => void;
}) {
  const t = useTranslations('shop');
  const productName = getProductName(product, locale);
  const price = getProductPrice(product, currency);

  return (
    <div className="group">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={productName}
            fill
            className="object-cover transition-transform duration-300 group-active:scale-95"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          </div>
        )}
        {product.isFeatured && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: themeColor }}
          >
            HOT
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-sm font-medium">{t('outOfStock')}</span>
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground">
          {productName}
        </p>
        <p className="text-sm font-bold mt-1" style={{ color: themeColor }}>
          {formatCurrency(price, currency)}
        </p>
      </div>
      <Button
        className="w-full mt-2 h-9 rounded-xl text-xs font-semibold text-white"
        style={{ backgroundColor: themeColor }}
        disabled={product.stock === 0}
        onClick={() => onAddToCart(product.id)}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('addToCart')}
      </Button>
    </div>
  );
}

export function CreatorShop({ creator, products, locale }: CreatorShopProps) {
  const t = useTranslations('shop');
  const [cartOpen, setCartOpen] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { items, addItem, removeItem, updateQuantity } = useCartStore();

  const currency = getCurrencyForLocale(locale);
  const themeColor = creator.themeColor || '#d4af37';
  const shopSettings = creator.shopSettings || {
    show_footer: true,
    show_social_links: true,
    show_subscriber_count: false,
    layout: 'grid',
    products_per_row: 2,
    show_prices: true,
    announcement: '',
    announcement_active: false,
  };

  useEffect(() => {
    const loadSubscriberCount = async () => {
      try {
        const supabase = getClient();
        const { count } = await supabase
          .from('mall_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creator.id)
          .eq('status', 'active');
        setSubscriberCount(count || 0);
      } catch {
        // ignore
      }
    };
    loadSubscriberCount();
  }, [creator.id]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        toast.error(t('loginRequired') || 'Please login to subscribe');
        setIsSubscribing(false);
        return;
      }

      const { data: buyer } = await supabase
        .from('buyers')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!buyer) {
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
      } else {
        await supabase.from('mall_subscriptions').insert({
          buyer_id: buyer.id,
          creator_id: creator.id,
        });
        setIsSubscribed(true);
        setSubscriberCount((c) => c + 1);
      }
    } catch {
      // ignore
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleAddToCart = (productId: string) => {
    addItem({ productId, quantity: 1, creatorId: creator.id });
    toast.success(t('addedToCart') || 'Added!');
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: creator.displayName || `@${creator.username}`, url });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const cartItems = items.filter((item) => item.creatorId === creator.id);
  const cartProducts = cartItems.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId),
  }));
  const cartTotal = cartProducts.reduce((total, item) => {
    if (!item.product) return total;
    return total + getProductPrice(item.product, currency) * item.quantity;
  }, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const hasSocial = creator.instagram || creator.youtube || creator.tiktok;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {/* Announcement Banner */}
      {shopSettings.announcement_active && shopSettings.announcement && (
        <div
          className="px-4 py-2.5 text-center text-xs font-medium text-white"
          style={{ backgroundColor: themeColor }}
        >
          {shopSettings.announcement}
        </div>
      )}

      {/* Top Nav Bar - minimal */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-12">
          <span className="text-base font-bold tracking-tight" style={{ color: themeColor }}>
            CNEC
          </span>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="p-2 rounded-full hover:bg-muted transition-colors">
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: themeColor }}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
                <SheetHeader>
                  <SheetTitle className="text-base">{t('cart')}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-3 overflow-y-auto max-h-[50vh]">
                  {cartProducts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      {t('emptyCart')}
                    </p>
                  ) : (
                    <>
                      {cartProducts.map((item) => {
                        if (!item.product) return null;
                        const price = getProductPrice(item.product, currency);
                        const name = getProductName(item.product, locale);
                        return (
                          <div key={item.productId} className="flex gap-3 py-3 border-b border-border/50 last:border-0">
                            <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-muted shrink-0">
                              {item.product.images?.[0] ? (
                                <Image src={item.product.images[0]} alt={name} fill className="object-cover" />
                              ) : (
                                <div className="h-full w-full bg-muted" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">{name}</p>
                              <p className="text-sm font-bold mt-0.5" style={{ color: themeColor }}>
                                {formatCurrency(price, currency)}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <button
                                  className="h-7 w-7 rounded-full border flex items-center justify-center"
                                  onClick={() =>
                                    item.quantity > 1
                                      ? updateQuantity(item.productId, item.quantity - 1)
                                      : removeItem(item.productId)
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                <button
                                  className="h-7 w-7 rounded-full border flex items-center justify-center"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
                {cartProducts.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">{t('total')}</span>
                      <span className="text-lg font-bold" style={{ color: themeColor }}>
                        {formatCurrency(cartTotal, currency)}
                      </span>
                    </div>
                    <Button
                      className="w-full h-12 rounded-xl text-sm font-semibold text-white"
                      style={{ backgroundColor: themeColor }}
                      asChild
                    >
                      <Link
                        href={`/${locale}/@${creator.username}/checkout`}
                        onClick={() => setCartOpen(false)}
                      >
                        {t('checkout')}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Profile Section - compact mobile design */}
      <section className="px-4 pt-8 pb-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <Avatar className="h-20 w-20 ring-2 ring-offset-2 ring-offset-background" style={{ ['--tw-ring-color' as any]: themeColor }}>
            <AvatarImage src={creator.profileImage} alt={creator.displayName || creator.username} />
            <AvatarFallback
              className="text-2xl font-bold text-white"
              style={{ backgroundColor: themeColor }}
            >
              {(creator.displayName || creator.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Name + Badge */}
          <div className="flex items-center gap-1.5 mt-3">
            <h1 className="text-lg font-bold">
              {creator.displayName || `@${creator.username}`}
            </h1>
            {creator.level && levelColors[creator.level] && (
              <Badge
                style={{ backgroundColor: levelColors[creator.level].color }}
                className="text-black text-[10px] px-1.5 py-0 font-medium"
              >
                <Award className="h-2.5 w-2.5 mr-0.5" />
                {levelColors[creator.level].name}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-0.5">@{creator.username}</p>

          {shopSettings.show_subscriber_count && (
            <p className="text-xs text-muted-foreground mt-1">
              {subscriberCount.toLocaleString(locale)} {t('subscribers') || 'subscribers'}
            </p>
          )}

          {/* Bio */}
          {creator.bio && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
              {creator.bio}
            </p>
          )}

          {/* Social Icons - inline */}
          {shopSettings.show_social_links && hasSocial && (
            <div className="flex gap-2 mt-3">
              {creator.instagram && (
                <a
                  href={creator.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full flex items-center justify-center transition-opacity active:opacity-70"
                  style={{ backgroundColor: themeColor + '20' }}
                >
                  <Instagram className="h-4 w-4" style={{ color: themeColor }} />
                </a>
              )}
              {creator.youtube && (
                <a
                  href={creator.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full flex items-center justify-center transition-opacity active:opacity-70"
                  style={{ backgroundColor: themeColor + '20' }}
                >
                  <Youtube className="h-4 w-4" style={{ color: themeColor }} />
                </a>
              )}
              {creator.tiktok && (
                <a
                  href={creator.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full flex items-center justify-center transition-opacity active:opacity-70"
                  style={{ backgroundColor: themeColor + '20' }}
                >
                  <Music2 className="h-4 w-4" style={{ color: themeColor }} />
                </a>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 w-full max-w-xs">
            <Button
              className="flex-1 h-9 rounded-xl text-xs font-semibold text-white"
              style={{ backgroundColor: isSubscribed ? 'transparent' : themeColor, color: isSubscribed ? themeColor : 'white', border: isSubscribed ? `1px solid ${themeColor}` : 'none' }}
              onClick={handleSubscribe}
              disabled={isSubscribing}
            >
              {isSubscribing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isSubscribed ? (
                <><BellOff className="h-3.5 w-3.5 mr-1" />{t('unsubscribe') || 'Unsubscribe'}</>
              ) : (
                <><Bell className="h-3.5 w-3.5 mr-1" />{t('subscribe') || 'Subscribe'}</>
              )}
            </Button>
            {creator.communityEnabled && (
              <Button
                variant="outline"
                className="flex-1 h-9 rounded-xl text-xs font-semibold"
                asChild
              >
                <Link href={`/${locale}/@${creator.username}/community`}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  {t('community') || 'Community'}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-4">
        <Separator />
      </div>

      {/* Products Section */}
      <section className="px-4 pt-6 pb-8">
        <h2 className="text-base font-bold mb-4">
          {t('title')} ({products.length})
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t('noProducts') || 'No products yet. Check back soon!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <MobileProductCard
                key={product.id}
                product={product}
                locale={locale}
                currency={currency}
                themeColor={themeColor}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer - minimal mobile */}
      {shopSettings.show_footer && (
        <LegalFooter locale={locale} variant="full" />
      )}
      <footer className="border-t border-border/50 py-6 px-4" style={{ backgroundColor: '#1a1a2e' }}>
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground">
            Powered by <span className="font-medium" style={{ color: themeColor }}>CNEC Commerce</span>
          </p>
        </div>
      </footer>

      {/* Floating Cart Button - mobile only */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full h-12 rounded-2xl text-white text-sm font-semibold flex items-center justify-between px-5 shadow-lg active:scale-[0.98] transition-transform"
            style={{ backgroundColor: themeColor }}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t('cart')} ({cartCount})
            </span>
            <span className="font-bold">{formatCurrency(cartTotal, currency)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
