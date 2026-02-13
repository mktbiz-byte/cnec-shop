'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  FolderOpen,
  Loader2,
  ChevronUp,
  ChevronDown,
  Trash2,
  Eye,
  EyeOff,
  Package,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type { Collection, CreatorShopItem, Product } from '@/types/database';

interface CollectionWithItems extends Collection {
  items?: (CreatorShopItem & { product?: Product })[];
}

export default function CreatorCollectionsPage() {
  const { creator, isLoading: authLoading } = useAuthStore();

  const [collections, setCollections] = useState<CollectionWithItems[]>([]);
  const [availableItems, setAvailableItems] = useState<(CreatorShopItem & { product?: Product })[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Add product dialog
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addToCollectionId, setAddToCollectionId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !creator) {
      if (!authLoading) setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        const supabase = getClient();

        const [collectionsRes, itemsRes] = await Promise.all([
          supabase
            .from('collections')
            .select('*')
            .eq('creator_id', creator!.id)
            .order('display_order', { ascending: true }),
          supabase
            .from('creator_shop_items')
            .select('*, product:products(*)')
            .eq('creator_id', creator!.id)
            .order('display_order', { ascending: true }),
        ]);

        if (cancelled) return;

        const items = (itemsRes.data ?? []) as (CreatorShopItem & { product?: Product })[];
        const cols = (collectionsRes.data ?? []).map((col) => ({
          ...col,
          items: items.filter((item) => item.collection_id === col.id),
        })) as CollectionWithItems[];

        setCollections(cols);
        setAvailableItems(items);
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [authLoading, creator]);

  const handleCreate = async () => {
    if (!creator || !newName.trim()) return;
    setCreating(true);

    try {
      const supabase = getClient();
      const { data, error } = await supabase
        .from('collections')
        .insert({
          creator_id: creator.id,
          name: newName.trim(),
          description: newDesc.trim() || null,
          is_visible: true,
          display_order: collections.length,
        })
        .select()
        .single();

      if (error) {
        toast.error('컬렉션 생성에 실패했습니다');
        console.error('Create error:', error);
      } else if (data) {
        toast.success('컬렉션이 생성되었습니다');
        setCollections((prev) => [...prev, { ...data, items: [] }]);
        setNewName('');
        setNewDesc('');
        setCreateOpen(false);
      }
    } catch (error) {
      toast.error('컬렉션 생성에 실패했습니다');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleVisibility = async (collection: CollectionWithItems) => {
    const supabase = getClient();
    const newVisible = !collection.is_visible;

    setCollections((prev) =>
      prev.map((c) => (c.id === collection.id ? { ...c, is_visible: newVisible } : c))
    );

    const { error } = await supabase
      .from('collections')
      .update({ is_visible: newVisible })
      .eq('id', collection.id);

    if (error) {
      toast.error('변경에 실패했습니다');
      setCollections((prev) =>
        prev.map((c) => (c.id === collection.id ? { ...c, is_visible: !newVisible } : c))
      );
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('이 컬렉션을 삭제하시겠습니까?')) return;

    const supabase = getClient();

    // Remove collection_id from items first
    await supabase
      .from('creator_shop_items')
      .update({ collection_id: null })
      .eq('collection_id', collectionId);

    const { error } = await supabase.from('collections').delete().eq('id', collectionId);

    if (error) {
      toast.error('삭제에 실패했습니다');
    } else {
      toast.success('컬렉션이 삭제되었습니다');
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
    }
  };

  const handleMoveCollection = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= collections.length) return;

    const supabase = getClient();
    const newCollections = [...collections];
    const temp = newCollections[index];
    newCollections[index] = newCollections[newIndex];
    newCollections[newIndex] = temp;

    // Update display_order
    const updated = newCollections.map((c, i) => ({ ...c, display_order: i }));
    setCollections(updated);

    // Persist
    for (const col of updated) {
      await supabase
        .from('collections')
        .update({ display_order: col.display_order })
        .eq('id', col.id);
    }
  };

  const handleAddProduct = async (item: CreatorShopItem & { product?: Product }) => {
    if (!addToCollectionId) return;

    const supabase = getClient();
    const { error } = await supabase
      .from('creator_shop_items')
      .update({ collection_id: addToCollectionId })
      .eq('id', item.id);

    if (error) {
      toast.error('추가에 실패했습니다');
    } else {
      toast.success('상품이 컬렉션에 추가되었습니다');
      setCollections((prev) =>
        prev.map((c) =>
          c.id === addToCollectionId
            ? { ...c, items: [...(c.items ?? []), item] }
            : c
        )
      );
      setAddProductOpen(false);
    }
  };

  const handleRemoveProduct = async (collectionId: string, itemId: string) => {
    const supabase = getClient();
    const { error } = await supabase
      .from('creator_shop_items')
      .update({ collection_id: null })
      .eq('id', itemId);

    if (error) {
      toast.error('삭제에 실패했습니다');
    } else {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? { ...c, items: (c.items ?? []).filter((item) => item.id !== itemId) }
            : c
        )
      );
    }
  };

  const handleMoveItem = async (
    collectionId: string,
    itemIndex: number,
    direction: 'up' | 'down'
  ) => {
    const col = collections.find((c) => c.id === collectionId);
    if (!col?.items) return;

    const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (newIndex < 0 || newIndex >= col.items.length) return;

    const supabase = getClient();
    const newItems = [...col.items];
    const temp = newItems[itemIndex];
    newItems[itemIndex] = newItems[newIndex];
    newItems[newIndex] = temp;

    const updatedItems = newItems.map((item, i) => ({ ...item, display_order: i }));

    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, items: updatedItems } : c))
    );

    for (const item of updatedItems) {
      await supabase
        .from('creator_shop_items')
        .update({ display_order: item.display_order })
        .eq('id', item.id);
    }
  };

  // Items not assigned to any collection
  const unassignedItems = availableItems.filter(
    (item) => !item.collection_id
  );

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">컬렉션 관리</h1>
          <p className="text-sm text-muted-foreground">
            상품을 컬렉션으로 묶어 관리하세요
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 컬렉션
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 컬렉션 만들기</DialogTitle>
              <DialogDescription>
                컬렉션 이름과 설명을 입력하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>컬렉션 이름</Label>
                <Input
                  placeholder="예: 여름 스킨케어 추천"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>설명 (선택)</Label>
                <Textarea
                  placeholder="컬렉션에 대한 설명을 입력하세요"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />생성 중...</>
                ) : (
                  '생성'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collections List */}
      {collections.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">아직 컬렉션이 없습니다</p>
            <p className="text-sm text-muted-foreground">
              새 컬렉션을 만들어 상품을 정리해 보세요
            </p>
          </CardContent>
        </Card>
      ) : (
        collections.map((collection, colIndex) => (
          <Card key={collection.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveCollection(colIndex, 'up')}
                      disabled={colIndex === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveCollection(colIndex, 'down')}
                      disabled={colIndex === collections.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {collection.name}
                      <Badge variant="secondary">
                        {(collection.items ?? []).length}개 상품
                      </Badge>
                    </CardTitle>
                    {collection.description && (
                      <CardDescription className="mt-1">
                        {collection.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {collection.is_visible ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={collection.is_visible}
                      onCheckedChange={() => handleToggleVisibility(collection)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCollection(collection.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Items in this collection */}
              {(collection.items ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  이 컬렉션에 상품이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {(collection.items ?? []).map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => handleMoveItem(collection.id, itemIndex, 'up')}
                          disabled={itemIndex === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() =>
                            handleMoveItem(collection.id, itemIndex, 'down')
                          }
                          disabled={itemIndex === (collection.items ?? []).length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      {/* Product thumbnail */}
                      <div className="h-10 w-10 bg-muted rounded shrink-0">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover rounded"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.product?.name ?? '상품'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {item.type === 'GONGGU' ? '공구' : '픽'}
                        </Badge>
                      </div>
                      {/* Remove button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleRemoveProduct(collection.id, item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add product button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => {
                  setAddToCollectionId(collection.id);
                  setAddProductOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                상품 추가
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add Product to Collection Dialog */}
      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>컬렉션에 상품 추가</DialogTitle>
            <DialogDescription>
              추가할 상품을 선택하세요
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2 py-4">
            {unassignedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                추가할 수 있는 상품이 없습니다
              </p>
            ) : (
              unassignedItems.map((item) => (
                <button
                  key={item.id}
                  className="flex items-center gap-3 w-full p-3 border rounded-lg hover:bg-accent transition-colors text-left"
                  onClick={() => handleAddProduct(item)}
                >
                  <div className="h-10 w-10 bg-muted rounded shrink-0">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-full w-full object-cover rounded"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.product?.name ?? '상품'}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {item.type === 'GONGGU' ? '공구' : '픽'}
                    </Badge>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
