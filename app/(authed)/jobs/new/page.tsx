import { JobForm } from "@/components/job-form";

export default function NewJobPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">הוסף משרה</h1>
        <p className="text-muted-foreground text-sm mt-1">הדבק/י את תיאור המשרה — Claude ינתח את ההתאמה תוך 15 שניות</p>
      </div>
      <JobForm />
    </div>
  );
}
