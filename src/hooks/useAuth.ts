import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Demo account credentials
const DEMO_ACCOUNT = {
  email: "test@gmail.com",
  password: "TestPassword123!",
  user: {
    id: "demo-user-local-12345",
    email: "test@gmail.com",
    created_at: new Date().toISOString(),
  }
};

// Local storage keys
const LOCAL_AUTH_KEY = "urgent_now_local_auth";
const LOCAL_USERS_KEY = "urgent_now_local_users";

// Local auth storage helper
class LocalAuth {
  static getUsers(): Record<string, { email: string; password: string; user: any }> {
    try {
      const stored = localStorage.getItem(LOCAL_USERS_KEY);
      if (!stored) {
        // Initialize with demo account
        const users = { [DEMO_ACCOUNT.email]: DEMO_ACCOUNT };
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
        return users;
      }
      return JSON.parse(stored);
    } catch {
      return { [DEMO_ACCOUNT.email]: DEMO_ACCOUNT };
    }
  }

  static saveUser(email: string, password: string) {
    const users = this.getUsers();
    users[email] = {
      email,
      password,
      user: {
        id: `local-user-${Date.now()}`,
        email,
        created_at: new Date().toISOString(),
      }
    };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    return users[email].user;
  }

  static verifyCredentials(email: string, password: string): any | null {
    const users = this.getUsers();
    const account = users[email];
    if (account && account.password === password) {
      return account.user;
    }
    return null;
  }

  static getSession(): any | null {
    try {
      const stored = localStorage.getItem(LOCAL_AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static setSession(user: any) {
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
  }

  static clearSession() {
    localStorage.removeItem(LOCAL_AUTH_KEY);
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [useLocalAuth, setUseLocalAuth] = useState(false);

  useEffect(() => {
    // Try Supabase first
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          setUseLocalAuth(false);
        } else {
          // Fall back to local auth
          const localUser = LocalAuth.getSession();
          if (localUser) {
            setUser(localUser as any);
            setUseLocalAuth(true);
          }
        }
      })
      .catch(() => {
        // Supabase failed, use local auth
        const localUser = LocalAuth.getSession();
        if (localUser) {
          setUser(localUser as any);
          setUseLocalAuth(true);
        }
      })
      .finally(() => setLoading(false));

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUseLocalAuth(false);
        LocalAuth.clearSession(); // Clear local auth if Supabase works
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // Try Supabase first
      const result = await supabase.auth.signUp({ email, password });
      if (!result.error && result.data.user) {
        return result;
      }
      throw result.error || new Error("Supabase signup failed");
    } catch (error) {
      // Fall back to local auth
      console.log("Using local auth for signup");
      const localUser = LocalAuth.saveUser(email, password);
      LocalAuth.setSession(localUser);
      setUser(localUser as any);
      setUseLocalAuth(true);
      return { data: { user: localUser }, error: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Try Supabase first
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (!result.error && result.data.user) {
        return result;
      }
      throw result.error || new Error("Supabase signin failed");
    } catch (error) {
      // Fall back to local auth
      console.log("Using local auth for signin");
      const localUser = LocalAuth.verifyCredentials(email, password);
      if (localUser) {
        LocalAuth.setSession(localUser);
        setUser(localUser as any);
        setUseLocalAuth(true);
        return { data: { user: localUser }, error: null };
      }
      return {
        data: { user: null },
        error: new Error("Invalid login credentials")
      };
    }
  };

  const signOut = async () => {
    if (useLocalAuth) {
      LocalAuth.clearSession();
      setUser(null);
      setUseLocalAuth(false);
      return { error: null };
    }
    return supabase.auth.signOut();
  };

  return { user, loading, signUp, signIn, signOut };
}
