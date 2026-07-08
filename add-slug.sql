-- 1. Tambahkan kolom slug ke tabel projects (jika belum ada)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Generate slug untuk proyek lama berdasarkan nama + sedikit karakter unik 
--    (agar tidak crash jika ada duplikat nama)
DO $$
DECLARE
  p_record RECORD;
  new_slug TEXT;
  random_suffix TEXT;
BEGIN
  FOR p_record IN SELECT id, name FROM projects WHERE slug IS NULL LOOP
    -- Generate random 4 char suffix
    random_suffix := substring(md5(random()::text) from 1 for 4);
    
    -- Buat slug (lowercase, regex hanya alfanumerik) 
    -- Regex replacement in Postgres: 
    new_slug := lower(regexp_replace(p_record.name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Trim leading and trailing dashes
    new_slug := trim(both '-' from new_slug);
    
    -- Gabungkan
    new_slug := new_slug || '-' || random_suffix;
    
    -- Update kolom slug
    UPDATE projects SET slug = new_slug WHERE id = p_record.id;
  END LOOP;
END $$;
