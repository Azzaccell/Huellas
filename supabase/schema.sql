-- =====================================================================
-- HUELLAS · base de datos (Supabase / PostgreSQL)
-- Pegar completo en Supabase → SQL Editor → Run. Se puede re-ejecutar.
-- =====================================================================

-- ---------- tablas ----------
create table if not exists public.pets (
  id          text primary key default gen_random_uuid()::text,
  created_at  timestamptz not null default now(),
  user_id     uuid default auth.uid(),
  name        text not null check (char_length(name) between 1 and 60),
  species     text not null check (species in ('perro','gato','ave','conejo','otro')),
  breed       text check (char_length(breed) <= 60),
  age         text check (char_length(age) <= 30),
  owner       text check (char_length(owner) <= 60),
  zone        text check (char_length(zone) <= 60),
  bio         text check (char_length(bio) <= 600),
  traits      text[] not null default '{}',
  photo       text,
  video       text,
  accent      text default '#FF6B35' check (accent ~ '^#[0-9A-Fa-f]{6}$'),
  followers   integer not null default 0,
  lost        boolean not null default false
);

create table if not exists public.reports (
  id          text primary key default gen_random_uuid()::text,
  created_at  timestamptz not null default now(),
  user_id     uuid default auth.uid(),
  type        text not null check (type in ('perdido','visto','encontrado','reunido')),
  species     text not null check (species in ('perro','gato','ave','conejo','otro')),
  name        text not null check (char_length(name) between 1 and 80),
  breed       text check (char_length(breed) <= 60),
  color       text check (char_length(color) <= 60),
  zone        text check (char_length(zone) <= 60),
  -- solo dentro del área metropolitana de Santa Cruz de la Sierra
  lat         double precision not null check (lat between -18.2 and -17.4),
  lng         double precision not null check (lng between -63.6 and -62.8),
  description text check (char_length(description) <= 1000),
  reward      text check (char_length(reward) <= 40),
  contact     text check (contact ~ '^[0-9]{7,15}$'),
  photo       text,
  video       text,
  pet_id      text references public.pets(id) on delete set null,
  likes       integer not null default 0
);
create index if not exists reports_created_idx on public.reports (created_at desc);

create table if not exists public.comments (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid default auth.uid(),
  report_id   text not null references public.reports(id) on delete cascade,
  text        text not null check (char_length(text) between 1 and 300)
);
create index if not exists comments_report_idx on public.comments (report_id);

-- autor visible (nombre y foto de Google) en lo que cada quien publica
alter table public.reports add column if not exists author text check (char_length(author) <= 80);
alter table public.reports add column if not exists avatar text check (char_length(avatar) <= 500);
alter table public.pets    add column if not exists author text check (char_length(author) <= 80);
alter table public.pets    add column if not exists avatar text check (char_length(avatar) <= 500);
alter table public.comments add column if not exists author text check (char_length(author) <= 80);
alter table public.comments add column if not exists avatar text check (char_length(avatar) <= 500);

-- ---------- seguridad (Row Level Security) ----------
-- Todos pueden leer. Para escribir hace falta una sesión (anónima o con cuenta):
-- cada fila guarda el user_id de quien la creó y solo esa persona puede editarla o borrarla.
alter table public.pets     enable row level security;
alter table public.reports  enable row level security;
alter table public.comments enable row level security;

drop policy if exists "leer pets" on public.pets;
drop policy if exists "crear pets" on public.pets;
drop policy if exists "editar mis pets" on public.pets;
drop policy if exists "borrar mis pets" on public.pets;
create policy "leer pets"        on public.pets for select using (true);
create policy "crear pets"       on public.pets for insert to authenticated with check (user_id = auth.uid() and followers = 0);
create policy "editar mis pets"  on public.pets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "borrar mis pets"  on public.pets for delete to authenticated using (user_id = auth.uid());

drop policy if exists "leer reports" on public.reports;
drop policy if exists "crear reports" on public.reports;
drop policy if exists "editar mis reports" on public.reports;
drop policy if exists "borrar mis reports" on public.reports;
create policy "leer reports"        on public.reports for select using (true);
create policy "crear reports"       on public.reports for insert to authenticated with check (user_id = auth.uid() and likes = 0);
create policy "editar mis reports"  on public.reports for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "borrar mis reports"  on public.reports for delete to authenticated using (user_id = auth.uid());

drop policy if exists "leer comments" on public.comments;
drop policy if exists "crear comments" on public.comments;
drop policy if exists "borrar mis comments" on public.comments;
create policy "leer comments"        on public.comments for select using (true);
create policy "crear comments"       on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy "borrar mis comments"  on public.comments for delete to authenticated using (user_id = auth.uid());

-- ---------- contadores (me gusta / seguir) sin dar permiso de editar la fila ----------
create or replace function public.like_report(rid text, delta integer)
returns integer language sql security definer set search_path = public as $$
  update reports set likes = greatest(0, likes + sign(delta)::int) where id = rid returning likes;
