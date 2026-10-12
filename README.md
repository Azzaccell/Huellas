# HUELLAS 🐾

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

- `huellas-movil.html`: documento completo con el mapa de OpenStreetMap. Lo empaqueta `huellas-movil.zip`, como `index.html` más la carpeta `media/`, listo para subir a cualquier hosting.
- `compartir.html`: la versión publicada como Artifact en https://claude.ai/artifact/L2wDyGS4L2HF8uChDdLTjZ.

Ambas intentan cargar OpenStreetMap. Si no hay internet o el visor bloquea las teselas, muestran el mapa dibujado de Santa Cruz, con los anillos, las radiales y el río Piraí.
Cada vez que cambies algo en `css/` o `js/`, vuelve a correr `node build.js`.

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
