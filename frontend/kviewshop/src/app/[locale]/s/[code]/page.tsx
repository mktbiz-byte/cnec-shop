'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ShortUrlRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const locale = params.locale as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const supabase = getClient();

        // Find short URL by code
        const { data: shortUrl, error: fetchError } = await supabase
          .from('short_urls')
          .select(`
            *,
            creator:creators (
              username
            )
          `)
          .eq('short_code', code.toLowerCase())
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError || !shortUrl) {
          setError('Link not found');
          return;
        }

        // Check if expired
        if (shortUrl.expires_at && new Date(shortUrl.expires_at) < new Date()) {
          setError('This link has expired');
          return;
        }

        // Record analytics
        await supabase.from('short_url_analytics').insert({
          short_url_id: shortUrl.id,
          referrer: typeof document !== 'undefined' ? document.referrer : null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          device_type: getDeviceType(),
        });

        // Redirect to creator shop
        const username = shortUrl.creator?.username;
        if (username) {
          router.replace(`/${locale}/@${username}`);
        } else {
          setError('Shop not found');
        }
      } catch (err) {
        console.error('Redirect error:', err);
        setError('Something went wrong');
      }
    };

    handleRedirect();
  }, [code, locale, router]);

  const getDeviceType = () => {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|iphone|android/i.test(ua)) return 'mobile';
    return 'desktop';
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Oops!</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <a
            href={`/${locale}`}
            className="text-primary hover:underline"
          >
            Go to homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Redirecting to shop...</p>
      </div>
    </div>
  );
}
