import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { SetupBanner } from "@/components/setup-banner";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { setup?: string };
}) {
  const supabase = createClient();
  const { data: profile } = await supabase.from("user_profile").select("*").maybeSingle();
  const isSetup = searchParams.setup === "1";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {isSetup && <SetupBanner step={1} />}
      <div>
        <h1 className="text-2xl font-bold">פרטים אישיים</h1>
        <p className="text-muted-foreground text-sm mt-1">
          המידע הזה עוזר ל-Claude לתת תשובות, ניתוחי משרות והכנות ראיון מותאמות אישית
        </p>
      </div>
      <ProfileForm initial={profile ?? {}} setup={isSetup} />
    </div>
  );
}
