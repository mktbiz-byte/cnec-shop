'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export default function CreatorOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">내 주문</h1>
        <p className="text-muted-foreground">내 샵의 주문을 추적합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>주문 내역</CardTitle>
          <CardDescription>총 0건의 주문</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">주문이 없습니다</p>
            <p className="text-sm text-muted-foreground">고객이 구매하면 여기에 표시됩니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
