'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Palette,
  User,
  Link as LinkIcon,
  Save,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  Settings,
  MessageSquare,
  QrCode,
  Instagram,
  Youtube,
  Music2,
  RefreshCw,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { getClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ShortUrl {
  id: string;
  short_code: string;
  is_primary: boolean;
  total_clicks: number;
  source_tag?: string;
  is_active: boolean;
}

interface ShopSettings {
  show_footer: boolean;
  footer_type: 'full' | 'minimal';
  show_social_links: boolean;
  show_subscriber_count: boolean;
  layout: 'grid' | 'list';
  products_per_row: number;
  show_prices: boolean;
  announcement: string;
  announcement_active: boolean;
}

export default function CreatorShopPage() {
  const t = useTranslations('creator');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = params.locale as string;

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [level, setLevel] = useState('bronze');
  const [shortUrls, setShortUrls] = useState<ShortUrl[]>([]);
  const [newShortCode, setNewShortCode] = useState('');
  const [newSourceTag, setNewSourceTag] = useState('general');

  const [settings, setSettings] = useState({
    displayName: '',
    bio: '',
    themeColor: '#d4af37',
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    instagram: '',
    youtube: '',
    tiktok: '',
    communityEnabled: false,
    communityType: 'board' as 'board' | 'chat',
  });

  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    show_footer: true,
    footer_type: 'full',
    show_social_links: true,
    show_subscriber_count: false,
    layout: 'grid',
    products_per_row: 3,
    show_prices: true,
    announcement: '',
    announcement_active: false,
  });

  const themeColors = [
    { name: 'Gold', value: '#d4af37' },
    { name: 'Rose', value: '#e91e63' },
    { name: 'Blue', value: '#2196f3' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Teal', value: '#009688' },
    { name: 'Pink', value: '#ff4081' },
    { name: 'Coral', value: '#ff6b6b' },
  ];

  const backgroundColors = [
    { name: 'Black', value: '#1a1a1a' },
    { name: 'White', value: '#ffffff' },
    { name: 'Dark Gray', value: '#2d2d2d' },
    { name: 'Navy', value: '#1a237e' },
    { name: 'Forest', value: '#1b5e20' },
    { name: 'Wine', value: '#4a1c40' },
  ];

  const levelColors: Record<string, { color: string; icon: string }> = {
    bronze: { color: '#CD7F32', icon: 'medal' },
    silver: { color: '#C0C0C0', icon: 'award' },
    gold: { color: '#FFD700', icon: 'crown' },
    platinum: { color: '#E5E4E2', icon: 'gem' },
    diamond: { color: '#B9F2FF', icon: 'diamond' },
  };

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
          .single();

        if (cancelled) return;

        if (creator) {
          setCreatorId(creator.id);
          setUsername(creator.username || '');
          setLevel(creator.level || 'bronze');
          setSettings({
            displayName: creator.display_name || '',
            bio: creator.bio || '',
            themeColor: creator.theme_color || '#d4af37',
            backgroundColor: creator.background_color || '#1a1a1a',
            textColor: creator.text_color || '#ffffff',
            instagram: creator.instagram || '',
            youtube: creator.youtube || '',
            tiktok: creator.tiktok || '',
            communityEnabled: creator.community_enabled || false,
            communityType: creator.community_type || 'board',
          });
          if (creator.shop_settings) {
            setShopSettings(creator.shop_settings);
          }

          // Load short URLs
          const { data: urls } = await supabase
            .from('short_urls')
            .select('*')
            .eq('creator_id', creator.id)
            .order('is_primary', { ascending: false });

          if (urls) {
            setShortUrls(urls);
          }
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('creators')
        .update({
          display_name: settings.displayName || null,
          bio: settings.bio || null,
          theme_color: settings.themeColor,
          background_color: settings.backgroundColor,
          text_color: settings.textColor,
          instagram: settings.instagram || null,
          youtube: settings.youtube || null,
          tiktok: settings.tiktok || null,
          community_enabled: settings.communityEnabled,
          community_type: settings.communityType,
          shop_settings: shopSettings,
        })
        .eq('user_id', session.user.id);

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

  const handleCreateShortUrl = async () => {
    if (!newShortCode || newShortCode.length < 3) {
      toast.error('Short code must be at least 3 characters');
      return;
    }

    try {
      const supabase = getClient();
      const { data, error } = await supabase
        .from('short_urls')
        .insert({
          creator_id: creatorId,
          short_code: newShortCode.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          source_tag: newSourceTag,
          is_primary: shortUrls.length === 0,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('This short code is already taken');
        } else {
          toast.error('Failed to create short URL');
        }
        return;
      }

      setShortUrls([...shortUrls, data]);
      setNewShortCode('');
      toast.success('Short URL created!');
    } catch (error) {
      toast.error('Failed to create short URL');
    }
  };

  const handleDeleteShortUrl = async (id: string) => {
    try {
      const supabase = getClient();
      await supabase.from('short_urls').delete().eq('id', id);
      setShortUrls(shortUrls.filter(u => u.id !== id));
      toast.success('Short URL deleted');
    } catch (error) {
      toast.error('Failed to delete short URL');
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getShortUrl = (code: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${locale}/s/${code}`;
    }
    return `/s/${code}`;
  };

  const getShopUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${locale}/@${username}`;
    }
    return `/@${username}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left: Settings Panel */}
      <div className="w-1/2 overflow-y-auto pr-4 space-y-6">
        <div className="flex items-center justify-between sticky top-0 bg-background py-2 z-10">
          <div>
            <h1 className="text-3xl font-headline font-bold">{t('customizeShop')}</h1>
            <p className="text-muted-foreground">{t('customizeShopDesc')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              style={{ backgroundColor: levelColors[level]?.color }}
              className="text-black font-medium"
            >
              <Award className="h-3 w-3 mr-1" />
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-1" /> Profile</TabsTrigger>
            <TabsTrigger value="theme"><Palette className="h-4 w-4 mr-1" /> Theme</TabsTrigger>
            <TabsTrigger value="urls"><LinkIcon className="h-4 w-4 mr-1" /> URLs</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" /> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    placeholder="Your shop name"
                    value={settings.displayName}
                    onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    placeholder="Tell customers about your shop..."
                    value={settings.bio}
                    onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Social Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" /> Instagram
                  </Label>
                  <Input
                    placeholder="https://instagram.com/..."
                    value={settings.instagram}
                    onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" /> YouTube
                  </Label>
                  <Input
                    placeholder="https://youtube.com/..."
                    value={settings.youtube}
                    onChange={(e) => setSettings({ ...settings, youtube: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music2 className="h-4 w-4" /> TikTok
                  </Label>
                  <Input
                    placeholder="https://tiktok.com/..."
                    value={settings.tiktok}
                    onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4 mt-4">
            {/* Theme Color */}
            <Card>
              <CardHeader>
                <CardTitle>Accent Color</CardTitle>
                <CardDescription>Choose your shop's main accent color</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {themeColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSettings({ ...settings, themeColor: color.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.themeColor === color.value
                          ? 'border-primary scale-105'
                          : 'border-transparent hover:border-muted'
                      }`}
                      style={{ backgroundColor: color.value + '20' }}
                    >
                      <div
                        className="w-6 h-6 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: color.value }}
                      />
                      <p className="text-xs text-center">{color.name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Background Color */}
            <Card>
              <CardHeader>
                <CardTitle>Background Color</CardTitle>
                <CardDescription>Set your shop's background</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {backgroundColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSettings({
                        ...settings,
                        backgroundColor: color.value,
                        textColor: color.value === '#ffffff' ? '#1a1a1a' : '#ffffff'
                      })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.backgroundColor === color.value
                          ? 'border-primary scale-105'
                          : 'border-transparent hover:border-muted'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full mx-auto mb-1 border"
                        style={{ backgroundColor: color.value }}
                      />
                      <p className="text-xs text-center">{color.name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="urls" className="space-y-4 mt-4">
            {/* Shop URL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Shop URL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input value={getShopUrl()} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(getShopUrl())}
                  >
                    {copiedUrl === getShopUrl() ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={getShopUrl()} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Short URLs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Short URLs
                </CardTitle>
                <CardDescription>
                  Create short links for Instagram, YouTube, etc.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create New */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="short_code"
                      value={newShortCode}
                      onChange={(e) => setNewShortCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="font-mono"
                    />
                  </div>
                  <select
                    value={newSourceTag}
                    onChange={(e) => setNewSourceTag(e.target.value)}
                    className="px-3 rounded-md border bg-muted"
                  >
                    <option value="general">General</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                  <Button onClick={handleCreateShortUrl}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* List */}
                <div className="space-y-2">
                  {shortUrls.map((url) => (
                    <div
                      key={url.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm truncate">
                            /s/{url.short_code}
                          </span>
                          {url.is_primary && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                          {url.source_tag && (
                            <Badge variant="outline" className="text-xs">{url.source_tag}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {url.total_clicks} clicks
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(getShortUrl(url.short_code))}
                        >
                          {copiedUrl === getShortUrl(url.short_code) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteShortUrl(url.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {shortUrls.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No short URLs created yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            {/* Community Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Community
                </CardTitle>
                <CardDescription>Enable community features for your shop</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Community</p>
                    <p className="text-sm text-muted-foreground">
                      Let buyers interact and share opinions
                    </p>
                  </div>
                  <Switch
                    checked={settings.communityEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, communityEnabled: checked })
                    }
                  />
                </div>
                {settings.communityEnabled && (
                  <div className="space-y-2">
                    <Label>Community Type</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={settings.communityType === 'board' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setSettings({ ...settings, communityType: 'board' })}
                      >
                        Board (Forum)
                      </Button>
                      <Button
                        variant={settings.communityType === 'chat' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setSettings({ ...settings, communityType: 'chat' })}
                      >
                        Chat
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shop Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Footer</p>
                    <p className="text-sm text-muted-foreground">Display legal footer</p>
                  </div>
                  <Switch
                    checked={shopSettings.show_footer}
                    onCheckedChange={(checked) =>
                      setShopSettings({ ...shopSettings, show_footer: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Social Links</p>
                    <p className="text-sm text-muted-foreground">Display social media links</p>
                  </div>
                  <Switch
                    checked={shopSettings.show_social_links}
                    onCheckedChange={(checked) =>
                      setShopSettings({ ...shopSettings, show_social_links: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Subscriber Count</p>
                    <p className="text-sm text-muted-foreground">Display how many follow your shop</p>
                  </div>
                  <Switch
                    checked={shopSettings.show_subscriber_count}
                    onCheckedChange={(checked) =>
                      setShopSettings({ ...shopSettings, show_subscriber_count: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Announcement */}
            <Card>
              <CardHeader>
                <CardTitle>Shop Announcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={shopSettings.announcement_active}
                    onCheckedChange={(checked) =>
                      setShopSettings({ ...shopSettings, announcement_active: checked })
                    }
                  />
                </div>
                <Textarea
                  placeholder="Enter announcement text..."
                  value={shopSettings.announcement}
                  onChange={(e) =>
                    setShopSettings({ ...shopSettings, announcement: e.target.value })
                  }
                  rows={3}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="sticky bottom-0 bg-background py-4 border-t">
          <Button className="w-full btn-gold" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{tCommon('loading')}</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />{tCommon('save')}</>
            )}
          </Button>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="w-1/2 border-l pl-6">
        <div className="sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
            </h2>
            <Button variant="outline" size="sm" asChild>
              <a href={getShopUrl()} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Shop
              </a>
            </Button>
          </div>

          {/* Preview Frame */}
          <div
            className="rounded-lg overflow-hidden border shadow-lg"
            style={{
              backgroundColor: settings.backgroundColor,
              color: settings.textColor,
            }}
          >
            {/* Announcement Banner */}
            {shopSettings.announcement_active && shopSettings.announcement && (
              <div
                className="p-2 text-center text-sm"
                style={{ backgroundColor: settings.themeColor }}
              >
                {shopSettings.announcement}
              </div>
            )}

            {/* Header */}
            <div className="p-6 text-center">
              <Avatar
                className="h-20 w-20 mx-auto mb-4 ring-4 ring-offset-2"
                style={{
                  ['--tw-ring-color' as any]: settings.themeColor,
                  ['--tw-ring-offset-color' as any]: settings.backgroundColor,
                }}
              >
                <AvatarFallback
                  style={{ backgroundColor: settings.themeColor }}
                  className="text-2xl font-bold text-white"
                >
                  {settings.displayName?.charAt(0)?.toUpperCase() || username?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-bold">
                {settings.displayName || username || 'Your Shop'}
              </h2>
              <p className="text-sm opacity-70 mt-1">@{username}</p>

              {shopSettings.show_subscriber_count && (
                <p className="text-xs opacity-50 mt-1">0 subscribers</p>
              )}

              {settings.bio && (
                <p className="mt-3 text-sm opacity-80 max-w-xs mx-auto">
                  {settings.bio}
                </p>
              )}

              {/* Social Links */}
              {shopSettings.show_social_links && (settings.instagram || settings.youtube || settings.tiktok) && (
                <div className="flex justify-center gap-3 mt-4">
                  {settings.instagram && (
                    <div
                      className="p-2 rounded-full"
                      style={{ backgroundColor: settings.themeColor + '30' }}
                    >
                      <Instagram className="h-4 w-4" style={{ color: settings.themeColor }} />
                    </div>
                  )}
                  {settings.youtube && (
                    <div
                      className="p-2 rounded-full"
                      style={{ backgroundColor: settings.themeColor + '30' }}
                    >
                      <Youtube className="h-4 w-4" style={{ color: settings.themeColor }} />
                    </div>
                  )}
                  {settings.tiktok && (
                    <div
                      className="p-2 rounded-full"
                      style={{ backgroundColor: settings.themeColor + '30' }}
                    >
                      <Music2 className="h-4 w-4" style={{ color: settings.themeColor }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Products Grid Preview */}
            <div className="p-6 pt-0">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg flex items-center justify-center text-xs border border-dashed"
                    style={{
                      borderColor: settings.themeColor + '40',
                      backgroundColor: settings.themeColor + '10',
                      color: settings.textColor,
                      opacity: 0.5,
                    }}
                  >
                    Product {i}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Preview */}
            {shopSettings.show_footer && (
              <div
                className="p-4 text-center text-xs border-t"
                style={{
                  borderColor: settings.textColor + '20',
                  opacity: 0.5,
                }}
              >
                <p>KviewShop | Terms | Privacy</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