$$;
create or replace function public.follow_pet(pid text, delta integer)
returns integer language sql security definer set search_path = public as $$
  update pets set followers = greatest(0, followers + sign(delta)::int) where id = pid returning followers;
$$;
revoke all on function public.like_report(text, integer) from public;
revoke all on function public.follow_pet(text, integer) from public;
grant execute on function public.like_report(text, integer) to authenticated;
grant execute on function public.follow_pet(text, integer) to authenticated;

-- ---------- fotos (Storage) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "subir mis fotos" on storage.objects;
create policy "subir mis fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "borrar mis fotos" on storage.objects;
create policy "borrar mis fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- tiempo real ----------
do $$ begin
  begin alter publication supabase_realtime add table public.reports;  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.pets;     exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; end;
end $$;

-- ---------- datos de ejemplo (sin dueño: nadie los puede editar) ----------
insert into public.pets (id, user_id, name, species, breed, age, owner, zone, bio, traits, photo, video, accent, followers, lost) values
 ('p1',  null, 'Canela', 'gato',  'Mestiza',          '2 años', 'Valeria R.',     'Equipetrol', 'Reina del sofá, experta en siestas y en pedir comida a las 6 a.m.', '{Dormilona,Glotona,"Con chip"}', null, 'media/v0.mp4', '#FF6B35', 1240, false),
 ('p2',  null, 'Mishi',  'gato',  'Mestizo',          '1 año',  'Diego A.',       'Urbarí',     'Tímido pero curioso. Ahora mismo está perdido, ¡ayúdanos a encontrarlo!', '{Tímido,Esterilizado}', null, 'media/v1.mp4', '#7B61FF', 860, true),
 ('p3',  null, 'Luna',   'gato',  'Bicolor',          '4 años', 'Camila S.',      'Sirari',     'Patas blancas, corazón enorme. Aprendió a abrir la puerta del refri.', '{Inteligente,Vacunada}', null, 'media/v2.mp4', '#1DBF73', 2310, false),
 ('p4',  null, 'Nube',   'gato',  'Siamés',           '3 años', 'Andrés M.',      'Las Palmas', 'Se perdió 2 días y volvió gracias a HUELLAS. Hoy es la embajadora del barrio.', '{"Reunida 💚","Con chip"}', null, 'media/v4.mp4', '#FFB020', 5120, false),
 ('p5',  null, 'Tigre',  'gato',  'Naranja',          '5 años', 'Familia Rojas',  'Mutualista', 'Comelón profesional. Patrulla el mercado como si fuera el dueño.', '{Callejero,Sociable}', null, 'media/v3.mp4', '#FF4D4D', 970, false),
 ('p6',  null, 'Toby',   'perro', 'Jack Russell',     '6 años', 'Jorge P.',       'Equipetrol', 'Olfato de detective. Le teme a los cohetes de fin de año.', '{Juguetón,"Collar rojo"}', 'media/pets/toby.jpg', null, '#FFB020', 640, true),
 ('p7',  null, 'Coco',   'perro', 'Dálmata',          '3 años', 'Lucía V.',       'Urbarí',     'Tiene 101 manchas (las contamos). Le encanta mirar la calle desde el balcón.', '{Curiosa,Vacunada,"Con chip"}', 'media/pets/coco.jpg', null, '#1B1A2E', 3020, false),
 ('p8',  null, 'Max',    'perro', 'Yorkshire terrier','4 años', 'Paola G.',       'Sirari',     'Pequeño en tamaño, gigante en actitud. Guardián oficial del condominio.', '{Valiente,"Peluquería al día"}', 'media/pets/max.jpg', null, '#FFB020', 1580, false),
 ('p9',  null, 'Bruno',  'perro', 'Pug',              '5 años', 'Rodrigo C.',     'Centro',     'Ronca más fuerte que su dueño. Fan número uno del pollo broaster.', '{Dormilón,Glotón}', 'media/pets/bruno.jpg', null, '#FF6B35', 2740, false),
 ('p10', null, 'Kira',   'perro', 'Border collie',    '2 años', 'Sofía M.',       'Urubó',      'La más rápida del parque. Atrapa frisbees y corazones.', '{Atlética,Obediente,"Con chip"}', 'media/pets/kira.jpg', null, '#7B61FF', 4210, false),
 ('p11', null, 'Simón',  'conejo','Holandés enano',   '1 año',  'Mateo F.',       'Las Palmas', 'Come zanahorias, salta de felicidad y muerde cables si no lo vigilas.', '{Saltarín,Tierno}', 'media/pets/simon.jpg', null, '#1DBF73', 990, false),
 ('p12', null, 'Nala',   'gato',  'Gata negra',       '3 años', 'Fernanda L.',    'Hamacas',    'Trae buena suerte, digan lo que digan. Ojos color miel.', '{Misteriosa,Esterilizada}', 'media/pets/nala.jpg', null, '#1B1A2E', 1870, false),
 ('p13', null, 'Lucas',  'perro', 'Mestizo',          '2 años', 'Familia Suárez', 'Plan 3000',  'Rescatado de la calle gracias a HUELLAS. Hoy es el payaso de la casa.', '{"Adoptado 💚",Sociable}', 'media/pets/lucas.jpg', null, '#FF4D4D', 3560, false)
