'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export default function CreatorOrdersPage() {
  const t = useTranslations('order');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">{t('orderSummary')}</h1>
        <p className="text-sm text-muted-foreground">{t('noOrders')}</p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{t('orderSummary')}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t('noOrders')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="text-center py-8 sm:py-12">
            <ShoppingCart className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground text-sm sm:text-base">{t('noOrders')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
