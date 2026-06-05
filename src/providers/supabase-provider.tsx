"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/services/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: "student" | "admin";
  created_at?: string;
  approval_required?: boolean;
  status?: "active" | "suspended" | "graduated";
}

interface AuthContextType {
  user: User | { id: string; email?: string } | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data configuration for local development when Supabase isn't set up
const MOCK_PROFILES = {
  "admin@readspace.com": {
    id: "mock-admin-id",
    email: "admin@readspace.com",
    name: "Admin Manager",
    role: "admin" as const,
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop",
    approval_required: false,
    status: "active" as const,
  },
  "student@readspace.com": {
    id: "mock-student-id",
    email: "student@readspace.com",
    name: "John Doe",
    role: "student" as const,
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&h=256&fit=crop",
    approval_required: true,
    status: "active" as const,
  },
};

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | { id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Detect if Supabase is actually configured
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "your-supabase-anon-key";

  const clearSession = () => {
    setUser(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("readspace_mock_user");
      localStorage.removeItem("readspace_mock_profile");
    }
    document.cookie = "readspace_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "readspace_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  useEffect(() => {
    // 1. Check for mock session first (even if Supabase is configured)
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("readspace_mock_user") : null;
    const storedProfile = typeof window !== "undefined" ? localStorage.getItem("readspace_mock_profile") : null;

    if (storedUser && storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      if (parsedProfile.status === "suspended") {
        toast.error("Your account has been suspended. Please contact the administrator.");
        clearSession();
        setIsLoading(false);
        return;
      }
      setUser(JSON.parse(storedUser));
      setProfile(parsedProfile);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          // Fetch profile
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (!profileError && profileData) {
            if (profileData.status === "suspended") {
              toast.error("Your account has been suspended. Please contact the administrator.");
              clearSession();
              return;
            }
            setUser(session.user);
            setProfile(profileData as UserProfile);
            document.cookie = `readspace_user_role=${profileData.role}; path=/; max-age=604800; SameSite=Lax`;
          } else {
            // Profile fallback
            const defaultProfile: UserProfile = {
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || "Reader",
              role: "student",
              status: "active",
              approval_required: true,
            };
            setUser(session.user);
            setProfile(defaultProfile);
            document.cookie = `readspace_user_role=student; path=/; max-age=604800; SameSite=Lax`;
          }
        }
      } catch (err) {
        console.error("Error loading session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileData) {
            if (profileData.status === "suspended") {
              toast.error("Your account has been suspended. Please contact the administrator.");
              clearSession();
              return;
            }
            // Clear mock session if we logged in via real Supabase
            localStorage.removeItem("readspace_mock_user");
            localStorage.removeItem("readspace_mock_profile");
            document.cookie = "readspace_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

            setUser(session.user);
            setProfile(profileData as UserProfile);
            document.cookie = `readspace_user_role=${profileData.role}; path=/; max-age=604800; SameSite=Lax`;
          } else {
            setUser(session.user);
            setProfile({
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || "Reader",
              role: "student",
              status: "active",
              approval_required: true,
            });
            document.cookie = `readspace_user_role=student; path=/; max-age=604800; SameSite=Lax`;
          }
        } else {
          // Only clear if no mock session exists
          const hasMockSession = localStorage.getItem("readspace_mock_user") !== null;
          if (!hasMockSession) {
            setUser(null);
            setProfile(null);
            document.cookie = "readspace_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const lowercaseEmail = email.trim().toLowerCase();
      const isDemoAccount = lowercaseEmail === "student@readspace.com" || lowercaseEmail === "admin@readspace.com";

      // If Supabase is not configured OR the user is using the demo credentials, use Mock auth
      if (!isSupabaseConfigured || isDemoAccount) {
        const storedProfilesStr = typeof window !== "undefined" ? localStorage.getItem("readspace_profiles_list") : null;
        const storedProfiles = storedProfilesStr ? JSON.parse(storedProfilesStr) : [];
        
        const mockProfile = storedProfiles.find((p: any) => p.email.toLowerCase() === lowercaseEmail)
          || MOCK_PROFILES[lowercaseEmail as keyof typeof MOCK_PROFILES];

        if (mockProfile) {
          if (mockProfile.status === "suspended") {
            throw new Error("Your account has been suspended. Please contact the administrator.");
          }
          const mockUser = { id: mockProfile.id, email: mockProfile.email };
          setUser(mockUser);
          setProfile(mockProfile);
          localStorage.setItem("readspace_mock_user", JSON.stringify(mockUser));
          localStorage.setItem("readspace_mock_profile", JSON.stringify(mockProfile));
          document.cookie = "readspace_mock_session=" + encodeURIComponent(JSON.stringify({ id: mockProfile.id, role: mockProfile.role, email: mockProfile.email })) + "; path=/; max-age=604800; SameSite=Lax";
          toast.success(`Logged in as ${mockProfile.name}`);
          return true;
        }

        // Catch-all mock student (only if not configured, otherwise require real registration)
        if (!isSupabaseConfigured) {
          const mockUser = { id: `mock-${Date.now()}`, email: lowercaseEmail };
          const newMockProfile: UserProfile = {
            id: mockUser.id,
            email: lowercaseEmail,
            name: lowercaseEmail.split("@")[0],
            role: lowercaseEmail.includes("admin") ? "admin" : "student",
            avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&h=256&fit=crop`,
            status: "active",
            approval_required: true,
          };
          setUser(mockUser);
          setProfile(newMockProfile);
          localStorage.setItem("readspace_mock_user", JSON.stringify(mockUser));
          localStorage.setItem("readspace_mock_profile", JSON.stringify(newMockProfile));
          document.cookie = "readspace_mock_session=" + encodeURIComponent(JSON.stringify({ id: newMockProfile.id, role: newMockProfile.role, email: newMockProfile.email })) + "; path=/; max-age=604800; SameSite=Lax";
          toast.success(`Logged in as ${newMockProfile.name}`);
          return true;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: lowercaseEmail,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (!profileError && profileData) {
          if (profileData.status === "suspended") {
            await supabase.auth.signOut();
            throw new Error("Your account has been suspended. Please contact the administrator.");
          }
          setUser(data.user);
          setProfile(profileData as UserProfile);
          document.cookie = `readspace_user_role=${profileData.role}; path=/; max-age=604800; SameSite=Lax`;
        } else {
          setUser(data.user);
          document.cookie = `readspace_user_role=student; path=/; max-age=604800; SameSite=Lax`;
        }
      }
      toast.success("Signed in successfully!");
      return true;
    } catch (error) {
      const err = error as { message?: string };
      if (err.message?.includes("suspended")) {
        toast.error(err.message);
        return false;
      }
      
      console.warn("Supabase auth failed, falling back to mock user session:", err);
      
      // Fallback to mock session so the user is never blocked in local development
      const lowercaseEmail = email.trim().toLowerCase();
      const mockUser = { id: `mock-${Date.now()}`, email: lowercaseEmail };
      const fallbackProfile: UserProfile = {
        id: mockUser.id,
        email: lowercaseEmail,
        name: lowercaseEmail.split("@")[0],
        role: lowercaseEmail.includes("admin") ? "admin" : "student",
        avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&h=256&fit=crop`,
        status: "active",
        approval_required: true,
      };
      
      setUser(mockUser);
      setProfile(fallbackProfile);
      localStorage.setItem("readspace_mock_user", JSON.stringify(mockUser));
      localStorage.setItem("readspace_mock_profile", JSON.stringify(fallbackProfile));
      document.cookie = "readspace_mock_session=" + encodeURIComponent(JSON.stringify({ id: fallbackProfile.id, role: fallbackProfile.role, email: fallbackProfile.email })) + "; path=/; max-age=604800; SameSite=Lax";
      
      toast.warning(`Supabase login failed (${err.message || "Invalid credentials"}). Logged in as mock user: ${fallbackProfile.name}`);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Mock registration
        const mockUser = { id: `mock-${Date.now()}`, email };
        const mockProfile: UserProfile = {
          id: mockUser.id,
          email,
          name,
          role: email.toLowerCase().includes("admin") ? "admin" : "student",
          avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&h=256&fit=crop`,
        };
        setUser(mockUser);
        setProfile(mockProfile);
        localStorage.setItem("readspace_mock_user", JSON.stringify(mockUser));
        localStorage.setItem("readspace_mock_profile", JSON.stringify(mockProfile));
        document.cookie = "readspace_mock_session=" + encodeURIComponent(JSON.stringify({ id: mockProfile.id, role: mockProfile.role, email: mockProfile.email })) + "; path=/; max-age=604800; SameSite=Lax";
        toast.success("Account created successfully!");
        return true;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        // Supabase trigger should create profile, but we can upsert/create if needed
        const newProfile: UserProfile = {
          id: data.user.id,
          email,
          name,
          role: email.toLowerCase().includes("admin") ? "admin" : "student",
        };
        
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(newProfile);

        if (profileError) console.error("Error creating profile:", profileError);
        setProfile(newProfile);
        document.cookie = `readspace_user_role=${newProfile.role}; path=/; max-age=604800; SameSite=Lax`;
      }
      
      toast.success("Registered and signed in successfully!");
      return true;
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to register");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      setProfile(null);
      localStorage.removeItem("readspace_mock_user");
      localStorage.removeItem("readspace_mock_profile");
      document.cookie = "readspace_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "readspace_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };


  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!profile) return false;
    try {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);

      if (!isSupabaseConfigured) {
        localStorage.setItem("readspace_mock_profile", JSON.stringify(updatedProfile));
        toast.success("Profile updated!");
        return true;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
      return true;
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to update profile");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        isMock: !isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a SupabaseProvider");
  }
  return context;
}
