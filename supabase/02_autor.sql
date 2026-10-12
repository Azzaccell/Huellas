-- HUELLAS · nombre del autor en alertas, mascotas y comentarios.
-- Pegar en Supabase → SQL Editor → Run. Se puede ejecutar varias veces.
alter table public.reports  add column if not exists author text check (char_length(author) <= 80);
alter table public.reports  add column if not exists avatar text check (char_length(avatar) <= 500);
alter table public.pets     add column if not exists author text check (char_length(author) <= 80);
alter table public.pets     add column if not exists avatar text check (char_length(avatar) <= 500);
alter table public.comments add column if not exists author text check (char_length(author) <= 80);
alter table public.comments add column if not exists avatar text check (char_length(avatar) <= 500);

-- permitir que cada quien borre sus propias fotos
drop policy if exists "borrar mis fotos" on storage.objects;
create policy "borrar mis fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
