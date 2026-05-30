"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  questionId: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  nextQuestionId?: string | null;
  category?: string;
}

export function MultipleChoiceForm({ questionId, options, correctAnswer, explanation, nextQuestionId, category }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Shuffle options once per question (stable across re-renders, changes between questions)
  const shuffledOptions = useMemo(() => {
    const arr = [...options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [questionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isAnswered = selected !== null;
  const isCorrect = selected === correctAnswer;

  async function handleSelect(option: string) {
    if (isAnswered) return;
    setSelected(option);
    setSaving(true);
    const score = option === correctAnswer ? 10 : 0;
    await fetch("/api/answers/mc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, selectedAnswer: option, score }),
    });
    setSaving(false);
  }

  function getOptionStyle(option: string) {
    if (!isAnswered) return "border-border bg-card hover:bg-accent/40 hover:border-primary/50 cursor-pointer";
    if (option === correctAnswer) return "border-green-500 bg-green-500/10 text-green-400";
    if (option === selected) return "border-red-500 bg-red-500/10 text-red-400";
    return "border-border bg-card opacity-40";
  }

  return (
    <div className="space-y-3">
      {shuffledOptions.map((option, i) => (
        <button
          key={i}
          onClick={() => handleSelect(option)}
          disabled={isAnswered}
          className={`w-full text-right px-4 py-3 rounded-lg border text-sm leading-relaxed transition-colors ${getOptionStyle(option)}`}
        >
          <span className="text-muted-foreground text-xs ml-2">{String.fromCharCode(65 + i)}.</span>
          {option}
        </button>
      ))}

      {isAnswered && (
        <div className={`rounded-lg border p-4 space-y-2 mt-4 ${isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
          <p className={`text-sm font-semibold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
            {isCorrect ? "✓ נכון!" : "✗ לא נכון"}
          </p>
          {!isCorrect && (
            <p className="text-xs text-muted-foreground">
              <span className="text-green-400 font-medium">התשובה הנכונה: </span>{correctAnswer}
            </p>
          )}
          <p className="text-sm leading-relaxed text-right">{explanation}</p>
        </div>
      )}

      {isAnswered && (
        <div className="flex gap-3 pt-2">
          {nextQuestionId ? (
            <Button onClick={() => router.push(`/practice/${nextQuestionId}`)}>
              שאלה הבאה ←
            </Button>
          ) : (
            <Button onClick={() => router.push(category ? `/questions?category=${encodeURIComponent(category)}` : "/questions")}>
              חזור לכל המושגים
            </Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            חזור
          </Button>
        </div>
      )}
    </div>
  );
}
