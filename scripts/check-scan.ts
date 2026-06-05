/**
 * Runs at 11:00 — if no scan ran today, sends a Gmail reminder.
 */
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID!;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!;
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN!;
const CRON_USER_EMAIL = process.env.CRON_USER_EMAIL || "lironbez93@gmail.com";

async function didScanRunToday(userId: string): Promise<boolean> {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await admin
    .from("scan_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "success")
    .gte("scanned_at", today.toISOString())
    .limit(1);

  return (data?.length ?? 0) > 0;
}

async function getUserId(): Promise<string | null> {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data } = await admin.auth.admin.listUsers();
  const user = data?.users.find((u) => u.email === CRON_USER_EMAIL);
  return user?.id ?? null;
}

async function sendReminderEmail() {
  const oauth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const subject = "⚠️ LinkedIn Job Scan לא רץ היום";
  const body = `שלום,

הסקריפט לסריקת משרות LinkedIn לא רץ היום עד שעה 11:00.

כדי להריץ ידנית:
cd ~/Desktop/pm-interview-prep && npm run scan-jobs

אם המחשב היה כבוי בשעה 8:00, הסקריפט לא הופעל אוטומטית.

— PM Interview Prep`;

  const message = [
    `From: ${CRON_USER_EMAIL}`,
    `To: ${CRON_USER_EMAIL}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body).toString("base64"),
  ].join("\n");

  const encoded = Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  await gmail.users.messages.send({ userId: "me", requestBody: { raw: encoded } });
  console.log("📧 מייל תזכורת נשלח");
}

async function run() {
  const missingVars = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"]
    .filter((v) => !process.env[v]);

  if (missingVars.length) {
    console.error("❌ משתנים חסרים:", missingVars.join(", "));
    process.exit(1);
  }

  const userId = await getUserId();
  if (!userId) {
    console.error("❌ משתמש לא נמצא:", CRON_USER_EMAIL);
    process.exit(1);
  }

  const didRun = await didScanRunToday(userId);

  if (didRun) {
    console.log("✅ הסקריפט רץ היום — אין צורך בתזכורת");
    return;
  }

  console.log("⚠️  הסקריפט לא רץ היום — שולח מייל...");
  await sendReminderEmail();
}

run().catch((err) => {
  console.error("❌ שגיאה:", err);
  process.exit(1);
});
