'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { MOCRA_THRESHOLDS } from '@/types/database';

// Mock data
const mockMoCRAData: {
  status: 'green' | 'yellow' | 'red';
  usSalesYTD: number;
  lastUpdated: string;
  monthlyBreakdown: { month: string; sales: number }[];
  projectedYearEnd: number;
} = {
  status: 'yellow',
  usSalesYTD: 850000,
  lastUpdated: '2026-02-03T10:30:00Z',
  monthlyBreakdown: [
    { month: 'Jan', sales: 120000 },
    { month: 'Feb', sales: 145000 },
    { month: 'Mar', sales: 98000 },
    { month: 'Apr', sales: 112000 },
    { month: 'May', sales: 135000 },
    { month: 'Jun', sales: 110000 },
    { month: 'Jul', sales: 130000 },
  ],
  projectedYearEnd: 1200000,
};

function getStatusConfig(status: 'green' | 'yellow' | 'red') {
  switch (status) {
    case 'green':
      return {
        icon: CheckCircle,
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/30',
        label: 'Safe',
      };
    case 'yellow':
      return {
        icon: AlertTriangle,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/30',
        label: 'Warning',
      };
    case 'red':
      return {
        icon: XCircle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/30',
        label: 'Critical',
      };
  }
}

export default function MoCRAPage() {
  const t = useTranslations('mocra');

  const statusConfig = getStatusConfig(mockMoCRAData.status);
  const StatusIcon = statusConfig.icon;
  const progressPercent = (mockMoCRAData.usSalesYTD / MOCRA_THRESHOLDS.CRITICAL) * 100;
  const warningPercent = (MOCRA_THRESHOLDS.WARNING / MOCRA_THRESHOLDS.CRITICAL) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Status Banner */}
      <Card className={`border-2 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${statusConfig.bgColor}`}>
                <StatusIcon className={`h-8 w-8 ${statusConfig.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('currentStatus')}</p>
                <h2 className={`text-3xl font-bold ${statusConfig.color}`}>
                  {t(mockMoCRAData.status)}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(`${mockMoCRAData.status}Desc`)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('usSalesYTD')}</p>
              <p className="text-4xl font-bold">
                {formatCurrency(mockMoCRAData.usSalesYTD, 'USD')}
              </p>
              <p className="text-xs text-muted-foreground flex items-center justify-end mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                Last updated: {new Date(mockMoCRAData.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Progress to Threshold</CardTitle>
          <CardDescription>
            Monitor your US cosmetic sales against MoCRA thresholds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Progress value={progressPercent} className="h-4" />
            {/* Warning threshold marker */}
            <div
              className="absolute top-0 h-4 w-0.5 bg-warning"
              style={{ left: `${warningPercent}%` }}
            />
            {/* Labels */}
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>$0</span>
              <span className="text-warning">
                $800,000 (Warning)
              </span>
              <span className="text-destructive">
                $1,000,000 (FDA Required)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center p-4 rounded-lg bg-success/10 border border-success/30">
              <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-success">{t('green')}</p>
              <p className="text-xs text-muted-foreground mt-1">$0 - $799,999</p>
              <p className="text-xs text-muted-foreground">No action required</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/30">
              <AlertTriangle className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-sm font-medium text-warning">{t('yellow')}</p>
              <p className="text-xs text-muted-foreground mt-1">$800,000 - $999,999</p>
              <p className="text-xs text-muted-foreground">Prepare for registration</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-sm font-medium text-destructive">{t('red')}</p>
              <p className="text-xs text-muted-foreground mt-1">$1,000,000+</p>
              <p className="text-xs text-muted-foreground">FDA registration required</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Sales Breakdown</CardTitle>
          <CardDescription>US cosmetic sales by month (2026)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockMoCRAData.monthlyBreakdown.map((month) => (
              <div key={month.month} className="flex items-center gap-4">
                <span className="w-12 text-sm font-medium">{month.month}</span>
                <div className="flex-1">
                  <Progress
                    value={(month.sales / 200000) * 100}
                    className="h-2"
                  />
                </div>
                <span className="w-24 text-sm text-right">
                  {formatCurrency(month.sales, 'USD')}
                </span>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-warning" />
              <span className="font-medium">Projected Year-End</span>
            </div>
            <span className="text-lg font-bold text-warning">
              {formatCurrency(mockMoCRAData.projectedYearEnd, 'USD')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Action Required */}
      {mockMoCRAData.status !== 'green' && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your US cosmetic sales are approaching or have exceeded the MoCRA small business exemption threshold.
              You may need to register with the FDA to continue selling cosmetics in the United States.
            </p>
            <div className="space-y-2">
              <h4 className="font-medium">Next Steps:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Review your product labeling for FDA compliance</li>
                <li>Prepare facility registration documentation</li>
                <li>Consider consulting with a regulatory specialist</li>
                <li>Begin the FDA Cosmetic Product Listing process</li>
              </ul>
            </div>
            <Button className="btn-gold" asChild>
              <a
                href="https://www.fda.gov/cosmetics/cosmetic-products-facility-registration"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('learnMore')}
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
