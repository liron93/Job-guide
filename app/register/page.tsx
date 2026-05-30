"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/tooltip";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, claudeApiKey: claudeKey }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.needsLogin) {
          router.push("/login?registered=1");
        } else {
          router.push("/profile?setup=1");
          router.refresh();
        }
      } else {
        setError(data.error ?? "שגיאה בהרשמה");
      }
    } catch {
      setError("שגיאת רשת — נסה שנית");
    } finally {
      setLoading(false);
    }
  }

  const emailValid = email.includes("@");
  const passwordValid = password.length >= 6;
  const keyValid = claudeKey.startsWith("sk-ant-");
  const isValid = emailValid && passwordValid && keyValid;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">המדריך למועמד</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">יצירת חשבון חדש</p>
        </CardHeader>
        <CardContent>
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
              {email && !emailValid && (
                <p className="text-xs text-destructive text-right">נא להזין כתובת אימייל תקינה</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">סיסמא (לפחות 6 תווים)</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
              />
              {password && !passwordValid && (
                <p className="text-xs text-destructive text-right">הסיסמא חייבת להכיל לפחות 6 תווים</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">מפתח Claude API שלך</label>
                <InfoTooltip>
                  <p className="font-medium mb-1">איך מקבלים מפתח Claude?</p>
                  <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                    <li>היכנס ל-console.anthropic.com</li>
                    <li>צור חשבון חינמי (יש $5 קרדיט להתחלה)</li>
                    <li>לך ל-Settings → API Keys</li>
                    <li>לחץ "Create Key" והעתק</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    המפתח מתחיל ב-<span className="font-mono">sk-ant-</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    האפליקציה משתמשת במפתח שלך בלבד — לא במפתח של אף אחד אחר.
                  </p>
                </InfoTooltip>
              </div>
              <Input
                type="password"
                placeholder="sk-ant-api03-..."
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                dir="ltr"
              />
              {claudeKey && !keyValid && (
                <p className="text-xs text-destructive text-right">המפתח חייב להתחיל ב-sk-ant-</p>
              )}
              <p className="text-xs text-muted-foreground text-right">
                ניתן לקבל ב-{" "}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  console.anthropic.com
                </a>
                {" "}(יש $5 קרדיט בחינם)
              </p>
            </div>

            {error && <p className="text-destructive text-sm text-right">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || !isValid}>
              {loading ? "יוצר חשבון..." : "הרשמה →"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              יש לך חשבון?{" "}
              <Link href="/login" className="underline hover:text-foreground">
                כניסה
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
