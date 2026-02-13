'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/lib/store/auth';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Minus,
  Plus,
  Truck,
  RotateCcw,
} from 'lucide-react';
import type {
  Product,
  CampaignProduct,
  Creator,
  Campaign,
} from '@/types/database';

// =============================================
// Props
// =============================================

interface ProductDetailPageProps {
  product: Product;
  campaignProduct: CampaignProduct | null;
  creator: Creator;
  locale: string;
  username: string;
}

// =============================================
// Helpers
// =============================================

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateDiscountPercent(original: number, sale: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

// =============================================
// Main Component
// =============================================

export function ProductDetailPage({
  product,
  campaignProduct,
  creator,
  locale,
  username,
}: ProductDetailPageProps) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const campaign = campaignProduct?.campaign as Campaign | undefined;
  const isGonggu = !!campaignProduct && campaign?.type === 'GONGGU';
  const effectivePrice = campaignProduct?.campaign_price ?? product.sale_price;
  const discountPercent = calculateDiscountPercent(product.original_price, effectivePrice);
  const brandName = product.brand?.brand_name || '';
  const images = product.images && product.images.length > 0 ? product.images : [];

  // Countdown timer for gonggu
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!isGonggu || !campaign?.end_at) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(campaign.end_at!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setCountdown('마감되었습니다');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setCountdown(
        `${days > 0 ? `${days}일 ` : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isGonggu, campaign?.end_at]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleBuy = () => {
    addItem({
      productId: product.id,
      campaignId: campaignProduct?.campaign_id,
      quantity,
      creatorId: creator.id,
      unitPrice: effectivePrice,
    });
    router.push(`/${locale}/${username}/checkout`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto flex items-center h-12 px-4">
          <Link
            href={`/${locale}/${username}`}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">돌아가기</span>
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Image Slider */}
        {images.length > 0 && (
          <div className="relative bg-secondary">
            <div className="aspect-square relative overflow-hidden">
              <img
                src={images[currentImageIndex]}
                alt={`${product.name} - ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/70 flex items-center justify-center hover:bg-background/90 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/70 flex items-center justify-center hover:bg-background/90 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentImageIndex
                          ? 'bg-foreground'
                          : 'bg-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Info */}
        <div className="px-4 pt-4 pb-3">
          {/* Gonggu Countdown Banner */}
          {isGonggu && countdown && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm font-medium text-accent">
                🔥 공구 마감까지: {countdown}
              </p>
            </div>
          )}

          {/* Brand */}
          {brandName && (
            <p className="text-sm text-muted-foreground mb-1">{brandName}</p>
          )}

          {/* Product Name */}
          <h1 className="text-lg font-bold text-foreground leading-snug">
            {product.name}
          </h1>

          {/* Volume */}
          {product.volume && (
            <p className="text-sm text-muted-foreground mt-1">{product.volume}</p>
          )}

          {/* Price Section */}
          <div className="mt-3 flex items-baseline gap-2">
            {discountPercent > 0 && (
              <span className="text-xl font-bold text-accent">
                {discountPercent}%
              </span>
            )}
            <span className="text-xl font-bold text-foreground">
              {formatKRW(effectivePrice)}
            </span>
          </div>
          {discountPercent > 0 && (
            <p className="text-sm text-muted-foreground line-through mt-0.5">
              {formatKRW(product.original_price)}
            </p>
          )}

          {/* Campaign Badge */}
          {isGonggu && (
            <div className="mt-2">
              <Badge className="bg-accent text-accent-foreground text-xs">
                🔥 공구 특가
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* Quantity Selector */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">수량</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium text-foreground">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                disabled={quantity >= product.stock}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">총 상품금액</span>
            <span className="text-lg font-bold text-primary">
              {formatKRW(effectivePrice * quantity)}
            </span>
          </div>
        </div>

        {/* Buy Button */}
        <div className="px-4 pb-4">
          <Button
            onClick={handleBuy}
            className="w-full h-12 text-base font-semibold btn-gold rounded-xl"
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? '품절' : '구매하기'}
          </Button>
        </div>

        <Separator />

        {/* Product Description */}
        {product.description && (
          <div className="px-4 py-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              상품 상세
            </h2>
            <div
              className="text-sm text-muted-foreground leading-relaxed prose prose-sm prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        <Separator />

        {/* Shipping Info Accordion */}
        <div className="border-b border-border">
          <button
            onClick={() => setShippingOpen(!shippingOpen)}
            className="w-full px-4 py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">배송 안내</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                shippingOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {shippingOpen && (
            <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
              {(product as any).shipping_info ? (
                <p>{(product as any).shipping_info}</p>
              ) : (
                <>
                  <p>- 배송비: {(product as any).shipping_fee_type === 'FREE' ? '무료배송' : (product as any).shipping_fee_type === 'CONDITIONAL_FREE' ? `${formatKRW((product as any).free_shipping_threshold || 50000)} 이상 무료배송 (기본 ${formatKRW((product as any).shipping_fee || 3000)})` : `${formatKRW((product as any).shipping_fee || 3000)}`}</p>
                  <p>- 배송기간: 결제 후 2~5일 이내 배송</p>
                  <p>- 공구 상품의 경우 캠페인 종료 후 일괄 배송될 수 있습니다.</p>
                  <p>- 제주/도서산간 지역은 추가 배송비가 발생할 수 있습니다.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Return/Exchange Info Accordion */}
        <div className="border-b border-border">
          <button
            onClick={() => setReturnOpen(!returnOpen)}
            className="w-full px-4 py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">교환/환불 안내</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                returnOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {returnOpen && (
            <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
              {(product as any).return_policy ? (
                <p>{(product as any).return_policy}</p>
              ) : (
                <>
                  <p>- 상품 수령 후 7일 이내 교환/환불 가능</p>
                  <p>- 고객 변심에 의한 반품 시 왕복 배송비 부담</p>
                  <p>- 상품 하자 시 배송비 포함 100% 환불</p>
                  <p>- 사용 또는 개봉한 상품은 교환/환불이 불가합니다.</p>
                  <p>- 공구 특가 상품은 교환/환불 정책이 다를 수 있습니다.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom Spacing */}
        <div className="h-6" />
      </div>
    </div>
  );
}
