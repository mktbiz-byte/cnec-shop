'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, Globe, ShieldCheck, Check, Plus, Minus, ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { getClient } from '@/lib/supabase/client';
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

export default function CreatorProductsPage() {
  const t = useTranslations('creatorProducts');
  const tb = useTranslations('brandSettings');
  const tc = useTranslations('common');
  const tCreator = useTranslations('creator');
  const params = useParams();
  const locale = params.locale as string;

  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Record<string, Brand>>({});
  const [pickedProductIds, setPickedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = getClient();

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      // Fetch brands with shipping/cert info
      const { data: brandsData } = await supabase
        .from('brands')
        .select('id, user_id, brand_name, shipping_countries, certifications');

      // Build brand lookup
      const brandMap: Record<string, Brand> = {};
      if (brandsData) {
        for (const brand of brandsData) {
          brandMap[brand.id] = {
            ...brand,
            shipping_countries: brand.shipping_countries || [],
            certifications: brand.certifications || [],
          };
          // Also index by user_id for product lookups
          brandMap[brand.user_id] = {
            ...brand,
            shipping_countries: brand.shipping_countries || [],
            certifications: brand.certifications || [],
          };
        }
      }

      // Fetch creator's picked products
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: creatorData } = await supabase
          .from('creators')
          .select('picked_products')
          .eq('user_id', user.id)
          .single();
        if (creatorData?.picked_products) {
          setPickedProductIds(creatorData.picked_products);
        }
      }

      setProducts(productsData || []);
      setBrands(brandMap);
      setLoading(false);
    }
    fetchData();
  }, []);

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
    const supabase = getClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPicked = [...pickedProductIds, productId];
    setPickedProductIds(newPicked);

    await supabase
      .from('creators')
      .update({ picked_products: newPicked })
      .eq('user_id', user.id);

    toast.success(tCreator('pickProduct'));
  };

  const handleUnpickProduct = async (productId: string) => {
    const supabase = getClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPicked = pickedProductIds.filter(id => id !== productId);
    setPickedProductIds(newPicked);

    await supabase
      .from('creators')
      .update({ picked_products: newPicked })
      .eq('user_id', user.id);

    toast.success(tCreator('unpickProduct'));
  };

  const getBrand = (product: Product): Brand | null => {
    return brands[product.brand_id] || null;
  };

  const getShippingRegionSummary = (countries: string[]) => {
    if (!countries || countries.length === 0) return [];
    const regions: string[] = [];
    for (const region of SHIPPING_REGIONS) {
      const matchCount = region.countries.filter(c => countries.includes(c.code)).length;
      if (matchCount === region.countries.length) {
        regions.push(region.nameKey);
      } else if (matchCount > 0) {
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
        {/* Product Image */}
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
          {/* Product Info */}
          <div className="flex-1">
            <p className="font-medium line-clamp-1">{product.name}</p>
            {brand && (
              <p className="text-xs text-muted-foreground mt-1">{brand.brand_name}</p>
            )}
            <p className="text-lg font-bold text-primary mt-1">
              ${product.price?.toFixed(2)}
            </p>
          </div>

          {/* Shipping Countries Summary */}
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

          {/* Certifications Summary */}
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

          {/* Expand/Collapse Details */}
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

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t space-y-3 text-sm">
              {/* Full Shipping Countries */}
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

              {/* Full Certifications */}
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

              {/* No Shipping/Cert Info */}
              {shippingCountries.length === 0 && certifications.length === 0 && (
                <p className="text-xs text-muted-foreground">{t('noShippingInfo')}</p>
              )}
            </div>
          )}

          {/* Pick/Unpick Button */}
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
        <TabsList>
          <TabsTrigger value="browse">{t('browseProducts')}</TabsTrigger>
          <TabsTrigger value="picked">{tCreator('pickedProducts')} ({pickedProductIds.length})</TabsTrigger>
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

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{tc('loading')}</div>
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
      </Tabs>
    </div>
  );
}
