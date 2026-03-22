'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import { parseUserType } from './user-type';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type UserType = 'vendedor' | 'comum';

export type PaymentPreference = 'transferencia' | 'mbway';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
  user_type: UserType;
  balance?: number;
  phone?: string | null;
  address?: string | null;
  iban?: string | null;
  payment_preference?: PaymentPreference | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Nunca lançar exceção — evita auth a ficar em loading eterno.
   * Importante: não usar await disto dentro de onAuthStateChange (bloqueia o cliente Supabase).
   */
  const fetchProfile = async (userId: string, sessionUserArg?: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      /** Fonte de verdade: `profiles.user_type`. Metadados Auth não sobrepõem a BD. */
      if (data) {
        const effectiveUserType: UserType =
          parseUserType(data.user_type) === 'vendedor' ? 'vendedor' : 'comum';
        setProfile({ ...(data as Profile), user_type: effectiveUserType });
        return;
      }

      if (error?.code === 'PGRST116' && sessionUserArg) {
        const metaType = sessionUserArg?.user_metadata?.user_type;
        const effectiveUserType: UserType =
          parseUserType(metaType) === 'vendedor' ? 'vendedor' : 'comum';
        setProfile({
          id: userId,
          full_name: (sessionUserArg.user_metadata?.full_name as string) ?? null,
          user_type: effectiveUserType,
          created_at: '',
          updated_at: '',
        });
        return;
      }

      setProfile(null);
    } catch (e) {
      console.error('[Auth] fetchProfile falhou', e);
      setProfile(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const applySession = (session: { user: SupabaseUser } | null) => {
      if (cancelled) return;
      if (session?.user) {
        setSessionUser(session.user);
        setUser({ id: session.user.id, email: session.user.email ?? undefined });
        setLoading(false);
        void fetchProfile(session.user.id, session.user);
      } else {
        setSessionUser(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      applySession(session);
    });

    void (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) {
          console.error('[Auth] getSession', error);
          setLoading(false);
          return;
        }
        applySession(session);
      } catch (e) {
        console.error('[Auth] getSession exceção', e);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSessionUser(null);
      setUser(null);
      setProfile(null);
      router.replace('/');
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const u = sessionUser ?? (await supabase.auth.getUser()).data.user;
      if (u) await fetchProfile(user.id, u);
      else await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
