'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Palette, User, Link as LinkIcon, Eye, EyeOff, Save, Loader2, ExternalLink, Paintbrush, Camera, X } from 'lucide-react';
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
  const [isUploading, setIsUploading] = useState(false);
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState({
    displayName: '',
    bio: '',
    themeColor: '#d4af37',
    backgroundColor: '#1a1a1a',
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

  const backgroundColors = [
    { name: 'Dark', value: '#1a1a1a' },
    { name: 'Charcoal', value: '#2a2a2a' },
    { name: 'Navy', value: '#0f172a' },
    { name: 'Dark Purple', value: '#1e1033' },
    { name: 'Dark Green', value: '#0a1f1a' },
    { name: 'White', value: '#ffffff' },
    { name: 'Light Gray', value: '#f5f5f5' },
    { name: 'Warm White', value: '#faf8f5' },
    { name: 'Cool Gray', value: '#f0f4f8' },
  ];

  useEffect(() => {
    let cancelled = false;

    const safetyTimeout = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 3000);

    const loadCreatorData = async () => {
      try {
        const supabase = getClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || cancelled) {
          setIsLoading(false);
          return;
        }

        const { data: creator } = await supabase
          .from('creators')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (cancelled) return;

        if (creator) {
          setUsername(creator.username || '');
          setProfileImage(creator.profile_image || '');
          setSettings({
            displayName: creator.display_name || '',
            bio: creator.bio || '',
            themeColor: creator.theme_color || '#d4af37',
            backgroundColor: creator.background_color || '#1a1a1a',
            instagram: creator.instagram || '',
            youtube: creator.youtube || '',
            tiktok: creator.tiktok || '',
          });
        }
      } catch (error) {
        console.error('Failed to load creator data:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCreatorData();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다');
      return;
    }

    setIsUploading(true);
    try {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `creators/${session.user.id}/profile.${fileExt}`;

      // Upload to profiles bucket
      const { data, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // If profiles bucket doesn't exist, try products bucket
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('products')
          .upload(`profiles/${session.user.id}/profile.${fileExt}`, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (fallbackError) {
          console.error('Upload error:', fallbackError);
          toast.error('업로드에 실패했습니다');
          return;
        }

        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(`profiles/${session.user.id}/profile.${fileExt}`);

        const imageUrl = urlData.publicUrl;
        setProfileImage(imageUrl);

        await supabase
          .from('creators')
          .update({ profile_image: imageUrl })
          .eq('user_id', session.user.id);
      } else {
        const { data: urlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;
        setProfileImage(imageUrl);

        await supabase
          .from('creators')
          .update({ profile_image: imageUrl })
          .eq('user_id', session.user.id);
      }

      toast.success(t('settingsSaved'));
    } catch (error) {
      console.error('Profile upload error:', error);
      toast.error(tCommon('error'));
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveProfileImage = async () => {
    const supabase = getClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setProfileImage('');
    await supabase
      .from('creators')
      .update({ profile_image: null })
      .eq('user_id', session.user.id);

    toast.success(t('settingsSaved'));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const user = session.user;

      const { error } = await supabase
        .from('creators')
        .update({
          display_name: settings.displayName || null,
          bio: settings.bio || null,
          theme_color: settings.themeColor,
          background_color: settings.backgroundColor,
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

  const isLightBg = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold">{t('customizeShop')}</h1>
          <p className="text-sm text-muted-foreground">{t('customizeShopDesc')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1 sm:flex-none"
          >
            {showPreview ? (
              <><EyeOff className="mr-2 h-4 w-4" />{t('hidePreview')}</>
            ) : (
              <><Eye className="mr-2 h-4 w-4" />{t('shopPreview')}</>
            )}
          </Button>
          {username && (
            <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
              <a
                href={`/${locale}/shop/${username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t('viewLiveShop')}</span>
                <span className="sm:hidden">Live</span>
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Live Preview */}
      {showPreview && (
        <Card className="overflow-hidden border-2 border-primary/30">
          <div
            className="p-6 sm:p-8 text-center transition-colors duration-300"
            style={{
              backgroundColor: settings.backgroundColor,
              color: isLightBg(settings.backgroundColor) ? '#1a1a1a' : '#e8e8e8',
            }}
          >
            {profileImage ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-3 sm:mb-4 overflow-hidden border-2" style={{ borderColor: settings.themeColor }}>
                <Image src={profileImage} alt="Profile" width={80} height={80} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center text-white text-xl sm:text-2xl font-bold"
                style={{ backgroundColor: settings.themeColor }}
              >
                {settings.displayName?.charAt(0)?.toUpperCase() || username?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <h2 className="text-xl sm:text-2xl font-bold">
              {settings.displayName || username || 'Creator'}
            </h2>
            <p className="text-sm opacity-60 mt-1">@{username}</p>
            {settings.bio && (
              <p className="mt-3 text-sm max-w-md mx-auto opacity-80">{settings.bio}</p>
            )}
            <div className="flex justify-center gap-3 mt-4 flex-wrap">
              {settings.instagram && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: settings.themeColor + '30', color: settings.themeColor }}>Instagram</span>
              )}
              {settings.youtube && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: settings.themeColor + '30', color: settings.themeColor }}>YouTube</span>
              )}
              {settings.tiktok && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: settings.themeColor + '30', color: settings.themeColor }}>TikTok</span>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg flex items-center justify-center text-xs border border-dashed"
                  style={{
                    borderColor: isLightBg(settings.backgroundColor) ? '#00000020' : '#ffffff20',
                    backgroundColor: isLightBg(settings.backgroundColor) ? '#00000008' : '#ffffff08',
                    color: isLightBg(settings.backgroundColor) ? '#00000050' : '#ffffff50',
                  }}
                >
                  {t('productPlaceholder')}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Shop URL Banner */}
      {username && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('shopUrl')}</p>
              <p className="text-sm font-mono truncate">
                {typeof window !== 'undefined' ? window.location.origin : ''}/{locale}/shop/{username}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/${locale}/shop/${username}`;
                  navigator.clipboard.writeText(url);
                  toast.success(t('linkCopied'));
                }}
              >
                <LinkIcon className="mr-2 h-3 w-3" />
                {t('copyLink')}
              </Button>
              <Button size="sm" asChild className="btn-gold">
                <a href={`/${locale}/shop/${username}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  {t('viewLiveShop')}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-5 w-5" />
              {t('profileSection')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t('profileSectionDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfileImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all relative"
                >
                  {isUploading ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : profileImage ? (
                    <Image src={profileImage} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </button>
                {profileImage && (
                  <button
                    type="button"
                    onClick={handleRemoveProfileImage}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t('profileImage')}</p>
            </div>

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

        {/* Theme Color */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Palette className="h-5 w-5" />
              {t('themeColor')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t('themeColorDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSettings({ ...settings, themeColor: color.value })}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    settings.themeColor === color.value
                      ? 'border-primary scale-105'
                      : 'border-transparent hover:border-muted'
                  }`}
                  style={{ backgroundColor: color.value + '20' }}
                >
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mx-auto mb-1 sm:mb-2"
                    style={{ backgroundColor: color.value }}
                  />
                  <p className="text-[10px] sm:text-xs text-center">{color.name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Background Color */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Paintbrush className="h-5 w-5" />
              {t('backgroundColor')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t('backgroundColorDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {backgroundColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSettings({ ...settings, backgroundColor: color.value })}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    settings.backgroundColor === color.value
                      ? 'border-primary scale-105'
                      : 'border-transparent hover:border-muted'
                  }`}
                  style={{ backgroundColor: color.value + (isLightBg(color.value) ? '' : '40') }}
                >
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg mx-auto mb-1 sm:mb-2 border border-border/30"
                    style={{ backgroundColor: color.value }}
                  />
                  <p className="text-[10px] sm:text-xs text-center">{color.name}</p>
                </button>
              ))}
            </div>
            {/* Custom color picker */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <Label className="text-xs whitespace-nowrap">{t('customColor')}</Label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-border"
                />
                <Input
                  value={settings.backgroundColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                      setSettings({ ...settings, backgroundColor: val });
                    }
                  }}
                  placeholder="#1a1a1a"
                  className="font-mono text-sm h-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <LinkIcon className="h-5 w-5" />
              {t('socialLinks')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t('socialLinksDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid gap-4 grid-cols-1">
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
        <Button className="btn-gold w-full sm:w-auto" onClick={handleSave} disabled={isSaving}>
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
