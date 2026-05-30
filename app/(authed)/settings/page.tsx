import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profile")
    .select("claude_api_key")
    .eq("user_id", user!.id)
    .maybeSingle();

  const maskedKey = profile?.claude_api_key
    ? `sk-ant-...${profile.claude_api_key.slice(-6)}`
    : null;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">הגדרות</h1>
        <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
      </div>
      <SettingsForm existingKeyMasked={maskedKey} hasKey={!!profile?.claude_api_key} />
    </div>
  );
}
