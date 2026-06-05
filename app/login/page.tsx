"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const profileRes = await fetch("/api/profile");
        const profile = await profileRes.json();
        const isNew = !profile?.full_name && !profile?.job_title;
        router.push(isNew ? "/profile?setup=1" : "/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "שגיאה בכניסה");
      }
    } catch {
      setError("שגיאת רשת — נסה שנית");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">המדריך למועמד</CardTitle>
        <p className="text-muted-foreground text-sm mt-1">כניסה לחשבון</p>
      </CardHeader>
      <CardContent>
        {registered && (
          <div className="mb-4 rounded-md bg-green-500/10 border border-green-500/30 px-3 py-2 text-sm text-green-600 dark:text-green-400 text-right">
            החשבון נוצר בהצלחה — אפשר להיכנס עכשיו
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">אימייל</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              dir="ltr"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">סיסמא</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>

          {error && <p className="text-destructive text-sm text-right">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email.includes("@") || password.length < 6}
          >
            {loading ? "נכנס..." : "כניסה →"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            עדיין אין חשבון?{" "}
            <Link href="/register" className="underline hover:text-foreground">
              הרשמה
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Suspense fallback={<div />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
