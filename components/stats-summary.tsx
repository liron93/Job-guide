import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stat {
  label: string;
  value: string | number;
  sub?: string;
}

interface StatsSummaryProps {
  stats: Stat[];
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className="text-2xl font-bold">{stat.value}</p>
            {stat.sub && <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
