'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  Loader2,
  Search,
  Package,
  User,
  ChevronDown,
  ChevronUp,
  Truck,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { getClient } from '@/lib/supabase/client';
import type { OrderStatus } from '@/types/database';

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  creator_revenue: number;
  platform_revenue: number;
  brand_revenue: number;
  currency: string;
  country: string;
  status: OrderStatus;
  tracking_number?: string;
  created_at: string;
  creator?: { id: string; username: string; display_name?: string };
  items?: { product_id: string; quantity: number; unit_price: number; product?: { name_en: string; name_ko: string; images: string[] } }[];
}

function getStatusColor(status: OrderStatus) {
  switch (status) {
    case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'paid': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'shipped': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'cancelled': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    case 'refunded': return 'bg-red-500/10 text-red-600 border-red-500/20';
  }
}

export default function BrandOrdersPage() {
  const t = useTranslations('order');
  const tDash = useTranslations('dashboard');

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const supabase = getClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setLoading(false); return; }

        const { data: brand } = await supabase
          .from('brands')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!brand) { setLoading(false); return; }

        const { data } = await supabase
          .from('orders')
          .select(`
            *,
            creator:creators(id, username, display_name),
            items:order_items(
              product_id,
              quantity,
              unit_price,
              product:products(name_en, name_ko, images)
            )
          `)
          .eq('brand_id', brand.id)
          .order('created_at', { ascending: false });

        setOrders((data as unknown as OrderData[]) || []);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(orderId);
    try {
      const supabase = getClient();
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'shipped') updateData.shipped_at = new Date().toISOString();
      if (newStatus === 'completed') updateData.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (!error) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (error) {
      console.error('Status update failed:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleUpdateTracking = async (orderId: string, trackingNumber: string) => {
    const supabase = getClient();
    await supabase
      .from('orders')
      .update({ tracking_number: trackingNumber })
      .eq('id', orderId);

    setOrders(orders.map(o => o.id === orderId ? { ...o, tracking_number: trackingNumber } : o));
  };

  const filteredOrders = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o =>
      !searchQuery ||
      o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.creator?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending' || o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">{t('orderSummary')}</h1>
        <p className="text-sm text-muted-foreground">{t('manageOrders')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{tDash('totalOrders')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('pending')}</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Package className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('shipped')}</p>
                <p className="text-2xl font-bold">{stats.shipped}</p>
              </div>
              <Truck className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('completed')}</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <DollarSign className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchOrders')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allOrders')}</SelectItem>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="paid">{t('paid')}</SelectItem>
                <SelectItem value="shipped">{t('shipped')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                <SelectItem value="refunded">{t('refunded')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{t('noOrders')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrder === order.id;
                return (
                  <div key={order.id} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-medium">#{order.order_number}</span>
                              <Badge className={getStatusColor(order.status)}>
                                {t(order.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{order.customer_name}</span>
                              {order.creator && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  @{order.creator.username}
                                </span>
                              )}
                              <span>{new Date(order.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold">
                            {formatCurrency(order.total_amount, order.currency || 'USD')}
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t space-y-4">
                        {/* Revenue Split */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-[10px] text-muted-foreground">{t('brandRevenue')}</p>
                            <p className="text-sm font-bold">{formatCurrency(order.brand_revenue || 0, order.currency || 'USD')}</p>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-[10px] text-muted-foreground">{t('creatorRevenue')}</p>
                            <p className="text-sm font-bold">{formatCurrency(order.creator_revenue || 0, order.currency || 'USD')}</p>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-[10px] text-muted-foreground">{t('platformFee')}</p>
                            <p className="text-sm font-bold">{formatCurrency(order.platform_revenue || 0, order.currency || 'USD')}</p>
                          </div>
                        </div>

                        {/* Creator Attribution */}
                        {order.creator && (
                          <div className="flex items-center gap-2 text-sm bg-primary/5 p-3 rounded-lg">
                            <User className="h-4 w-4 text-primary" />
                            <span>{t('viaCreator')}: <strong>@{order.creator.username}</strong></span>
                            {order.creator.display_name && (
                              <span className="text-muted-foreground">({order.creator.display_name})</span>
                            )}
                          </div>
                        )}

                        {/* Order Items */}
                        {order.items && order.items.length > 0 && (
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span>{item.product?.name_en || item.product?.name_ko || 'Product'} x{item.quantity}</span>
                                <span className="font-medium">{formatCurrency(item.unit_price * item.quantity, order.currency || 'USD')}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tracking */}
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder={t('trackingNumber')}
                            defaultValue={order.tracking_number || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (order.tracking_number || '')) {
                                handleUpdateTracking(order.id, e.target.value);
                              }
                            }}
                            className="flex-1 text-sm"
                          />
                        </div>

                        {/* Status Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {order.status === 'paid' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'shipped')}
                              disabled={updatingStatus === order.id}
                            >
                              {updatingStatus === order.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Truck className="mr-1 h-3 w-3" />}
                              {t('markShipped')}
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'completed')}
                              disabled={updatingStatus === order.id}
                            >
                              {updatingStatus === order.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                              {t('markCompleted')}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
