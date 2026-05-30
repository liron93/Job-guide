import { createClient } from "@supabase/supabase-js";
import questionsData from "../data/questions.json";
import terminologyData from "../data/terminology-questions.json";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  const regularQuestions = (Array.isArray(questionsData) ? questionsData : []).map((q: Record<string, unknown>) => ({
    ...q,
    question_type: q.question_type ?? "open",
  }));
  const all = [...regularQuestions, ...terminologyData];

  if (all.length === 0) {
    console.log("No questions to seed.");
    process.exit(0);
  }

  console.log(`Seeding ${all.length} questions (${terminologyData.length} terminology MC)...`);

  const { error } = await supabase
    .from("questions")
    .upsert(all, { onConflict: "id" });

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log("Done.");
}

seed();
