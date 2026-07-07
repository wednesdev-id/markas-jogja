-- Buat tabel penyimpanan data JSON aplikasi (satu dokumen)
create table if not exists app_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

-- Aktifkan Row Level Security (Standar keamanan Supabase)
alter table app_data enable row level security;

-- Buat aturan agar tabel ini bisa diakses dan ditulis (Untuk keperluan prototype/public anon key)
create policy "Allow public read/write" on app_data for all using (true) with check (true);
