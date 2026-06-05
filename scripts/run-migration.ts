/**
 * Runs the job scan migration against Supabase via service role.
 * npm run migrate-scan
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key);

async function run() {
  console.log("Running migration...");

  // 1. Add source column to jobs
  const { error: e1 } = await admin.rpc("exec_sql" as never, {
    sql: `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual' CHECK (source IN ('manual', 'auto_scan'));`,
  });
  if (e1) {
    // exec_sql may not exist — instruct user to run manually
    console.log("⚠️  exec_sql RPC not available — migration must be run manually in Supabase SQL Editor.");
    console.log("Open: https://supabase.com/dashboard/project/idjachbxaotsliowsjbv/sql/new");
    console.log("Run the contents of: supabase/migration_job_scan.sql");
    return;
  }

  // 2. Create scan_logs table
  await admin.rpc("exec_sql" as never, {
    sql: `
      CREATE TABLE IF NOT EXISTS scan_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        scanned_at timestamptz DEFAULT now(),
        jobs_found integer DEFAULT 0,
        jobs_saved integer DEFAULT 0,
        status text DEFAULT 'success' CHECK (status IN ('success', 'failed')),
        error_message text
      );
      ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'scan_logs' AND policyname = 'Users see own scan logs'
        ) THEN
          CREATE POLICY "Users see own scan logs" ON scan_logs FOR ALL USING (auth.uid() = user_id);
        END IF;
      END $$;
    `,
  });

  console.log("✅ Migration complete");
}

run().catch(console.error);
