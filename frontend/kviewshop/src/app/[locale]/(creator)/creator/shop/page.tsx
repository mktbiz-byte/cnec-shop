'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

  const [settings, setSettings] = useState({
    displayName: '',
    bio: '',
    themeColor: '#d4af37',
    backgroundColor: '#1a1a1a',

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
          setCreatorId(creator.id);
          setUsername(creator.username || '');

          setSettings({
            displayName: creator.display_name || '',
            bio: creator.bio || '',
            themeColor: creator.theme_color || '#d4af37',
            backgroundColor: creator.background_color || '#1a1a1a',

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


  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (

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

              </div>
            </div>


      </div>
    </div>
  );
}
