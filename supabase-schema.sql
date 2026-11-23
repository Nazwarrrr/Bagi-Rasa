-- ============================================================
-- BagiRasa — Supabase Database Schema
-- Jalankan seluruh file ini di SQL Editor Supabase
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TABLES ─────────────────────────────────────────────────

-- Profiles (satu baris per auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT,
  whatsapp_number      TEXT,
  district             TEXT,
  total_portions_saved INTEGER NOT NULL DEFAULT 0,
  rescue_points        INTEGER NOT NULL DEFAULT 0,
  avatar_url           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Food Posts
CREATE TABLE IF NOT EXISTS public.food_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT NOT NULL CHECK (category IN ('Makanan Berat', 'Roti & Kue', 'Bahan Masak')),
  is_halal          BOOLEAN NOT NULL DEFAULT TRUE,
  initial_portions  INTEGER NOT NULL CHECK (initial_portions > 0),
  remaining_portions INTEGER NOT NULL CHECK (remaining_portions >= 0),
  pickup_address    TEXT NOT NULL,
  maps_url          TEXT,
  image_url         TEXT,
  expires_at        TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'completed', 'expired')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Claims
CREATE TABLE IF NOT EXISTS public.claims (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID NOT NULL REFERENCES public.food_posts(id) ON DELETE CASCADE,
  claimer_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  claimer_name      TEXT NOT NULL,
  claimer_whatsapp  TEXT NOT NULL,
  portions_claimed  INTEGER NOT NULL CHECK (portions_claimed BETWEEN 1 AND 2),
  pickup_code       TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill columns for projects upgrading from an earlier schema version.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rescue_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.food_posts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS claimer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS donor_name TEXT;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS donor_whatsapp TEXT;

-- ─── VIEWS ───────────────────────────────────────────────────

-- Active districts (kecamatan dengan postingan aktif)
CREATE OR REPLACE VIEW public.active_districts AS
SELECT DISTINCT p.district
FROM public.food_posts fp
JOIN public.profiles p ON p.id = fp.donor_id
WHERE fp.status = 'available'
  AND fp.remaining_portions > 0
  AND fp.expires_at > NOW()
  AND p.district IS NOT NULL
ORDER BY p.district;

-- Donor leaderboard (top donatur berdasarkan total_portions_saved)
CREATE OR REPLACE VIEW public.donor_leaderboard AS
SELECT
  p.id,
  p.full_name,
  p.district,
  p.total_portions_saved
FROM public.profiles p
WHERE p.total_portions_saved > 0
ORDER BY p.total_portions_saved DESC
LIMIT 10;

CREATE OR REPLACE VIEW public.donor_profiles AS
SELECT p.id, p.full_name, p.district, p.avatar_url
FROM public.profiles p;

CREATE OR REPLACE VIEW public.hero_leaderboard AS
SELECT p.id, p.full_name, p.district, p.rescue_points
FROM public.profiles p
WHERE p.rescue_points > 0
ORDER BY p.rescue_points DESC
LIMIT 10;

CREATE OR REPLACE VIEW public.community_impact AS
SELECT
  COALESCE(SUM(p.total_portions_saved), 0)::BIGINT AS total_portions,
  COUNT(*) FILTER (WHERE p.total_portions_saved > 0)::BIGINT AS donor_count,
  COUNT(*) FILTER (WHERE p.rescue_points > 0)::BIGINT AS hero_count
FROM public.profiles p;

GRANT SELECT ON public.donor_profiles, public.community_impact TO anon, authenticated;
GRANT SELECT ON public.active_districts, public.donor_leaderboard, public.hero_leaderboard TO anon, authenticated;

-- ─── STORAGE ─────────────────────────────────────────────────
-- Otomatis buat bucket "food-images" (public bucket):
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Akses baca publik (SELECT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Read Access for food-images'
  ) THEN
    CREATE POLICY "Public Read Access for food-images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'food-images');
  END IF;
END $$;

-- Policy 2: Upload untuk user login (INSERT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload food-images'
  ) THEN
    CREATE POLICY "Authenticated users can upload food-images"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'food-images' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- ─── RPC FUNCTIONS ───────────────────────────────────────────

-- 1. Klaim porsi makanan (atomic dengan row-level lock)
CREATE OR REPLACE FUNCTION public.claim_food_portion(
  p_post_id         UUID,
  p_claimer_name    TEXT,
  p_claimer_whatsapp TEXT,
  p_portions        INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_post          public.food_posts%ROWTYPE;
  v_pickup_code   TEXT;
  v_claim_id      UUID;
  v_donor_name    TEXT;
  v_donor_whatsapp TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Silakan masuk untuk mengklaim makanan';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND NULLIF(BTRIM(full_name), '') IS NOT NULL
      AND NULLIF(BTRIM(whatsapp_number), '') IS NOT NULL
      AND NULLIF(BTRIM(district), '') IS NOT NULL
      AND whatsapp_number = p_claimer_whatsapp
      AND full_name = p_claimer_name
  ) THEN
    RAISE EXCEPTION 'Lengkapi profil sebelum mengklaim makanan';
  END IF;

  -- Validasi jumlah porsi
  IF p_portions NOT BETWEEN 1 AND 2 THEN
    RAISE EXCEPTION 'Jumlah klaim harus antara 1 sampai 2 porsi';
  END IF;

  -- Lock baris untuk mencegah race condition
  SELECT * INTO v_post
  FROM public.food_posts
  WHERE id = p_post_id
    AND status = 'available'
    AND remaining_portions >= p_portions
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Makanan tidak tersedia atau stok tidak mencukupi';
  END IF;

  SELECT full_name, whatsapp_number
  INTO v_donor_name, v_donor_whatsapp
  FROM public.profiles
  WHERE id = v_post.donor_id;

  -- Generate kode unik BR-XXXX
  LOOP
    v_pickup_code := 'BR-' || UPPER(SUBSTRING(encode(gen_random_bytes(3), 'hex'), 1, 4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.claims WHERE pickup_code = v_pickup_code);
  END LOOP;

  -- Kurangi stok
  UPDATE public.food_posts
  SET remaining_portions = remaining_portions - p_portions,
      status = CASE
        WHEN remaining_portions - p_portions = 0 THEN 'completed'
        ELSE 'available'
      END
  WHERE id = p_post_id;

  -- Buat record klaim
  INSERT INTO public.claims (post_id, claimer_id, claimer_name, claimer_whatsapp, donor_name, donor_whatsapp, portions_claimed, pickup_code)
  VALUES (p_post_id, auth.uid(), p_claimer_name, p_claimer_whatsapp, v_donor_name, v_donor_whatsapp, p_portions, v_pickup_code)
  RETURNING id INTO v_claim_id;

  RETURN json_build_object(
    'claim_id',         v_claim_id,
    'pickup_code',      v_pickup_code,
    'portions_claimed', p_portions,
    'donor_name',       v_donor_name,
    'donor_whatsapp',   v_donor_whatsapp
  );
END;
$$;

-- 2. Batalkan klaim dan kembalikan stok
CREATE OR REPLACE FUNCTION public.cancel_claim(
  p_claim_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_claim public.claims%ROWTYPE;
  v_post  public.food_posts%ROWTYPE;
BEGIN
  SELECT * INTO v_claim
  FROM public.claims
  WHERE id = p_claim_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Klaim tidak ditemukan atau sudah diproses';
  END IF;

  SELECT * INTO v_post FROM public.food_posts WHERE id = v_claim.post_id;

  IF auth.uid() IS NULL OR (auth.uid() != v_post.donor_id AND auth.uid() != v_claim.claimer_id) THEN
    RAISE EXCEPTION 'Hanya pemilik donasi atau pengklaim yang berhak membatalkan klaim ini';
  END IF;

  -- Batalkan klaim
  UPDATE public.claims
  SET status = 'cancelled'
  WHERE id = p_claim_id;

  -- Kembalikan stok
  UPDATE public.food_posts
  SET remaining_portions = LEAST(initial_portions, remaining_portions + v_claim.portions_claimed),
      status = CASE
        WHEN expires_at <= NOW() THEN 'expired'
        ELSE 'available'
      END
  WHERE id = v_claim.post_id;
END;
$$;

-- 3. Verifikasi pengambilan dan tambah poin donatur
CREATE OR REPLACE FUNCTION public.confirm_pickup(
  p_claim_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_claim   public.claims%ROWTYPE;
  v_post    public.food_posts%ROWTYPE;
BEGIN
  SELECT * INTO v_claim
  FROM public.claims
  WHERE id = p_claim_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Klaim tidak ditemukan atau sudah diproses';
  END IF;

  SELECT * INTO v_post FROM public.food_posts WHERE id = v_claim.post_id;

  -- Validasi otorisasi: hanya donatur pemilik makanan yang boleh memverifikasi
  IF auth.uid() IS NULL OR auth.uid() != v_post.donor_id THEN
    RAISE EXCEPTION 'Hanya donatur pemilik makanan yang berhak memverifikasi pengambilan ini';
  END IF;

  -- Tandai klaim sebagai diambil
  UPDATE public.claims
  SET status = 'picked_up'
  WHERE id = p_claim_id;

  -- Tambah poin ke leaderboard donatur
  UPDATE public.profiles
  SET total_portions_saved = total_portions_saved + v_claim.portions_claimed
  WHERE id = v_post.donor_id;

  UPDATE public.profiles
  SET rescue_points = rescue_points + v_claim.portions_claimed
  WHERE id = v_claim.claimer_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_food_portion(UUID, TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_claim(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_pickup(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_food_portion(UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_claim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_pickup(UUID) TO authenticated;

-- ─── AUTO-CREATE PROFILE TRIGGER ─────────────────────────────
-- Otomatis buat baris profil kosong saat user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, whatsapp_number, district, avatar_url, total_portions_saved, rescue_points, created_at)
  ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Food Posts
ALTER TABLE public.food_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view available food posts" ON public.food_posts;
CREATE POLICY "Anyone can view available food posts"
  ON public.food_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert food posts" ON public.food_posts;
CREATE POLICY "Authenticated users can insert food posts"
  ON public.food_posts FOR INSERT WITH CHECK (auth.uid() = donor_id);

DROP POLICY IF EXISTS "Donors can update their own food posts" ON public.food_posts;
CREATE POLICY "Donors can update their own food posts"
  ON public.food_posts FOR UPDATE USING (auth.uid() = donor_id);

-- Claims
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view claims" ON public.claims;
DROP POLICY IF EXISTS "Users can view their own claims or donor claims" ON public.claims;
CREATE POLICY "Users can view their own claims or donor claims"
  ON public.claims FOR SELECT USING (
    auth.uid() = claimer_id OR EXISTS (
      SELECT 1 FROM public.food_posts
      WHERE food_posts.id = claims.post_id AND food_posts.donor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can insert claims (via RPC)" ON public.claims;

-- ─── INDEXES UNTUK PERFORMA ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_food_posts_active 
  ON public.food_posts (status, expires_at, remaining_portions);

CREATE INDEX IF NOT EXISTS idx_food_posts_donor 
  ON public.food_posts (donor_id);

CREATE INDEX IF NOT EXISTS idx_claims_post_id 
  ON public.claims (post_id);

CREATE INDEX IF NOT EXISTS idx_claims_status 
  ON public.claims (status);

CREATE INDEX IF NOT EXISTS idx_claims_claimer_id
  ON public.claims (claimer_id);

-- ─── REALTIME ────────────────────────────────────────────────
-- Aktifkan Realtime untuk tabel food_posts dari UI Supabase:
-- Database > Replication > food_posts > Toggle ON
-- Klaim memiliki subscriber antrean warga/donatur:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'claims'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
  END IF;
END $$;

-- ============================================================
-- SELESAI — Semua objek database BagiRasa siap digunakan
-- ============================================================
