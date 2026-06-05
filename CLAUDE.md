# המדריך למועמד — Project Context for Claude Code

## מה האפליקציה
כלי הכנה לראיונות עבודה. משתמשים מתאמנים על שאלות ראיון, מנהלים מעקב משרות, מעלים קורות חיים, ומקבלים פידבק מ-Claude AI. האפליקציה **מרובת משתמשים** — כל משתמש מביא מפתח Claude API משלו.

## Tech Stack
- **Next.js 14.2** App Router, TypeScript, Tailwind v3, shadcn/ui
- **Supabase** — Auth (email+password) + PostgreSQL + RLS
- **Anthropic Claude** — per-user API key, לא key של הבעלים
- **Vercel** — production deployment: `pm-interview-prep-ivory.vercel.app`
- **GitHub** — `github.com/liron93/Job-guide`

## ארכיטקטורת Auth
- Supabase Auth (`signInWithPassword`, `signUp` via admin client)
- `@supabase/ssr` v0.10.2 — cookie-based sessions
- שני clients:
  - `lib/supabase/server.ts` → `createClient()` — anon key + SSR, כפוף ל-RLS
  - `lib/supabase/admin.ts` → `createAdminClient()` — service role, עוקף RLS
- **Middleware** (`middleware.ts`) — מגן על כל הנתיבים חוץ מ-`/login`, `/register`
- `lib/auth-user.ts` → `getAuthUser()` — מחזיר `{ id, email, claudeApiKey }`

## מפתח Claude — Per-User
כל משתמש מזין מפתח Claude שלו בהרשמה. נשמר ב-`user_profile.claude_api_key`.
- `lib/anthropic.ts` → `createAnthropicClient(apiKey)` — factory, לא singleton
- כל API route מושך את המפתח דרך `getAuthUser()` ויוצר client חדש

## Database — Supabase
**RLS מופעל** על כל טבלאות המשתמש. Policy: `auth.uid() = user_id`.

### טבלאות משתמש (כפוף ל-RLS):
- `user_profile` — **primary key: `user_id` (uuid)** — שים לב: אין עמודת `id`
  - עמודות: `user_id`, `full_name`, `job_title`, `years_experience`, `experience_areas`, `looking_for`, `target_companies`, `strengths`, `improvement_areas`, `additional_notes`, `claude_api_key`, `updated_at`
- `cvs` — קורות חיים (uuid pk, user_id)
- `answers` — תשובות לשאלות (uuid pk, user_id)
- `jobs` — מעקב משרות (uuid pk, user_id)
- `article_summaries` — סיכומי מאמרים (uuid pk, user_id)

### טבלאות משותפות (admin client בלבד):
- `questions` — שאלות ראיון (shared, RLS: authenticated can read)

### חשוב: profile upsert
`user_profile` משתמש ב-admin client לכתיבה (בגלל RLS edge cases).
Route: `app/api/profile/route.ts` — upsert עם `onConflict: "user_id"`.

## API Routes — מבנה
כל route מוגן: מתחיל עם `getAuthUser()`, מחזיר 401 אם לא מחובר.

```
/api/login          POST — supabase.auth.signInWithPassword
/api/logout         POST — supabase.auth.signOut
/api/register       POST — admin.auth.admin.createUser (email_confirm: true) + שמירת claude_api_key
/api/profile        GET/POST — קריאה/כתיבה פרופיל (admin client)
/api/cv/upload      POST — העלאת PDF, חילוץ טקסט
/api/questions      GET — שאלות (admin client)
/api/questions/reveal POST — reveal תשובה + cache ב-questions
/api/answers/evaluate POST — הערכת תשובה עם Claude
/api/jobs           GET/POST — מעקב משרות
/api/jobs/[id]/prep POST — הכנה למשרה ספציפית עם Claude
/api/articles/summarize POST — סיכום מאמר עם Claude
/api/chat           POST — צ'אט חופשי עם Claude
/api/guide/study-plan POST — תוכנית לימוד עם Claude
```

## Layout & Navigation
- `/app/(authed)/layout.tsx` — layout עם Sidebar, מגן על כל הנתיבים המחוברים
- `components/sidebar.tsx` — ניווט + logout
- `components/nav-links.tsx` — קישורים כולל `/settings`
- `/settings` — עדכון מפתח Claude

## RTL / עברית
האפליקציה בעברית, RTL. כל הטקסטים בעברית.

## מה שעובד
- הרשמה + התחברות + logout ✓
- פרופיל משתמש ✓
- העלאת קורות חיים (PDF) ✓
- תרגול שאלות ראיון עם הערכת Claude ✓
- מעקב משרות + הכנה לראיון ✓
- סיכום מאמרים ✓
- הפרדה מלאה בין משתמשים (RLS) ✓
- Deployment על Vercel ✓

## Supabase Project
- URL: `https://idjachbxaotsliowsjbv.supabase.co`
- Auth Site URL: `https://pm-interview-prep-ivory.vercel.app`

## env vars נדרשים
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```