on conflict (id) do nothing;

insert into public.reports (id, user_id, created_at, type, species, name, breed, color, zone, lat, lng, description, reward, contact, photo, video, pet_id, likes) values
 ('r1',  null, now() - interval '5 hours',  'perdido',    'perro', 'Toby',                   'Jack Russell',    'Blanco y café',   'Equipetrol',        -17.7633, -63.1957, 'Collar rojo con placa. Se asustó con los cohetes y salió por el portón. Es muy amigable.', 'Bs 500', '59170000000', 'media/pets/toby.jpg', null, 'p6', 48),
 ('r2',  null, now() - interval '2 hours',  'visto',      'perro', 'Jack Russell sin collar', 'Jack Russell',   'Blanco y café',   'Sirari',            -17.7704, -63.1925, 'Lo vi caminando por la avenida San Martín, parecía desorientado. Iba hacia el 3er anillo.', null, '59170000001', null, null, null, 12),
 ('r3',  null, now() - interval '20 hours', 'perdido',    'gato',  'Mishi',                  'Mestizo',         'Blanco y gris',   'Urbarí',            -17.7946, -63.1953, 'Gata esterilizada, muy tímida. Tiene una mancha gris en la cola.', null, '59170000002', null, 'media/v1.mp4', 'p2', 31),
 ('r4',  null, now() - interval '9 hours',  'encontrado', 'perro', 'Cachorro café',          'Mestizo',         'Café',            'Plan 3000',         -17.8267, -63.1284, 'Lo tengo resguardado en casa, está bien alimentado. Busco a su familia.', null, '59170000003', 'media/pets/cachorro.jpg', null, null, 64),
 ('r5',  null, now() - interval '50 hours', 'reunido',    'gato',  'Nube',                   'Siamés',          'Crema',           'Las Palmas',        -17.7963, -63.2046, '¡Gracias a una vecina que la vio en el mapa, Nube ya está en casa! 💚', null, '59170000004', null, 'media/v4.mp4', 'p4', 210),
 ('r6',  null, now() - interval '30 hours', 'perdido',    'perro', 'Rocky',                  'Pastor alemán',   'Negro y fuego',   'Banzer 4to anillo', -17.7403, -63.1776, 'Tiene chip. Responde a su nombre. Necesita medicación diaria.', 'Bs 1000', '59170000005', 'media/pets/rocky.jpg', null, null, 89),
 ('r7',  null, now() - interval '7 hours',  'visto',      'gato',  'Gato atigrado',          'Mestizo',         'Atigrado',        'Hamacas',           -17.7547, -63.1724, 'Está en el techo de una tienda en la calle 2, maúlla mucho.', null, '59170000006', 'media/pets/atigrado.jpg', null, null, 9),
 ('r8',  null, now() - interval '12 hours', 'perdido',    'ave',   'Paco',                   'Loro hablador',   'Verde',           'Centro',            -17.7830, -63.1818, 'Dice "hola Paco" y silba. Se escapó cerca de la plaza.', null, '59170000007', null, null, null, 57),
 ('r9',  null, now() - interval '16 hours', 'encontrado', 'perro', 'Golden con pañuelo',     'Golden retriever','Dorado',          'Urubó',             -17.7563, -63.2376, 'Apareció en el condominio con pañuelo azul. Muy cariñoso.', null, '59170000008', 'media/pets/golden.jpg', null, null, 41),
 ('r10', null, now() - interval '3 hours',  'perdido',    'gato',  'Tigre',                  'Mestizo',         'Naranja y blanco','Mutualista',        -17.7652, -63.1603, 'Gato naranja con pecho blanco. Último avistamiento en el mercado.', null, '59170000009', null, 'media/v3.mp4', 'p5', 22),
 ('r11', null, now() - interval '72 hours', 'reunido',    'perro', 'Lola',                   'Poodle',          'Blanco',          'Villa 1ro de Mayo', -17.7574, -63.1297, 'Volvió a casa en menos de 24h. ¡Gracias comunidad HUELLAS!', null, '59170000000', 'media/pets/lola.jpg', null, null, 180),
 ('r12', null, now() - interval '1 hour',   'visto',      'perro', 'Perrito negro',          'Mestizo',         'Negro',           'Pampa de la Isla',  -17.7718, -63.1183, 'Corriendo por la doble vía, cojea de la pata trasera.', null, '59170000001', 'media/pets/negrito.jpg', null, null, 6)
on conflict (id) do nothing;
