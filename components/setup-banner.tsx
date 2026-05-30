export function SetupBanner({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: "פרופיל אישי" },
    { n: 2, label: "קורות חיים" },
    { n: 3, label: "התחל לתרגל" },
  ];

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-medium text-right mb-3">
        הגדרת פרופיל ראשונית — שלב {step} מתוך 2
      </p>
      <div className="flex items-center gap-0 justify-end flex-row-reverse">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-row-reverse">
            <div className={`flex items-center gap-1.5 ${s.n < step ? "text-primary" : s.n === step ? "text-foreground" : "text-muted-foreground"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                s.n < step ? "bg-primary text-primary-foreground" :
                s.n === step ? "bg-primary/20 text-primary border border-primary/40" :
                "bg-muted text-muted-foreground"
              }`}>
                {s.n < step ? "✓" : s.n}
              </span>
              <span className="text-xs">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px mx-2 ${s.n < step ? "bg-primary/40" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
