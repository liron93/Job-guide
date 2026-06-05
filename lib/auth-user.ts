import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface AuthUser {
  id: string;
  email: string | undefined;
  claudeApiKey: string | null;
}

// cache() deduplicates calls within the same request — no repeated DB hits
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("user_profile")
    .select("claude_api_key")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    claudeApiKey: profile?.claude_api_key ?? null,
  };
});
