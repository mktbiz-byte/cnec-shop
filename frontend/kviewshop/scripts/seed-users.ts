import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client (service role key needed)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test accounts to create
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

async function seedUsers() {
  console.log('🌱 Starting user seed...\n');

  for (const account of testAccounts) {
    console.log(`Creating ${account.role}: ${account.email}`);

    try {
      // 1. Create Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          name: account.name,
          role: account.role,
        },
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`  ⚠️  User already exists, skipping auth creation`);

          // Get existing user
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.users.find(u => u.email === account.email);

          if (existingUser) {
            // Update user record if needed
            await createUserRecord(existingUser.id, account);
          }
          continue;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      console.log(`  ✅ Auth user created: ${authData.user.id}`);

      // 2. Create user record in users table
      await createUserRecord(authData.user.id, account);

    } catch (error) {
      console.error(`  ❌ Error creating ${account.email}:`, error);
    }

    console.log('');
  }

  console.log('\n✨ Seed complete!\n');
  console.log('='.repeat(50));
  console.log('Test Accounts:');
  console.log('='.repeat(50));
  testAccounts.forEach((acc) => {
    console.log(`\n[${acc.role.toUpperCase()}]`);
    console.log(`  Email: ${acc.email}`);
    console.log(`  Password: ${acc.password}`);
  });
  console.log('\n' + '='.repeat(50));
}

async function createUserRecord(userId: string, account: typeof testAccounts[0]) {
  // Insert into users table
  const { error: userError } = await supabase.from('users').upsert({
    id: userId,
    email: account.email,
    name: account.name,
    role: account.role,
  });

  if (userError) {
    console.log(`  ⚠️  User record error:`, userError.message);
  } else {
    console.log(`  ✅ User record created`);
  }

  // Create role-specific record
  if (account.role === 'brand_admin' && 'brandData' in account) {
    const { error: brandError } = await supabase.from('brands').upsert({
      user_id: userId,
      ...account.brandData,
    });

    if (brandError) {
      console.log(`  ⚠️  Brand record error:`, brandError.message);
    } else {
      console.log(`  ✅ Brand record created`);
    }
  }

  if (account.role === 'creator' && 'creatorData' in account) {
    const { error: creatorError } = await supabase.from('creators').upsert({
      user_id: userId,
      ...account.creatorData,
    });

    if (creatorError) {
      console.log(`  ⚠️  Creator record error:`, creatorError.message);
    } else {
      console.log(`  ✅ Creator record created`);
    }
  }
}

// Run the seed
seedUsers().catch(console.error);
