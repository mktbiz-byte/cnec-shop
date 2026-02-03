'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/i18n/config';

const mockOrders = [
  { id: '1', order_number: 'KV-20260203-0001', product: 'Glow Serum', customer: 'John Doe', commission: 12.5, status: 'completed', date: '2026-02-03' },
  { id: '2', order_number: 'KV-20260202-0002', product: 'Hydra Cream', customer: 'Jane Smith', commission: 11.25, status: 'shipped', date: '2026-02-02' },
  { id: '3', order_number: 'KV-20260201-0003', product: 'Vitamin C Toner', customer: 'Kim Lee', commission: 9.5, status: 'paid', date: '2026-02-01' },
];

export default function CreatorOrdersPage() {
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
        <h1 className="text-3xl font-headline font-bold">My Orders</h1>
        <p className="text-muted-foreground">Track orders from your shop</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>{mockOrders.length} orders total</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="font-bold text-success">{formatCurrency(order.commission, 'USD')}</TableCell>
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
