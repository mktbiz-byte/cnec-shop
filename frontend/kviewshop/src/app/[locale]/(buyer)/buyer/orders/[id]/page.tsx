'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingBag,
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Copy,
  ExternalLink,
  Loader2,
  Star,
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  points_used: number;
  currency: string;
  payment_method: string;
  payment_key: string | null;
  shipping_status: string;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  creator: {
    id: string;
    username: string;
    display_name: string;
    theme_color: string;
    profile_image: string;
  };
  order_items: OrderItem[];
}

const statusConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10', label: 'Pending Payment' },
  paid: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Payment Confirmed' },
  processing: { icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-500/10', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-500/10', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Cancelled' },
  refunded: { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-500/10', label: 'Refunded' },
};

const shippingStatusSteps = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const orderId = params.id as string;
  const { buyer } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!buyer || !orderId) return;

      try {
        const supabase = getClient();

        const { data: orderData, error } = await supabase
          .from('orders')
          .select(`
            *,
            creator:creators (
              id,
              username,
              display_name,
              theme_color,
              profile_image
            ),
            order_items (
              id,
              product_id,
              product_name,
              product_image,
              quantity,
              unit_price,
              subtotal
            )
          `)
          .eq('id', orderId)
          .eq('buyer_id', buyer.id)
          .single();

        if (error) {
          console.error('Error loading order:', error);
          router.push('/' + locale + '/buyer/orders');
          return;
        }

        setOrder(orderData as any);
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [buyer, orderId, router, locale]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    if (!order) return '';
    const symbol = order.currency === 'JPY' ? '¥' : order.currency === 'KRW' ? '₩' : '$';
    return symbol + amount.toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getCurrentStep = () => {
    if (!order) return 0;
    if (order.status === 'cancelled' || order.status === 'refunded') return -1;
    return shippingStatusSteps.indexOf(order.status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order not found</h2>
        <Link href={'/' + locale + '/buyer/orders'}>
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const currentStep = getCurrentStep();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href={'/' + locale + '/buyer/orders'}
        className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Orders
      </Link>

      {/* Order Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            Order {order.order_number}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(order.order_number)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </h1>
          <p className="text-muted-foreground">Placed on {formatDate(order.created_at)}</p>
        </div>
        <Badge className={'text-sm px-3 py-1 ' + status.bgColor + ' ' + status.color + ' border-0'}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {status.label}
        </Badge>
      </div>

      {/* Progress Tracker */}
      {currentStep >= 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <div className="flex justify-between">
                {shippingStatusSteps.map((step, index) => {
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div
                        className={
                          'w-8 h-8 rounded-full flex items-center justify-center z-10 ' +
                          (isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground')
                        }
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span className="text-sm">{index + 1}</span>
                        )}
                      </div>
                      <span
                        className={
                          'text-xs mt-2 capitalize ' +
                          (isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground')
                        }
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Progress Line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -translate-y-1/2">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: (currentStep / (shippingStatusSteps.length - 1)) * 100 + '%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
                <Link
                  href={'/' + locale + '/@' + order.creator?.username}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: order.creator?.theme_color || '#000' }}
                  />
                  {order.creator?.display_name || order.creator?.username}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{item.product_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                  </div>
                </div>
              ))}

              <Separator />

              {/* Order Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.shipping_fee > 0 ? formatCurrency(order.shipping_fee) : 'Free'}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                {order.points_used > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Points Used</span>
                    <span>-{order.points_used.toLocaleString()}P</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Info */}
          {order.tracking_number && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Tracking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-mono font-semibold flex items-center gap-2">
                      {order.tracking_number}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(order.tracking_number || '')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </p>
                  </div>
                  {order.tracking_url && (
                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
                        Track Package
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.shipping_name}</p>
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p>
              <p>{order.shipping_country}</p>
              <Separator className="my-3" />
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {order.shipping_phone}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                {order.shipping_email}
              </p>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{order.payment_method || 'Card'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-xs">
                  {order.paid_at ? 'Paid' : 'Pending'}
                </Badge>
              </div>
              {order.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid At</span>
                  <span>{formatDate(order.paid_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            {order.status === 'delivered' && (
              <Link href={'/' + locale + '/buyer/reviews?orderId=' + order.id} className="block">
                <Button className="w-full gap-2">
                  <Star className="h-4 w-4" />
                  Write a Review
                </Button>
              </Link>
            )}
            {['pending', 'paid'].includes(order.status) && (
              <Button variant="outline" className="w-full text-destructive">
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
