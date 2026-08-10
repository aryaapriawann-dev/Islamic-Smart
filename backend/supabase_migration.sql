-- ============================================================
-- Ihsan.id — Skema Database Supabase (Production Ready)
-- ============================================================
-- Aman dijalankan berulang kali (idempotent).
-- Drop tabel lama lalu buat ulang dari awal.
-- ============================================================


-- Hapus tabel lama jika ada (urutan penting karena tidak ada FK)
DROP TABLE IF EXISTS rakaat_sessions CASCADE;
DROP TABLE IF EXISTS attire_logs     CASCADE;
DROP TABLE IF EXISTS visitor_counts  CASCADE;


-- ────────────────────────────────────────────────────────────
-- 1. TABEL: visitor_counts
-- ────────────────────────────────────────────────────────────

CREATE TABLE visitor_counts (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp         TIMESTAMPTZ DEFAULT now() NOT NULL,
  count             INTEGER     NOT NULL DEFAULT 0,
  prayer_time_label TEXT,
  device_id         TEXT
);

CREATE INDEX idx_vc_timestamp ON visitor_counts (timestamp DESC);
CREATE INDEX idx_vc_prayer    ON visitor_counts (prayer_time_label);


-- ────────────────────────────────────────────────────────────
-- 2. TABEL: attire_logs
-- ────────────────────────────────────────────────────────────

CREATE TABLE attire_logs (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp       TIMESTAMPTZ DEFAULT now() NOT NULL,
  result_status   TEXT        NOT NULL,
  persen_aurat    REAL        DEFAULT 0.0,
  mode            TEXT        DEFAULT 'PEREMPUAN'
);

CREATE INDEX idx_al_timestamp ON attire_logs (timestamp DESC);
CREATE INDEX idx_al_status    ON attire_logs (result_status);


-- ────────────────────────────────────────────────────────────
-- 3. TABEL: rakaat_sessions
-- ────────────────────────────────────────────────────────────

CREATE TABLE rakaat_sessions (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      TEXT        NOT NULL,
  prayer_type     TEXT        NOT NULL,
  max_rakaat      INTEGER     NOT NULL,
  detected_rakaat INTEGER     NOT NULL DEFAULT 0,
  exceeded        BOOLEAN     DEFAULT false,
  timestamp       TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_rs_timestamp ON rakaat_sessions (timestamp DESC);
CREATE INDEX idx_rs_prayer    ON rakaat_sessions (prayer_type);


-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE visitor_counts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE attire_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rakaat_sessions ENABLE ROW LEVEL SECURITY;

-- visitor_counts
CREATE POLICY "vc_select" ON visitor_counts FOR SELECT USING (true);
CREATE POLICY "vc_insert" ON visitor_counts FOR INSERT WITH CHECK (true);

-- attire_logs
CREATE POLICY "al_select" ON attire_logs FOR SELECT USING (true);
CREATE POLICY "al_insert" ON attire_logs FOR INSERT WITH CHECK (true);

-- rakaat_sessions
CREATE POLICY "rs_select" ON rakaat_sessions FOR SELECT USING (true);
CREATE POLICY "rs_insert" ON rakaat_sessions FOR INSERT WITH CHECK (true);
