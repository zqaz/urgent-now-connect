import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type UserProfile = Tables<"profiles">;
export type UserProfileUpdate = Omit<TablesUpdate<"profiles">, "id" | "updated_at">;

function isTableMissingError(error: unknown): boolean {
  const msg = (error as { message?: string })?.message ?? "";
  return (
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    msg.includes("profiles")
  );
}

const storageKey = (id: string) => `un_profile_${id}`;

function loadLocalProfile(id: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function saveLocalProfile(profile: UserProfile) {
  try {
    localStorage.setItem(storageKey(profile.id), JSON.stringify(profile));
  } catch {}
}

// Realistic demo profile pre-loaded for first-time users
function makeDemoProfile(id: string): UserProfile {
  return {
    id,
    name: "Alex Johnson",
    date_of_birth: "1990-04-15",
    insurance_id: "premera",
    blood_type: "O+",
    allergies: "Penicillin, Sulfa drugs",
    medications: "Metformin 500mg (twice daily), Vitamin D 2000 IU",
    conditions: "Type 2 Diabetes (well-controlled), Seasonal Allergies",
    emergency_contact_name: "Jordan Johnson",
    emergency_contact_phone: "(206) 555-0182",
    notes: "Prefer UW Medicine facilities when possible.",
    updated_at: new Date().toISOString(),
  };
}

function makeEmptyProfile(id: string): UserProfile {
  return {
    id,
    name: null,
    date_of_birth: null,
    insurance_id: null,
    blood_type: null,
    allergies: null,
    medications: null,
    conditions: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    notes: null,
    updated_at: new Date().toISOString(),
  };
}

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error && isTableMissingError(error)) {
      // Supabase table not created yet — use localStorage with demo data
      setIsLocalMode(true);
      const existing = loadLocalProfile(user.id);
      setProfile(existing ?? makeDemoProfile(user.id));
    } else {
      setIsLocalMode(false);
      setProfile(data ?? makeEmptyProfile(user.id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const upsertProfile = useCallback(
    async (updates: UserProfileUpdate): Promise<{ data: UserProfile | null; error: Error | null }> => {
      if (!user) return { data: null, error: new Error("Not authenticated") };
      setSaving(true);

      if (isLocalMode) {
        const existing = loadLocalProfile(user.id) ?? makeDemoProfile(user.id);
        const updated: UserProfile = {
          ...existing,
          ...updates,
          id: user.id,
          updated_at: new Date().toISOString(),
        };
        saveLocalProfile(updated);
        setProfile(updated);
        setSaving(false);
        return { data: updated, error: null };
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...updates })
        .select()
        .single();

      if (error && isTableMissingError(error)) {
        setIsLocalMode(true);
        const existing = loadLocalProfile(user.id) ?? makeDemoProfile(user.id);
        const updated: UserProfile = {
          ...existing,
          ...updates,
          id: user.id,
          updated_at: new Date().toISOString(),
        };
        saveLocalProfile(updated);
        setProfile(updated);
        setSaving(false);
        return { data: updated, error: null };
      }

      if (!error && data) setProfile(data);
      setSaving(false);
      return { data: data ?? null, error: error as Error | null };
    },
    [user, isLocalMode]
  );

  return { profile, loading, saving, isLocalMode, fetchProfile, upsertProfile };
}
