'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Clock, CheckCircle, Wallet, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';

export default function CreatorSettlementsPage() {
  const t = useTranslations('settlement');
  const tCreator = useTranslations('creator');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('withdrawalHistory')}</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('requestWithdrawal')}</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-primary">{formatCurrency(0, 'USD')}</div>
            <Button className="w-full mt-3 btn-gold text-xs sm:text-sm" size="sm" disabled>
              {t('requestWithdrawal')}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('period')}</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(0, 'USD')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{tCreator('totalEarnings')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(0, 'USD')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('pending')}</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-warning">{formatCurrency(0, 'USD')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{t('withdrawalHistory')}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t('title')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="text-center py-8 sm:py-12">
            <Receipt className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground text-sm sm:text-base">{t('pending')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
