'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  DollarSign,
  ShoppingCart,
  Copy,
  Check,
  ExternalLink,
  Store,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth';

export default function CreatorDashboardPage() {
  const t = useTranslations('dashboard');
  const tCreator = useTranslations('creator');
  const params = useParams();
  const locale = params.locale as string;
  const [copied, setCopied] = useState(false);

  // Read auth state from zustand store (populated by Header's useUser hook)
  const { creator, isLoading: loading } = useAuthStore();
  const username = creator?.username || '';

  const shopUrl = username ? `https://cnecshop.netlify.app/@${username}` : '';

  const copyShopUrl = () => {
    if (!shopUrl) return;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    toast.success(tCreator('linkCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">{t('welcome')}</h1>
        <p className="text-sm text-muted-foreground">{t('overview')}</p>
      </div>

      {/* Shop URL Banner */}
      {username && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Store className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">{tCreator('shopUrl')}</p>
                  <p className="font-mono text-xs sm:text-sm text-primary truncate">{shopUrl}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={copyShopUrl} className="flex-1 sm:flex-none text-xs">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-1">{tCreator('copyLink')}</span>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none text-xs">
                  <a href={`/${locale}/@${username}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">{tCreator('shopPreview')}</span>
                    <span className="ml-1 sm:hidden">Live</span>
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{tCreator('totalEarnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-primary">{formatCurrency(0, 'USD')}</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{tCreator('pickedProducts')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{tCreator('pendingEarnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-warning">{formatCurrency(0, 'USD')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{t('overview')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Button variant="outline" className="justify-start h-12 text-sm" asChild>
            <Link href={`/${locale}/creator/products`}>
              <Package className="mr-3 h-5 w-5 text-primary" />
              {tCreator('pickProducts')}
            </Link>
          </Button>
          <Button variant="outline" className="justify-start h-12 text-sm" asChild>
            <Link href={`/${locale}/creator/shop`}>
              <Store className="mr-3 h-5 w-5 text-primary" />
              {tCreator('customizeShop')}
            </Link>
          </Button>
          <Button variant="outline" className="justify-start h-12 text-sm btn-gold" asChild>
            <Link href={`/${locale}/creator/settlements`}>
              <DollarSign className="mr-3 h-5 w-5" />
              {tCreator('earnings')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
