'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type { ProductCategory } from '@/types/database';
import { PRODUCT_CATEGORY_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NewProductPage() {
  const router = useRouter();
  const { brand } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic info
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('skincare');
  const [originalPrice, setOriginalPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');

  // Detail
  const [mainImage, setMainImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState('');
  const [description, setDescription] = useState('');
  const [volume, setVolume] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [howToUse, setHowToUse] = useState('');

  // Sales settings
  const [isActive, setIsActive] = useState(true);
  const [allowCreatorPick, setAllowCreatorPick] = useState(true);
  const [commissionRate, setCommissionRate] = useState('10');

  async function handleSave() {
    if (!brand?.id) return;

    // Validation
    if (!name.trim()) {
      setError('상품명을 입력해주세요.');
      return;
    }
    if (!originalPrice || Number(originalPrice) <= 0) {
      setError('정가를 올바르게 입력해주세요.');
      return;
    }
    if (!salePrice || Number(salePrice) <= 0) {
      setError('판매가를 올바르게 입력해주세요.');
      return;
    }
    if (!stock || Number(stock) < 0) {
      setError('재고를 올바르게 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = getClient();

    // Build images array
    const images: string[] = [];
    if (mainImage.trim()) {
      images.push(mainImage.trim());
    }
    if (additionalImages.trim()) {
      const extras = additionalImages
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean);
      images.push(...extras);
    }

    const { error: insertError } = await supabase.from('products').insert({
      brand_id: brand.id,
      name: name.trim(),
      category,
      description: description.trim() || null,
      original_price: Number(originalPrice),
      sale_price: Number(salePrice),
      stock: Number(stock),
      images,
      volume: volume.trim() || null,
      ingredients: ingredients.trim() || null,
      how_to_use: howToUse.trim() || null,
      status: isActive ? 'ACTIVE' : 'INACTIVE',
      allow_creator_pick: allowCreatorPick,
      default_commission_rate: Number(commissionRate),
    });

    if (insertError) {
      console.error('Failed to create product:', insertError);
      setError('상품 등록에 실패했습니다. 다시 시도해주세요.');
      setIsSaving(false);
      return;
    }

    router.push('../products');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">새 상품 등록</h1>
        <Button variant="outline" onClick={() => router.back()}>
          취소
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>상품의 기본 정보를 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">상품명 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="상품명을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리 *</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as ProductCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_CATEGORY_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">정가 (원) *</Label>
              <Input
                id="originalPrice"
                type="number"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">판매가 (원) *</Label>
              <Input
                id="salePrice"
                type="number"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">재고 *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail */}
      <Card>
        <CardHeader>
          <CardTitle>상세 정보</CardTitle>
          <CardDescription>
            상품의 이미지 및 상세 설명을 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mainImage">대표 이미지 URL</Label>
            <Input
              id="mainImage"
              value={mainImage}
              onChange={(e) => setMainImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalImages">
              추가 이미지 URLs (줄바꿈으로 구분)
            </Label>
            <Textarea
              id="additionalImages"
              value={additionalImages}
              onChange={(e) => setAdditionalImages(e.target.value)}
              placeholder={'https://example.com/image2.jpg\nhttps://example.com/image3.jpg'}
              rows={3}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="description">상품 설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상품에 대한 상세 설명을 입력하세요"
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="volume">용량/수량</Label>
            <Input
              id="volume"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="예: 50ml, 100g, 30매"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredients">성분</Label>
            <Textarea
              id="ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="성분 목록을 입력하세요"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="howToUse">사용법</Label>
            <Textarea
              id="howToUse"
              value={howToUse}
              onChange={(e) => setHowToUse(e.target.value)}
              placeholder="사용 방법을 입력하세요"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sales Settings */}
      <Card>
        <CardHeader>
          <CardTitle>판매 설정</CardTitle>
          <CardDescription>
            판매 상태 및 크리에이터 설정을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>판매 상태</Label>
              <p className="text-sm text-muted-foreground">
                활성화하면 캠페인에 상품을 사용할 수 있습니다.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>크리에이터픽 허용</Label>
              <p className="text-sm text-muted-foreground">
                크리에이터가 자유롭게 이 상품을 픽할 수 있도록 허용합니다.
              </p>
            </div>
            <Switch
              checked={allowCreatorPick}
              onCheckedChange={setAllowCreatorPick}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="commissionRate">기본 커미션율 (%)</Label>
            <p className="text-sm text-muted-foreground">
              크리에이터픽 시 적용되는 기본 커미션율입니다.
            </p>
            <Input
              id="commissionRate"
              type="number"
              min="0"
              max="100"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? '저장 중...' : '상품 등록'}
        </Button>
      </div>
    </div>
  );
}
