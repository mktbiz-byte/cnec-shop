'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Palette, User, Link as LinkIcon, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatorShopPage() {
  const [settings, setSettings] = useState({
    displayName: '',
    bio: '',
    themeColor: '#d4af37',
    instagram: '',
    youtube: '',
    tiktok: '',
  });

  const handleSave = () => {
    toast.success('설정이 저장되었습니다');
  };

  const themeColors = [
    { name: '골드', value: '#d4af37' },
    { name: '로즈', value: '#e91e63' },
    { name: '블루', value: '#2196f3' },
    { name: '퍼플', value: '#9c27b0' },
    { name: '그린', value: '#4caf50' },
    { name: '오렌지', value: '#ff9800' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">샵 꾸미기</h1>
          <p className="text-muted-foreground">내 샵 외관을 커스터마이징합니다</p>
        </div>
        <Button variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          미리보기
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              프로필
            </CardTitle>
            <CardDescription>공개 프로필 정보</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>표시 이름</Label>
              <Input
                placeholder="샵에 표시될 이름"
                value={settings.displayName}
                onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>소개</Label>
              <Textarea
                placeholder="나를 소개하는 글을 작성해주세요"
                value={settings.bio}
                onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              테마
            </CardTitle>
            <CardDescription>샵 강조 색상 선택</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSettings({ ...settings, themeColor: color.value })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.themeColor === color.value
                      ? 'border-primary scale-105'
                      : 'border-transparent hover:border-muted'
                  }`}
                  style={{ backgroundColor: color.value + '20' }}
                >
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: color.value }}
                  />
                  <p className="text-xs text-center">{color.name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              소셜 링크
            </CardTitle>
            <CardDescription>소셜 미디어 계정 연결</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  placeholder="https://instagram.com/..."
                  value={settings.instagram}
                  onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>YouTube</Label>
                <Input
                  placeholder="https://youtube.com/..."
                  value={settings.youtube}
                  onChange={(e) => setSettings({ ...settings, youtube: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>TikTok</Label>
                <Input
                  placeholder="https://tiktok.com/..."
                  value={settings.tiktok}
                  onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button className="btn-gold" onClick={handleSave}>
          저장하기
        </Button>
      </div>
    </div>
  );
}
