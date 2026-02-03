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
    displayName: 'Sakura Beauty',
    bio: 'K-Beauty enthusiast sharing my favorite products from Korea!',
    themeColor: '#d4af37',
    instagram: 'https://instagram.com/sakura_beauty',
    youtube: '',
    tiktok: '',
  });

  const handleSave = () => {
    toast.success('Shop settings saved!');
  };

  const themeColors = [
    { name: 'Gold', value: '#d4af37' },
    { name: 'Rose', value: '#e91e63' },
    { name: 'Blue', value: '#2196f3' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Orange', value: '#ff9800' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Customize Shop</h1>
          <p className="text-muted-foreground">Personalize your shop appearance</p>
        </div>
        <Button variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          Preview Shop
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your public profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={settings.displayName}
                onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
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
              Theme
            </CardTitle>
            <CardDescription>Choose your shop accent color</CardDescription>
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
              Social Links
            </CardTitle>
            <CardDescription>Connect your social media accounts</CardDescription>
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
          Save Changes
        </Button>
      </div>
    </div>
  );
}
