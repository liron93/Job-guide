"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/tooltip";

export function SettingsForm({
  existingKeyMasked,
  hasKey,
}: {
  existingKeyMasked: string | null;
  hasKey: boolean;
}) {
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.startsWith("sk-ant-")) {
      setError("מפתח לא תקין — חייב להתחיל ב-sk-ant-");
      return;
    }
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claude_api_key: newKey }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "שגיאה");
        return;
      }
      setSaved(true);
      setNewKey("");
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">מפתח Claude API</CardTitle>
          <InfoTooltip>
            <p className="font-medium mb-1">מה זה ולמה צריך?</p>
            <p className="text-xs text-muted-foreground mb-2">
              האפליקציה משתמשת ב-Claude AI לניתוח תשובות, הכנת ראיונות וסיכום מאמרים.
              כל משתמש מתחבר עם המפתח שלו — לא חולקים קרדיטים.
            </p>
            <p className="font-medium mb-1">איך מקבלים?</p>
            <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
              <li>היכנס ל-console.anthropic.com</li>
              <li>צור חשבון (יש $5 קרדיט בחינם להתחלה)</li>
              <li>Settings → API Keys → Create Key</li>
              <li>העתק את המפתח (מתחיל ב-sk-ant-)</li>
            </ol>
          </InfoTooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasKey && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            מפתח פעיל: <span className="font-mono">{existingKeyMasked}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
              {hasKey ? "החלף מפתח" : "הוסף מפתח"}
            </label>
            <Input
              type="password"
              placeholder="sk-ant-api03-..."
              value={newKey}
              onChange={(e) => { setNewKey(e.target.value); setSaved(false); }}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              ניתן לקבל ב-{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={loading || newKey.length < 10}
            >
              {loading ? "שומר..." : "שמור מפתח"}
            </Button>
            {saved && <p className="text-sm text-green-400">✓ נשמר</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
