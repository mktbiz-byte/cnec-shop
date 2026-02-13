'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Eye,
  EyeOff,
  ImageIcon,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';

// ── Local types (no DB types imported yet) ──────────────────────────────
type BannerType = 'HORIZONTAL' | 'VERTICAL';
type LinkType = 'EXTERNAL' | 'COLLECTION' | 'PRODUCT';

interface Banner {
  id: string;
  creator_id: string;
  image_url: string;
  banner_type: BannerType;
  link_url: string;
  link_type: LinkType;
  is_visible: boolean;
  display_order: number;
  created_at: string;
}

const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  HORIZONTAL: '가로형',
  VERTICAL: '세로형',
};

const LINK_TYPE_LABELS: Record<LinkType, string> = {
  EXTERNAL: '외부 링크',
  COLLECTION: '컬렉션',
  PRODUCT: '상품',
};

// ── Mock data ───────────────────────────────────────────────────────────
const MOCK_BANNERS: Banner[] = [
  {
    id: 'mock-banner-1',
    creator_id: 'mock-creator',
    image_url: '',
    banner_type: 'HORIZONTAL',
    link_url: '/collections/summer-skincare',
    link_type: 'COLLECTION',
    is_visible: true,
    display_order: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-banner-2',
    creator_id: 'mock-creator',
    image_url: '',
    banner_type: 'VERTICAL',
    link_url: 'https://instagram.com/mychannel',
    link_type: 'EXTERNAL',
    is_visible: true,
    display_order: 1,
    created_at: new Date().toISOString(),
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────
function generateId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Page component ──────────────────────────────────────────────────────
export default function CreatorBannersPage() {
  const { creator, isLoading: authLoading } = useAuthStore();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // New banner form
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    image_url: string;
    banner_type: BannerType;
    link_url: string;
    link_type: LinkType;
  }>({
    image_url: '',
    banner_type: 'HORIZONTAL',
    link_url: '',
    link_type: 'EXTERNAL',
  });

  // ── Data fetching (mock for MVP) ────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;

    // TODO: Replace with real Supabase fetch once banners table exists
    // const supabase = getClient();
    // const { data } = await supabase
    //   .from('banners')
    //   .select('*')
    //   .eq('creator_id', creator!.id)
    //   .order('display_order', { ascending: true });

    const timer = setTimeout(() => {
      setBanners(MOCK_BANNERS);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [authLoading, creator]);

  // ── Reset form ──────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({
      image_url: '',
      banner_type: 'HORIZONTAL',
      link_url: '',
      link_type: 'EXTERNAL',
    });
    setShowForm(false);
    setEditingId(null);
  };

  // ── Create / Edit ───────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.image_url.trim() && !form.link_url.trim()) {
      toast.error('이미지 URL 또는 링크 URL을 입력해주세요');
      return;
    }

    setCreating(true);

    if (editingId) {
      // Edit existing
      // TODO: Replace with Supabase update
      setBanners((prev) =>
        prev.map((b) =>
          b.id === editingId
            ? {
                ...b,
                image_url: form.image_url.trim(),
                banner_type: form.banner_type,
                link_url: form.link_url.trim(),
                link_type: form.link_type,
              }
            : b
        )
      );
      toast.success('배너가 수정되었습니다');
    } else {
      // Create new
      // TODO: Replace with Supabase insert
      const banner: Banner = {
        id: generateId(),
        creator_id: creator?.id ?? 'mock',
        image_url: form.image_url.trim(),
        banner_type: form.banner_type,
        link_url: form.link_url.trim(),
        link_type: form.link_type,
        is_visible: true,
        display_order: banners.length,
        created_at: new Date().toISOString(),
      };
      setBanners((prev) => [...prev, banner]);
      toast.success('배너가 생성되었습니다');
    }

    resetForm();
    setCreating(false);
  };

  const handleEdit = (banner: Banner) => {
    setForm({
      image_url: banner.image_url,
      banner_type: banner.banner_type,
      link_url: banner.link_url,
      link_type: banner.link_type,
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  // ── Delete ──────────────────────────────────────────────────────────
  const handleDelete = (bannerId: string) => {
    if (!confirm('이 배너를 삭제하시겠습니까?')) return;

    // TODO: Replace with Supabase delete
    setBanners((prev) =>
      prev
        .filter((b) => b.id !== bannerId)
        .map((b, i) => ({ ...b, display_order: i }))
    );
    if (editingId === bannerId) resetForm();
    toast.success('배너가 삭제되었습니다');
  };

  // ── Toggle visibility ───────────────────────────────────────────────
  const handleToggleVisibility = (bannerId: string) => {
    // TODO: Replace with Supabase update
    setBanners((prev) =>
      prev.map((b) => (b.id === bannerId ? { ...b, is_visible: !b.is_visible } : b))
    );
  };

  // ── Reorder ─────────────────────────────────────────────────────────
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    setBanners(updated.map((b, i) => ({ ...b, display_order: i })));
  };

  // ── Loading state ───────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 mt-2 bg-muted rounded animate-pulse" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 w-full bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            배너 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            내 셀렉트샵에 노출할 배너를 관리합니다
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 배너
          </Button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? '배너 수정' : '새 배너 만들기'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>이미지 URL</Label>
              <Input
                placeholder="https://example.com/banner.jpg"
                value={form.image_url}
                onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
              />
              {form.image_url && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={form.image_url}
                    alt="배너 미리보기"
                    className={
                      form.banner_type === 'HORIZONTAL'
                        ? 'w-full h-32 object-cover'
                        : 'w-32 h-48 object-cover'
                    }
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>배너 유형</Label>
                <Select
                  value={form.banner_type}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, banner_type: v as BannerType }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="배너 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HORIZONTAL">가로형</SelectItem>
                    <SelectItem value="VERTICAL">세로형</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>링크 유형</Label>
                <Select
                  value={form.link_type}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, link_type: v as LinkType }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="링크 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXTERNAL">외부 링크</SelectItem>
                    <SelectItem value="COLLECTION">컬렉션</SelectItem>
                    <SelectItem value="PRODUCT">상품</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>링크 URL</Label>
              <Input
                placeholder={
                  form.link_type === 'EXTERNAL'
                    ? 'https://example.com'
                    : form.link_type === 'COLLECTION'
                      ? '/collections/collection-id'
                      : '/products/product-id'
                }
                value={form.link_url}
                onChange={(e) => setForm((prev) => ({ ...prev, link_url: e.target.value }))}
              />
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={creating}>
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingId ? '수정' : '생성'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banners List */}
      {banners.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">아직 배너가 없습니다</p>
            <p className="text-sm text-muted-foreground">
              새 배너를 만들어 셀렉트샵을 꾸며 보세요
            </p>
          </CardContent>
        </Card>
      ) : (
        banners.map((banner, index) => (
          <Card key={banner.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === banners.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Banner info */}
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      배너 {index + 1}
                      <Badge variant="secondary">
                        {BANNER_TYPE_LABELS[banner.banner_type]}
                      </Badge>
                      <Badge variant="outline">
                        {LINK_TYPE_LABELS[banner.link_type]}
                      </Badge>
                    </CardTitle>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {banner.is_visible ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={banner.is_visible}
                      onCheckedChange={() => handleToggleVisibility(banner.id)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Banner preview */}
              <div
                className={`rounded-lg overflow-hidden border bg-muted ${
                  banner.banner_type === 'HORIZONTAL'
                    ? 'w-full h-32'
                    : 'w-32 h-48'
                }`}
              >
                {banner.image_url ? (
                  <img
                    src={banner.image_url}
                    alt={`배너 ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Link info */}
              {banner.link_url && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  {banner.link_type === 'EXTERNAL' ? (
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  ) : (
                    <Link2 className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{banner.link_url}</span>
                </div>
              )}

              {/* Edit button */}
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => handleEdit(banner)}
              >
                수정
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
