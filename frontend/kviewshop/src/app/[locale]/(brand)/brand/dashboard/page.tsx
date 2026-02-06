'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { MOCRA_THRESHOLDS } from '@/types/database';
import { getClient } from '@/lib/supabase/client';

interface BrandStats {
  totalRevenue: number;
  totalOrders: number;
  productCount: number;
  activeCreators: number;
  usSalesYTD: number;
  jpSalesYTD: number;
  mocraStatus: 'green' | 'yellow' | 'red';
}

interface TopProduct {
  id: string;
  name: string;
  sold: number;
  revenue: number;
}

interface TopCreator {
  id: string;
  name: string;
  sold: number;
  revenue: number;
}

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

function getMoCRAStatus(usSales: number): 'green' | 'yellow' | 'red' {
  if (usSales >= MOCRA_THRESHOLDS.CRITICAL) return 'red';
  if (usSales >= MOCRA_THRESHOLDS.WARNING) return 'yellow';
  return 'green';
}

export default function BrandDashboardPage() {
  const t = useTranslations('dashboard');
  const tMocra = useTranslations('mocra');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BrandStats>({
    totalRevenue: 0,
    totalOrders: 0,
    productCount: 0,
    activeCreators: 0,
    usSalesYTD: 0,
    jpSalesYTD: 0,
    mocraStatus: 'green',
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const supabase = getClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // Get brand info
        const { data: brand } = await supabase
          .from('brands')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!brand) {
          setLoading(false);
          return;
        }

        const brandId = brand.id;

        // Fetch all data in parallel
        const [productsRes, ordersRes, creatorsRes] = await Promise.all([
          supabase.from('products').select('id, name, is_active').eq('brand_id', brandId),
          supabase.from('orders').select('id, total_amount, currency, country, created_at, items').eq('brand_id', brandId),
          supabase.from('creators').select('id, display_name, username, picked_products').not('picked_products', 'is', null),
        ]);

        const products = productsRes.data || [];
        const orders = ordersRes.data || [];

        // Calculate stats from real data
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const totalOrders = orders.length;
        const productCount = products.filter(p => p.is_active).length;

        // Count creators that have picked this brand's products
        const productIds = products.map(p => p.id);
        const allCreators = creatorsRes.data || [];
        const activeCreators = allCreators.filter(c => {
          try {
            const picked = c.picked_products || [];
            return picked.some((pid: string) => productIds.includes(pid));
          } catch {
            return false;
          }
        });

        // Calculate US and JP sales YTD
        const currentYear = new Date().getFullYear();
        const ytdOrders = orders.filter(o => new Date(o.created_at).getFullYear() === currentYear);
        const usSalesYTD = ytdOrders
          .filter(o => o.country === 'US')
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const jpSalesYTD = ytdOrders
          .filter(o => o.country === 'JP')
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        const mocraStatus = getMoCRAStatus(usSalesYTD);

        setStats({
          totalRevenue,
          totalOrders,
          productCount,
          activeCreators: activeCreators.length,
          usSalesYTD,
          jpSalesYTD,
          mocraStatus,
        });

        // Calculate top products by revenue from order items
        const productRevenue: Record<string, { name: string; sold: number; revenue: number }> = {};
        for (const order of orders) {
          const items = order.items || [];
          for (const item of items) {
            if (!productRevenue[item.product_id]) {
              const prod = products.find(p => p.id === item.product_id);
              productRevenue[item.product_id] = {
                name: prod?.name || item.product_name || 'Unknown',
                sold: 0,
                revenue: 0,
              };
            }
            productRevenue[item.product_id].sold += item.quantity || 1;
            productRevenue[item.product_id].revenue += item.total || item.price || 0;
          }
        }
        const sortedProducts = Object.entries(productRevenue)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3);
        setTopProducts(sortedProducts);

        // Calculate top creators by revenue
        const creatorRevenue: Record<string, { name: string; sold: number; revenue: number }> = {};
        for (const order of orders) {
          const cid = (order as Record<string, unknown>).creator_id as string | undefined;
          if (!cid) continue;
          if (!creatorRevenue[cid]) {
            const creator = allCreators.find(c => c.id === cid);
            creatorRevenue[cid] = {
              name: creator ? `@${creator.username || creator.display_name}` : 'Unknown',
              sold: 0,
              revenue: 0,
            };
          }
          creatorRevenue[cid].sold += 1;
          creatorRevenue[cid].revenue += (order.total_amount || 0);
        }
        const sortedCreators = Object.entries(creatorRevenue)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3);
        setTopCreators(sortedCreators);

      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const mocraProgress = stats.usSalesYTD > 0
    ? (stats.usSalesYTD / MOCRA_THRESHOLDS.CRITICAL) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('welcome')}</h1>
        <p className="text-muted-foreground">{t('overview')}</p>
      </div>

      {/* MoCRA Alert Banner */}
      {stats.mocraStatus !== 'green' && (
        <Card className={`border ${getMoCRAStatusColor(stats.mocraStatus)}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-lg">{tMocra('title')}</CardTitle>
              <Badge className={getMoCRAStatusColor(stats.mocraStatus)}>
                {tMocra(stats.mocraStatus)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{tMocra('usSalesYTD')}</span>
                <span className="font-bold">
                  {formatCurrency(stats.usSalesYTD, 'USD')}
                </span>
              </div>
              <Progress value={mocraProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {tMocra(`${stats.mocraStatus}Desc`)}
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
              {formatCurrency(stats.totalRevenue, 'USD')}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('activeProducts')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productCount}</div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('activeCreators')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCreators}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Creators */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('topProducts')}</CardTitle>
            <CardDescription>{t('topProductsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t('noData')}</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
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
                          {product.sold} {t('sold')}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold">
                      {formatCurrency(product.revenue, 'USD')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('topCreators')}</CardTitle>
            <CardDescription>{t('topCreatorsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {topCreators.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t('noData')}</p>
            ) : (
              <div className="space-y-4">
                {topCreators.map((creator, index) => (
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
                          {creator.sold} {t('itemsSold')}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold">
                      {formatCurrency(creator.revenue, 'USD')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Country */}
      {(stats.usSalesYTD > 0 || stats.jpSalesYTD > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('salesByCountry')}</CardTitle>
            <CardDescription>{t('salesByCountryDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {stats.jpSalesYTD > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">JP</span>
                    <span className="font-medium">{t('japan')}</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.jpSalesYTD, 'JPY')}
                  </p>
                </div>
              )}
              {stats.usSalesYTD > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">US</span>
                    <span className="font-medium">{t('usa')}</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.usSalesYTD, 'USD')}
                  </p>
                  <Progress value={mocraProgress} className="h-2" />
                  {stats.mocraStatus !== 'green' && (
                    <p className="text-xs text-warning">
                      {tMocra(`${stats.mocraStatus}Desc`)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
