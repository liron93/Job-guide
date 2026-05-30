import { createClient } from "@/lib/supabase/server";
import { ArticleForm } from "@/components/article-form";
import { ArticleFilter } from "@/components/article-filter";
import { ArticlesList } from "@/components/articles-list";
import type { ArticleData } from "@/components/article-card";

export const dynamic = "force-dynamic";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { rec?: string };
}) {
  const supabase = createClient();
  let query = supabase
    .from("article_summaries")
    .select("*")
    .order("article_published_at", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false });

  if (searchParams.rec) {
    query = query.eq("recommendation", searchParams.rec);
  }

  const { data: articles } = await query;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">סיכום מאמרים</h1>
        <p className="text-muted-foreground text-sm mt-1">הכניסו לינק למאמר — Claude יסכם ויגיד אם שווה לקרוא</p>
      </div>

      <ArticleForm />

      {((articles ?? []).length > 0 || !!searchParams.rec) && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-right">מאמרים שסוכמו</h2>
            <ArticleFilter />
          </div>

          <ArticlesList articles={(articles ?? []) as ArticleData[]} />
        </div>
      )}

      {(articles ?? []).length === 0 && searchParams.rec && (
        <p className="text-sm text-muted-foreground text-center py-8">אין מאמרים בקטגוריה זו</p>
      )}
    </div>
  );
}
