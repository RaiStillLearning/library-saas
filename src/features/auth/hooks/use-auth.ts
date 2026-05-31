import { useAuth as useProviderAuth } from "@/src/providers/supabase-provider";

export function useAuth() {
  return useProviderAuth();
}
