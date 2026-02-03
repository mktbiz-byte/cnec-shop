'use client';

import { useState } from 'react';
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
import { Plus, Search, Edit, Trash2, Package, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';

// Mock data
const mockProducts = [
  {
    id: '1',
    name_en: 'Glow Serum',
    name_jp: 'グローセラム',
    price_usd: 50,
    price_jpy: 7500,
    stock: 150,
    is_cosmetic: true,
    is_active: true,
    images: ['https://via.placeholder.com/100'],
  },
  {
    id: '2',
    name_en: 'Hydra Cream',
    name_jp: 'ハイドラクリーム',
    price_usd: 45,
    price_jpy: 6750,
    stock: 80,
    is_cosmetic: true,
    is_active: true,
    images: ['https://via.placeholder.com/100'],
  },
  {
    id: '3',
    name_en: 'Vitamin C Toner',
    name_jp: 'ビタミンCトナー',
    price_usd: 38,
    price_jpy: 5700,
    stock: 5,
    is_cosmetic: true,
    is_active: true,
    images: ['https://via.placeholder.com/100'],
  },
  {
    id: '4',
    name_en: 'Beauty Tool Set',
    name_jp: 'ビューティーツールセット',
    price_usd: 25,
    price_jpy: 3750,
    stock: 200,
    is_cosmetic: false,
    is_active: false,
    images: ['https://via.placeholder.com/100'],
  },
];

export default function ProductsPage() {
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredProducts = mockProducts.filter((p) =>
    p.name_en.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">{t('name')}s</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gold">
              <Plus className="mr-2 h-4 w-4" />
              {t('addProduct')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('addProduct')}</DialogTitle>
              <DialogDescription>
                Add a new product to your catalog. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('name')} (English)</Label>
                  <Input placeholder="Product name in English" />
                </div>
                <div className="space-y-2">
                  <Label>{t('name')} (日本語)</Label>
                  <Input placeholder="商品名" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('price')} (USD)</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>{t('price')} (JPY)</Label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('stock')}</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>{t('description')} (English)</Label>
                <Textarea placeholder="Product description in English" />
              </div>
              <div className="space-y-2">
                <Label>{t('description')} (日本語)</Label>
                <Textarea placeholder="商品説明" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="is_cosmetic" />
                  <Label htmlFor="is_cosmetic">{t('isCosmetic')}</Label>
                </div>
              </div>
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-warning">{t('cosmeticWarning')}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" className="btn-gold">
                  {tCommon('save')}
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
              placeholder={`${tCommon('search')} products...`}
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
            All Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>{t('price')} (USD)</TableHead>
                <TableHead>{t('price')} (JPY)</TableHead>
                <TableHead>{t('stock')}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted" />
                      <div>
                        <p className="font-medium">{product.name_en}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.name_jp}
                        </p>
                        {product.is_cosmetic && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Cosmetic
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(product.price_usd, 'USD')}</TableCell>
                  <TableCell>{formatCurrency(product.price_jpy, 'JPY')}</TableCell>
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
                        Low
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.is_active ? 'default' : 'secondary'}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
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
        </CardContent>
      </Card>
    </div>
  );
}
