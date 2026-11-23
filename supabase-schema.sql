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
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Food Posts
CREATE TABLE IF NOT EXISTS public.food_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
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
  claimer_name      TEXT NOT NULL,
  claimer_whatsapp  TEXT NOT NULL,
  portions_claimed  INTEGER NOT NULL CHECK (portions_claimed BETWEEN 1 AND 2),
  pickup_code       TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
AS $$
DECLARE
  v_post          public.food_posts%ROWTYPE;
  v_pickup_code   TEXT;
  v_claim_id      UUID;
BEGIN
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
  INSERT INTO public.claims (post_id, claimer_name, claimer_whatsapp, portions_claimed, pickup_code)
  VALUES (p_post_id, p_claimer_name, p_claimer_whatsapp, p_portions, v_pickup_code)
  RETURNING id INTO v_claim_id;

  RETURN json_build_object(
    'claim_id',         v_claim_id,
    'pickup_code',      v_pickup_code,
    'portions_claimed', p_portions
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
AS $$
DECLARE
  v_claim public.claims%ROWTYPE;
BEGIN
  SELECT * INTO v_claim
  FROM public.claims
  WHERE id = p_claim_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Klaim tidak ditemukan atau sudah diproses';
  END IF;

  -- Batalkan klaim
  UPDATE public.claims
  SET status = 'cancelled'
  WHERE id = p_claim_id;

  -- Kembalikan stok
  UPDATE public.food_posts
  SET remaining_portions = remaining_portions + v_claim.portions_claimed,
      status = 'available'
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

  -- Tandai klaim sebagai diambil
  UPDATE public.claims
  SET status = 'picked_up'
  WHERE id = p_claim_id;

  -- Tambah poin ke leaderboard donatur
  UPDATE public.profiles
  SET total_portions_saved = total_portions_saved + v_claim.portions_claimed
  WHERE id = v_post.donor_id;
END;
$$;

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

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Food Posts
ALTER TABLE public.food_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available food posts"
  ON public.food_posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert food posts"
  ON public.food_posts FOR INSERT WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update their own food posts"
  ON public.food_posts FOR UPDATE USING (auth.uid() = donor_id);

-- Claims
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view claims"
  ON public.claims FOR SELECT USING (true);

CREATE POLICY "Anyone can insert claims (via RPC)"
  ON public.claims FOR INSERT WITH CHECK (true);

-- ─── REALTIME ────────────────────────────────────────────────
-- Aktifkan Realtime untuk tabel food_posts dari UI Supabase:
-- Database > Replication > food_posts > Toggle ON

-- ============================================================
-- SELESAI — Semua objek database BagiRasa siap digunakan
-- ============================================================
