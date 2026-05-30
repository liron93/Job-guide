import rubricsData from "@/data/rubrics.json";

export interface RubricCriterion {
  name: string;
  weight: number;
  description: string;
  indicators: {
    excellent: string[];
    good: string[];
    poor: string[];
  };
}

export interface Rubric {
  category: string;
  criteria: RubricCriterion[];
}

export function getRubric(category: string): Rubric | null {
  const rubrics = rubricsData as Record<string, Rubric>;
  return rubrics[category] ?? null;
}
