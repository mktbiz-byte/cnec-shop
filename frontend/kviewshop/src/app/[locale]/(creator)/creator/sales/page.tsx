'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Eye,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Wallet,
  Receipt,
} from 'lucide-react';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { formatCurrency } from '@/lib/i18n/config';
import type { Conversion, Product, OrderItem } from '@/types/database';

interface ConversionWithDetails extends Conversion {
  order_item?: OrderItem & { product?: Product };
}

export default function CreatorSalesPage() {
  const { creator, isLoading: authLoading } = useAuthStore();

  const [conversions, setConversions] = useState<ConversionWithDetails[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [pendingSettlement, setPendingSettlement] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !creator) {
      if (!authLoading) setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        const supabase = getClient();

        const [conversionsRes, visitsRes, settlementsRes, orderItemsRes, productsRes] =
          await Promise.all([
            supabase
              .from('conversions')
              .select('*')
              .eq('creator_id', creator!.id)
              .order('created_at', { ascending: false }),
            supabase
              .from('shop_visits')
              .select('id', { count: 'exact', head: true })
              .eq('creator_id', creator!.id),
            supabase
              .from('settlements')
              .select('net_amount')
              .eq('creator_id', creator!.id)
              .eq('status', 'PENDING'),
            supabase.from('order_items').select('*, product:products(*)'),
            supabase.from('products').select('id, name'),
          ]);

        if (cancelled) return;

        // Build order items map
        const orderItemMap: Record<string, OrderItem & { product?: Product }> = {};
        for (const item of orderItemsRes.data ?? []) {
          orderItemMap[item.id] = item;
        }

        const combined: ConversionWithDetails[] = (conversionsRes.data ?? []).map((c) => ({
          ...c,
          order_item: orderItemMap[c.order_item_id],
        }));

        setConversions(combined);
        setTotalVisits(visitsRes.count ?? 0);
        setPendingSettlement(
          (settlementsRes.data ?? []).reduce((sum, s) => sum + s.net_amount, 0)
        );
      } catch (error) {
        console.error('Failed to fetch sales data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [authLoading, creator]);

  // Computed stats
  const totalOrders = conversions.filter((c) => c.status === 'CONFIRMED').length;
  const totalRevenue = conversions
    .filter((c) => c.status === 'CONFIRMED')
    .reduce((sum, c) => sum + c.order_amount, 0);
  const totalCommission = conversions
    .filter((c) => c.status === 'CONFIRMED')
    .reduce((sum, c) => sum + c.commission_amount, 0);
  const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">판매 현황</h1>
        <p className="text-sm text-muted-foreground">내 샵의 판매와 수익을 확인하세요</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">방문수</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {totalVisits.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">판매건수</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {totalOrders.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">전환율</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {conversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">판매금액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-primary">
              {formatCurrency(totalRevenue, 'KRW')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">정산 예정 금액</CardTitle>
            <Wallet className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-warning">
              {formatCurrency(pendingSettlement, 'KRW')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">판매 상세</CardTitle>
        </CardHeader>
        <CardContent>
          {conversions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">판매 내역이 없습니다</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>결제일시</TableHead>
                  <TableHead>상품명</TableHead>
                  <TableHead className="text-right">판매금액</TableHead>
                  <TableHead>전환유형</TableHead>
                  <TableHead className="text-right">수수료율</TableHead>
                  <TableHead className="text-right">정산 예정</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversions.map((conversion) => (
                  <TableRow key={conversion.id}>
                    <TableCell className="text-sm">
                      {new Date(conversion.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm truncate">
                        {conversion.order_item?.product?.name ?? '-'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(conversion.order_amount, 'KRW')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          conversion.conversion_type === 'DIRECT'
                            ? 'text-blue-600 border-blue-500/30'
                            : 'text-purple-600 border-purple-500/30'
                        }
                      >
                        {conversion.conversion_type === 'DIRECT' ? '직접' : '간접'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {(conversion.commission_rate * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-primary">
                      {formatCurrency(conversion.commission_amount, 'KRW')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          conversion.status === 'CONFIRMED'
                            ? 'text-green-600 border-green-500/30'
                            : conversion.status === 'CANCELLED'
                            ? 'text-red-600 border-red-500/30'
                            : 'text-yellow-600 border-yellow-500/30'
                        }
                      >
                        {conversion.status === 'CONFIRMED'
                          ? '확정'
                          : conversion.status === 'CANCELLED'
                          ? '취소'
                          : '대기'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
