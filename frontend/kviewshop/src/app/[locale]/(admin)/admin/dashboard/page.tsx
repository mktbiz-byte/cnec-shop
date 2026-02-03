'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Users,
  DollarSign,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { getClient } from '@/lib/supabase/client';

export default function AdminDashboardPage() {
  const t = useTranslations('dashboard');
  const tAdmin = useTranslations('admin');
  const [stats, setStats] = useState({
    totalBrands: 0,
    totalCreators: 0,
    totalProducts: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = getClient();

        const [brandsRes, creatorsRes, productsRes, ordersRes] = await Promise.all([
          supabase.from('brands').select('id', { count: 'exact', head: true }),
          supabase.from('creators').select('id', { count: 'exact', head: true }),
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          totalBrands: brandsRes.count || 0,
          totalCreators: creatorsRes.count || 0,
          totalProducts: productsRes.count || 0,
          totalOrders: ordersRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{tAdmin('title')}</h1>
        <p className="text-muted-foreground">{t('overview')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{tAdmin('totalTransaction')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(0, 'KRW')}</div>
            <p className="text-xs text-muted-foreground mt-1">주문 데이터 없음</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">전체 주문</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('activeBrands')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBrands}</div>
            <p className="text-xs text-muted-foreground mt-1">등록된 브랜드</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('activeCreators')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreators}</div>
            <p className="text-xs text-muted-foreground mt-1">등록된 크리에이터</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      <Card>
        <CardHeader>
          <CardTitle>시작하기</CardTitle>
          <CardDescription>플랫폼을 시작하려면 아래 단계를 따르세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">1</div>
            <div>
              <p className="font-medium">브랜드 등록</p>
              <p className="text-sm text-muted-foreground">브랜드가 회원가입하여 상품을 등록합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">2</div>
            <div>
              <p className="font-medium">크리에이터 등록</p>
              <p className="text-sm text-muted-foreground">크리에이터가 회원가입하여 상품을 선택합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">3</div>
            <div>
              <p className="font-medium">고객 주문</p>
              <p className="text-sm text-muted-foreground">고객이 크리에이터 샵에서 상품을 구매합니다</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
