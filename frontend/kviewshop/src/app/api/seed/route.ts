import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Test accounts
const testAccounts = [
  {
    email: 'admin@kviewshop.com',
    password: 'admin123!@#',
    name: 'Super Admin',
    role: 'super_admin' as const,
  },
  {
    email: 'brand@kviewshop.com',
    password: 'brand123!@#',
    name: 'Test Brand',
    role: 'brand_admin' as const,
    brandData: {
      company_name: 'Beauty Lab Korea',
      company_name_en: 'Beauty Lab Korea',
      company_name_jp: 'ビューティーラボコリア',
      business_number: '123-45-67890',
      description: '프리미엄 K-뷰티 브랜드',
      description_en: 'Premium K-Beauty Brand',
      description_jp: 'プレミアムK-ビューティーブランド',
      approved: true,
      creator_commission_rate: 25,
    },
  },
  {
    email: 'creator@kviewshop.com',
    password: 'creator123!@#',
    name: 'Sakura Beauty',
    role: 'creator' as const,
    creatorData: {
      username: 'sakura_beauty',
      display_name: 'Sakura Beauty',
      bio: '일본에서 활동하는 K-뷰티 크리에이터입니다.',
      bio_en: 'K-Beauty creator based in Japan.',
      bio_jp: '日本で活動するK-ビューティークリエイターです。',
      theme_color: '#d4af37',
      country: 'JP' as const,
      social_links: {
        instagram: 'https://instagram.com/sakura_beauty',
        youtube: 'https://youtube.com/@sakura_beauty',
        tiktok: 'https://tiktok.com/@sakura_beauty',
      },
    },
  },
];

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      {
        error: 'Missing Supabase credentials',
        hint: 'Set SUPABASE_SERVICE_ROLE_KEY in .env.local',
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const results: { email: string; status: string; error?: string }[] = [];

  for (const account of testAccounts) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === account.email);

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        results.push({ email: account.email, status: 'exists (updated records)' });
      } else {
        // Create Auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            name: account.name,
            role: account.role,
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        userId = authData.user.id;
        results.push({ email: account.email, status: 'created' });
      }

      // Upsert user record
      await supabase.from('users').upsert({
        id: userId,
        email: account.email,
        name: account.name,
        role: account.role,
      });

      // Create role-specific record
      if (account.role === 'brand_admin' && 'brandData' in account) {
        await supabase.from('brands').upsert({
          user_id: userId,
          ...account.brandData,
        }, { onConflict: 'user_id' });
      }

      if (account.role === 'creator' && 'creatorData' in account) {
        await supabase.from('creators').upsert({
          user_id: userId,
          ...account.creatorData,
        }, { onConflict: 'user_id' });
      }

    } catch (error) {
      results.push({
        email: account.email,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    message: 'Seed completed',
    results,
    accounts: testAccounts.map(a => ({
      role: a.role,
      email: a.email,
      password: a.password,
    })),
  });
}
