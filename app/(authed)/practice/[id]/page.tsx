export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { PracticeForm } from "@/components/practice-form";
import { MultipleChoiceForm } from "@/components/multiple-choice-form";

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "קל",
  medium: "בינוני",
  hard: "קשה",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { eval?: string };
}) {
  const supabase = createClient();

  const [{ data: question, error }, { data: previousAnswers }] = await Promise.all([
    supabase.from("questions").select("*").eq("id", params.id).single(),
    supabase
      .from("answers")
      .select("id, overall_score, answer_text, evaluation, created_at")
      .eq("question_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  // When arriving via toast, load the specific answer to display immediately
  let initialAnswer: { id: string; overall_score: number; answer_text: string; evaluation: unknown; created_at: string } | null = null;
  if (searchParams.eval) {
    const { data } = await supabase
      .from("answers")
      .select("id, overall_score, answer_text, evaluation, created_at")
      .eq("id", searchParams.eval)
      .single();
    if (data?.evaluation) initialAnswer = data;
  }

  if (error || !question) notFound();

  let nextQuestionId: string | null = null;
  {
    const { data: categoryQs } = await supabase
      .from("questions")
      .select("id")
      .eq("category", question.category)
      .order("created_at", { ascending: true });
    if (categoryQs) {
      const idx = categoryQs.findIndex((q) => q.id === params.id);
      nextQuestionId = categoryQs[idx + 1]?.id ?? null;
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{question.category}</Badge>
        <Badge
          variant="outline"
          className={DIFFICULTY_COLORS[question.difficulty]}
        >
          {DIFFICULTY_LABELS[question.difficulty]}
        </Badge>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-lg leading-relaxed font-medium">{question.question}</p>
      </div>

      {question.hint && (
        <details className="group">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1">
            <span className="group-open:hidden">▶ הצג רמז</span>
            <span className="hidden group-open:inline">▼ הסתר רמז</span>
          </summary>
          <div className="mt-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
            <p className="text-sm text-yellow-400">{question.hint}</p>
          </div>
        </details>
      )}

      {question.question_type === "multiple_choice" ? (
        <MultipleChoiceForm
          questionId={question.id}
          options={question.options as string[]}
          correctAnswer={question.correct_answer as string}
          explanation={question.explanation as string}
          nextQuestionId={nextQuestionId}
          category={question.category}
        />
      ) : (
        <PracticeForm
          questionId={question.id}
          previousAnswers={previousAnswers ?? []}
          nextQuestionId={nextQuestionId}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialAnswer={initialAnswer as any}
        />
      )}
    </div>
  );
}
