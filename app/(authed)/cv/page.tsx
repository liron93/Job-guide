import { createClient } from "@/lib/supabase/server";
import { CvForm } from "@/components/cv-form";
import { SetupBanner } from "@/components/setup-banner";

export const dynamic = "force-dynamic";

export default async function CVPage({
  searchParams,
}: {
  searchParams: { setup?: string };
}) {
  const supabase = createClient();
  const { data: cv } = await supabase
    .from("cvs")
    .select("filename, uploaded_at, extracted_text")
    .eq("is_active", true)
    .maybeSingle();
  const isSetup = searchParams.setup === "1";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {isSetup && <SetupBanner step={2} />}
      <div>
        <h1 className="text-2xl font-bold">קורות חיים</h1>
        <p className="text-muted-foreground text-sm mt-1">
          הטקסט משמש לניתוח משרות, הכנת CV מותאם, מכתב מוטיבציה ומשוב מותאם אישית
        </p>
      </div>
      <CvForm existing={cv ?? null} setup={isSetup} />
    </div>
  );
}
