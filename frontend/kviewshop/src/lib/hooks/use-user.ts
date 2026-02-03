'use client';

import { useEffect, useState } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User, Brand, Creator } from '@/types/database';

export function useUser() {
  const { user, brand, creator, isLoading, setUser, setBrand, setCreator, setLoading } =
    useAuthStore();
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = getClient();

    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserData(session.user.id);
      } else {
        setSupabaseUser(null);
        setUser(null);
        setBrand(null);
        setCreator(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    const supabase = getClient();
    setLoading(true);

    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Fetch role-specific data
      if (userData.role === 'brand_admin') {
        const { data: brandData } = await supabase
          .from('brands')
          .select('*')
          .eq('user_id', userId)
          .single();
        setBrand(brandData);
      } else if (userData.role === 'creator') {
        const { data: creatorData } = await supabase
          .from('creators')
          .select('*')
          .eq('user_id', userId)
          .single();
        setCreator(creatorData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const supabase = getClient();
    await supabase.auth.signOut();
    setSupabaseUser(null);
    setUser(null);
    setBrand(null);
    setCreator(null);
  };

  return {
    user,
    brand,
    creator,
    supabaseUser,
    isLoading,
    signOut,
    refetch: supabaseUser ? () => fetchUserData(supabaseUser.id) : undefined,
  };
}
