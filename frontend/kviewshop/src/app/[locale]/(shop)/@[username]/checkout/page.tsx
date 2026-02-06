'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadTossPayments, TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';
import { getClient } from '@/lib/supabase/client';
import { useCartStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCurrency } from '@/lib/i18n/config';
import {
  Loader2,
  ArrowLeft,
  CreditCard,
  ShoppingCart,
  MapPin,
  User,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

interface Product {
  id: string;
  name_ko: string;
  name_en: string;
  name_jp: string;
  price_usd: number;
  price_jpy: number;
  images: string[];
}

interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

interface Creator {
  id: string;
  username: string;
  display_name: string;
  theme_color: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const username = (params.username as string)?.replace('@', '');
  const locale = params.locale as string;

  const { items, clearCart } = useCartStore();
  const widgetRef = useRef<TossPaymentsWidgets | null>(null);
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'toss' | 'paypal'>('toss');
  const [widgetReady, setWidgetReady] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: locale === 'ja' ? 'JP' : locale === 'ko' ? 'KR' : 'US',
  });

  const currency = locale === 'ja' ? 'JPY' : 'USD';

  useEffect(() => {
    const loadCheckoutData = async () => {
      if (!username) return;

      try {
        const supabase = getClient();
        const { data: creatorData } = await supabase
          .from('creators')
          .select('id, username, display_name, theme_color')
          .eq('username', username)
          .maybeSingle();

        if (!creatorData) {
          router.push('/' + locale);
          return;
        }

        setCreator(creatorData);

        const creatorItems = items.filter((item) => item.creatorId === creatorData.id);

        if (creatorItems.length === 0) {
          router.push('/' + locale + '/@' + username);
          return;
        }

        const productIds = creatorItems.map((item) => item.productId);
        const { data: products } = await supabase
          .from('products')
          .select('id, name_ko, name_en, name_jp, price_usd, price_jpy, images')
          .in('id', productIds);

        const itemsWithProducts = creatorItems.map((item) => ({
          ...item,
          product: products?.find((p) => p.id === item.productId),
        }));

        setCartItems(itemsWithProducts);
      } catch (error) {
        console.error('Failed to load checkout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckoutData();
  }, [username, items, locale, router]);

  useEffect(() => {
    if (isLoading || cartItems.length === 0 || paymentMethod !== 'toss') return;

    const initWidget = async () => {
      try {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        const customerKey = 'customer_' + new Date().getTime();
        const widgets = tossPayments.widgets({ customerKey });
        widgetRef.current = widgets;

        await widgets.setAmount({
          currency: currency === 'JPY' ? 'JPY' : 'USD',
          value: calculateTotal(),
        });

        if (paymentMethodRef.current) {
          await widgets.renderPaymentMethods({
            selector: '#payment-method',
            variantKey: 'DEFAULT',
          });
        }

        if (agreementRef.current) {
          await widgets.renderAgreement({
            selector: '#agreement',
            variantKey: 'AGREEMENT',
          });
        }

        setWidgetReady(true);
      } catch (error) {
        console.error('Failed to initialize Toss widget:', error);
        toast.error('Failed to load payment widget');
      }
    };

    initWidget();
  }, [isLoading, cartItems, paymentMethod, currency]);

  const getProductName = (product: Product) => {
    switch (locale) {
      case 'ko':
        return product.name_ko || product.name_en;
      case 'ja':
        return product.name_jp || product.name_en;
      default:
        return product.name_en || product.name_ko;
    }
  };

  const getPrice = (product: Product) => {
    return currency === 'JPY' ? product.price_jpy : product.price_usd;
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      if (!item.product) return total;
      return total + getPrice(item.product) * item.quantity;
    }, 0);
  };

  const validateForm = () => {
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.postalCode) {
      toast.error('Please fill in all required fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleTossPayment = async () => {
    if (!validateForm() || !widgetRef.current || !creator) return;

    setIsProcessing(true);
    try {
      const timestamp = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 11);
      const orderId = 'KV-' + timestamp + '-' + randomStr;
      const orderName = (creator.display_name || creator.username) + ' Shop Order';

      await widgetRef.current.requestPayment({
        orderId,
        orderName,
        customerName: form.name,
        customerEmail: form.email,
        customerMobilePhone: form.phone.replace(/[^0-9]/g, ''),
        successUrl: window.location.origin + '/' + locale + '/payment/success?creatorId=' + creator.id,
        failUrl: window.location.origin + '/' + locale + '/payment/fail',
      });
    } catch (error: any) {
      console.error('Payment failed:', error);
      if (error.code === 'USER_CANCEL') {
        toast.error('Payment cancelled');
      } else {
        toast.error(error.message || 'Payment failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!validateForm() || !creator) return;

    setIsProcessing(true);
    try {
      toast.info('PayPal integration coming soon');
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'toss') {
      handleTossPayment();
    } else {
      handlePayPalPayment();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!creator || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-bold mb-2">Cart is empty</h1>
          <Link href={'/' + locale + '/@' + username}>
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link
            href={'/' + locale + '/@' + username}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Shop
          </Link>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      placeholder="10001"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <select
                    id="country"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2"
                  >
                    <option value="US">United States</option>
                    <option value="JP">Japan</option>
                    <option value="KR">South Korea</option>
                    <option value="CN">China</option>
                    <option value="TW">Taiwan</option>
                    <option value="HK">Hong Kong</option>
                    <option value="SG">Singapore</option>
                    <option value="TH">Thailand</option>
                    <option value="VN">Vietnam</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as 'toss' | 'paypal')}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="toss" id="toss" />
                    <Label htmlFor="toss" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        <span>Toss Payments</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Credit Card, Debit Card, Bank Transfer
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                          P
                        </div>
                        <span>PayPal</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pay with PayPal account
                      </p>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'toss' && (
                  <div className="mt-4 space-y-4">
                    <div id="payment-method" ref={paymentMethodRef} />
                    <div id="agreement" ref={agreementRef} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative h-16 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.product && getProductName(item.product)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {item.product && formatCurrency(getPrice(item.product) * item.quantity, currency)}
                    </p>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="text-green-500">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total, currency)}</span>
                  </div>
                </div>

                <Button
                  className="w-full btn-gold"
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing || (paymentMethod === 'toss' && !widgetReady)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Pay {formatCurrency(total, currency)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Your payment is secured with 256-bit SSL encryption
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
