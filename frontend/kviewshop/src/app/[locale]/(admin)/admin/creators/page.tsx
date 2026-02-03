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
import { Search, MoreHorizontal, Eye, Ban, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';

const mockCreators = [
  {
    id: '1',
    username: 'sakura_beauty',
    display_name: 'Sakura Beauty',
    email: 'sakura@example.com',
    country: 'JP',
    total_revenue: 3250,
    total_orders: 48,
    products_picked: 15,
    status: 'active',
    created_at: '2026-01-10',
  },
  {
    id: '2',
    username: 'glow_with_me',
    display_name: 'Glow With Me',
    email: 'glow@example.com',
    country: 'US',
    total_revenue: 5420,
    total_orders: 72,
    products_picked: 22,
    status: 'active',
    created_at: '2026-01-12',
  },
  {
    id: '3',
    username: 'beauty_insider',
    display_name: 'Beauty Insider',
    email: 'insider@example.com',
    country: 'JP',
    total_revenue: 1850,
    total_orders: 28,
    products_picked: 8,
    status: 'suspended',
    created_at: '2026-01-25',
  },
];

export default function AdminCreatorsPage() {
  const t = useTranslations('admin');
  const [search, setSearch] = useState('');
  const [creators] = useState(mockCreators);

  const filteredCreators = creators.filter(c =>
    c.username.toLowerCase().includes(search.toLowerCase()) ||
    c.display_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('creatorManagement')}</h1>
        <p className="text-muted-foreground">{t('creatorManagementDesc')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('allCreators')}</CardTitle>
              <CardDescription>{filteredCreators.length} creators registered</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search creators..."
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
                <TableHead>Creator</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreators.map((creator) => (
                <TableRow key={creator.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{creator.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{creator.username}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{creator.country}</Badge>
                  </TableCell>
                  <TableCell>{creator.products_picked}</TableCell>
                  <TableCell>{creator.total_orders}</TableCell>
                  <TableCell className="font-medium text-primary">
                    {formatCurrency(creator.total_revenue, 'USD')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={creator.status === 'active' ? 'default' : 'destructive'}>
                      {creator.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{creator.created_at}</TableCell>
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
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Visit Shop
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Ban className="mr-2 h-4 w-4" />
                          Suspend
                        </DropdownMenuItem>
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
