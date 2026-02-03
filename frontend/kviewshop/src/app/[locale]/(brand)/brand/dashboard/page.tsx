'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { MOCRA_THRESHOLDS } from '@/types/database';

// Mock data - replace with real data from Supabase
const mockBrandStats: {
  totalRevenue: number;
  totalOrders: number;
  productCount: number;
  activeCreators: number;
  usSalesYTD: number;
  jpSalesYTD: number;
  mocraStatus: 'green' | 'yellow' | 'red';
} = {
  totalRevenue: 45000, // USD
  totalOrders: 320,
  productCount: 25,
  activeCreators: 12,
  usSalesYTD: 750000, // USD
  jpSalesYTD: 5500000, // JPY
  mocraStatus: 'yellow',
};

const mockTopProducts = [
  { id: '1', name: 'Glow Serum', sold: 150, revenue: 7500 },
  { id: '2', name: 'Hydra Cream', sold: 120, revenue: 6000 },
  { id: '3', name: 'Vitamin C Toner', sold: 95, revenue: 4750 },
];

const mockTopCreators = [
  { id: '1', name: '@sakura_beauty', sold: 85, revenue: 4250 },
  { id: '2', name: '@mika_skin', sold: 72, revenue: 3600 },
  { id: '3', name: '@beauty_jin', sold: 58, revenue: 2900 },
];

function getMoCRAStatusColor(status: 'green' | 'yellow' | 'red') {
  switch (status) {
    case 'green':
      return 'mocra-green';
    case 'yellow':
      return 'mocra-yellow';
    case 'red':
      return 'mocra-red';
  }
}

export default function BrandDashboardPage() {
  const t = useTranslations('dashboard');
  const tMocra = useTranslations('mocra');

  const mocraProgress = (mockBrandStats.usSalesYTD / MOCRA_THRESHOLDS.CRITICAL) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('welcome')}</h1>
        <p className="text-muted-foreground">{t('overview')}</p>
      </div>

      {/* MoCRA Alert Banner */}
      {mockBrandStats.mocraStatus !== 'green' && (
        <Card className={`border ${getMoCRAStatusColor(mockBrandStats.mocraStatus)}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-lg">{tMocra('title')}</CardTitle>
              <Badge className={getMoCRAStatusColor(mockBrandStats.mocraStatus)}>
                {tMocra(mockBrandStats.mocraStatus)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{tMocra('usSalesYTD')}</span>
                <span className="font-bold">
                  {formatCurrency(mockBrandStats.usSalesYTD, 'USD')}
                </span>
              </div>
              <Progress value={mocraProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {tMocra(`${mockBrandStats.mocraStatus}Desc`)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockBrandStats.totalRevenue, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-success" />
              +15.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockBrandStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-success" />
              +22 this week
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('activeProducts')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockBrandStats.productCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              3 low stock alerts
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('activeCreators')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockBrandStats.activeCreators}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Selling your products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Creators */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('topProducts')}</CardTitle>
            <CardDescription>Best performing products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTopProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sold} sold
                      </p>
                    </div>
                  </div>
                  <span className="font-bold">
                    {formatCurrency(product.revenue, 'USD')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('topCreators')}</CardTitle>
            <CardDescription>Best performing creators this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTopCreators.map((creator, index) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{creator.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {creator.sold} items sold
                      </p>
                    </div>
                  </div>
                  <span className="font-bold">
                    {formatCurrency(creator.revenue, 'USD')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Country */}
      <Card>
        <CardHeader>
          <CardTitle>{t('salesByCountry')}</CardTitle>
          <CardDescription>Year-to-date revenue by market</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇯🇵</span>
                <span className="font-medium">{t('japan')}</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(mockBrandStats.jpSalesYTD, 'JPY')}
              </p>
              <Progress value={65} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇺🇸</span>
                <span className="font-medium">{t('usa')}</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(mockBrandStats.usSalesYTD, 'USD')}
              </p>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-warning">
                {mockBrandStats.mocraStatus === 'yellow' && '⚠️ Approaching MoCRA threshold'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
