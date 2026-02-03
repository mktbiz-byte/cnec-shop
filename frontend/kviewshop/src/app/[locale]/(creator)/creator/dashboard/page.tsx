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
import { getClient } from '@/lib/supabase/client';

export default function CreatorDashboardPage() {
  const t = useTranslations('dashboard');
  const tCreator = useTranslations('creator');
  const params = useParams();
  const locale = params.locale as string;
  const [copied, setCopied] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreator() {
      const supabase = getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('creators')
          .select('username')
          .eq('user_id', user.id)
          .single();
        if (data) setUsername(data.username);
      }
      setLoading(false);
    }
    fetchCreator();
  }, []);

  const shopUrl = username ? `https://cnecshop.netlify.app/@${username}` : '';

  const copyShopUrl = () => {
    if (!shopUrl) return;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    toast.success(tCreator('linkCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('welcome')}</h1>
        <p className="text-muted-foreground">{t('overview')}</p>
      </div>

      {/* Shop URL Banner */}
      {username && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{tCreator('shopUrl')}</p>
                <p className="font-mono text-primary">{shopUrl}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyShopUrl}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2">{tCreator('copyLink')}</span>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`/${locale}/@${username}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <span className="ml-2">{tCreator('shopPreview')}</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{tCreator('totalEarnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(0, 'USD')}</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{tCreator('pickedProducts')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{tCreator('pendingEarnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(0, 'USD')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>샵 관리</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Button variant="outline" className="justify-start h-12" asChild>
            <Link href={`/${locale}/creator/products`}>
              <Package className="mr-3 h-5 w-5 text-primary" />
              {tCreator('pickProducts')}
            </Link>
          </Button>
          <Button variant="outline" className="justify-start h-12" asChild>
            <Link href={`/${locale}/creator/shop`}>
              <Store className="mr-3 h-5 w-5 text-primary" />
              {tCreator('customizeShop')}
            </Link>
          </Button>
          <Button variant="outline" className="justify-start h-12 btn-gold" asChild>
            <Link href={`/${locale}/creator/settlements`}>
              <DollarSign className="mr-3 h-5 w-5" />
              수익 보기
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
