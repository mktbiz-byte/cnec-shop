'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export default function CreatorOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">My Orders</h1>
        <p className="text-muted-foreground">Track orders from your shop</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>0 orders total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground">Orders will appear here when customers purchase from your shop</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
