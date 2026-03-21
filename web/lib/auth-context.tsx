'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { isVendedorType, parseUserType } from './user-type';
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
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, sessionUser?: SupabaseUser) => {
    const metaType = sessionUser?.user_metadata?.user_type;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const dbType = data?.user_type;
    const effectiveIsVendedor = isVendedorType(dbType, metaType);
    const effectiveUserType: UserType = effectiveIsVendedor ? 'vendedor' : 'comum';

    // Corrigir BD se o registo foi como vendedor mas a linha em profiles ficou "comum"
    if (data && parseUserType(dbType) === 'comum' && parseUserType(metaType) === 'vendedor') {
      void supabase
        .from('profiles')
        .update({ user_type: 'vendedor', updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    if (data) {
      setProfile({ ...(data as Profile), user_type: effectiveUserType });
      return;
    }

    // Sem linha em profiles (ex.: utilizador antigo) — ainda assim mostrar tipo a partir dos metadados Auth
    if (error?.code === 'PGRST116' && sessionUser) {
      setProfile({
        id: userId,
        full_name: (sessionUser.user_metadata?.full_name as string) ?? null,
        user_type: effectiveUserType,
        created_at: '',
        updated_at: '',
      });
      return;
    }

    setProfile(null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setSessionUser(session.user);
          setUser({ id: session.user.id, email: session.user.email ?? undefined });
          await fetchProfile(session.user.id, session.user);
        } else {
          setSessionUser(null);
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser(session.user);
        setUser({ id: session.user.id, email: session.user.email ?? undefined });
        try {
          await fetchProfile(session.user.id, session.user);
        } finally {
          setLoading(false);
        }
      } else {
        setSessionUser(null);
        setLoading(false);
      }
    })();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setUser(null);
    setProfile(null);
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
