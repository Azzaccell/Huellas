/* Conexión a Supabase. Con los dos campos vacíos, HUELLAS funciona en modo local (datos solo en este navegador).
   Los valores salen de Supabase → Project Settings → API. La "anon / publishable key" es pública por diseño:
   la seguridad la ponen las reglas (RLS) de supabase/schema.sql. Nunca pongas aquí la "service_role key". */
window.HUELLAS_CONFIG = {
  // Dirección pública de la web. Google solo puede volver a una dirección web, así que el HTML
  // abierto como archivo (por ejemplo desde WhatsApp) abre esta página para iniciar sesión.
  siteUrl: 'https://azzaccell.github.io/Huellas/',
  // Botón "Continuar con Google" (requiere activar el proveedor Google en Supabase).
  googleLogin: true,
  supabaseUrl: 'https://qxpyyxoontyrikgdokip.supabase.co',
  supabaseKey: 'sb_publishable_DRUdKM_Rl-Vtjh8g8Vw4_A_W5dSQd5Z',
};
