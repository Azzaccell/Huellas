/* Conexión a Supabase. Con los dos campos vacíos, HUELLAS funciona en modo local (datos solo en este navegador).
   Los valores salen de Supabase → Project Settings → API. La "anon / publishable key" es pública por diseño:
   la seguridad la ponen las reglas (RLS) de supabase/schema.sql. Nunca pongas aquí la "service_role key". */
window.HUELLAS_CONFIG = {
  supabaseUrl: '',
  supabaseKey: '',
};
