'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings, Percent, Building2, CreditCard, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getClient } from '@/lib/supabase/client';

export default function BrandSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // 브랜드 기본 정보
    brandName: '',
    businessNumber: '',
    contactEmail: '',
    contactPhone: '',
    // 수수료 설정
    creatorCommissionRate: 20, // 크리에이터에게 지급할 수수료율 (%)
    enableTieredCommission: false, // 등급별 차등 수수료
    tier1Rate: 15, // 일반 크리에이터
    tier2Rate: 20, // 실버 크리에이터
    tier3Rate: 25, // 골드 크리에이터
    tier4Rate: 30, // VIP 크리에이터
    // 정산 설정
    settlementCycle: 'monthly', // weekly, biweekly, monthly
    minimumPayout: 50, // USD
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // 여기서 Supabase에 저장
      toast.success('설정이 저장되었습니다');
    } catch (error) {
      toast.error('저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">브랜드 설정</h1>
        <p className="text-muted-foreground">브랜드 정보 및 수수료 설정을 관리합니다</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">기본 정보</TabsTrigger>
          <TabsTrigger value="commission">수수료 설정</TabsTrigger>
          <TabsTrigger value="settlement">정산 설정</TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                브랜드 정보
              </CardTitle>
              <CardDescription>브랜드 기본 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>브랜드명</Label>
                  <Input
                    placeholder="브랜드 이름"
                    value={settings.brandName}
                    onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>사업자등록번호</Label>
                  <Input
                    placeholder="000-00-00000"
                    value={settings.businessNumber}
                    onChange={(e) => setSettings({ ...settings, businessNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>연락처 이메일</Label>
                  <Input
                    type="email"
                    placeholder="contact@brand.com"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>연락처 전화번호</Label>
                  <Input
                    placeholder="02-0000-0000"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={loading} className="btn-gold">
                {loading ? '저장 중...' : '저장하기'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 수수료 설정 탭 */}
        <TabsContent value="commission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                크리에이터 수수료 설정
              </CardTitle>
              <CardDescription>
                크리에이터에게 지급할 판매 수수료율을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 기본 수수료율 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>기본 수수료율</Label>
                    <p className="text-sm text-muted-foreground">
                      모든 크리에이터에게 적용되는 기본 수수료율
                    </p>
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

              {/* 등급별 차등 수수료 */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label>등급별 차등 수수료</Label>
                    <p className="text-sm text-muted-foreground">
                      크리에이터 등급에 따라 다른 수수료율 적용
                    </p>
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
                        일반 크리에이터
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
                        실버 크리에이터
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
                        골드 크리에이터
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
                        VIP 크리에이터
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

              {/* 안내 메시지 */}
              <div className="flex items-start gap-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-500">해외 크리에이터 정산 안내</p>
                  <p className="text-muted-foreground mt-1">
                    해외 크리에이터의 경우 원천징수세 없이 전액 지급됩니다.
                    정산은 USD 또는 해당 국가 통화로 진행됩니다.
                  </p>
                </div>
              </div>

              <Button onClick={handleSave} disabled={loading} className="btn-gold">
                {loading ? '저장 중...' : '저장하기'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 정산 설정 탭 */}
        <TabsContent value="settlement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                정산 설정
              </CardTitle>
              <CardDescription>정산 주기 및 계좌 정보를 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 정산 주기 */}
              <div className="space-y-2">
                <Label>정산 주기</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'weekly', label: '주간' },
                    { value: 'biweekly', label: '격주' },
                    { value: 'monthly', label: '월간' },
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

              {/* 최소 정산 금액 */}
              <div className="space-y-2">
                <Label>최소 정산 금액 (USD)</Label>
                <Input
                  type="number"
                  value={settings.minimumPayout}
                  onChange={(e) => setSettings({ ...settings, minimumPayout: parseInt(e.target.value) || 0 })}
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground">
                  이 금액 이상일 때만 정산이 진행됩니다
                </p>
              </div>

              {/* 계좌 정보 */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">정산 계좌 정보</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>은행명</Label>
                    <Input
                      placeholder="은행명"
                      value={settings.bankName}
                      onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>예금주</Label>
                    <Input
                      placeholder="예금주명"
                      value={settings.accountHolder}
                      onChange={(e) => setSettings({ ...settings, accountHolder: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>계좌번호</Label>
                    <Input
                      placeholder="000-0000-0000-00"
                      value={settings.accountNumber}
                      onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={loading} className="btn-gold">
                {loading ? '저장 중...' : '저장하기'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
