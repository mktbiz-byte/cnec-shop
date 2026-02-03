'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';

// Mock data - replace with real data from Supabase
const mockStats = {
  totalRevenue: 125000000, // KRW
  totalOrders: 1250,
  activeBrands: 15,
  activeCreators: 48,
  usRevenue: 45000, // USD
  jpRevenue: 8500000, // JPY
  pendingApprovals: 3,
  mocraCriticalBrands: 1,
};

const mockRecentBrands = [
  { id: '1', name: 'Beauty Lab Korea', status: 'pending', date: '2026-02-01' },
  { id: '2', name: 'Glow Essence', status: 'pending', date: '2026-02-02' },
  { id: '3', name: 'K-Skin Pro', status: 'pending', date: '2026-02-03' },
];

export default function AdminDashboardPage() {
  const t = useTranslations('dashboard');
  const tAdmin = useTranslations('admin');

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
            <div className="text-2xl font-bold">
              {formatCurrency(mockStats.totalRevenue, 'KRW')}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-success" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-success" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('activeBrands')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeBrands}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockStats.pendingApprovals} pending approvals
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('activeCreators')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeCreators}</div>
            <p className="text-xs text-muted-foreground mt-1">
              32 JP, 16 US
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Country */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('salesByCountry')}</CardTitle>
            <CardDescription>Revenue breakdown by target market</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇯🇵</span>
                <span className="font-medium">{t('japan')}</span>
              </div>
              <span className="font-bold">{formatCurrency(mockStats.jpRevenue, 'JPY')}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-[65%] bg-primary rounded-full" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇺🇸</span>
                <span className="font-medium">{t('usa')}</span>
              </div>
              <span className="font-bold">{formatCurrency(mockStats.usRevenue, 'USD')}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-[35%] bg-secondary rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>{tAdmin('pendingApprovals')}</CardTitle>
            <CardDescription>Brand applications awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{brand.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Applied: {brand.date}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MoCRA Alerts */}
      {mockStats.mocraCriticalBrands > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">MoCRA Alert</CardTitle>
            </div>
            <CardDescription>
              {mockStats.mocraCriticalBrands} brand(s) have exceeded the $1,000,000 US sales threshold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              These brands need to register with FDA under MoCRA regulations.
              Please contact them immediately to ensure compliance.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
