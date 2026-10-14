-- 4 PATITAS · actualiza los textos de los datos de ejemplo al nuevo nombre.
-- Pegar en Supabase → SQL Editor → Run. Solo toca las filas de ejemplo (sin dueño).
update public.reports
   set description = replace(replace(description, ' 💚', ''), 'HUELLAS', '4 Patitas')
 where user_id is null;

update public.pets
   set bio = replace(bio, 'HUELLAS', '4 Patitas'),
       traits = array_replace(array_replace(traits, 'Reunida 💚', 'Reunida'), 'Adoptado 💚', 'Adoptada')
 where user_id is null;
