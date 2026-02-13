'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Package, Truck, Loader2, ShoppingBag } from 'lucide-react';
import { getClient } from '@/lib/supabase/client';

// Inline types to avoid dependency on database.ts
type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

interface OrderItemResult {
  id: string;
  product_id: string;
  campaign_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    id: string;
    name: string;
    thumbnail_url: string | null;
    images: string[];
    brand: {
      id: string;
      brand_name: string;
    } | null;
  } | null;
}

interface OrderResult {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  product_amount: number | null;
  shipping_fee: number;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  shipping_address: string;
  shipping_detail: string | null;
  shipping_zipcode: string | null;
  shipping_memo: string | null;
  payment_method: string | null;
  courier_code: string | null;
  tracking_number: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  items: OrderItemResult[];
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: '결제대기',
  PAID: '결제완료',
  PREPARING: '배송준비',
  SHIPPING: '배송중',
  DELIVERED: '배송완료',
  CONFIRMED: '구매확정',
  CANCELLED: '취소',
  REFUNDED: '환불',
};

const STATUS_BADGE_VARIANT: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  SHIPPING: 'bg-purple-100 text-purple-800 border-purple-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  REFUNDED: 'bg-gray-100 text-gray-800 border-gray-200',
};

const COURIER_LABELS: Record<string, string> = {
  cj: 'CJ대한통운',
  hanjin: '한진택배',
  logen: '로젠택배',
  epost: '우체국택배',
  lotte: '롯데택배',
  etc: '기타',
};

const COURIER_TRACKING_URL: Record<string, string> = {
  cj: 'https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=',
  hanjin: 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession=&wblnum=',
  logen: 'https://www.ilogen.com/web/personal/trace/',
  epost: 'https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1=',
  lotte: 'https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=',
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export default function OrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!orderNumber.trim() || !buyerPhone.trim()) {
      setError('주문번호와 전화번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);
    setSearched(true);

    try {
      const supabase = getClient();

      const { data, error: queryError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          product_amount,
          shipping_fee,
          buyer_name,
          buyer_phone,
          buyer_email,
          shipping_address,
          shipping_detail,
          shipping_zipcode,
          shipping_memo,
          payment_method,
          courier_code,
          tracking_number,
          paid_at,
          shipped_at,
          delivered_at,
          cancelled_at,
          cancel_reason,
          created_at,
          items:order_items (
            id,
            product_id,
            campaign_id,
            quantity,
            unit_price,
            total_price,
            product:products (
              id,
              name,
              thumbnail_url,
              images,
              brand:brands (
                id,
                brand_name
              )
            )
          )
        `)
        .eq('order_number', orderNumber.trim())
        .eq('buyer_phone', buyerPhone.trim())
        .single();

      if (queryError || !data) {
        setError('주문을 찾을 수 없습니다. 주문번호와 전화번호를 확인해주세요.');
        return;
      }

      setOrder(data as unknown as OrderResult);
    } catch (err) {
      console.error('Order lookup error:', err);
      setError('주문 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  function getTrackingUrl(courierCode: string | null, trackingNumber: string | null): string | null {
    if (!courierCode || !trackingNumber) return null;
    const baseUrl = COURIER_TRACKING_URL[courierCode];
    if (!baseUrl) return null;
    return baseUrl + trackingNumber;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">주문 조회</h1>
          <p className="text-gray-500 mt-2">
            주문번호와 전화번호로 주문을 조회합니다
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">주문번호</Label>
                <Input
                  id="orderNumber"
                  type="text"
                  placeholder="CNEC-20260213-12345"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyerPhone">주문자 전화번호</Label>
                <Input
                  id="buyerPhone"
                  type="tel"
                  placeholder="01012345678"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    조회중...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    주문 조회
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {searched && !loading && !error && !order && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-sm text-center">
                검색 결과가 없습니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-4">
            {/* Order Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">주문 상태</CardTitle>
                  <Badge
                    variant="outline"
                    className={STATUS_BADGE_VARIANT[order.status]}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">주문번호</span>
                    <span className="font-mono font-medium">{order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">주문일시</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  {order.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">결제일시</span>
                      <span>{formatDate(order.paid_at)}</span>
                    </div>
                  )}
                  {order.shipped_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">발송일시</span>
                      <span>{formatDate(order.shipped_at)}</span>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">배송완료</span>
                      <span>{formatDate(order.delivered_at)}</span>
                    </div>
                  )}
                  {order.cancelled_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">취소일시</span>
                      <span>{formatDate(order.cancelled_at)}</span>
                    </div>
                  )}
                  {order.cancel_reason && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">취소사유</span>
                      <span className="text-red-600">{order.cancel_reason}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  주문 상품
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item, index) => {
                    const productName = item.product?.name || '상품 정보 없음';
                    const brandName = item.product?.brand?.brand_name || '';
                    const imageUrl =
                      item.product?.thumbnail_url ||
                      (item.product?.images && item.product.images.length > 0
                        ? item.product.images[0]
                        : null);

                    return (
                      <div key={item.id}>
                        {index > 0 && <Separator className="mb-4" />}
                        <div className="flex gap-3">
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            {brandName && (
                              <p className="text-xs text-gray-400">{brandName}</p>
                            )}
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {productName}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">
                                {formatCurrency(item.unit_price)} x {item.quantity}
                              </span>
                              <span className="text-sm font-semibold">
                                {formatCurrency(item.total_price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-4" />

                {/* Amount Summary */}
                <div className="space-y-2 text-sm">
                  {order.product_amount != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">상품금액</span>
                      <span>{formatCurrency(order.product_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">배송비</span>
                    <span>
                      {order.shipping_fee === 0
                        ? '무료'
                        : formatCurrency(order.shipping_fee)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>총 결제금액</span>
                    <span className="text-blue-600">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping / Tracking Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  배송 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">받는분</span>
                    <span>{order.buyer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">연락처</span>
                    <span>{order.buyer_phone}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 flex-shrink-0">배송지</span>
                    <span className="text-right ml-4">
                      {order.shipping_address}
                      {order.shipping_detail && ` ${order.shipping_detail}`}
                      {order.shipping_zipcode && (
                        <span className="text-gray-400 ml-1">
                          ({order.shipping_zipcode})
                        </span>
                      )}
                    </span>
                  </div>
                  {order.shipping_memo && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">배송메모</span>
                      <span>{order.shipping_memo}</span>
                    </div>
                  )}
                </div>

                {/* Tracking Information */}
                {order.tracking_number && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">택배사</span>
                        <span>
                          {order.courier_code
                            ? COURIER_LABELS[order.courier_code] || order.courier_code
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">운송장번호</span>
                        <span className="font-mono">{order.tracking_number}</span>
                      </div>
                      {(() => {
                        const trackingUrl = getTrackingUrl(
                          order.courier_code,
                          order.tracking_number
                        );
                        if (!trackingUrl) return null;
                        return (
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-3"
                          >
                            <Button variant="outline" className="w-full" type="button">
                              <Truck className="w-4 h-4 mr-2" />
                              배송 추적하기
                            </Button>
                          </a>
                        );
                      })()}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
