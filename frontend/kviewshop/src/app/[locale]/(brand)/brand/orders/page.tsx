'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';

const mockOrders = [
  { id: '1', order_number: 'KV-20260203-0001', creator: 'sakura_beauty', customer: 'John Doe', country: 'US', total: 150, status: 'completed', date: '2026-02-03' },
  { id: '2', order_number: 'KV-20260202-0002', creator: 'glow_with_me', customer: 'Jane Smith', country: 'JP', total: 85, status: 'shipped', date: '2026-02-02' },
  { id: '3', order_number: 'KV-20260201-0003', creator: 'sakura_beauty', customer: 'Kim Lee', country: 'JP', total: 220, status: 'paid', date: '2026-02-01' },
];

export default function BrandOrdersPage() {
  const [search, setSearch] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/20 text-success';
      case 'shipped': return 'bg-primary/20 text-primary';
      case 'paid': return 'bg-warning/20 text-warning';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage your product orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>{mockOrders.length} orders total</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">{order.order_number}</TableCell>
                  <TableCell>@{order.creator}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell><Badge variant="outline">{order.country}</Badge></TableCell>
                  <TableCell className="font-bold">{formatCurrency(order.total, 'USD')}</TableCell>
                  <TableCell><Badge className={getStatusColor(order.status)}>{order.status}</Badge></TableCell>
                  <TableCell>{order.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
