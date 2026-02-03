'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { toast } from 'sonner';

const mockSettlements: {
  id: string;
  user_name: string;
  user_type: string;
  period: string;
  amount: number;
  currency: 'USD' | 'JPY' | 'KRW';
  status: string;
  created_at: string;
  paid_at?: string;
}[] = [
  {
    id: '1',
    user_name: 'Sakura Beauty',
    user_type: 'creator',
    period: '2026-01',
    amount: 850,
    currency: 'USD',
    status: 'pending',
    created_at: '2026-02-01',
  },
  {
    id: '2',
    user_name: 'Beauty Lab Korea',
    user_type: 'brand',
    period: '2026-01',
    amount: 4250,
    currency: 'USD',
    status: 'pending',
    created_at: '2026-02-01',
  },
  {
    id: '3',
    user_name: 'Glow With Me',
    user_type: 'creator',
    period: '2026-01',
    amount: 1200,
    currency: 'USD',
    status: 'completed',
    paid_at: '2026-02-03',
    created_at: '2026-02-01',
  },
];

const stats = {
  totalPending: 5100,
  totalPaid: 12500,
  pendingCount: 8,
  paidCount: 24,
};

export default function AdminSettlementsPage() {
  const t = useTranslations('admin');
  const [settlements, setSettlements] = useState(mockSettlements);

  const handleProcess = (id: string) => {
    setSettlements(prev =>
      prev.map(s => s.id === id ? { ...s, status: 'completed', paid_at: new Date().toISOString().split('T')[0] } : s)
    );
    toast.success('Settlement processed successfully');
  };

  const pendingSettlements = settlements.filter(s => s.status === 'pending');
  const completedSettlements = settlements.filter(s => s.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('settlementManagement')}</h1>
        <p className="text-muted-foreground">{t('settlementManagementDesc')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(stats.totalPending, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">{stats.pendingCount} settlements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats.totalPaid, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">{stats.paidCount} settlements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Creator Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(8500, 'USD')}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Brand Payouts</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(9100, 'USD')}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Settlements</CardTitle>
          <CardDescription>Manage creator and brand payouts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingSettlements.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedSettlements.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSettlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell className="font-medium">{settlement.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{settlement.user_type}</Badge>
                      </TableCell>
                      <TableCell>{settlement.period}</TableCell>
                      <TableCell className="font-bold text-primary">
                        {formatCurrency(settlement.amount, settlement.currency)}
                      </TableCell>
                      <TableCell>{settlement.created_at}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleProcess(settlement.id)}>
                          Process Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid On</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedSettlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell className="font-medium">{settlement.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{settlement.user_type}</Badge>
                      </TableCell>
                      <TableCell>{settlement.period}</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(settlement.amount, settlement.currency)}
                      </TableCell>
                      <TableCell>{settlement.paid_at}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-success">
                          Completed
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
