'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { User, CreditCard, Bell, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatorSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // 프로필 정보
    displayName: '',
    email: '',
    phone: '',
    country: 'US',
    // 정산 정보
    paymentMethod: 'paypal',
    paypalEmail: '',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    // 알림 설정
    emailNotifications: true,
    orderNotifications: true,
    settlementNotifications: true,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      toast.success('설정이 저장되었습니다');
    } catch (error) {
      toast.error('저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const countries = [
    { code: 'US', name: '미국', flag: '🇺🇸' },
    { code: 'JP', name: '일본', flag: '🇯🇵' },
    { code: 'KR', name: '한국', flag: '🇰🇷' },
    { code: 'CN', name: '중국', flag: '🇨🇳' },
    { code: 'TW', name: '대만', flag: '🇹🇼' },
    { code: 'TH', name: '태국', flag: '🇹🇭' },
    { code: 'VN', name: '베트남', flag: '🇻🇳' },
    { code: 'ID', name: '인도네시아', flag: '🇮🇩' },
    { code: 'MY', name: '말레이시아', flag: '🇲🇾' },
    { code: 'SG', name: '싱가포르', flag: '🇸🇬' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">설정</h1>
        <p className="text-muted-foreground">계정 및 정산 설정을 관리합니다</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">프로필</TabsTrigger>
          <TabsTrigger value="payment">정산 정보</TabsTrigger>
          <TabsTrigger value="notifications">알림</TabsTrigger>
        </TabsList>

        {/* 프로필 탭 */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                프로필 정보
              </CardTitle>
              <CardDescription>기본 계정 정보를 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>표시 이름</Label>
                  <Input
                    placeholder="크리에이터 이름"
                    value={settings.displayName}
                    onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>이메일</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>전화번호</Label>
                  <Input
                    placeholder="+1 000-000-0000"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    거주 국가
                  </Label>
                  <select
                    value={settings.country}
                    onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button onClick={handleSave} disabled={loading} className="btn-gold">
                {loading ? '저장 중...' : '저장하기'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 정산 정보 탭 */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                정산 정보
              </CardTitle>
              <CardDescription>수익 정산을 받을 계좌 정보를 입력합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 정산 방법 선택 */}
              <div className="space-y-2">
                <Label>정산 방법</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'paypal', label: 'PayPal' },
                    { value: 'bank', label: '해외 송금' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, paymentMethod: option.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.paymentMethod === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* PayPal 정보 */}
              {settings.paymentMethod === 'paypal' && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label>PayPal 이메일</Label>
                    <Input
                      type="email"
                      placeholder="paypal@example.com"
                      value={settings.paypalEmail}
                      onChange={(e) => setSettings({ ...settings, paypalEmail: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      PayPal 계정에 등록된 이메일 주소를 입력하세요
                    </p>
                  </div>
                </div>
              )}

              {/* 해외 송금 정보 */}
              {settings.paymentMethod === 'bank' && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>은행명 (영문)</Label>
                      <Input
                        placeholder="Bank Name"
                        value={settings.bankName}
                        onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SWIFT/BIC 코드</Label>
                      <Input
                        placeholder="XXXXXXXX"
                        value={settings.swiftCode}
                        onChange={(e) => setSettings({ ...settings, swiftCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>계좌번호 (IBAN)</Label>
                      <Input
                        placeholder="계좌번호를 입력하세요"
                        value={settings.accountNumber}
                        onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 안내 메시지 */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium text-blue-500">해외 크리에이터 정산 안내</span>
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>• 해외 거주 크리에이터는 원천징수세가 적용되지 않습니다</li>
                  <li>• 정산은 USD로 진행되며, 최소 정산 금액은 $50입니다</li>
                  <li>• 정산 주기는 월 1회 (매월 15일)입니다</li>
                </ul>
              </div>

              <Button onClick={handleSave} disabled={loading} className="btn-gold">
                {loading ? '저장 중...' : '저장하기'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알림 설정 탭 */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                알림 설정
              </CardTitle>
              <CardDescription>알림 수신 설정을 관리합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>이메일 알림</Label>
                  <p className="text-sm text-muted-foreground">이메일로 알림을 받습니다</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>주문 알림</Label>
                  <p className="text-sm text-muted-foreground">새 주문이 들어오면 알림을 받습니다</p>
                </div>
                <Switch
                  checked={settings.orderNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, orderNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>정산 알림</Label>
                  <p className="text-sm text-muted-foreground">정산 완료 시 알림을 받습니다</p>
                </div>
                <Switch
                  checked={settings.settlementNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, settlementNotifications: checked })}
                />
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
