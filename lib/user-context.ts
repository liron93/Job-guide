import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// cache() deduplicates calls within the same request
export const getUserContext = cache(async (): Promise<string> => {
  const supabase = createClient();

  const [{ data: profile }, { data: cv }] = await Promise.all([
    supabase.from("user_profile").select("*").maybeSingle(),
    supabase.from("cvs").select("extracted_text").eq("is_active", true).maybeSingle(),
  ]);

  const parts: string[] = [];

  if (profile) {
    if (profile.full_name) parts.push(`שם: ${profile.full_name}`);
    if (profile.job_title) parts.push(`תפקיד נוכחי: ${profile.job_title}`);
    if (profile.years_experience != null) parts.push(`שנות ניסיון: ${profile.years_experience}`);
    if (profile.experience_areas?.length) parts.push(`תחומי ניסיון: ${profile.experience_areas.join(", ")}`);
    if (profile.looking_for) parts.push(`מה מחפש/ת: ${profile.looking_for}`);
    if (profile.target_companies) parts.push(`חברות יעד: ${profile.target_companies}`);
    if (profile.strengths) parts.push(`חוזקות: ${profile.strengths}`);
    if (profile.improvement_areas) parts.push(`תחומים לשיפור: ${profile.improvement_areas}`);
    if (profile.additional_notes) parts.push(`הקשר נוסף: ${profile.additional_notes}`);
  }

  if (cv?.extracted_text) {
    parts.push(`\nקורות חיים:\n---\n${cv.extracted_text.slice(0, 3000)}\n---`);
  }

  if (parts.length === 0) return "";
  return `פרופיל המשתמש/ת:\n${parts.join("\n")}`;
});
