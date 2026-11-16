import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile } from "./types";

interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  verified: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));

  const load = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!supabase || !s) {
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const [p, a] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, created_at").eq("id", s.user.id).maybeSingle(),
      supabase.from("admin_users").select("user_id").eq("user_id", s.user.id).maybeSingle(),
    ]);
    setProfile((p.data as Profile) ?? null);
    setIsAdmin(Boolean(a.data));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      // token refreshes don't change who is logged in; skip the extra queries
      if (event === "TOKEN_REFRESHED") setSession(s);
      else setTimeout(() => load(s), 0); // outside the auth callback, as supabase-js recommends
    });
    return () => data.subscription.unsubscribe();
  }, [load]);

  const value: AuthState = {
    loading,
    session,
    profile,
    isAdmin,
    verified: Boolean(session?.user.email_confirmed_at),
    refreshProfile: () => load(session),
    signOut: async () => {
      await supabase?.auth.signOut();
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
