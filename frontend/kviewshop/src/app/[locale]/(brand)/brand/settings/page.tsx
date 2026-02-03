'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Settings, Percent, Building2, CreditCard, Info, Globe, ShieldCheck, Upload, X, Check, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { SHIPPING_REGIONS, CERTIFICATION_TYPES, getRegionCountryCodes } from '@/lib/shipping-countries';

interface Certification {
  id: string;
  type: string;
  name: string;
  issueDate: string;
  expiryDate: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function BrandSettingsPage() {
  const t = useTranslations('brandSettings');
  const tc = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    brandName: '',
    businessNumber: '',
    contactEmail: '',
    contactPhone: '',
    creatorCommissionRate: 20,
    enableTieredCommission: false,
    tier1Rate: 15,
    tier2Rate: 20,
    tier3Rate: 25,
    tier4Rate: 30,
    settlementCycle: 'monthly',
    minimumPayout: 50,
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  // Shipping countries state
  const [shippingCountries, setShippingCountries] = useState<string[]>([]);

  // Certifications state
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [newCert, setNewCert] = useState({
    type: '',
    name: '',
    issueDate: '',
    expiryDate: '',
    fileUrl: '',
  });
  const [showAddCert, setShowAddCert] = useState(false);

  const isRegionFullySelected = (regionId: string) => {
    const codes = getRegionCountryCodes(regionId);
    return codes.every(code => shippingCountries.includes(code));
  };

  const isRegionPartiallySelected = (regionId: string) => {
    const codes = getRegionCountryCodes(regionId);
    const selected = codes.filter(code => shippingCountries.includes(code));
    return selected.length > 0 && selected.length < codes.length;
  };

  const toggleRegion = (regionId: string) => {
    const codes = getRegionCountryCodes(regionId);
    if (isRegionFullySelected(regionId)) {
      setShippingCountries(prev => prev.filter(c => !codes.includes(c)));
    } else {
      setShippingCountries(prev => [...new Set([...prev, ...codes])]);
    }
  };

  const toggleCountry = (code: string) => {
    setShippingCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const selectAll = () => {
    const allCodes = SHIPPING_REGIONS.flatMap(r => r.countries.map(c => c.code));
    setShippingCountries(allCodes);
  };

  const deselectAll = () => {
    setShippingCountries([]);
  };

  const handleAddCertification = () => {
    if (!newCert.type || !newCert.name) return;
    const cert: Certification = {
      id: Date.now().toString(),
      type: newCert.type,
      name: newCert.name,
      issueDate: newCert.issueDate,
      expiryDate: newCert.expiryDate,
      fileUrl: newCert.fileUrl,
      status: 'pending',
    };
    setCertifications(prev => [...prev, cert]);
    setNewCert({ type: '', name: '', issueDate: '', expiryDate: '', fileUrl: '' });
    setShowAddCert(false);
  };

  const handleRemoveCertification = (id: string) => {
    setCertifications(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = async (section?: string) => {
    setLoading(true);
    try {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');
      const user = session.user;

      if (section === 'shipping' || !section) {
        await supabase
          .from('brands')
          .update({ shipping_countries: shippingCountries })
          .eq('user_id', user.id);
      }

      if (section === 'certifications' || !section) {
        await supabase
          .from('brands')
          .update({ certifications: certifications })
          .eq('user_id', user.id);
      }

      if (section === 'general' || section === 'commission' || section === 'settlement' || !section) {
        await supabase
          .from('brands')
          .update({
            brand_name: settings.brandName,
            business_number: settings.businessNumber,
            contact_email: settings.contactEmail,
            contact_phone: settings.contactPhone,
            creator_commission_rate: settings.creatorCommissionRate,
            enable_tiered_commission: settings.enableTieredCommission,
            tier1_rate: settings.tier1Rate,
            tier2_rate: settings.tier2Rate,
            tier3_rate: settings.tier3Rate,
            tier4_rate: settings.tier4Rate,
            settlement_cycle: settings.settlementCycle,
            minimum_payout: settings.minimumPayout,
            bank_name: settings.bankName,
            account_number: settings.accountNumber,
            account_holder: settings.accountHolder,
          })
          .eq('user_id', user.id);
      }

      toast.success(t('saved'));
    } catch (error) {
      toast.error(t('saveError'));
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = getClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data } = await supabase
          .from('brands')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (data) {
          setSettings(prev => ({
            ...prev,
            brandName: data.brand_name || '',
            businessNumber: data.business_number || '',
            contactEmail: data.contact_email || '',
            contactPhone: data.contact_phone || '',
            creatorCommissionRate: data.creator_commission_rate ?? 20,
            enableTieredCommission: data.enable_tiered_commission ?? false,
            tier1Rate: data.tier1_rate ?? 15,
            tier2Rate: data.tier2_rate ?? 20,
            tier3Rate: data.tier3_rate ?? 25,
            tier4Rate: data.tier4_rate ?? 30,
            settlementCycle: data.settlement_cycle || 'monthly',
            minimumPayout: data.minimum_payout ?? 50,
            bankName: data.bank_name || '',
            accountNumber: data.account_number || '',
            accountHolder: data.account_holder || '',
          }));
          setShippingCountries(data.shipping_countries || []);
          setCertifications(data.certifications || []);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const getCertStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/30"><Check className="h-3 w-3 mr-1" />{t('certApproved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('certRejected')}</Badge>;
      default:
        return <Badge variant="secondary">{t('certPending')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general">{t('generalTab')}</TabsTrigger>
          <TabsTrigger value="shipping">{t('shippingTab')}</TabsTrigger>
          <TabsTrigger value="certifications">{t('certificationsTab')}</TabsTrigger>
          <TabsTrigger value="commission">{t('commissionTab')}</TabsTrigger>
          <TabsTrigger value="settlement">{t('settlementTab')}</TabsTrigger>
        </TabsList>

        {/* General Info Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('brandInfo')}
              </CardTitle>
              <CardDescription>{t('brandInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('brandName')}</Label>
                  <Input
                    placeholder={t('brandNamePlaceholder')}
                    value={settings.brandName}
                    onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('businessNumber')}</Label>
                  <Input
                    placeholder="000-00-00000"
                    value={settings.businessNumber}
                    onChange={(e) => setSettings({ ...settings, businessNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('contactEmail')}</Label>
                  <Input
                    type="email"
                    placeholder="contact@brand.com"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('contactPhone')}</Label>
                  <Input
                    placeholder="02-0000-0000"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={() => handleSave('general')} disabled={loading} className="btn-gold">
                {loading ? tc('loading') : tc('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Countries Tab */}
        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('shippingTitle')}
              </CardTitle>
              <CardDescription>{t('shippingDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Select/Deselect All */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t('selectedCountries', { count: shippingCountries.length })}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    {t('selectAll')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    {t('deselectAll')}
                  </Button>
                </div>
              </div>

              {/* Region Groups */}
              <div className="space-y-4">
                {SHIPPING_REGIONS.map((region) => (
                  <div key={region.id} className="border rounded-lg p-4">
                    {/* Region Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <Checkbox
                        id={`region-${region.id}`}
                        checked={isRegionFullySelected(region.id)}
                        ref={(el) => {
                          if (el) {
                            const input = el as unknown as HTMLButtonElement;
                            input.dataset.indeterminate = isRegionPartiallySelected(region.id) ? 'true' : 'false';
                          }
                        }}
                        className={isRegionPartiallySelected(region.id) ? 'data-[state=unchecked]:bg-primary/30' : ''}
                        onCheckedChange={() => toggleRegion(region.id)}
                      />
                      <Label htmlFor={`region-${region.id}`} className="text-base font-semibold cursor-pointer">
                        {t(`regions.${region.nameKey}`)}
                      </Label>
                      <Badge variant="secondary" className="ml-auto">
                        {region.countries.filter(c => shippingCountries.includes(c.code)).length}/{region.countries.length}
                      </Badge>
                    </div>
                    {/* Countries Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ml-6">
                      {region.countries.map((country) => (
                        <div key={country.code} className="flex items-center gap-2">
                          <Checkbox
                            id={`country-${country.code}`}
                            checked={shippingCountries.includes(country.code)}
                            onCheckedChange={() => toggleCountry(country.code)}
                          />
                          <Label htmlFor={`country-${country.code}`} className="text-sm cursor-pointer">
                            {t(`countries.${country.nameKey}`)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-500">{t('shippingNote')}</p>
                  <p className="text-muted-foreground mt-1">{t('shippingNoteDesc')}</p>
                </div>
              </div>

              <Button onClick={() => handleSave('shipping')} disabled={loading} className="btn-gold">
                {loading ? tc('loading') : tc('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                {t('certTitle')}
              </CardTitle>
              <CardDescription>{t('certDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Certifications */}
              {certifications.length > 0 ? (
                <div className="space-y-3">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{cert.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {t(`certTypes.${cert.type}`)}
                            {cert.issueDate && ` · ${cert.issueDate}`}
                            {cert.expiryDate && ` ~ ${cert.expiryDate}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCertStatusBadge(cert.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCertification(cert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{t('noCertifications')}</p>
                </div>
              )}

              {/* Add Certification Form */}
              {showAddCert ? (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <h4 className="font-medium">{t('addCertification')}</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('certType')}</Label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={newCert.type}
                        onChange={(e) => setNewCert({ ...newCert, type: e.target.value })}
                      >
                        <option value="">{t('selectCertType')}</option>
                        {CERTIFICATION_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>
                            {t(`certTypes.${type.nameKey}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('certName')}</Label>
                      <Input
                        placeholder={t('certNamePlaceholder')}
                        value={newCert.name}
                        onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('issueDate')}</Label>
                      <Input
                        type="date"
                        value={newCert.issueDate}
                        onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('expiryDate')}</Label>
                      <Input
                        type="date"
                        value={newCert.expiryDate}
                        onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddCertification} disabled={!newCert.type || !newCert.name} className="btn-gold">
                      {tc('add')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddCert(false)}>
                      {tc('cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowAddCert(true)} className="w-full">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {t('addCertification')}
                </Button>
              )}

              {/* Certification Types Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">{t('availableCertTypes')}</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {CERTIFICATION_TYPES.map((type) => (
                    <div key={type.id} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{t(`certTypes.${type.nameKey}`)}</p>
                        <p className="text-xs text-muted-foreground">{t(`certTypes.${type.descKey}`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => handleSave('certifications')} disabled={loading} className="btn-gold">
                {loading ? tc('loading') : tc('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Tab */}
        <TabsContent value="commission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                {t('commissionTitle')}
              </CardTitle>
              <CardDescription>{t('commissionDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('baseCommission')}</Label>
                    <p className="text-sm text-muted-foreground">{t('baseCommissionDesc')}</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {settings.creatorCommissionRate}%
                  </div>
                </div>
                <Slider
                  value={[settings.creatorCommissionRate]}
                  onValueChange={(value) => setSettings({ ...settings, creatorCommissionRate: value[0] })}
                  min={5}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5%</span>
                  <span>50%</span>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label>{t('tieredCommission')}</Label>
                    <p className="text-sm text-muted-foreground">{t('tieredCommissionDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.enableTieredCommission}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableTieredCommission: checked })}
                  />
                </div>

                {settings.enableTieredCommission && (
                  <div className="grid gap-4 md:grid-cols-2 mt-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-zinc-400" />
                        {t('tierNormal')}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={settings.tier1Rate}
                          onChange={(e) => setSettings({ ...settings, tier1Rate: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-zinc-300" />
                        {t('tierSilver')}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={settings.tier2Rate}
                          onChange={(e) => setSettings({ ...settings, tier2Rate: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500" />
                        {t('tierGold')}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={settings.tier3Rate}
                          onChange={(e) => setSettings({ ...settings, tier3Rate: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-500" />
                        {t('tierVip')}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={settings.tier4Rate}
                          onChange={(e) => setSettings({ ...settings, tier4Rate: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                        <span>%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-500">{t('intlSettlementNote')}</p>
                  <p className="text-muted-foreground mt-1">{t('intlSettlementNoteDesc')}</p>
                </div>
              </div>

              <Button onClick={() => handleSave('commission')} disabled={loading} className="btn-gold">
                {loading ? tc('loading') : tc('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settlement Tab */}
        <TabsContent value="settlement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('settlementTitle')}
              </CardTitle>
              <CardDescription>{t('settlementDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t('settlementCycle')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'weekly', label: t('weekly') },
                    { value: 'biweekly', label: t('biweekly') },
                    { value: 'monthly', label: t('monthly') },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, settlementCycle: option.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.settlementCycle === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('minimumPayout')}</Label>
                <Input
                  type="number"
                  value={settings.minimumPayout}
                  onChange={(e) => setSettings({ ...settings, minimumPayout: parseInt(e.target.value) || 0 })}
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground">{t('minimumPayoutDesc')}</p>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">{t('bankInfo')}</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('bankName')}</Label>
                    <Input
                      placeholder={t('bankNamePlaceholder')}
                      value={settings.bankName}
                      onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('accountHolder')}</Label>
                    <Input
                      placeholder={t('accountHolderPlaceholder')}
                      value={settings.accountHolder}
                      onChange={(e) => setSettings({ ...settings, accountHolder: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t('accountNumber')}</Label>
                    <Input
                      placeholder="000-0000-0000-00"
                      value={settings.accountNumber}
                      onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave('settlement')} disabled={loading} className="btn-gold">
                {loading ? tc('loading') : tc('save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
