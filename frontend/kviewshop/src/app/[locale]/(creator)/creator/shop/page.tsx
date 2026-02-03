'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Palette, User, Link as LinkIcon, Eye, EyeOff, Save, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getClient } from '@/lib/supabase/client';

export default function CreatorShopPage() {
  const t = useTranslations('creator');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = params.locale as string;

  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [settings, setSettings] = useState({
    displayName: '',
    bio: '',
    themeColor: '#d4af37',
    instagram: '',
    youtube: '',
    tiktok: '',
  });

  const themeColors = [
    { name: 'Gold', value: '#d4af37' },
    { name: 'Rose', value: '#e91e63' },
    { name: 'Blue', value: '#2196f3' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Black', value: '#1a1a1a' },
    { name: 'Teal', value: '#009688' },
    { name: 'Pink', value: '#ff4081' },
  ];

  useEffect(() => {
    loadCreatorData();
  }, []);

  const loadCreatorData = async () => {
    try {
      const supabase = getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: creator } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (creator) {
        setUsername(creator.username);
        setSettings({
          displayName: creator.display_name || '',
          bio: creator.bio || '',
          themeColor: creator.theme_color || '#d4af37',
          instagram: creator.instagram || '',
          youtube: creator.youtube || '',
          tiktok: creator.tiktok || '',
        });
      }
    } catch (error) {
      console.error('Failed to load creator data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('creators')
        .update({
          display_name: settings.displayName || null,
          bio: settings.bio || null,
          theme_color: settings.themeColor,
          instagram: settings.instagram || null,
          youtube: settings.youtube || null,
          tiktok: settings.tiktok || null,
        })
        .eq('user_id', user.id);

      if (error) {
        toast.error(tCommon('error'));
        console.error('Save error:', error);
      } else {
        toast.success(t('settingsSaved'));
      }
    } catch (error) {
      toast.error(tCommon('error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">{t('customizeShop')}</h1>
          <p className="text-muted-foreground">{t('customizeShopDesc')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <><EyeOff className="mr-2 h-4 w-4" />{t('hidePreview')}</>
            ) : (
              <><Eye className="mr-2 h-4 w-4" />{t('shopPreview')}</>
            )}
          </Button>
          {username && (
            <Button variant="outline" asChild>
              <a
                href={`/${locale}/@${username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {t('viewLiveShop')}
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Live Preview */}
      {showPreview && (
        <Card className="overflow-hidden border-2 border-primary/30">
          <div
            className="p-8 text-center"
            style={{ backgroundColor: settings.themeColor + '15' }}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: settings.themeColor }}
            >
              {settings.displayName?.charAt(0)?.toUpperCase() || username?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <h2 className="text-2xl font-bold">
              {settings.displayName || username || 'Creator'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">@{username}</p>
            {settings.bio && (
              <p className="mt-3 text-sm max-w-md mx-auto">{settings.bio}</p>
            )}
            <div className="flex justify-center gap-4 mt-4">
              {settings.instagram && (
                <span className="text-xs px-2 py-1 rounded-full bg-muted">Instagram</span>
              )}
              {settings.youtube && (
                <span className="text-xs px-2 py-1 rounded-full bg-muted">YouTube</span>
              )}
              {settings.tiktok && (
                <span className="text-xs px-2 py-1 rounded-full bg-muted">TikTok</span>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground text-xs border border-dashed border-muted-foreground/20"
                >
                  {t('productPlaceholder')}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profileSection')}
            </CardTitle>
            <CardDescription>{t('profileSectionDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('displayName')}</Label>
              <Input
                placeholder={t('displayNamePlaceholder')}
                value={settings.displayName}
                onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('bio')}</Label>
              <Textarea
                placeholder={t('bioPlaceholder')}
                value={settings.bio}
                onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('themeColor')}
            </CardTitle>
            <CardDescription>{t('themeColorDesc')}</CardDescription>
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

        {/* Social Links */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              {t('socialLinks')}
            </CardTitle>
            <CardDescription>{t('socialLinksDesc')}</CardDescription>
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
        <Button className="btn-gold" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{tCommon('loading')}</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />{tCommon('save')}</>
          )}
        </Button>
      </div>
    </div>
  );
}
