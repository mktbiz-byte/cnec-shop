'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package } from 'lucide-react';
import { getClient } from '@/lib/supabase/client';

export default function CreatorProductsPage() {
  const t = useTranslations('creator');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = params.locale as string;
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const supabase = getClient();
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      setProducts(data || []);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('pickProducts')}</h1>
        <p className="text-muted-foreground">내 샵에 표시할 상품을 선택하세요</p>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">상품 둘러보기</TabsTrigger>
          <TabsTrigger value="picked">{t('pickedProducts')} (0)</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="상품 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">아직 상품이 없습니다</p>
              <p className="text-sm text-muted-foreground">브랜드가 상품을 등록하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Products will be rendered here */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="picked">
          <Card>
            <CardHeader>
              <CardTitle>{t('pickedProducts')}</CardTitle>
              <CardDescription>내 샵에 있는 상품</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">선택한 상품이 없습니다</p>
                <p className="text-sm text-muted-foreground">상품을 둘러보고 내 샵에 추가하세요</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
