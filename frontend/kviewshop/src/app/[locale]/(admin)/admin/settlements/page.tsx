'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Clock, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { getClient } from '@/lib/supabase/client';

export default function AdminSettlementsPage() {
  const t = useTranslations('admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('settlementManagement')}</h1>
        <p className="text-muted-foreground">{t('settlementManagementDesc')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">정산 대기 금액</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(0, 'USD')}</div>
            <p className="text-xs text-muted-foreground">0건 대기중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">이번 달 지급액</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(0, 'USD')}</div>
            <p className="text-xs text-muted-foreground">0건 완료</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체 지급액</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(0, 'USD')}</div>
            <p className="text-xs text-muted-foreground">누적 금액</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>정산 내역</CardTitle>
          <CardDescription>크리에이터 및 브랜드 정산을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">대기중 (0)</TabsTrigger>
              <TabsTrigger value="completed">완료 (0)</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">대기중인 정산이 없습니다</p>
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">완료된 정산이 없습니다</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
