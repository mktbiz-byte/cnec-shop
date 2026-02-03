'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, Package, AlertCircle, ImageIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { ImageUpload } from '@/components/ui/image-upload';
import { uploadMultipleImages } from '@/lib/supabase/storage';
import { getClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Image from 'next/image';

interface Product {
  id: string;
  name_ko: string;
  name_en: string;
  name_ja: string;
  description_ko: string;
  description_en: string;
  description_ja: string;
  price_usd: number;
  price_jpy: number;
  price_krw: number;
  stock: number;
  is_cosmetic: boolean;
  is_active: boolean;
  thumbnail_url: string;
  detail_images: string[];
  brand_id: string;
  created_at: string;
}

const emptyProduct = {
  name_ko: '',
  name_en: '',
  name_ja: '',
  description_ko: '',
  description_en: '',
  description_ja: '',
  price_usd: 0,
  price_jpy: 0,
  price_krw: 0,
  stock: 0,
  is_cosmetic: true,
  is_active: true,
  thumbnail_url: '',
  detail_images: [] as string[],
};

export default function ProductsPage() {
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [thumbnailFiles, setThumbnailFiles] = useState<string[]>([]);
  const [detailFiles, setDetailFiles] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const supabase = getClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleThumbnailUpload = async (files: File[]): Promise<string[]> => {
    const urls = await uploadMultipleImages(files, 'brand-temp', 'thumbnail');
    return urls;
  };

  const handleDetailUpload = async (files: File[]): Promise<string[]> => {
    const urls = await uploadMultipleImages(files, 'brand-temp', 'detail');
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = getClient();

      const productData = {
        ...newProduct,
        thumbnail_url: thumbnailFiles[0] || '',
        detail_images: detailFiles,
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast.success('상품이 등록되었습니다');
      setIsAddDialogOpen(false);
      setNewProduct(emptyProduct);
      setThumbnailFiles([]);
      setDetailFiles([]);
      fetchProducts();
    } catch (err) {
      console.error('Error:', err);
      toast.error('상품 등록에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name_ko?.toLowerCase().includes(search.toLowerCase()) ||
    p.name_en?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">상품 관리</h1>
          <p className="text-muted-foreground">상품 카탈로그를 관리합니다</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gold">
              <Plus className="mr-2 h-4 w-4" />
              상품 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>상품 등록</DialogTitle>
              <DialogDescription>
                새 상품 정보를 입력하세요. 다국어 지원을 위해 영어/일본어 정보도 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="basic">기본 정보</TabsTrigger>
                  <TabsTrigger value="description">상세 설명</TabsTrigger>
                  <TabsTrigger value="images">이미지</TabsTrigger>
                  <TabsTrigger value="settings">설정</TabsTrigger>
                </TabsList>

                {/* 기본 정보 탭 */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>상품명 (한국어) *</Label>
                      <Input
                        placeholder="상품 이름"
                        value={newProduct.name_ko}
                        onChange={(e) => setNewProduct({ ...newProduct, name_ko: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>상품명 (English)</Label>
                        <Input
                          placeholder="Product name"
                          value={newProduct.name_en}
                          onChange={(e) => setNewProduct({ ...newProduct, name_en: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>상품명 (日本語)</Label>
                        <Input
                          placeholder="商品名"
                          value={newProduct.name_ja}
                          onChange={(e) => setNewProduct({ ...newProduct, name_ja: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>가격 (KRW) *</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newProduct.price_krw || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, price_krw: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>가격 (USD)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newProduct.price_usd || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, price_usd: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>가격 (JPY)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newProduct.price_jpy || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, price_jpy: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>재고 수량 *</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newProduct.stock || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </TabsContent>

                {/* 상세 설명 탭 */}
                <TabsContent value="description" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>상품 설명 (한국어)</Label>
                    <Textarea
                      placeholder="상품에 대한 상세 설명을 입력하세요"
                      value={newProduct.description_ko}
                      onChange={(e) => setNewProduct({ ...newProduct, description_ko: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>상품 설명 (English)</Label>
                    <Textarea
                      placeholder="Product description in English"
                      value={newProduct.description_en}
                      onChange={(e) => setNewProduct({ ...newProduct, description_en: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>상품 설명 (日本語)</Label>
                    <Textarea
                      placeholder="商品説明"
                      value={newProduct.description_ja}
                      onChange={(e) => setNewProduct({ ...newProduct, description_ja: e.target.value })}
                      rows={4}
                    />
                  </div>
                </TabsContent>

                {/* 이미지 탭 */}
                <TabsContent value="images" className="space-y-6 mt-4">
                  <ImageUpload
                    label="썸네일 이미지"
                    description="상품 목록에 표시될 대표 이미지 (1장)"
                    value={thumbnailFiles}
                    onChange={setThumbnailFiles}
                    onUpload={handleThumbnailUpload}
                    maxFiles={1}
                  />

                  <ImageUpload
                    label="상세 이미지"
                    description="상품 상세 페이지에 표시될 이미지 (최대 10장)"
                    value={detailFiles}
                    onChange={setDetailFiles}
                    onUpload={handleDetailUpload}
                    maxFiles={10}
                  />
                </TabsContent>

                {/* 설정 탭 */}
                <TabsContent value="settings" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>화장품 여부</Label>
                      <p className="text-sm text-muted-foreground">
                        화장품인 경우 MoCRA 규정에 따라 미국 판매량이 모니터링됩니다
                      </p>
                    </div>
                    <Switch
                      checked={newProduct.is_cosmetic}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, is_cosmetic: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>판매 활성화</Label>
                      <p className="text-sm text-muted-foreground">
                        비활성화하면 크리에이터 샵에 표시되지 않습니다
                      </p>
                    </div>
                    <Switch
                      checked={newProduct.is_active}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, is_active: checked })}
                    />
                  </div>

                  {newProduct.is_cosmetic && (
                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-warning">MoCRA 규정 안내</p>
                        <p className="text-muted-foreground mt-1">
                          미국 내 연간 화장품 매출이 $1,000,000을 초과하면 FDA 등록이 필요합니다.
                          매출 현황은 MoCRA 모니터링 페이지에서 확인하세요.
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  취소
                </Button>
                <Button type="submit" className="btn-gold" disabled={saving}>
                  {saving ? '등록 중...' : '상품 등록'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
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

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            전체 상품 ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">등록된 상품이 없습니다</p>
              <p className="text-sm text-muted-foreground">상품 등록 버튼을 클릭하여 첫 상품을 등록하세요</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상품</TableHead>
                  <TableHead>가격 (KRW)</TableHead>
                  <TableHead>가격 (USD)</TableHead>
                  <TableHead>재고</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded bg-muted overflow-hidden">
                          {product.thumbnail_url ? (
                            <Image
                              src={product.thumbnail_url}
                              alt={product.name_ko}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name_ko}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.name_en}
                          </p>
                          {product.is_cosmetic && (
                            <Badge variant="outline" className="text-xs mt-1">
                              화장품
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(product.price_krw || 0, 'KRW')}</TableCell>
                    <TableCell>{formatCurrency(product.price_usd || 0, 'USD')}</TableCell>
                    <TableCell>
                      <span
                        className={
                          product.stock <= 10
                            ? 'text-destructive font-medium'
                            : ''
                        }
                      >
                        {product.stock}
                      </span>
                      {product.stock <= 10 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          부족
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.is_active ? 'default' : 'secondary'}
                      >
                        {product.is_active ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
