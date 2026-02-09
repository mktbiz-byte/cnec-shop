'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Globe, ShieldCheck, Check, Plus, Minus, ChevronDown, ChevronUp, X, Gift, Truck, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { SHIPPING_REGIONS, CERTIFICATION_TYPES } from '@/lib/shipping-countries';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  brand_id: string;
  is_active: boolean;
  is_cosmetic: boolean;
}

interface Brand {
  id: string;
  user_id: string;
  brand_name: string;
  shipping_countries: string[];
  certifications: {
    id: string;
    type: string;
    name: string;
    status: string;
    issueDate?: string;
    expiryDate?: string;
  }[];
}

interface SampleRequest {
  id: string;
  creator_id: string;
  brand_id: string;
  product_ids: string[];
  status: string;
  message?: string;
  tracking_number?: string;
  created_at: string;
}

export default function CreatorProductsPage() {
  const t = useTranslations('creatorProducts');
  const tb = useTranslations('brandSettings');
  const tc = useTranslations('common');
  const tCreator = useTranslations('creator');
  const params = useParams();
  const locale = params.locale as string;

  // Read auth state from zustand store
  const { creator: storeCreator, isLoading: authLoading } = useAuthStore();

  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Record<string, Brand>>({});
  const [pickedProductIds, setPickedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Sample box request state
  const [sampleSelectedIds, setSampleSelectedIds] = useState<string[]>([]);
  const [sampleMessage, setSampleMessage] = useState('');
  const [sampleRequests, setSampleRequests] = useState<SampleRequest[]>([]);
  const [submittingSample, setSubmittingSample] = useState(false);

  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState({
    recipientName: '',
    phone: '',
    country: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
  });

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    async function fetchData() {
      try {
        const supabase = getClient();

        // Fetch products and brands in parallel (no auth needed for these)
        const [productsRes, brandsRes] = await Promise.all([
          supabase.from('products').select('*').eq('is_active', true),
          supabase.from('brands').select('*'),
        ]);

        if (cancelled) return;

        // Build brand lookup
        const brandMap: Record<string, Brand> = {};
        if (brandsRes.data) {
          for (const brand of brandsRes.data) {
            brandMap[brand.id] = {
              ...brand,
              shipping_countries: brand.shipping_countries || [],
              certifications: brand.certifications || [],
            };
            brandMap[brand.user_id] = {
              ...brand,
              shipping_countries: brand.shipping_countries || [],
              certifications: brand.certifications || [],
            };
          }
        }

        // Use creator from store instead of querying again
        if (storeCreator) {
          if (storeCreator.picked_products) {
            setPickedProductIds(storeCreator.picked_products);
          }
          // Fetch sample requests using store creator ID
          const { data: requestsData } = await supabase
            .from('sample_requests')
            .select('*')
            .eq('creator_id', storeCreator.id)
            .order('created_at', { ascending: false });
          if (requestsData && !cancelled) {
            setSampleRequests(requestsData);
          }
        }

        if (!cancelled) {
          setProducts(productsRes.data || []);
          setBrands(brandMap);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
    };
  }, [authLoading, storeCreator]);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const pickedProducts = useMemo(() => {
    return products.filter(p => pickedProductIds.includes(p.id));
  }, [products, pickedProductIds]);

  const handlePickProduct = async (productId: string) => {
    if (!storeCreator) return;
    const supabase = getClient();
    const newPicked = [...pickedProductIds, productId];
    setPickedProductIds(newPicked);

    await supabase
      .from('creators')
      .update({ picked_products: newPicked })
      .eq('id', storeCreator.id);

    toast.success(tCreator('pickProduct'));
  };

  const handleUnpickProduct = async (productId: string) => {
    if (!storeCreator) return;
    const supabase = getClient();
    const newPicked = pickedProductIds.filter(id => id !== productId);
    setPickedProductIds(newPicked);

    await supabase
      .from('creators')
      .update({ picked_products: newPicked })
      .eq('id', storeCreator.id);

    toast.success(tCreator('unpickProduct'));
  };

  const getBrand = (product: Product): Brand | null => {
    return brands[product.brand_id] || null;
  };

  const toggleSampleProduct = (productId: string) => {
    setSampleSelectedIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleSubmitSampleRequest = async () => {
    if (sampleSelectedIds.length === 0 || !storeCreator) return;

    if (!shippingAddress.recipientName || !shippingAddress.country || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.postalCode) {
      toast.error(t('shippingAddressRequired'));
      return;
    }

    setSubmittingSample(true);

    try {
      const supabase = getClient();
      const brandGroups: Record<string, string[]> = {};
      for (const pid of sampleSelectedIds) {
        const product = products.find(p => p.id === pid);
        if (product) {
          const brandId = product.brand_id;
          if (!brandGroups[brandId]) brandGroups[brandId] = [];
          brandGroups[brandId].push(pid);
        }
      }

      for (const [brandId, productIds] of Object.entries(brandGroups)) {
        const { data, error } = await supabase
          .from('sample_requests')
          .insert({
            creator_id: storeCreator.id,
            brand_id: brandId,
            product_ids: productIds,
            message: sampleMessage || null,
            shipping_address: shippingAddress,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setSampleRequests(prev => [data, ...prev]);
        }
      }

      toast.success(t('sampleRequestSent'));
      setSampleSelectedIds([]);
      setSampleMessage('');
    } catch (error) {
      console.error('Sample request error:', error);
      toast.error(t('sampleRequestError'));
    } finally {
      setSubmittingSample(false);
    }
  };

  const getSampleStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
      approved: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      received: 'bg-green-500/10 text-green-600 border-green-500/30',
      rejected: 'bg-red-500/10 text-red-600 border-red-500/30',
    };
    return (
      <Badge className={styles[status] || ''}>
        {t(`sampleStatus.${status}`)}
      </Badge>
    );
  };

  const getShippingRegionSummary = (countries: string[]) => {
    if (!countries || countries.length === 0) return [];
    const regions: string[] = [];
    for (const region of SHIPPING_REGIONS) {
      const matchCount = region.countries.filter(c => countries.includes(c.code)).length;
      if (matchCount > 0) {
        regions.push(region.nameKey);
      }
    }
    return regions;
  };

  const renderProductCard = (product: Product, isPicked: boolean) => {
    const brand = getBrand(product);
    const isExpanded = expandedProduct === product.id;
    const shippingCountries = brand?.shipping_countries || [];
    const certifications = brand?.certifications || [];
    const approvedCerts = certifications.filter(c => c.status === 'approved');
    const regionSummary = getShippingRegionSummary(shippingCountries);

    return (
      <Card key={product.id} className="overflow-hidden flex flex-col">
        <div className="aspect-square bg-muted relative">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          {product.is_cosmetic && (
            <Badge className="absolute top-2 right-2 bg-purple-500/90 text-white text-xs">
              MoCRA
            </Badge>
          )}
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex-1">
            <p className="font-medium line-clamp-1">{product.name}</p>
            {brand && (
              <p className="text-xs text-muted-foreground mt-1">{brand.brand_name}</p>
            )}
            <p className="text-lg font-bold text-primary mt-1">
              ${product.price?.toFixed(2)}
            </p>
          </div>

          {shippingCountries.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-1 mb-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{t('shippingAvailable')}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {regionSummary.slice(0, 3).map(regionKey => (
                  <Badge key={regionKey} variant="outline" className="text-[10px] px-1.5 py-0">
                    {tb(`regions.${regionKey}`)}
                  </Badge>
                ))}
                {regionSummary.length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    +{regionSummary.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {approvedCerts.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1 mb-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">{t('certifiedProduct')}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {approvedCerts.slice(0, 3).map(cert => (
                  <Badge key={cert.id} className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-500/30">
                    {tb(`certTypes.${cert.type}`)}
                  </Badge>
                ))}
                {approvedCerts.length > 3 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-500/30">
                    +{approvedCerts.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
            className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
          >
            {isExpanded ? (
              <><ChevronUp className="h-3 w-3" />{t('hideDetails')}</>
            ) : (
              <><ChevronDown className="h-3 w-3" />{t('viewDetails')}</>
            )}
          </button>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t space-y-3 text-sm">
              {shippingCountries.length > 0 && (
                <div>
                  <p className="font-medium text-xs mb-2 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {t('shippingCountries')} ({shippingCountries.length})
                  </p>
                  <div className="space-y-2">
                    {SHIPPING_REGIONS.map(region => {
                      const regionCountries = region.countries.filter(c => shippingCountries.includes(c.code));
                      if (regionCountries.length === 0) return null;
                      return (
                        <div key={region.id}>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">
                            {tb(`regions.${region.nameKey}`)}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {regionCountries.map(country => (
                              <Badge key={country.code} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {tb(`countries.${country.nameKey}`)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {certifications.length > 0 && (
                <div>
                  <p className="font-medium text-xs mb-2 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t('certifications')} ({certifications.length})
                  </p>
                  <div className="space-y-1.5">
                    {certifications.map(cert => (
                      <div key={cert.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          {cert.status === 'approved' ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <span className="h-3 w-3 rounded-full bg-yellow-500/30 inline-block" />
                          )}
                          <span>{cert.name}</span>
                        </div>
                        <Badge
                          variant={cert.status === 'approved' ? 'default' : 'secondary'}
                          className={`text-[10px] px-1.5 py-0 ${cert.status === 'approved' ? 'bg-green-500/10 text-green-600 border-green-500/30' : ''}`}
                        >
                          {cert.status === 'approved' ? tb('certApproved') : tb('certPending')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {shippingCountries.length === 0 && certifications.length === 0 && (
                <p className="text-xs text-muted-foreground">{t('noShippingInfo')}</p>
              )}
            </div>
          )}

          <div className="mt-3">
            {isPicked ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleUnpickProduct(product.id)}
              >
                <Minus className="h-4 w-4 mr-1" />
                {tCreator('unpickProduct')}
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full btn-gold"
                onClick={() => handlePickProduct(product.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {tCreator('pickProduct')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{tCreator('pickProducts')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="browse">{t('browseProducts')}</TabsTrigger>
          <TabsTrigger value="picked">{tCreator('pickedProducts')} ({pickedProductIds.length})</TabsTrigger>
          <TabsTrigger value="sample">
            <Gift className="h-4 w-4 mr-1" />
            {t('sampleBox')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {loading || authLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{t('noProducts')}</p>
              <p className="text-sm text-muted-foreground">{t('noProductsDesc')}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map(product =>
                renderProductCard(product, pickedProductIds.includes(product.id))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="picked">
          {pickedProducts.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{tCreator('pickedProducts')}</CardTitle>
                <CardDescription>{t('pickedDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">{t('noPickedProducts')}</p>
                  <p className="text-sm text-muted-foreground">{t('noPickedProductsDesc')}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pickedProducts.map(product =>
                renderProductCard(product, true)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sample" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {t('sampleBoxTitle')}
              </CardTitle>
              <CardDescription>{t('sampleBoxDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">{t('selectSampleProducts')}</Label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        sampleSelectedIds.includes(product.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleSampleProduct(product.id)}
                    >
                      <Checkbox
                        checked={sampleSelectedIds.includes(product.id)}
                        onCheckedChange={() => toggleSampleProduct(product.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">${product.price?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('noProducts')}</p>
                )}
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">{t('shippingAddress')}</Label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('recipientName')} *</Label>
                    <Input
                      placeholder={t('recipientNamePlaceholder')}
                      value={shippingAddress.recipientName}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, recipientName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('phoneNumber')}</Label>
                    <Input
                      placeholder="+1 234 567 8900"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('countryRegion')} *</Label>
                  <Select
                    value={shippingAddress.country}
                    onValueChange={(value) => setShippingAddress({ ...shippingAddress, country: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCountry')} />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_REGIONS.flatMap(region =>
                        region.countries.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {tb(`countries.${country.nameKey}`)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('addressLine1')} *</Label>
                  <Input
                    placeholder={t('addressLine1Placeholder')}
                    value={shippingAddress.addressLine1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('addressLine2')}</Label>
                  <Input
                    placeholder={t('addressLine2Placeholder')}
                    value={shippingAddress.addressLine2}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('city')} *</Label>
                    <Input
                      placeholder={t('cityPlaceholder')}
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('stateProvince')}</Label>
                    <Input
                      placeholder={t('stateProvincePlaceholder')}
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('postalCode')} *</Label>
                    <Input
                      placeholder={t('postalCodePlaceholder')}
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('sampleMessage')}</Label>
                <Textarea
                  placeholder={t('sampleMessagePlaceholder')}
                  value={sampleMessage}
                  onChange={(e) => setSampleMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                className="btn-gold w-full sm:w-auto"
                disabled={sampleSelectedIds.length === 0 || submittingSample}
                onClick={handleSubmitSampleRequest}
              >
                {submittingSample ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{tc('loading')}</>
                ) : (
                  <><Gift className="h-4 w-4 mr-2" />{t('submitSampleRequest', { count: sampleSelectedIds.length })}</>
                )}
              </Button>
            </CardContent>
          </Card>

          {sampleRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('sampleRequestHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sampleRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {req.product_ids.length} {t('sampleProducts')}
                          </p>
                          {getSampleStatusBadge(req.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(req.created_at).toLocaleDateString(locale)}
                        </p>
                        {req.tracking_number && (
                          <p className="text-xs mt-1 flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {req.tracking_number}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {req.product_ids.map(pid => {
                          const p = products.find(pr => pr.id === pid);
                          return p ? <div key={pid} className="truncate max-w-[150px]">{p.name}</div> : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
