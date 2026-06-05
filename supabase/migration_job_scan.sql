-- Add source column to jobs (manual vs auto_scan)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'
  CHECK (source IN ('manual', 'auto_scan'));

-- Track daily scans
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

CREATE POLICY "Users see own scan logs"
  ON scan_logs FOR ALL
  USING (auth.uid() = user_id);
