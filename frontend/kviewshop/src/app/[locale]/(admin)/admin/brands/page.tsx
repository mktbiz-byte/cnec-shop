'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Check, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

const mockBrands = [
  {
    id: '1',
    company_name: 'Beauty Lab Korea',
    email: 'contact@beautylab.kr',
    business_number: '123-45-67890',
    approved: true,
    products_count: 24,
    created_at: '2026-01-15',
  },
  {
    id: '2',
    company_name: 'Glow Essence',
    email: 'info@glowessence.com',
    business_number: '234-56-78901',
    approved: true,
    products_count: 18,
    created_at: '2026-01-20',
  },
  {
    id: '3',
    company_name: 'K-Skin Pro',
    email: 'hello@kskinpro.co.kr',
    business_number: '345-67-89012',
    approved: false,
    products_count: 0,
    created_at: '2026-02-01',
  },
];

export default function AdminBrandsPage() {
  const t = useTranslations('admin');
  const [search, setSearch] = useState('');
  const [brands, setBrands] = useState(mockBrands);

  const handleApprove = (id: string) => {
    setBrands(prev => prev.map(b => b.id === id ? { ...b, approved: true } : b));
    toast.success('Brand approved successfully');
  };

  const handleReject = (id: string) => {
    setBrands(prev => prev.filter(b => b.id !== id));
    toast.success('Brand rejected');
  };

  const filteredBrands = brands.filter(b =>
    b.company_name.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('brandManagement')}</h1>
        <p className="text-muted-foreground">{t('brandManagementDesc')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('allBrands')}</CardTitle>
              <CardDescription>{filteredBrands.length} brands registered</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Business Number</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.company_name}</TableCell>
                  <TableCell>{brand.email}</TableCell>
                  <TableCell>{brand.business_number}</TableCell>
                  <TableCell>{brand.products_count}</TableCell>
                  <TableCell>
                    <Badge variant={brand.approved ? 'default' : 'secondary'}>
                      {brand.approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>{brand.created_at}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {!brand.approved && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(brand.id)}>
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(brand.id)} className="text-destructive">
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
