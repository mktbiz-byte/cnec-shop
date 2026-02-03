'use client';

import { useState, useEffect } from 'react';
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
import { Search, Building2, Check, X } from 'lucide-react';
import { getClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Brand {
  id: string;
  company_name: string;
  business_number: string;
  approved: boolean;
  created_at: string;
}

export default function AdminBrandsPage() {
  const t = useTranslations('admin');
  const [search, setSearch] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    const supabase = getClient();
    const { data } = await supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false });
    setBrands(data || []);
    setLoading(false);
  }

  const handleApprove = async (id: string) => {
    const supabase = getClient();
    await supabase.from('brands').update({ approved: true }).eq('id', id);
    toast.success('Brand approved');
    fetchBrands();
  };

  const filteredBrands = brands.filter(b =>
    b.company_name?.toLowerCase().includes(search.toLowerCase())
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
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No brands registered yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Business Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.company_name}</TableCell>
                    <TableCell>{brand.business_number || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={brand.approved ? 'default' : 'secondary'}>
                        {brand.approved ? 'Approved' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(brand.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {!brand.approved && (
                        <Button size="sm" onClick={() => handleApprove(brand.id)}>
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      )}
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
