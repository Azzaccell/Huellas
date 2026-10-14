// Genera las versiones de un solo archivo (CSS y JS en línea). Uso: node build.js
//  - compartir.html  → para publicar como Artifact (el visor pone <html>/<head>/<body>)
//  - 4patitas-movil.html → documento completo para abrir en el celular o subir a cualquier hosting
// Ambas usan OpenStreetMap; si las teselas no cargan, muestran el mapa dibujado de anillos.
const fs = require('fs'), path = require('path');
const r = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>4 Patitas</title>
<meta name="description" content="La red de vecinos que cuida a las mascotas de Santa Cruz de la Sierra.">
<meta name="theme-color" content="#F6F5E3">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='11.2' fill='%23EEDDB9' stroke='%23272016' stroke-width='1.4'/%3E%3Cg fill='none' stroke='%23272016' stroke-width='1.5'%3E%3Cellipse cx='12' cy='15.2' rx='3.6' ry='3'/%3E%3Cellipse cx='7.3' cy='11' rx='1.3' ry='1.7'/%3E%3Cellipse cx='10.1' cy='7.8' rx='1.3' ry='1.8'/%3E%3Cellipse cx='13.9' cy='7.8' rx='1.3' ry='1.8'/%3E%3Cellipse cx='16.7' cy='11' rx='1.3' ry='1.7'/%3E%3C/g%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Nunito:wght@400;600;700;800&family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet">
<style>
${r('vendor/leaflet.min.css')}
${r('css/styles.css')}
</style>`;

// online: incluye Supabase + config (base de datos compartida). El Artifact no puede conectarse
// a servidores externos, así que su versión queda en modo local.
const makeBody = online => `<div id="app"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/vue/3.5.13/vue.global.prod.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
${online ? `<script>
${r('vendor/supabase.min.js')}
</script>
<script>
${r('js/config.js')}
</script>` : ''}
<script>
${r('js/data.js')}
</script>
<script>
${r('js/api.js')}
</script>
<script>
${r('js/app.js')}
</script>`;
const body = makeBody(false);

// Para la versión de un solo archivo se incrustan las fotos y los videos cortos como data URIs,
// así se ve completa aunque se mande sola por WhatsApp (sin la carpeta media/).
const TYPES = { '.jpg': 'image/jpeg', '.avif': 'image/avif', '.mp4': 'video/mp4' };
const embed = ['media/ilustracion.jpg', 'media/img2.avif', 'media/v1.mp4', 'media/v2.mp4', 'media/v4.mp4',
  ...fs.readdirSync(path.join(__dirname, 'media/pets')).filter(f => f.endsWith('.jpg')).map(f => 'media/pets/' + f)];
const media = Object.fromEntries(embed.map(p => [p, `data:${TYPES[path.extname(p)]};base64,` + fs.readFileSync(path.join(__dirname, p)).toString('base64')]));
const liteBody = `<script>window.HUELLAS_LITE = true; window.HUELLAS_MEDIA = ${JSON.stringify(media)};</script>\n${makeBody(true)}`;

const out = {
  'compartir.html': `${head}\n${body}\n`,
  '4patitas-movil.html': `<!doctype html>\n<html lang="es">\n<head>\n${head}\n</head>\n<body>\n${liteBody}\n</body>\n</html>\n`,
};
for (const [name, html] of Object.entries(out)) {
  fs.writeFileSync(path.join(__dirname, name), html);
  console.log(name, (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB');
}
