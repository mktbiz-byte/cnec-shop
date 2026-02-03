'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Headphones,
  Plus,
  Package,
  Truck,
  RotateCcw,
  AlertCircle,
  MessageSquare,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { getClient } from '@/lib/supabase/client';

type TicketCategory = 'product_quality' | 'shipping' | 'returns' | 'payment_error' | 'refund' | 'creator_inquiry' | 'platform_inquiry';
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketHandler = 'brand' | 'cnec';

interface SupportTicket {
  id: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  handler: TicketHandler;
  order_id?: string;
  created_at: string;
  updated_at: string;
  response?: string;
}

const CATEGORY_CONFIG: Record<TicketCategory, { icon: typeof Package; handler: TicketHandler }> = {
  product_quality: { icon: Package, handler: 'brand' },
  shipping: { icon: Truck, handler: 'brand' },
  returns: { icon: RotateCcw, handler: 'brand' },
  payment_error: { icon: AlertCircle, handler: 'cnec' },
  refund: { icon: AlertCircle, handler: 'cnec' },
  creator_inquiry: { icon: MessageSquare, handler: 'cnec' },
  platform_inquiry: { icon: Headphones, handler: 'cnec' },
};

function getStatusBadge(status: TicketStatus) {
  switch (status) {
    case 'open':
      return <Badge variant="outline" className="text-blue-500 border-blue-500/30"><Clock className="mr-1 h-3 w-3" />Open</Badge>;
    case 'in_progress':
      return <Badge variant="outline" className="text-warning border-warning/30"><Loader2 className="mr-1 h-3 w-3" />In Progress</Badge>;
    case 'resolved':
      return <Badge variant="outline" className="text-success border-success/30"><CheckCircle2 className="mr-1 h-3 w-3" />Resolved</Badge>;
    case 'closed':
      return <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" />Closed</Badge>;
  }
}

export default function BrandSupportPage() {
  const t = useTranslations('support');
  const tCommon = useTranslations('common');

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<'all' | TicketHandler>('all');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newTicket, setNewTicket] = useState({
    category: '' as TicketCategory | '',
    subject: '',
    description: '',
    orderId: '',
  });

  useEffect(() => {
    async function loadTickets() {
      try {
        const supabase = getClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setLoading(false); return; }

        const { data: brand } = await supabase
          .from('brands')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!brand) { setLoading(false); return; }

        const { data } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('brand_id', brand.id)
          .order('created_at', { ascending: false });

        setTickets(data || []);
      } catch (error) {
        console.error('Failed to load tickets:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  const handleCreateTicket = async () => {
    if (!newTicket.category || !newTicket.subject || !newTicket.description) {
      toast.error(t('fillRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: brand } = await supabase
        .from('brands')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!brand) return;

      const handler = CATEGORY_CONFIG[newTicket.category as TicketCategory].handler;

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          brand_id: brand.id,
          category: newTicket.category,
          subject: newTicket.subject,
          description: newTicket.description,
          handler,
          order_id: newTicket.orderId || null,
          status: 'open',
        })
        .select()
        .maybeSingle();

      if (error) {
        toast.error(tCommon('error'));
        console.error('Create ticket error:', error);
      } else if (data) {
        setTickets([data, ...tickets]);
        setNewTicket({ category: '', subject: '', description: '', orderId: '' });
        setShowCreateForm(false);
        toast.success(t('ticketCreated'));
      }
    } catch (error) {
      toast.error(tCommon('error'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter(t => t.handler === filter);

  const brandCategories: TicketCategory[] = ['product_quality', 'shipping', 'returns'];
  const cnecCategories: TicketCategory[] = ['payment_error', 'refund', 'creator_inquiry', 'platform_inquiry'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button
          className="btn-gold"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('newTicket')}
        </Button>
      </div>

      {/* CS Responsibility Matrix */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {t('brandResponsibility')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {brandCategories.map(cat => {
              const Icon = CATEGORY_CONFIG[cat].icon;
              return (
                <div key={cat} className="flex items-center gap-2 text-sm">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t(`categories.${cat}`)}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Headphones className="h-4 w-4 text-accent" />
              {t('cnecResponsibility')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cnecCategories.map(cat => {
              const Icon = CATEGORY_CONFIG[cat].icon;
              return (
                <div key={cat} className="flex items-center gap-2 text-sm">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t(`categories.${cat}`)}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>{t('newTicket')}</CardTitle>
            <CardDescription>{t('newTicketDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('category')}</Label>
                <Select
                  value={newTicket.category}
                  onValueChange={(v) => setNewTicket({ ...newTicket, category: v as TicketCategory })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_quality">{t('categories.product_quality')}</SelectItem>
                    <SelectItem value="shipping">{t('categories.shipping')}</SelectItem>
                    <SelectItem value="returns">{t('categories.returns')}</SelectItem>
                    <SelectItem value="payment_error">{t('categories.payment_error')}</SelectItem>
                    <SelectItem value="refund">{t('categories.refund')}</SelectItem>
                    <SelectItem value="creator_inquiry">{t('categories.creator_inquiry')}</SelectItem>
                    <SelectItem value="platform_inquiry">{t('categories.platform_inquiry')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('orderId')}</Label>
                <Input
                  placeholder={t('orderIdPlaceholder')}
                  value={newTicket.orderId}
                  onChange={(e) => setNewTicket({ ...newTicket, orderId: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('subject')}</Label>
              <Input
                placeholder={t('subjectPlaceholder')}
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('description')}</Label>
              <Textarea
                placeholder={t('descriptionPlaceholder')}
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={4}
              />
            </div>
            {newTicket.category && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5" />
                {t('handledBy')}: <Badge variant="outline" className="text-xs">
                  {CATEGORY_CONFIG[newTicket.category as TicketCategory]?.handler === 'brand' ? t('brandTeam') : 'CNEC'}
                </Badge>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                {tCommon('cancel')}
              </Button>
              <Button className="btn-gold" onClick={handleCreateTicket} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {tCommon('submit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter & Ticket List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>{t('tickets')}</CardTitle>
              <CardDescription>{t('ticketsDesc', { count: filteredTickets.length })}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                {tCommon('all')}
              </Button>
              <Button
                variant={filter === 'brand' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('brand')}
              >
                {t('brandTeam')}
              </Button>
              <Button
                variant={filter === 'cnec' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('cnec')}
              >
                CNEC
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Headphones className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{t('noTickets')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => {
                const catConfig = CATEGORY_CONFIG[ticket.category];
                const Icon = catConfig?.icon || MessageSquare;
                const isExpanded = expandedTicket === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{ticket.subject}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">
                                {t(`categories.${ticket.category}`)}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(ticket.status)}
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <p className="text-sm text-muted-foreground">{ticket.description}</p>
                        {ticket.order_id && (
                          <p className="text-xs text-muted-foreground">
                            {t('orderId')}: <span className="font-mono">{ticket.order_id}</span>
                          </p>
                        )}
                        {ticket.response && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-xs font-medium mb-1">{t('response')}</p>
                            <p className="text-sm">{ticket.response}</p>
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {t('handledBy')}: {ticket.handler === 'brand' ? t('brandTeam') : 'CNEC'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
