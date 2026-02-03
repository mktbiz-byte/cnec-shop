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
    let cancelled = false;

    // Get initial session (getSession reads from local storage, fast & reliable)
    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.user) {
          setSupabaseUser(session.user);
          await fetchUserData(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (!cancelled) setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
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

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
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

      if (userError) {
        console.error('Error fetching user record:', userError);
        // User might not have a record in users table yet (signed up via auth only)
        // Use metadata from auth as fallback
        setLoading(false);
        return;
      }
      setUser(userData);

      // Fetch role-specific data
      if (userData.role === 'brand_admin') {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (!brandError) setBrand(brandData);
      } else if (userData.role === 'creator') {
        const { data: creatorData, error: creatorError } = await supabase
          .from('creators')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (!creatorError) setCreator(creatorData);
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
