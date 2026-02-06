'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { getClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Gift,
  TrendingUp,
  TrendingDown,
  Star,
  ShoppingBag,
  Users,
  Calendar,
  Loader2,
} from 'lucide-react';

interface PointsHistoryItem {
  id: string;
  amount: number;
  balance_after: number;
  type: string;
  description: string;
  created_at: string;
}

export default function BuyerPointsPage() {
  const { buyer } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<PointsHistoryItem[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!buyer) return;

      try {
        const supabase = getClient();
        const { data } = await supabase
          .from('points_history')
          .select('*')
          .eq('buyer_id', buyer.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (data) {
          setHistory(data);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [buyer]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review_text':
      case 'review_instagram':
        return <Star className="h-4 w-4" />;
      case 'purchase':
        return <ShoppingBag className="h-4 w-4" />;
      case 'referral':
        return <Users className="h-4 w-4" />;
      case 'use_order':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'review_text':
        return 'Text Review';
      case 'review_instagram':
        return 'Instagram Review';
      case 'purchase':
        return 'Purchase Bonus';
      case 'referral':
        return 'Referral Bonus';
      case 'event':
        return 'Event Bonus';
      case 'use_order':
        return 'Used for Order';
      case 'expiry':
        return 'Points Expired';
      case 'admin_adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <Gift className="h-8 w-8 text-primary" />
          My Points
        </h1>
        <p className="text-muted-foreground mt-1">
          Earn and spend reward points
        </p>
      </div>

      {/* Points Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-4xl font-bold text-primary mt-1">
                {buyer?.points_balance?.toLocaleString() || 0}
                <span className="text-lg ml-1">P</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold">
                  {buyer?.total_points_earned?.toLocaleString() || 0} P
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingDown className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Used</p>
                <p className="text-2xl font-bold">
                  {buyer?.total_points_used?.toLocaleString() || 0} P
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How to Earn */}
      <Card>
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Write Reviews</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Text review: <strong>500P</strong><br />
                With Instagram: <strong>1,000P</strong>
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Refer Friends</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Each friend signup: <strong>1,000P</strong>
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <span className="font-medium">Special Events</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Participate in promotions for bonus points
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
          <CardDescription>Your recent point transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No point transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      item.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{getTypeLabel(item.type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                        {item.description && ` • ${item.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      item.amount > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}P
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance: {item.balance_after.toLocaleString()}P
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
