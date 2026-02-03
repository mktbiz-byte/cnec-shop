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
import { Search, Users } from 'lucide-react';
import { getClient } from '@/lib/supabase/client';

interface Creator {
  id: string;
  username: string;
  display_name: string;
  country: string;
  created_at: string;
}

export default function AdminCreatorsPage() {
  const t = useTranslations('admin');
  const [search, setSearch] = useState('');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreators() {
      const supabase = getClient();
      const { data } = await supabase
        .from('creators')
        .select('*')
        .order('created_at', { ascending: false });
      setCreators(data || []);
      setLoading(false);
    }
    fetchCreators();
  }, []);

  const filteredCreators = creators.filter(c =>
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.display_name?.toLowerCase().includes(search.toLowerCase())
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
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredCreators.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No creators registered yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCreators.map((creator) => (
                  <TableRow key={creator.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{creator.display_name || creator.username}</p>
                        <p className="text-sm text-muted-foreground">@{creator.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{creator.country}</Badge>
                    </TableCell>
                    <TableCell>{new Date(creator.created_at).toLocaleDateString()}</TableCell>
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
