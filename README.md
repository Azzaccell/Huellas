# 4 Patitas

**Web en vivo:** https://azzaccell.github.io/Huellas/

Red social de mascotas de Santa Cruz de la Sierra: mapa en vivo de mascotas perdidas, avistadas y rescatadas, perfiles de mascotas y una comunidad.

## Cómo correrla

```bash
node server.js
```

Abre http://localhost:5200. No hay que compilar nada ni correr `npm install`.

## Versión para compartir y para celular

```bash
node build.js
```

Genera dos archivos que llevan el CSS y el JS dentro:

- `4patitas-movil.html`: documento completo con el mapa de OpenStreetMap. Lo empaqueta `4patitas-movil.zip`, como `index.html` más la carpeta `media/`, listo para subir a cualquier hosting.
- `compartir.html`: la versión publicada como Artifact en https://claude.ai/artifact/L2wDyGS4L2HF8uChDdLTjZ.

Ambas intentan cargar OpenStreetMap. Si no hay internet o el visor bloquea las teselas, muestran el mapa dibujado de Santa Cruz, con los anillos, las radiales y el río Piraí.
Cada vez que cambies algo en `css/` o `js/`, vuelve a correr `node build.js`.

## Base de datos compartida (Supabase)

Sin configurar, cada visitante ve solo sus propios datos. Con Supabase, todos ven las mismas alertas en tiempo real.

1. Crea un proyecto gratis en https://supabase.com, con la región **South America (São Paulo)**.
2. En **SQL Editor** pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y presiona **Run**. Eso crea las tablas, las reglas de seguridad, el espacio para fotos, el tiempo real y los datos de ejemplo.
3. En **Authentication → Sign In / Providers**, activa **Allow anonymous sign-ins**. Así cada visitante recibe una sesión anónima y solo puede editar o borrar lo que publicó.
4. En **Project Settings → API**, copia la **Project URL** y la **anon / publishable key** a [`js/config.js`](js/config.js).
5. Ejecuta `node build.js` y luego haz `git push`.

Las reglas de seguridad (Row Level Security) se definen en `schema.sql`:

- Todos pueden leer.
- Para escribir hace falta una sesión.
- Cada quien edita y borra solo lo suyo.
- Los "me gusta" y los seguidores pasan por funciones que solo suman o restan 1.
- Las fotos se suben a la carpeta de cada usuario, con un máximo de 2 MB.

## Diseño

Estilo de libro ilustrado a línea, tomado de la ilustración de portada (`media/ilustracion.jpg`):

- **Paleta:** papel `#F6F5E3`, tinta `#272016`, paja `#EEDDB9`, salvia `#7A9270`, damasco `#E2AD8E` y piedra `#9E9A8E`.
- **Tipografía:** Quicksand para los títulos (trazo redondeado y parejo como el dibujo), Nunito para el texto y Caveat para las notas a mano.
- **Formas:** todo se dibuja con el mismo trazo de tinta de 1.75 px, con rellenos planos y sin sombras difusas. Los íconos son SVG de línea (`ICONS` en `js/app.js`).

## Stack (mismo enfoque que dontboardme.com)

- **Vue 3**: componentes reactivos y router por hash
- **GSAP + ScrollTrigger**: animaciones con el scroll, transiciones de página y scroll horizontal fijado
- **Lenis**: scroll suave
- **Leaflet + OpenStreetMap**: mapa gratis, sin API key

Todo se carga desde CDN, y el código propio pesa unos 100 KB sin comprimir.
Los datos se guardan en `localStorage`, que funciona como base de datos de demo.

## Estructura

- `index.html`: shell
- `css/styles.css`: diseño (tokens, responsive y barra inferior en celular)
- `js/data.js`: datos semilla de Santa Cruz, store, cálculo de coincidencias y distancias
- `js/app.js`: páginas (Inicio, Mapa, Publicar, Comunidad, Perfil, Registrar) y animaciones
- `media/`: videos e imágenes
