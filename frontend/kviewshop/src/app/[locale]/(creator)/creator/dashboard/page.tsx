'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  Store,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { toast } from 'sonner';

// Mock data - replace with real data from Supabase
const mockCreatorStats = {
  username: 'sakura_beauty',
  totalRevenue: 3250, // USD
  totalOrders: 48,
  pickedProducts: 15,
  pendingSettlement: 850, // USD
};

const mockRecentOrders = [
  { id: '1', orderNumber: 'KV-2026-001', product: 'Glow Serum', amount: 50, date: '2026-02-03', status: 'completed' },
  { id: '2', orderNumber: 'KV-2026-002', product: 'Hydra Cream', amount: 45, date: '2026-02-02', status: 'shipped' },
  { id: '3', orderNumber: 'KV-2026-003', product: 'Vitamin C Toner', amount: 38, date: '2026-02-01', status: 'paid' },
];

export default function CreatorDashboardPage() {
  const t = useTranslations('dashboard');
  const tCreator = useTranslations('creator');
  const tOrder = useTranslations('order');
  const params = useParams();
  const locale = params.locale as string;
  const [copied, setCopied] = useState(false);

  const shopUrl = `https://kviewshop.com/@${mockCreatorStats.username}`;

  const copyShopUrl = () => {
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    toast.success(tCreator('linkCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success border-success/30';
      case 'shipped':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'paid':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('welcome')}</h1>
        <p className="text-muted-foreground">{t('overview')}</p>
      </div>

      {/* Shop URL Banner */}
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
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="ml-2">{tCreator('copyLink')}</span>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/${locale}/@${mockCreatorStats.username}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span className="ml-2">{tCreator('shopPreview')}</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{tCreator('totalEarnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(mockCreatorStats.totalRevenue, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-success" />
              +18.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCreatorStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-success" />
              +5 this week
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{tCreator('pickedProducts')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCreatorStats.pickedProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In your shop
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{tCreator('pendingEarnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(mockCreatorStats.pendingSettlement, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for withdrawal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your shop</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
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
                Request Withdrawal
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recentOrders')}</CardTitle>
            <CardDescription>Your latest sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{order.product}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.orderNumber} • {order.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(order.amount, 'USD')}</p>
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                      {tOrder(order.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
