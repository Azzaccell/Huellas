/* 4 PATITAS — app (Vue 3 + GSAP/ScrollTrigger + Lenis + Leaflet), sin build step */
const { createApp, ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick, markRaw } = Vue;
const { state, TYPES, SPECIES, ACCENTS, accentOf, ZONES, CENTER, matches, timeAgo, km, M, LITE, actions, status, canEdit, auth } = window.HUELLAS;
gsap.registerPlugin(ScrollTrigger);

const BRAND = '4 Patitas';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- íconos de línea (24×24, trazo 1.75, mismo pulso que la ilustración) ---------- */
const ICONS = {
  paw: '<ellipse cx="12" cy="16.3" rx="4.7" ry="3.9"/><ellipse cx="5.8" cy="10.8" rx="1.8" ry="2.3"/><ellipse cx="9.5" cy="6.6" rx="1.8" ry="2.4"/><ellipse cx="14.5" cy="6.6" rx="1.8" ry="2.4"/><ellipse cx="18.2" cy="10.8" rx="1.8" ry="2.3"/>',
  map: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chat: '<path d="M4.5 5.5h15v10.2h-8.2L7 19.5v-3.8H4.5z"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19c.9-3.3 3.2-5 6-5s5.1 1.7 6 5"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 6M17.6 14.3c1.8.6 3 2.2 3.4 4.7"/>',
  home: '<path d="M4 11 12 4.5l8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  megaphone: '<path d="M4 9.5v5h3l8 4.5v-14L7 9.5z"/><path d="M18 9.5c1.3.7 1.3 4.3 0 5M7.5 14.5l1 4.5h2.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.3C19.5 15.4 12 20 12 20z"/>',
  share: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M5 13v6.5h14V13"/>',
  pin: '<path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  camera: '<path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4z"/><circle cx="12" cy="13.3" r="3.4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  whatsapp: '<path d="M5.3 18.7 6.4 15A7.6 7.6 0 1 1 9.3 17.9z"/><path d="M9.4 8.8c.2 2.4 2.4 4.8 5.2 5.4l1-1.3-1.7-.9-.8.8c-1-.4-2-1.4-2.4-2.4l.8-.8-.9-1.7z"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  gift: '<path d="M4.5 11h15v9h-15zM3.5 7.5h17V11h-17zM12 7.5V20"/><path d="M12 7.5C10.5 4 7 4.2 7.6 6.6c.3 1 2 .9 4.4.9m0 0c1.5-3.5 5-3.3 4.4-.9-.3 1-2 .9-4.4.9"/>',
  spark: '<path d="M12 3.5c.6 4.3 2.2 6 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.5 5.9-2.2 6.5-6.5z"/><path d="M18.5 15.5c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5z"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 19.5h1.5M19.5 14v1.5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  locate: '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 17.5h2"/>',
  id: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M14.5 10h3.5M14.5 13.5h3"/>',
  star: '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  logout: '<path d="M14 4.5H6.5v15H14M10 12h10M16.5 8.5 20 12l-3.5 3.5"/>',
  leaf: '<path d="M5 19c0-8 5-13.5 14-14-.3 9-5.6 14-14 14z"/><path d="M5 19c3-4 6-6.5 9.5-8.5"/>',
  hand: '<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6a1.5 1.5 0 0 1 3 0v8.5c0 3.5-2.4 6-6 6-2.7 0-4.2-1.3-5.6-3.4L4.2 13.7a1.4 1.4 0 0 1 2.2-1.6L8 13.8"/>',
  dog: '<path d="M8.2 6.6C5.6 6 4 7.6 4 10.6c0 2 .9 3.3 2.3 3.4"/><path d="M15.8 6.6c2.6-.6 4.2 1 4.2 4 0 2-.9 3.3-2.3 3.4"/><path d="M7.5 9.2C7.5 6.6 9.5 5 12 5s4.5 1.6 4.5 4.2v5.3c0 2.7-2 4.5-4.5 4.5s-4.5-1.8-4.5-4.5z"/><path d="M10.7 15.2h2.6L12 16.6z"/><path d="M10 11.2v.01M14 11.2v.01"/>',
  cat: '<path d="M5 13.5V4.6l4 3.1h6l4-3.1v8.9c0 3.7-3.1 6-7 6s-7-2.3-7-6z"/><path d="M11 14.6h2l-1 1z"/><path d="M9.3 11.6v.01M14.7 11.6v.01"/><path d="M3 14.6l3.4.5M3.6 17.2l3.1-.9M21 14.6l-3.4.5M20.4 17.2l-3.1-.9"/>',
  bird: '<path d="M5 14.8c0-5 3.5-8.8 8-8.8 2.2 0 4 1.3 4.6 3.2L20.5 10l-2.8 1.3C17.4 16 14 19 9.5 19 7 19 5 17.3 5 14.8z"/><path d="M14.5 9.6v.01"/><path d="M7.5 13c1.8.4 3.6-.2 5-1.8M8 19l-1 2.5M11 19l.5 2.5"/>',
  rabbit: '<path d="M9.6 9C8.6 6 8.4 3 9.7 2.8c1.4-.2 1.7 3.2 1.6 5.9M14.4 9c1-3 1.2-6-.1-6.2-1.4-.2-1.7 3.2-1.6 5.9"/><path d="M6.5 14.5c0-3.4 2.5-6 5.5-6s5.5 2.6 5.5 6-2.5 5.5-5.5 5.5-5.5-2.1-5.5-5.5z"/><path d="M10 13.6v.01M14 13.6v.01"/><path d="M11.2 16h1.6l-.8.8z"/>',
};
const icoSvg = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.paw}</svg>`;
const CLOUD = '<path d="M9 40c-7 0-8-11 2-12 0-11 17-15 21-4 4-13 26-11 25 4 11-1 14 12 3 12z"/>';

/* ---------- scroll suave (Lenis) sincronizado con ScrollTrigger ---------- */
const lenis = new Lenis({ lerp: 0.1, smoothWheel: !reduced });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ---------- router por hash ---------- */
const ROUTES = [
  ['/', 'page-home'], ['/mapa', 'page-map'], ['/publicar', 'page-publish'],
  ['/comunidad', 'page-community'], ['/registrar', 'page-register'], ['/mascota/:id', 'page-pet'], ['/cuenta', 'page-account'],
];
const parse = (hash = location.hash) => {
  const [path, qs = ''] = (hash.replace(/^#/, '') || '/').split('?');
  const query = Object.fromEntries(new URLSearchParams(qs));
  for (const [pattern, comp] of ROUTES) {
    const keys = [], rx = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$');
    const m = path.match(rx);
    if (m) return { path, comp, query, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return { path: '/', comp: 'page-home', query, params: {} };
};
const route = ref(parse());
addEventListener('hashchange', () => { route.value = parse(); });
// Navegación en memoria: funciona igual dentro de un iframe/visor compartido que como sitio normal
const go = p => {
  route.value = parse('#' + p);
  try { history.replaceState(null, '', '#' + p); } catch (e) {}
};
addEventListener('click', e => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  go(a.getAttribute('href').slice(1));
});

/* ---------- UI global: modal, toast ---------- */
const ui = reactive({ modal: null, toast: '' });
let toastT;
const toast = msg => { ui.toast = msg; clearTimeout(toastT); toastT = setTimeout(() => (ui.toast = ''), 3200); };
window.HUELLAS.onError = toast;
const openAlert = id => { ui.modal = id; lenis.stop(); };
const closeAlert = () => { ui.modal = null; lenis.start(); };

const share = async (title, hash) => {
  const url = location.origin + location.pathname + hash;
  try { if (navigator.share) { await navigator.share({ title, url }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); }
  catch (e) { toast('Copia este enlace: ' + url); }
};
const waLink = r => `https://wa.me/${r.contact}?text=${encodeURIComponent(`Hola, te escribo por "${r.name}" en ${BRAND}`)}`;

/* Imagen → JPEG comprimido (mantiene el localStorage liviano) */
const readImage = (file, max = 900) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = img.width * s; c.height = img.height * s;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    res(c.toDataURL('image/jpeg', 0.78));
  };
  img.onerror = rej;
  img.src = URL.createObjectURL(file);
});

/* ---------- animaciones ---------- */
/* Entrada determinística: fromTo con valores finales fijos (no se "congela" si se re-ejecuta) */
const FROM_KEYS = ['x', 'y', 'opacity', 'scale', 'rotate'];
const intro = (targets, vars) => {
  const from = {}, to = { clearProps: 'opacity,transform,translate,rotate,scale' };
  for (const k in vars) (FROM_KEYS.includes(k) ? from : to)[k] = vars[k];
  for (const k in from) to[k] = k === 'opacity' || k === 'scale' ? 1 : 0;
  return gsap.fromTo(targets, from, to);
};
// Dibuja un trazo SVG de punta a punta (como una línea hecha a mano)
const drawLines = (els, vars = {}) => {
  gsap.utils.toArray(els).forEach(el => {
    const len = el.getTotalLength ? el.getTotalLength() : 200;
    gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', ...vars, onComplete: () => gsap.set(el, { clearProps: 'strokeDasharray,strokeDashoffset' }) });
  });
};

// gsap.context agrupa tweens y ScrollTriggers de la página para limpiarlos al salir
function usePageFx(root, setup) {
  let ctx;
  onMounted(() => nextTick(() => {
    ctx = gsap.context(() => {
      if (!reduced) {
        // aparición suave al entrar en pantalla (el contenido ya es visible en reposo)
        ScrollTrigger.batch(root.value.querySelectorAll('[data-reveal]'), {
          start: 'top 92%', once: true,
          onEnter: b => gsap.fromTo(b, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .08, overwrite: true }),
        });
        // la línea de suelo se traza de izquierda a derecha
        gsap.utils.toArray(root.value.querySelectorAll('.ground')).forEach(g =>
          gsap.fromTo(g, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: g, start: 'top 95%', end: 'top 55%', scrub: .6 } }));
      }
      setup && !reduced && setup();
    }, root.value);
  }));
  onBeforeUnmount(() => ctx && ctx.revert());
}

/* Autoplay solo cuando el video está visible (ahorra batería/CPU) */
const io = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
}), { rootMargin: '100px' });
const vAuto = { mounted: el => io.observe(el), beforeUnmount: el => io.unobserve(el) };

/* Huellita de línea al tocar la pantalla */
addEventListener('pointerdown', e => {
  if (reduced || e.target.closest('.map, .leaflet-container, input, textarea, select, button, a')) return;
  const p = document.createElement('div');
  p.className = 'paw-fx'; p.innerHTML = `<svg viewBox="0 0 24 24">${ICONS.paw}</svg>`;
  p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px';
  document.body.appendChild(p);
  gsap.fromTo(p, { scale: .3, rotate: gsap.utils.random(-30, 30), opacity: 1 }, { scale: 1, y: -18, opacity: 0, duration: .9, ease: 'power2.out', onComplete: () => p.remove() });
});

/* ---------- Leaflet ---------- */
// Teselas de OpenStreetMap (gratis, sin API key); el tono sepia se da con filtros CSS
const TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const pinIcon = r => L.divIcon({
  className: '', iconSize: [42, 42], iconAnchor: [21, 50], popupAnchor: [0, -46],
  html: `<div class="pin ${r.type === 'perdido' ? 'pulse' : ''}" style="--c:${TYPES[r.type].color}"><svg viewBox="0 0 24 24">${ICONS[SPECIES[r.species]] || ICONS.paw}</svg></div>`,
});
// Mapa vectorial propio de Santa Cruz (anillos, radiales, río Piraí, barrios) si las teselas no cargan.
const VECTOR = !!window.HUELLAS_VECTOR_MAP;
const RINGS = [['1er', 750], ['2do', 1450], ['3er', 2350], ['4to', 3350], ['5to', 4450], ['6to', 5650], ['7mo', 6900], ['8vo', 8200]];
const RADIALS = [-12, 18, 48, 82, 128, 168, 205, 240, 300, 335]; // rumbos de las avenidas radiales
const offset = ([lat, lng], m, deg) => {
  const r = deg * Math.PI / 180;
  return [lat + (m * Math.cos(r)) / 111320, lng + (m * Math.sin(r)) / (111320 * Math.cos(lat * Math.PI / 180))];
};
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function drawCity(map, { labels = true } = {}) {
  const ink = cssVar('--ink'), soft = cssVar('--stone');
  RADIALS.forEach(deg => L.polyline([offset(CENTER, 300, deg), offset(CENTER, 9600, deg)], { color: soft, weight: 1.5, interactive: false }).addTo(map));
  RINGS.forEach(([name, m], i) => {
    L.circle(CENTER, { radius: m, color: ink, weight: i < 4 ? 1.75 : 1.2, opacity: .8, fill: false, interactive: false }).addTo(map);
    if (labels) L.marker(offset(CENTER, m, 0), { interactive: false, icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="ring-label">${name} anillo</div>` }) }).addTo(map);
  });
  L.polyline([[-17.70, -63.215], [-17.73, -63.222], [-17.76, -63.214], [-17.79, -63.221], [-17.82, -63.214], [-17.86, -63.222]], { color: cssVar('--sage'), weight: 6, opacity: .7, lineCap: 'round', interactive: false }).addTo(map);
  L.circleMarker(CENTER, { radius: 6, color: ink, fillColor: cssVar('--apricot'), fillOpacity: 1, weight: 1.75, interactive: false }).addTo(map);
  if (labels) Object.entries(ZONES).forEach(([z, ll]) => L.marker(ll, { interactive: false, icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="zone-label">${z}</div>` }) }).addTo(map));
}
const makeMap = (el, opts = {}) => {
  const map = L.map(el, { zoomControl: false, attributionControl: true, ...opts }).setView(opts.center || CENTER, opts.zoom || 13);
  const vector = () => { if (map._city) return; map._city = true; drawCity(map, { labels: !opts.static }); };
  if (VECTOR) vector();
  else {
    let loaded = false;
    const tiles = L.tileLayer(TILE, { attribution: ATTR, maxZoom: 19, className: opts.dark ? 'tiles-dark' : 'tiles' })
      .on('tileload', () => { loaded = true; })
      .on('tileerror', () => { if (!loaded) { map.removeLayer(tiles); vector(); } })
      .addTo(map);
    setTimeout(() => { if (!loaded && map.hasLayer(tiles)) { map.removeLayer(tiles); vector(); } }, 8000);
  }
  if (opts.zoomControl !== false && !opts.static) L.control.zoom({ position: 'topright' }).addTo(map);
  return markRaw(map);
};

/* ===================================================== */
/*                     COMPONENTES                       */
/* ===================================================== */
const app = createApp({
  setup() {
    // transición de página: el papel sube y una huella se dibuja a mano
    const curtain = ref(null);
    let first = true;
    const leave = (el, done) => {
      if (reduced) return done();
      const c = curtain.value;
      const strokes = c.querySelectorAll('.curtain__paw ellipse');
      gsap.timeline({ onComplete: done })
        .set(c, { visibility: 'visible' })
        .set(strokes, { strokeDasharray: 40, strokeDashoffset: 40 })
        .fromTo(c.querySelectorAll('.curtain__panel'), { scaleY: 0, transformOrigin: 'bottom' }, { scaleY: 1, duration: .5, ease: 'expo.inOut', stagger: .07 })
        .to(strokes, { strokeDashoffset: 0, duration: .45, ease: 'power2.out', stagger: .05 }, '-=.15')
        .fromTo(c.querySelector('.curtain__word'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .3 }, '<')
        .to(el, { opacity: 0, duration: .3 }, 0);
    };
    const enter = (el, done) => {
      lenis.scrollTo(0, { immediate: true, force: true });
      if (first || reduced) { first = false; ScrollTrigger.refresh(); return done(); }
      const c = curtain.value;
      gsap.timeline({ onComplete: () => { gsap.set(c, { visibility: 'hidden' }); ScrollTrigger.refresh(); done(); } })
        .to(c.querySelectorAll('.curtain__paw, .curtain__word'), { opacity: 0, y: -10, duration: .25, ease: 'power2.in' })
        .to([...c.querySelectorAll('.curtain__panel')].reverse(), { scaleY: 0, transformOrigin: 'top', duration: .55, ease: 'expo.inOut', stagger: .07 }, '-=.05')
        .set(c.querySelectorAll('.curtain__paw, .curtain__word'), { opacity: 1, y: 0 })
        .fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'power3.out', clearProps: 'transform,opacity' }, '-=.4');
    };
    return { route, ui, curtain, leave, enter, closeAlert, ICONS };
  },
  template: `
    <site-nav />
    <transition :css="false" mode="out-in" @leave="leave" @enter="enter" appear>
      <component :is="route.comp" :key="route.path" />
    </transition>
    <site-footer v-if="route.comp !== 'page-map'" />
    <tab-bar />
    <div class="curtain" ref="curtain" aria-hidden="true">
      <div class="curtain__panel curtain__panel--2"></div>
      <div class="curtain__panel"></div>
      <div class="curtain__paw"><svg viewBox="0 0 24 24" v-html="ICONS.paw"></svg></div>
      <div class="curtain__word">un momentito…</div>
    </div>
    <transition name="fade"><alert-modal v-if="ui.modal" :id="ui.modal" @close="closeAlert" /></transition>
    <transition name="fade"><div class="toast" v-if="ui.toast" role="status">{{ ui.toast }}</div></transition>
  `,
});

/* ---------- piezas base ---------- */
app.component('ico', {
  props: { name: String },
  setup: () => ({ ICONS }),
  template: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" v-html="ICONS[name] || ICONS.paw"></svg>`,
});
app.component('brand', {
  template: `<a href="#/" class="brand" aria-label="${BRAND}, inicio"><span class="brand__mark"><ico name="paw" /></span><span><b>4</b> patitas</span></a>`,
});
app.component('cloud', {
  setup: () => ({ CLOUD }),
  template: `<div class="cloud" aria-hidden="true"><svg viewBox="0 0 64 44" v-html="CLOUD"></svg></div>`,
});
app.component('ground', { template: `<div class="ground" aria-hidden="true"></div>` });

/* ---------- navegación ---------- */
const LINKS = [['/', 'Inicio', 'home'], ['/mapa', 'Mapa', 'map'], ['/publicar', 'Publicar', 'plus'], ['/comunidad', 'Comunidad', 'users'], ['/registrar', 'Mi mascota', 'paw']];
const TABS = [...LINKS.slice(0, 4), ['/cuenta', 'Perfil', 'user']];
const isActive = p => (p === '/' ? route.value.path === '/' : route.value.path.startsWith(p));

app.component('user-avatar', {
  props: { size: { type: Number, default: 34 } },
  setup: () => ({ status }),
  template: `
    <span class="uavatar" :style="{width:size+'px',height:size+'px',fontSize:(size*.42)+'px'}">
      <img v-if="status.user && status.user.avatar" :src="status.user.avatar" alt="" referrerpolicy="no-referrer">
      <template v-else-if="status.user">{{ status.user.name.charAt(0).toUpperCase() }}</template>
      <ico v-else name="user" />
    </span>`,
});

// Botón oficial "Continuar con Google" (desactivado en config; queda listo para activarlo)
app.component('google-btn', {
  setup: () => ({ auth, status }),
  template: `
    <p v-if="auth.hosted && status.googleReady === false" class="acct__fine">El inicio con Google se está configurando.</p>
    <button v-else type="button" class="gbtn" :disabled="status.authBusy || status.connecting" @click="auth.login()">
      <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      <span>{{ status.authBusy ? 'Abriendo Google…' : 'Continuar con Google' }}</span>
    </button>`,
});

app.component('site-nav', {
  setup() {
    const hide = ref(false);
    let last = 0;
    lenis.on('scroll', ({ scroll }) => { hide.value = scroll > last && scroll > 200; last = scroll; });
    return { hide, links: LINKS.filter(l => l[0] !== '/publicar'), isActive, status, auth };
  },
  template: `
    <header class="nav" :class="{hide}">
      <div class="wrap nav__in">
        <brand />
        <nav class="nav__links" aria-label="Principal">
          <a v-for="l in links" :key="l[0]" :href="'#'+l[0]" :class="{active:isActive(l[0])}">{{ l[1] }}</a>
        </nav>
        <div class="nav__end">
          <a href="#/publicar" class="btn btn--alert btn--sm nav__cta"><ico name="megaphone" />Reportar mascota</a>
          <a v-if="auth.enabled" href="#/cuenta" class="nav__acct" :class="{active:isActive('/cuenta')}" :aria-label="status.user ? 'Mi cuenta' : 'Entrar'">
            <user-avatar :size="34" />
            <span class="nav__acct-label">{{ status.user ? status.user.name.split(' ')[0] : 'Entrar' }}</span>
          </a>
        </div>
      </div>
    </header>`,
});
app.component('tab-bar', {
  setup: () => ({ links: auth.enabled ? TABS : LINKS, isActive, status }),
  template: `
    <nav class="tabbar" aria-label="Secciones">
      <a v-for="l in links" :key="l[0]" :href="'#'+l[0]" :class="{active:isActive(l[0]), plus:l[0]==='/publicar'}" :aria-label="l[1]">
        <user-avatar v-if="l[0]==='/cuenta' && status.user" :size="24" /><ico v-else :name="l[2]" />
        <span v-if="l[0]!=='/publicar'">{{ l[0]==='/cuenta' && status.user ? 'Yo' : l[1] }}</span>
      </a>
    </nav>`,
});
app.component('site-footer', {
  template: `
    <footer class="foot">
      <div class="wrap">
        <ground />
        <div class="foot__grid" style="margin-top:44px">
          <div>
            <brand />
            <p class="mt" style="max-width:36ch">La red de vecinos que cuida a las mascotas de Santa Cruz de la Sierra. Hecha por cambas que quieren a sus peludos.</p>
          </div>
          <div><h4>Explorar</h4><a href="#/mapa">Mapa en vivo</a><a href="#/comunidad">Comunidad</a><a href="#/publicar">Reportar</a></div>
          <div><h4>Tu mascota</h4><a href="#/registrar">Registrar perfil</a><a href="#/cuenta">Mi cuenta</a></div>
          <div><h4>Ayuda</h4><a href="#/">Preguntas frecuentes</a><a href="#/">Refugios aliados</a><a href="#/">Contacto</a></div>
        </div>
        <div class="foot__big" aria-hidden="true">4 patitas</div>
        <p class="muted mt">© ${new Date().getFullYear()} ${BRAND} · Santa Cruz de la Sierra, Bolivia</p>
      </div>
    </footer>`,
});

/* ---------- media reutilizable (video / foto / dibujo de la especie) ---------- */
app.component('pet-media', {
  props: ['item'],
  setup: () => ({ SPECIES, M, hide: e => (e.target.style.visibility = 'hidden') }),
  template: `
    <video v-if="item.video" v-auto :src="M(item.video)" muted loop playsinline preload="none"></video>
    <img v-else-if="item.photo" :src="M(item.photo)" :alt="item.name" loading="lazy" @error="hide">
    <div v-else class="media-blank"><ico :name="SPECIES[item.species] || 'paw'" /></div>`,
});
app.component('type-tag', {
  props: ['type'],
  setup: () => ({ TYPES }),
  template: `<span class="tag"><i :style="{'--c':TYPES[type].dot}"></i>{{ TYPES[type].label }}</span>`,
});
app.component('pet-card', {
  props: ['pet'],
  setup: () => ({ accentOf }),
  template: `
    <a :href="'#/mascota/'+pet.id" class="pet-card" :style="{'--accent':accentOf(pet.accent, pet.id)}">
      <div class="pet-card__media"><pet-media :item="pet" />
        <span v-if="pet.lost" class="pet-card__badge"><type-tag type="perdido" /></span>
      </div>
      <div class="pet-card__body">
        <h3>{{ pet.name }} <small><ico name="heart" />{{ (pet.followers||0).toLocaleString('es-BO') }}</small></h3>
        <p>{{ pet.breed }} · {{ pet.zone }}</p>
        <div class="traits"><span v-for="t in pet.traits" :key="t">{{ t }}</span></div>
      </div>
    </a>`,
});

/* ===================== INICIO ===================== */
app.component('page-home', {
  setup() {
    const root = ref(null), mini = ref(null);
    const pets = computed(() => state.pets);
    const lostCount = computed(() => state.reports.filter(r => r.type === 'perdido').length);
    const homeCount = computed(() => state.reports.filter(r => r.type === 'reunido').length);
    const byId = (...ids) => ids.map(id => state.pets.find(p => p.id === id)).filter(Boolean);
    const faces = computed(() => byId('p8', 'p12', 'p11', 'p13'));
    const mission = LITE ? { photo: 'media/pets/golden.jpg', name: 'Golden' } : { video: 'media/v3.mp4', name: 'Tigre' };
    const art = M('media/ilustracion.jpg');
    let map;

    usePageFx(root, () => {
      intro('.story', { y: 14, opacity: 0, duration: .6, ease: 'power3.out', stagger: .04, delay: .1 });
      gsap.from('.hero h1 .line>span', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .09, delay: .15 });
      drawLines('.hero .underline path', { delay: .9 });
      intro('.hero .lead, .hero__cta > *, .hero__proof', { y: 18, opacity: 0, duration: .9, ease: 'power3.out', stagger: .07, delay: .45 });
      intro('.hero__art img', { y: 24, opacity: 0, duration: 1.4, ease: 'power3.out', delay: .25 });
      drawLines('.hero__art .note path', { delay: 1.4, duration: .8 });
      // nubes que flotan despacio, como en la ilustración
      gsap.utils.toArray('.hero__art .cloud').forEach((c, i) => gsap.to(c, { x: i % 2 ? -26 : 30, duration: 9 + i * 3, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
      gsap.to('.hero__art img', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

      // contadores
      gsap.utils.toArray('[data-count]').forEach(el => {
        const o = { v: 0 }, end = +el.dataset.count;
        gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' }, onUpdate: () => (el.textContent = Math.round(o.v) + (el.dataset.suffix || '')) });
      });

      // "Cómo funciona": recorrido horizontal fijado (solo escritorio)
      gsap.matchMedia().add('(min-width: 721px)', () => {
        const track = document.querySelector('.how__track');
        const dist = () => track.scrollWidth - innerWidth;
        gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.how', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
      });
      drawLines('.step__art .ico *', { scrollTrigger: { trigger: '.how', start: 'top 70%' }, stagger: .02 });
      gsap.fromTo('.identity .frame img', { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.identity', scrub: true } });
    });

    onMounted(() => {
      map = makeMap(mini.value, { static: true, zoom: 12, zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, keyboard: false, attributionControl: false });
      state.reports.forEach(r => L.marker([r.lat, r.lng], { icon: pinIcon(r), interactive: false }).addTo(map));
      setTimeout(() => map.invalidateSize(), 900);
    });
    onBeforeUnmount(() => map && map.remove());

    const features = [
      ['spark', 'var(--apricot-l)', 'Coincidencias automáticas', 'Si alguien ve un perrito parecido cerca de donde se perdió el tuyo, la app los conecta por especie, color y distancia.'],
      ['qr', 'var(--straw)', 'Perfil con QR', 'Cada mascota tiene su ficha con fotos, señas y un QR para el collar. Quien la encuentre te avisa en un toque.'],
      ['bell', 'var(--stone-l)', 'Alertas por barrio', 'Lo que pasa a tu alrededor primero. Una alerta nueva llega a los vecinos en un radio de 5 km.'],
      ['leaf', 'var(--straw)', 'Liviana y gratis', 'Funciona desde el navegador del celular, sin descargas. Publicar una alerta toma menos de un minuto.'],
    ];
    const steps = [
      ['camera', '#C99A3E', 'var(--straw)', 'Crea su perfil', 'Sube fotos, señas particulares, chip y vacunas. Si algún día se pierde, todo ya está listo.'],
      ['megaphone', '#B9694A', 'var(--apricot-l)', 'Activa la alerta', 'Con un toque marcas dónde y cuándo se perdió. Su perfil se convierte en un afiche.'],
      ['users', '#8C887B', 'var(--stone-l)', 'El barrio se activa', 'Los vecinos cercanos ven la alerta y marcan en el mapa dónde la vieron.'],
      ['heart', '#56704D', 'var(--sage-l)', 'Reencuentro', 'Te avisamos de cada coincidencia, hablas directo por WhatsApp y celebras con la comunidad.'],
    ];
    return { root, mini, pets, lostCount, homeCount, faces, mission, art, state, features, steps, M };
  },
  template: `
  <main ref="root">
    <!-- HERO: la ilustración es la portada -->
    <section class="hero">
      <div class="wrap">
        <div class="stories" aria-label="Mascotas de la comunidad">
          <a href="#/registrar" class="story story--add"><span class="story__ring"><ico name="plus" /></span><small>Tu mascota</small></a>
          <a v-for="p in pets" :key="p.id" :href="'#/mascota/'+p.id" class="story">
            <span class="story__ring" :class="{lost:p.lost}"><pet-media :item="p" /></span>
            <small>{{ p.name }}</small>
          </a>
        </div>
      </div>
      <div class="wrap hero__grid">
        <div>
          <span class="eyebrow"><ico name="pin" />Santa Cruz de la Sierra</span>
          <h1 class="h-xl">
            <span class="line"><span>Cada patita</span></span>
            <span class="line"><span>vuelve a <span class="hand underline">casa.<svg viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M4 13c40-9 115-11 192-2"/></svg></span></span></span>
          </h1>
          <p class="lead">La red de vecinos que cuida a las mascotas de Santa Cruz. Registra a la tuya, marca en el mapa a las que se perdieron y ayuda a que vuelvan con su familia en horas, no semanas.</p>
          <div class="hero__cta">
            <a href="#/publicar" class="btn btn--alert"><ico name="megaphone" />Perdí a mi mascota</a>
            <a href="#/mapa" class="btn"><ico name="map" />Ver el mapa</a>
          </div>
          <div class="hero__proof">
            <div class="avatars"><span v-for="p in faces" :key="p.id"><pet-media :item="p" /></span></div>
            <span><b>{{ state.pets.length }} mascotas</b> en la manada · <b>{{ lostCount }} alertas activas</b></span>
          </div>
        </div>
        <div class="hero__art">
          <cloud style="width:13%;top:4%;left:4%" />
          <cloud style="width:9%;top:30%;right:0" />
          <img :src="art" alt="Dibujo a línea de una gata calicó y un perro blanco con sombreros de paja y pañuelos verdes" width="1448" height="1086">
          <div class="note" style="left:2%;bottom:16%">listos para<br>volver a casa
            <svg viewBox="0 0 46 38"><path d="M2 30c10 4 26 3 38-14M33 13l8 2-2 8"/></svg>
          </div>
        </div>
      </div>
    </section>

    <ground />

    <!-- MISIÓN -->
    <section class="section">
      <div class="wrap mission">
        <div class="frame" data-reveal><pet-media :item="mission" /></div>
        <div data-reveal>
          <span class="eyebrow">nuestra misión</span>
          <h2 class="h-lg" style="margin-top:8px">Ningún peludo debería dormir lejos de su plato.</h2>
          <p class="lead">Muchas mascotas se pierden en Santa Cruz por cohetes, portones abiertos o un descuido. Con ${BRAND}, todo el barrio se vuelve su red de búsqueda.</p>
          <div class="flex mt">
            <span class="tag"><i style="--c:#56704D"></i>{{ homeCount }} reencuentros</span>
            <span class="tag"><i style="--c:#B9694A"></i>{{ lostCount }} buscando su casa</span>
          </div>
        </div>
      </div>
    </section>

    <div class="ribbon" aria-hidden="true"><div class="ribbon__track">
      <span v-for="n in 2" :key="n">Registra <ico name="paw" /> Reporta <ico name="paw" /> Encuentra <ico name="paw" /> Reúne <ico name="paw" /> Adopta <ico name="paw" /> Comparte <ico name="paw" /></span>
    </div></div>

    <!-- POR QUÉ -->
    <section class="section">
      <div class="wrap">
        <div class="section__head">
          <div><span class="eyebrow">¿por qué 4 patitas?</span><h2 class="h-lg">Hecha para encontrarlos pronto.</h2></div>
          <p class="lead" style="max-width:42ch">Los grupos de WhatsApp se llenan de mensajes y las alertas se pierden. Aquí cada alerta queda en el mapa, se cruza con las demás y llega a quien está cerca.</p>
        </div>
        <div class="features">
          <article class="feature feature--big" data-reveal>
            <div>
              <div class="feature__ico" style="--c:var(--card)"><ico name="map" /></div>
              <h3 style="font-size:1.9rem">Mapa en vivo de toda la ciudad</h3>
              <p>Del Plan 3000 al Urubó: cada alerta queda en el punto exacto donde se perdió o se vio. Filtra por especie y por estado.</p>
              <a href="#/mapa" class="btn btn--sm mt">Abrir mapa <ico name="arrow" /></a>
            </div>
            <div class="mini-map" ref="mini"></div>
          </article>
          <article v-for="f in features" :key="f[2]" class="feature" data-reveal>
            <div class="feature__ico" :style="{'--c':f[1]}"><ico :name="f[0]" /></div>
            <h3>{{ f[2] }}</h3>
            <p>{{ f[3] }}</p>
          </article>
        </div>
        <div class="stats" data-reveal>
          <div class="stat"><b>24/7</b><span>mapa actualizado</span></div>
          <div class="stat"><b data-count="15">15</b><span>barrios cubiertos</span></div>
          <div class="stat"><b data-count="5" data-suffix=" km">5 km</b><span>radio de alerta</span></div>
          <div class="stat"><b>Bs 0</b><span>siempre gratis</span></div>
        </div>
      </div>
    </section>

    <!-- CÓMO FUNCIONA -->
    <section class="how section">
      <div class="how__scroller">
        <div class="how__track">
          <div class="how__intro">
            <span class="eyebrow">cómo funciona</span>
            <h2 class="h-lg">De perdida a en casa, en 4 pasos.</h2>
            <p>Desliza para ver cómo la comunidad trabaja para traerlos de vuelta.</p>
          </div>
          <article v-for="(s,i) in steps" :key="s[3]" class="step" :style="{'--c':s[1],'--c-l':s[2]}">
            <span class="step__n">paso {{ i+1 }}</span>
            <div class="step__art"><ico :name="s[0]" /></div>
            <h3>{{ s[3] }}</h3>
            <p>{{ s[4] }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- LA MANADA -->
    <section class="section">
      <div class="wrap">
        <div class="section__head">
          <div><span class="eyebrow">la manada</span><h2 class="h-lg">Conoce a los vecinos.</h2></div>
          <a href="#/comunidad?tab=perfiles" class="btn">Ver todos los perfiles <ico name="arrow" /></a>
        </div>
        <div class="pets-rail" data-lenis-prevent-wheel>
          <pet-card v-for="p in pets" :key="p.id" :pet="p" />
        </div>
      </div>
    </section>

    <!-- IDENTIDAD -->
    <section class="wrap identity">
      <div class="frame" data-reveal><img :src="M('media/pets/coco.jpg')" alt="Coco, una dálmata, mirando la calle desde el balcón" loading="lazy"></div>
      <div data-reveal>
        <span class="eyebrow">su propia ficha</span>
        <h2 class="h-lg" style="margin:8px 0 14px">Tu mascota merece su propio perfil.</h2>
        <p class="lead">Fotos, señas, vacunas y un QR para el collar. Si algún día se pierde, su perfil se vuelve una alerta con un solo toque.</p>
        <a href="#/registrar" class="btn btn--primary mt"><ico name="paw" />Registrar a mi mascota</a>
      </div>
    </section>

    <!-- COMPARATIVA -->
    <section class="section">
      <div class="wrap">
        <div class="section__head"><div><span class="eyebrow">la diferencia</span><h2 class="h-lg">No es otro grupo de WhatsApp.</h2></div></div>
        <div class="compare" data-reveal>
          <div class="compare__row"><span></span><span>4 Patitas</span><span>Grupos y redes</span></div>
          <div class="compare__row" v-for="c in ['Ubicación exacta en un mapa','Cruce automático perdido ↔ avistado','Alertas solo de tu zona','Perfil permanente con QR','Las alertas no se pierden entre mensajes']" :key="c">
            <span>{{ c }}</span><span class="yes" aria-label="Sí"><ico name="check" /></span><span class="no" aria-label="No"><ico name="close" /></span>
          </div>
        </div>
      </div>
    </section>

    <!-- HISTORIAS -->
    <section class="section" style="padding-top:0">
      <div class="wrap">
        <div class="section__head"><div><span class="eyebrow">reencuentros</span><h2 class="h-lg">Historias con final feliz.</h2></div></div>
        <div class="quotes">
          <blockquote class="quote" style="--c:var(--apricot-l)" data-reveal><p>"Nube se escapó por el balcón. Una vecina la marcó en el mapa a 3 cuadras y en 2 días estaba en casa."</p><footer><span><ico name="cat" /></span><div><b>Andrés M.</b><br>Las Palmas</div></footer></blockquote>
          <blockquote class="quote" style="--c:var(--straw)" data-reveal><p>"Encontré un golden en el condominio y en una hora su familia me escribió por WhatsApp."</p><footer><span><ico name="dog" /></span><div><b>Mariela T.</b><br>Urubó</div></footer></blockquote>
          <blockquote class="quote" style="--c:var(--sage-l)" data-reveal><p>"Ahora todo el barrio tiene el perfil de sus perros. Es como un vecindario que se cuida."</p><footer><span><ico name="paw" /></span><div><b>Familia Rojas</b><br>Mutualista</div></footer></blockquote>
        </div>
      </div>
    </section>

    <!-- PREGUNTAS -->
    <section class="section" style="padding-top:0">
      <div class="wrap" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:36px">
        <div><span class="eyebrow">preguntas</span><h2 class="h-lg">Lo que nos preguntan.</h2></div>
        <div class="faq">
          <details><summary>¿4 Patitas es gratis?</summary><p>Sí. Registrar mascotas, publicar alertas y usar el mapa es y será gratis para los dueños.</p></details>
          <details><summary>¿Qué hago si encuentro una mascota en la calle?</summary><p>Toca "Publicar", elige "La vi" o "La rescaté", marca el lugar en el mapa y sube una foto. Si coincide con una alerta, avisamos a su familia.</p></details>
          <details><summary>¿Mis datos de contacto son públicos?</summary><p>Solo se muestra un botón para escribirte por WhatsApp en las alertas que tú publicas. Puedes borrarlas cuando quieras.</p></details>
          <details><summary>¿Funciona fuera de Santa Cruz?</summary><p>Empezamos en Santa Cruz de la Sierra y el área metropolitana (Urubó, Warnes, La Guardia). Pronto más ciudades de Bolivia.</p></details>
        </div>
      </div>
    </section>

    <!-- LLAMADO FINAL -->
    <section class="wrap">
      <div class="cta" data-reveal>
        <div>
          <span class="eyebrow">únete a la manada</span>
          <h2 class="h-lg" style="margin-top:8px">Haz que tu barrio cuide a tu mascota.</h2>
          <p>Crea su perfil en un minuto. Si algún día se pierde, los vecinos estarán listos para ayudar.</p>
          <div class="flex">
            <a href="#/registrar" class="btn btn--primary">Crear perfil gratis</a>
            <a href="#/mapa" class="btn">Ver el mapa</a>
          </div>
        </div>
        <div class="cta__art"><img :src="art" alt="" loading="lazy"></div>
      </div>
    </section>
  </main>`,
});

/* ===================== MAPA ===================== */
app.component('page-map', {
  setup() {
    const root = ref(null), el = ref(null);
    const f = reactive({ type: 'todos', species: 'todas', q: '' });
    const sel = ref(route.value.query.focus || null);
    const list = computed(() => state.reports
      .filter(r => (f.type === 'todos' || r.type === f.type) && (f.species === 'todas' || r.species === f.species))
      .filter(r => !f.q || `${r.name} ${r.breed} ${r.zone} ${r.color}`.toLowerCase().includes(f.q.toLowerCase()))
      .sort((a, b) => b.date - a.date));
    let map, layer, temp;
    const markers = {};

    const draw = () => {
      layer.clearLayers();
      list.value.forEach(r => {
        const m = L.marker([r.lat, r.lng], { icon: pinIcon(r) })
          .bindPopup(`<div class="pop"><h4>${r.name}</h4><p>${TYPES[r.type].label} · ${r.zone} · ${timeAgo(r.date)}</p><button data-open="${r.id}">Ver detalles</button></div>`)
          .on('click', () => (sel.value = r.id));
        markers[r.id] = m; layer.addLayer(m);
      });
    };
    const focus = id => {
      const r = state.reports.find(x => x.id === id); if (!r) return;
      sel.value = id;
      map.flyTo([r.lat, r.lng], 16, { duration: 1.1 });
      setTimeout(() => markers[id] && markers[id].openPopup(), 1150);
    };
    const locate = () => {
      if (!navigator.geolocation) return toast('Tu navegador no permite ubicación');
      navigator.geolocation.getCurrentPosition(p => {
        const ll = [p.coords.latitude, p.coords.longitude];
        L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18] }) }).addTo(map);
        map.flyTo(ll, 15);
        const near = state.reports.filter(r => r.type !== 'reunido' && km({ lat: ll[0], lng: ll[1] }, r) < 5).length;
        toast(`${near} alertas a menos de 5 km de ti`);
      }, () => toast('No pudimos obtener tu ubicación'));
    };

    usePageFx(root, () => {
      intro('.mapside > *', { x: -24, opacity: 0, stagger: .06, duration: .8, ease: 'power3.out', delay: .2 });
      intro('.map', { opacity: 0, duration: 1, ease: 'power3.out', delay: .1 });
    });

    onMounted(() => {
      map = makeMap(el.value, { zoom: 13 });
      layer = L.layerGroup().addTo(map);
      draw();
      map.on('click', e => {
        temp && temp.remove();
        const { lat, lng } = e.latlng;
        temp = L.popup().setLatLng(e.latlng).setContent(`<div class="pop"><h4>¿Reportar aquí?</h4><p>Marca este punto para una mascota perdida o vista.</p><button data-here="${lat.toFixed(5)},${lng.toFixed(5)}">Reportar en este lugar</button></div>`).openOn(map);
      });
      // los popups de Leaflet cortan la propagación del click, así que escuchamos en fase de captura
      document.addEventListener('click', onPopupClick, true);
      setTimeout(() => { map.invalidateSize(); if (sel.value) focus(sel.value); }, 700);
    });
    const onPopupClick = e => {
      const o = e.target.closest('[data-open]'); if (o) openAlert(o.dataset.open);
      const h = e.target.closest('[data-here]'); if (h) { const [lat, lng] = h.dataset.here.split(','); go(`/publicar?lat=${lat}&lng=${lng}`); }
    };
    watch(list, draw);
    onBeforeUnmount(() => { document.removeEventListener('click', onPopupClick, true); map && map.remove(); });

    return { root, el, f, list, sel, focus, locate, TYPES, SPECIES, timeAgo, status };
  },
  template: `
  <main class="page" ref="root" style="padding-bottom:30px">
    <div class="wrap">
      <div class="mapwrap">
        <aside class="mapside">
          <div><span class="eyebrow">mapa en vivo<template v-if="status.online"> · <span class="live-dot"></span>conectado</template></span><h1 class="h-md" style="margin-top:6px">Santa Cruz de la Sierra</h1></div>
          <label class="sr" for="q" style="position:absolute;left:-9999px">Buscar</label>
          <input id="q" class="input" v-model="f.q" placeholder="Buscar por nombre, raza, barrio o color">
          <div class="filters">
            <button class="chip" :class="{on:f.type==='todos'}" @click="f.type='todos'">Todos</button>
            <button v-for="(t,k) in TYPES" :key="k" class="chip" :class="{on:f.type===k}" @click="f.type=k"><ico :name="t.icon" />{{ t.label }}</button>
          </div>
          <div class="filters">
            <button class="chip" :class="{on:f.species==='todas'}" @click="f.species='todas'">Todas</button>
            <button v-for="(icon,k) in SPECIES" :key="k" class="chip" :class="{on:f.species===k}" @click="f.species=k" :aria-label="k" :title="k"><ico :name="icon" /></button>
          </div>
          <div class="mapside__list" data-lenis-prevent>
            <button v-for="r in list" :key="r.id" class="alert-item" :class="{on:sel===r.id}" @click="focus(r.id)" @dblclick="openAlert(r.id)">
              <div class="thumb" :style="{'--c':TYPES[r.type].color}"><pet-media :item="r" /></div>
              <div style="min-width:0">
                <h4>{{ r.name }}</h4>
                <p>{{ r.breed }} · {{ r.zone }} · {{ timeAgo(r.date) }}</p>
                <div style="margin-top:6px"><type-tag :type="r.type" /></div>
              </div>
            </button>
            <p v-if="!list.length" class="empty">No hay alertas con esos filtros.</p>
          </div>
          <a href="#/publicar" class="btn btn--alert"><ico name="megaphone" />Publicar una alerta</a>
        </aside>
        <div class="map" ref="el" data-lenis-prevent>
          <div class="map__hint"><ico name="hand" />Toca el mapa para reportar en ese punto</div>
          <div class="map__tools"><button class="btn btn--sm" @click.stop="locate"><ico name="locate" />Cerca de mí</button></div>
        </div>
      </div>
    </div>
  </main>`,
});
app.config.globalProperties.openAlert = openAlert;

/* ===================== PUBLICAR ===================== */
app.component('page-publish', {
  setup() {
    const root = ref(null), pick = ref(null), fileIn = ref(null);
    const q = route.value.query;
    const hasPoint = !!(q.lat && q.lng);
    const form = reactive({ type: 'perdido', species: 'perro', name: '', breed: '', color: '', zone: 'Centro', desc: '', reward: '', contact: '', photo: null,
      lat: hasPoint ? +q.lat : CENTER[0], lng: hasPoint ? +q.lng : CENTER[1] });
    // si viene desde el perfil de una mascota, precargamos sus datos
    if (q.pet) {
      const p = state.pets.find(x => x.id === q.pet);
      if (p) Object.assign(form, { name: p.name, species: p.species, breed: p.breed, zone: p.zone, desc: p.bio, photo: p.photo || null, video: p.video, petId: p.id, lat: ZONES[p.zone][0], lng: ZONES[p.zone][1] });
    }
    let map, marker;
    const types = { perdido: ['megaphone', 'Perdí a mi mascota'], visto: ['eye', 'Vi una mascota'], encontrado: ['home', 'La rescaté'] };

    const onFile = async e => {
      const file = e.target.files[0]; if (!file) return;
      form.photo = await readImage(file); form.video = null;
    };
    watch(() => form.zone, z => {
      if (!map) return;
      form.lat = ZONES[z][0]; form.lng = ZONES[z][1];
      marker.setLatLng(ZONES[z]); map.flyTo(ZONES[z], 15, { duration: .8 });
    });
    const valid = computed(() => form.name.trim() && form.contact.replace(/\D/g, '').length >= 7);
    const sending = ref(false);
    const submit = async () => {
      if (!valid.value) return toast('Completa el nombre y un WhatsApp válido');
      if (sending.value) return;
      sending.value = true;
      try {
        const id = await actions.addReport({ ...form });
        toast('Alerta publicada. Ya está en el mapa');
        go('/mapa?focus=' + id);
        setTimeout(() => openAlert(id), 1700);
      } catch (e) {
        toast('No se pudo publicar: ' + (e.message || 'revisa tu conexión e inténtalo de nuevo'));
      } finally { sending.value = false; }
    };

    usePageFx(root, () => {
      intro('.page__head > *', { y: 24, opacity: 0, stagger: .07, duration: .9, ease: 'power3.out', delay: .15 });
      intro('.publish-layout > *', { y: 30, opacity: 0, stagger: .1, duration: .9, ease: 'power3.out', delay: .3 });
    });
    onMounted(() => {
      map = makeMap(pick.value, { center: [form.lat, form.lng], zoom: hasPoint ? 16 : 14 });
      marker = L.marker([form.lat, form.lng], { draggable: true, icon: pinIcon(form) }).addTo(map);
      const set = ll => { form.lat = ll.lat; form.lng = ll.lng; marker.setLatLng(ll); };
      marker.on('dragend', () => set(marker.getLatLng()));
      map.on('click', e => set(e.latlng));
      watch(() => [form.type, form.species], () => marker.setIcon(pinIcon(form)));
      setTimeout(() => map.invalidateSize(), 700);
    });
    onBeforeUnmount(() => map && map.remove());

    return { root, pick, fileIn, form, types, SPECIES, ZONES, TYPES, onFile, submit, valid, hasPoint, sending };
  },
  template: `
  <main class="page" ref="root">
    <div class="wrap">
      <header class="page__head">
        <span class="eyebrow">nueva alerta</span>
        <h1 class="h-lg">Publica y deja que el barrio ayude.</h1>
        <p class="lead">Mientras más detalles des, más fácil será reconocerla. Toma menos de un minuto.</p>
      </header>
      <div class="publish-layout">
        <form class="card form-grid" @submit.prevent="submit">
          <div class="field field--full"><label>¿Qué pasó?</label>
            <div class="seg">
              <button type="button" v-for="(t,k) in types" :key="k" :class="{on:form.type===k}" :style="{'--c':TYPES[k].color}" @click="form.type=k"><ico :name="t[0]" />{{ t[1] }}</button>
            </div>
          </div>
          <div class="field field--full"><label>Especie</label>
            <div class="seg" style="--n:5">
              <button type="button" v-for="(icon,k) in SPECIES" :key="k" :class="{on:form.species===k}" @click="form.species=k"><ico :name="icon" />{{ k }}</button>
            </div>
          </div>
          <div class="field"><label for="p-name">{{ form.type==='perdido' ? 'Nombre de tu mascota' : 'Título corto' }} *</label><input id="p-name" class="input" v-model="form.name" :placeholder="form.type==='perdido' ? 'Ej. Toby' : 'Ej. Perrito café con collar'"></div>
          <div class="field"><label for="p-breed">Raza</label><input id="p-breed" class="input" v-model="form.breed" placeholder="Ej. Beagle, mestizo…"></div>
          <div class="field"><label for="p-color">Color / señas</label><input id="p-color" class="input" v-model="form.color" placeholder="Ej. Tricolor, collar rojo"></div>
          <div class="field"><label for="p-zone">Barrio / zona</label><select id="p-zone" class="input" v-model="form.zone"><option v-for="(_,z) in ZONES" :key="z">{{ z }}</option></select></div>
          <div class="field field--full"><label><ico name="pin" />¿Dónde exactamente? <span class="muted" style="font-weight:600">toca el mapa o arrastra el pin</span></label>
            <div class="pick-map" ref="pick" data-lenis-prevent></div>
          </div>
          <div class="field field--full"><label for="p-desc">Descripción</label><textarea id="p-desc" class="input" v-model="form.desc" placeholder="¿Cómo es su carácter? ¿Qué llevaba puesto? ¿Hacia dónde iba?"></textarea></div>
          <div class="field field--full"><label>Foto</label>
            <div class="drop" @click="fileIn.click()">
              <img v-if="form.photo" :src="form.photo" alt=""><ico v-else name="camera" />
              <div><b>{{ form.photo ? 'Cambiar foto' : 'Sube una foto clara' }}</b><br><small class="muted">La comprimimos para que cargue rápido</small></div>
              <input type="file" accept="image/*" ref="fileIn" hidden @change="onFile">
            </div>
          </div>
          <div class="field" v-if="form.type==='perdido'"><label for="p-reward">Recompensa (opcional)</label><input id="p-reward" class="input" v-model="form.reward" placeholder="Ej. Bs 300"></div>
          <div class="field" :class="{'field--full': form.type!=='perdido'}"><label for="p-wa">Tu WhatsApp *</label><input id="p-wa" class="input" v-model="form.contact" inputmode="tel" placeholder="7XXXXXXX"></div>
          <div class="field field--full"><button class="btn btn--primary" :disabled="!valid || sending"><ico name="paw" />{{ sending ? 'Publicando…' : 'Publicar alerta en el mapa' }}</button></div>
        </form>
        <aside class="preview-sticky">
          <p class="eyebrow" style="margin-bottom:10px">así se verá</p>
          <div class="post" style="margin:0">
            <div class="post__media" :style="{'--c':TYPES[form.type].color}"><pet-media :item="form" /></div>
            <div class="post__body">
              <type-tag :type="form.type" />
              <h3 style="font-size:1.5rem;margin:10px 0 4px">{{ form.name || 'Nombre' }}</h3>
              <p class="muted">{{ form.breed || 'Raza' }} · {{ form.color || 'Color' }} · {{ form.zone }}</p>
              <p style="margin-top:10px">{{ form.desc || 'La descripción aparecerá aquí.' }}</p>
              <p v-if="form.reward" style="margin-top:10px;font-weight:800"><ico name="gift" /> Recompensa: {{ form.reward }}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </main>`,
});

/* ===================== COMUNIDAD ===================== */
app.component('page-community', {
  setup() {
    const root = ref(null);
    const tab = ref(route.value.query.tab || 'muro');
    const feed = computed(() => [...state.reports].sort((a, b) => b.date - a.date));
    const urgent = computed(() => state.reports.filter(r => r.type === 'perdido').slice(0, 4));
    const happy = computed(() => state.reports.filter(r => r.type === 'reunido'));
    const popular = computed(() => [...state.pets].sort((a, b) => b.followers - a.followers).slice(0, 4));
    const like = r => actions.toggleLike(r);
    usePageFx(root, () => intro('.page__head > *, .feed-tabs', { y: 24, opacity: 0, stagger: .07, duration: .9, ease: 'power3.out', delay: .15 }));
    watch(tab, () => nextTick(() => {
      if (!reduced) gsap.fromTo(root.value.querySelectorAll('.tabpane > *'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: .04, duration: .6, ease: 'power3.out' });
      ScrollTrigger.refresh();
    }));
    return { root, tab, feed, urgent, happy, popular, state, like, TYPES, timeAgo, share, openAlert, accentOf, BRAND };
  },
  template: `
  <main class="page" ref="root">
    <div class="wrap">
      <header class="page__head">
        <span class="eyebrow">comunidad</span>
        <h1 class="h-lg">La manada de Santa Cruz.</h1>
      </header>
      <div class="flex feed-tabs" style="margin-bottom:22px" role="tablist">
        <button class="chip" role="tab" :aria-selected="tab==='muro'" :class="{on:tab==='muro'}" @click="tab='muro'"><ico name="chat" />Muro</button>
        <button class="chip" role="tab" :aria-selected="tab==='perfiles'" :class="{on:tab==='perfiles'}" @click="tab='perfiles'"><ico name="paw" />Perfiles</button>
        <button class="chip" role="tab" :aria-selected="tab==='reunidos'" :class="{on:tab==='reunidos'}" @click="tab='reunidos'"><ico name="heart" />Reencuentros</button>
      </div>

      <div v-if="tab==='perfiles'" class="pets-grid tabpane">
        <a href="#/registrar" class="pet-card pet-card--add">
          <div><div class="feature__ico" style="--c:var(--straw)"><ico name="plus" /></div><h3 style="font-size:1.4rem">Registra a tu mascota</h3><p class="muted">Gratis · 1 minuto</p></div>
        </a>
        <pet-card v-for="p in state.pets" :key="p.id" :pet="p" />
      </div>

      <div v-else class="feed-layout">
        <div class="tabpane">
          <article v-for="r in (tab==='reunidos' ? happy : feed)" :key="r.id" class="post">
            <div class="post__head">
              <div class="thumb" :style="{'--c':TYPES[r.type].color}"><ico :name="TYPES[r.type].icon" /></div>
              <div style="flex:1;min-width:0"><b>{{ r.name }}</b> <small>{{ TYPES[r.type].verb }} {{ r.zone }}</small><br><small>{{ timeAgo(r.date) }}<template v-if="r.author"> · por <img v-if="r.avatar" :src="r.avatar" class="byline-img" alt="" referrerpolicy="no-referrer">{{ r.author }}</template></small></div>
              <type-tag :type="r.type" />
            </div>
            <div class="post__media" :style="{'--c':TYPES[r.type].color}" @click="openAlert(r.id)"><pet-media :item="r" /></div>
            <div class="post__body">
              <p>{{ r.desc }}</p>
              <p v-if="r.reward" style="margin-top:8px;font-weight:800"><ico name="gift" /> Recompensa: {{ r.reward }}</p>
              <div class="post__actions">
                <button class="like" :class="{on:r.liked}" @click="like(r)" :aria-pressed="r.liked"><ico name="heart" />{{ r.likes }}</button>
                <button class="like" @click="openAlert(r.id)"><ico name="chat" />{{ r.comments.length }} · Lo vi</button>
                <a class="like" :href="'#/mapa?focus='+r.id"><ico name="map" />En el mapa</a>
                <button class="like" @click="share(r.name+' en '+BRAND,'#/mapa?focus='+r.id)"><ico name="share" />Compartir</button>
              </div>
            </div>
          </article>
        </div>
        <aside>
          <div class="side-card side-card--alert">
            <h3><ico name="megaphone" />Buscando su casa</h3>
            <div v-for="r in urgent" :key="r.id" class="mini-pet" @click="openAlert(r.id)">
              <div class="thumb" style="--c:var(--card)"><pet-media :item="r" /></div>
              <div><b>{{ r.name }}</b><small>{{ r.zone }} · {{ timeAgo(r.date) }}</small></div>
            </div>
          </div>
          <div class="side-card">
            <h3><ico name="star" />Mascotas populares</h3>
            <a v-for="p in popular" :key="p.id" :href="'#/mascota/'+p.id" class="mini-pet">
              <div class="thumb" :style="{'--c':accentOf(p.accent,p.id)}"><pet-media :item="p" /></div>
              <div><b>{{ p.name }}</b><small>{{ p.followers.toLocaleString('es-BO') }} seguidores</small></div>
            </a>
          </div>
          <div class="side-card side-card--straw">
            <h3><ico name="trophy" />Héroes del barrio</h3>
            <p style="font-size:.92rem">Los vecinos que más ayudan a reunir familias ganan insignias en su perfil. Reporta lo que veas.</p>
          </div>
        </aside>
      </div>
    </div>
  </main>`,
});

/* ===================== PERFIL DE MASCOTA ===================== */
app.component('page-pet', {
  setup() {
    const root = ref(null);
    const pet = computed(() => state.pets.find(p => p.id === route.value.params.id));
    const following = ref((state.user.followed || []).includes(route.value.params.id));
    const follow = async () => { following.value = await actions.toggleFollow(pet.value); };
    const alert = computed(() => pet.value && state.reports.find(r => r.type === 'perdido' && (r.petId === pet.value.id || r.name === pet.value.name)));
    const markHome = async () => {
      try {
        if (alert.value && canEdit(alert.value)) await actions.setReportType(alert.value, 'reunido');
        await actions.setPetLost(pet.value, false);
        toast('Qué alegría: marcada como en casa');
      } catch (e) { toast('No se pudo actualizar: ' + e.message); }
    };
    // QR decorativo determinístico a partir del id
    const qr = computed(() => { let s = [...(pet.value?.id || 'x')].reduce((a, c) => a * 31 + c.charCodeAt(0), 7); return Array.from({ length: 81 }, () => ((s = (s * 9301 + 49297) % 233280) / 233280) > .5); });
    usePageFx(root, () => {
      gsap.from('.profile__media', { clipPath: 'inset(100% 0 0 0 round 22px)', duration: 1.1, ease: 'expo.inOut', delay: .1 });
      intro('.profile__info > *', { y: 24, opacity: 0, stagger: .06, duration: .9, ease: 'power3.out', delay: .35 });
    });
    return { root, pet, following, follow, alert, markHome, qr, share, openAlert, SPECIES, canEdit, accentOf, BRAND };
  },
  template: `
  <main class="page" ref="root">
    <div class="wrap" v-if="pet">
      <a href="#/comunidad?tab=perfiles" class="chip" style="margin-bottom:22px"><ico name="back" />Perfiles</a>
      <div class="profile">
        <div class="profile__media" :style="{'--accent':accentOf(pet.accent, pet.id)}"><pet-media :item="pet" /></div>
        <div class="profile__info">
          <span class="eyebrow"><ico :name="SPECIES[pet.species] || 'paw'" />{{ pet.breed }}<template v-if="pet.age"> · {{ pet.age }}</template></span>
          <h1 class="h-xl" style="margin:8px 0">{{ pet.name }}</h1>
          <div v-if="pet.lost" class="flex" style="margin-bottom:12px"><type-tag type="perdido" /><span class="muted">Esta mascota está perdida. Ayuda a encontrarla.</span></div>
          <p class="lead">{{ pet.bio }}</p>
          <div class="profile__stats">
            <div><b>{{ pet.followers.toLocaleString('es-BO') }}</b><span>seguidores</span></div>
            <div><b>{{ pet.zone }}</b><span>barrio</span></div>
            <div v-if="pet.owner"><b>{{ pet.owner }}</b><span>familia</span></div>
          </div>
          <div class="traits" style="margin-bottom:24px"><span v-for="t in pet.traits" :key="t" style="font-size:.88rem;padding:6px 13px">{{ t }}</span></div>
          <div class="flex">
            <button class="btn" :class="following ? 'btn--straw' : 'btn--primary'" @click="follow" :aria-pressed="following"><ico :name="following ? 'check' : 'plus'" />{{ following ? 'Siguiendo' : 'Seguir' }}</button>
            <a v-if="!pet.lost && canEdit(pet)" :href="'#/publicar?pet='+pet.id" class="btn btn--alert"><ico name="megaphone" />Reportar como perdida</a>
            <template v-else-if="pet.lost">
              <button v-if="alert" class="btn btn--alert" @click="openAlert(alert.id)">Ver alerta</button>
              <button v-if="canEdit(pet)" class="btn" @click="markHome"><ico name="heart" />Ya volvió a casa</button>
            </template>
            <button class="btn btn--ghost" @click="share(pet.name+' en '+BRAND,'#/mascota/'+pet.id)"><ico name="share" />Compartir</button>
          </div>
          <div class="card mt flex" style="gap:22px;align-items:center">
            <div class="qr" aria-hidden="true"><i v-for="(b,i) in qr" :key="i" :class="{o:!b}"></i></div>
            <div style="flex:1;min-width:200px"><h3 style="font-size:1.25rem">Placa QR para el collar</h3><p class="muted">Quien encuentre a {{ pet.name }} escanea el QR y te avisa al instante, con su ubicación.</p></div>
          </div>
        </div>
      </div>
    </div>
    <div class="wrap empty" v-else><h2>No encontramos esta mascota</h2><a href="#/comunidad" class="btn mt">Volver</a></div>
  </main>`,
});

/* Formulario de cuenta con correo y contraseña: crear cuenta / entrar / recuperar / nueva contraseña */
app.component('email-auth', {
  setup() {
    const mode = ref(status.recovery ? 'nueva' : 'crear'); // crear | entrar | olvido | nueva
    const f = reactive({ name: state.user.name || '', email: '', password: '' });
    const show = ref(false), msg = ref(''), ok = ref('');
    watch(() => status.recovery, v => { if (v) mode.value = 'nueva'; });
    watch(mode, () => { msg.value = ''; ok.value = ''; });
    const valid = computed(() => {
      const mail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim());
      if (mode.value === 'olvido') return mail;
      if (mode.value === 'nueva') return f.password.length >= 6;
      if (mode.value === 'crear') return mail && f.password.length >= 6 && f.name.trim().length >= 2;
      return mail && f.password.length >= 1;
    });
    const submit = async () => {
      msg.value = ''; ok.value = '';
      if (!valid.value) {
        msg.value = mode.value === 'crear' ? 'Escribe tu nombre, un correo válido y una contraseña de 6 caracteres o más.' : 'Revisa el correo y la contraseña.';
        return;
      }
      try {
        if (mode.value === 'crear') {
          const r = await auth.signUp(f);
          if (r.pending) ok.value = `Te enviamos un enlace a ${f.email}. Ábrelo para activar tu cuenta.`;
          else toast('Cuenta creada. Bienvenido a la manada');
        } else if (mode.value === 'entrar') {
          await auth.signIn(f);
        } else if (mode.value === 'olvido') {
          await auth.resetPassword(f.email);
          ok.value = `Si ${f.email} tiene cuenta, te llegará un enlace para crear una contraseña nueva.`;
        } else {
          await auth.setNewPassword(f.password);
          toast('Contraseña actualizada');
        }
        f.password = '';
      } catch (e) { msg.value = e.message; }
    };
    const titles = { crear: 'Crear cuenta', entrar: 'Entrar', olvido: 'Enviar enlace', nueva: 'Guardar contraseña' };
    return { mode, f, show, msg, ok, submit, status, titles };
  },
  template: `
    <form class="eauth" @submit.prevent="submit" novalidate>
      <div v-if="mode==='crear' || mode==='entrar'" class="eauth__tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="mode==='crear'" :class="{on:mode==='crear'}" @click="mode='crear'">Crear cuenta</button>
        <button type="button" role="tab" :aria-selected="mode==='entrar'" :class="{on:mode==='entrar'}" @click="mode='entrar'">Ya tengo cuenta</button>
      </div>
      <p v-if="mode==='olvido'" class="eauth__hint">Escribe tu correo y te enviamos un enlace para crear una contraseña nueva.</p>
      <p v-if="mode==='nueva'" class="eauth__hint">Elige tu contraseña nueva.</p>

      <div class="field" v-if="mode==='crear'">
        <label for="ea-name">Tu nombre</label>
        <input id="ea-name" class="input" v-model="f.name" autocomplete="name" placeholder="Ej. Valeria Rojas" maxlength="60">
      </div>
      <div class="field" v-if="mode!=='nueva'">
        <label for="ea-email">Correo</label>
        <input id="ea-email" class="input" v-model="f.email" type="email" inputmode="email" autocomplete="email" placeholder="tucorreo@gmail.com">
      </div>
      <div class="field" v-if="mode!=='olvido'">
        <label for="ea-pass">{{ mode==='nueva' ? 'Contraseña nueva' : 'Contraseña' }}</label>
        <div class="eauth__pass">
          <input id="ea-pass" class="input" v-model="f.password" :type="show ? 'text' : 'password'" :autocomplete="mode==='entrar' ? 'current-password' : 'new-password'" :placeholder="mode==='entrar' ? '' : 'Mínimo 6 caracteres'">
          <button type="button" class="eauth__eye" @click="show=!show" :aria-label="show ? 'Ocultar contraseña' : 'Mostrar contraseña'"><ico :name="show ? 'eyeOff' : 'eye'" /></button>
        </div>
      </div>

      <p v-if="msg" class="eauth__msg" role="alert">{{ msg }}</p>
      <p v-if="ok" class="eauth__ok" role="status">{{ ok }}</p>

      <button class="btn btn--primary eauth__go" :disabled="status.authBusy || status.connecting">{{ status.authBusy ? 'Un momento…' : titles[mode] }}</button>

      <button v-if="mode==='entrar'" type="button" class="eauth__link" @click="mode='olvido'">¿Olvidaste tu contraseña?</button>
      <button v-if="mode==='olvido'" type="button" class="eauth__link" @click="mode='entrar'">Volver a entrar</button>
    </form>`,
});

/* ===================== MI CUENTA ===================== */
app.component('page-account', {
  setup() {
    const root = ref(null);
    const myReports = computed(() => state.reports.filter(r => r.mine).sort((a, b) => b.date - a.date));
    const myPets = computed(() => state.pets.filter(p => p.mine));
    const faces = computed(() => state.pets.filter(p => p.photo).slice(0, 5));
    const perks = [
      ['phone', 'Tu cuenta en todos tus dispositivos', 'Entra desde el celular o la compu y encuentra tus alertas y mascotas.'],
      ['id', 'Tu nombre en lo que publicas', 'Los vecinos saben quién avisa. Así se genera confianza.'],
      ['lock', 'Solo tú editas lo tuyo', 'Marca a tu mascota como reunida o borra tus alertas cuando quieras.'],
    ];
    usePageFx(root, () => intro('.acct > *', { y: 24, opacity: 0, stagger: .07, duration: .9, ease: 'power3.out', delay: .15 }));
    return { root, status, auth, myReports, myPets, faces, perks, TYPES, timeAgo, openAlert, BRAND };
  },
  template: `
  <main class="page" ref="root">
    <div class="wrap acct">
      <section v-if="!auth.enabled || (!status.online && !status.connecting)" class="card acct__join">
        <span class="eyebrow">mi cuenta</span>
        <h1 class="h-lg">Entra a la manada.</h1>
        <p class="lead">Las cuentas funcionan en la versión en línea de {{ BRAND }}.</p>
        <a v-if="auth.siteUrl" :href="auth.siteUrl + '#/cuenta'" target="_blank" rel="noopener" class="btn btn--primary mt">Abrir {{ BRAND }} en línea <ico name="arrow" /></a>
      </section>

      <section v-else-if="!status.user" class="acct__join card">
        <div class="avatars acct__faces"><span v-for="p in faces" :key="p.id"><pet-media :item="p" /></span></div>
        <span class="eyebrow">mi cuenta</span>
        <h1 class="h-lg">Únete a la manada.</h1>
        <p class="lead">Ver el mapa y publicar no requiere cuenta. Con una cuenta, tus publicaciones te acompañan a todas partes.</p>
        <ul class="perks">
          <li v-for="p in perks" :key="p[1]"><span class="perks__ico"><ico :name="p[0]" /></span><div><b>{{ p[1] }}</b><p>{{ p[2] }}</p></div></li>
        </ul>
        <email-auth />
        <template v-if="auth.google"><span class="eauth__or">o</span><google-btn /></template>
        <a href="#/registrar" class="chip"><ico name="paw" />o registra a tu mascota sin cuenta</a>
        <p class="acct__fine">Tu correo nunca se muestra a otras personas. Solo se ve el nombre que elijas.
          <template v-if="myReports.length || myPets.length"><br>Lo que ya publicaste desde este dispositivo ({{ myReports.length + myPets.length }}) pasa a tu cuenta nueva.</template>
        </p>
      </section>

      <template v-else>
        <section v-if="status.recovery" class="card acct__join">
          <span class="eyebrow">recuperar acceso</span>
          <h2 class="h-md">Crea tu contraseña nueva</h2>
          <email-auth />
        </section>
        <section class="acct__head card">
          <user-avatar :size="84" />
          <div class="acct__who">
            <span class="eyebrow">mi cuenta</span>
            <h1 class="h-md">{{ status.user.name }}</h1>
            <p class="muted">{{ status.user.email }}</p>
          </div>
          <div class="acct__stats">
            <div><b>{{ myPets.length }}</b><span>mascotas</span></div>
            <div><b>{{ myReports.length }}</b><span>alertas</span></div>
            <div><b>{{ myReports.filter(r=>r.type==='reunido').length }}</b><span>reencuentros</span></div>
          </div>
          <button class="btn btn--sm" :disabled="status.authBusy" @click="auth.logout()"><ico name="logout" />Cerrar sesión</button>
        </section>

        <section>
          <div class="section__head" style="margin-bottom:16px"><h2 class="h-md">Mis mascotas</h2><a href="#/registrar" class="btn btn--sm"><ico name="plus" />Registrar mascota</a></div>
          <div class="pets-grid" v-if="myPets.length"><pet-card v-for="p in myPets" :key="p.id" :pet="p" /></div>
          <p v-else class="card empty">Todavía no registraste a tu mascota. Su perfil queda listo por si algún día se pierde.</p>
        </section>

        <section>
          <div class="section__head" style="margin-bottom:16px"><h2 class="h-md">Mis alertas</h2><a href="#/publicar" class="btn btn--alert btn--sm"><ico name="megaphone" />Nueva alerta</a></div>
          <div class="acct__alerts" v-if="myReports.length">
            <button v-for="r in myReports" :key="r.id" class="alert-item" @click="openAlert(r.id)">
              <div class="thumb" :style="{'--c':TYPES[r.type].color}"><pet-media :item="r" /></div>
              <div style="min-width:0;flex:1">
                <h4>{{ r.name }}</h4>
                <p>{{ r.zone }} · {{ timeAgo(r.date) }} · {{ r.comments.length }} comentarios</p>
                <div style="margin-top:6px"><type-tag :type="r.type" /></div>
              </div>
            </button>
          </div>
          <p v-else class="card empty">No publicaste alertas. Si ves una mascota perdida, márcala en el mapa.</p>
        </section>
      </template>
    </div>
  </main>`,
});

/* ===================== REGISTRAR MASCOTA ===================== */
app.component('page-register', {
  setup() {
    const root = ref(null), fileIn = ref(null);
    const form = reactive({ name: '', species: 'perro', breed: '', age: '', zone: 'Centro', owner: (status.user && status.user.name) || state.user.name || '', bio: '', traits: '', photo: null, accent: ACCENTS[0] });
    const onFile = async e => { const f = e.target.files[0]; if (f) form.photo = await readImage(f, 800); };
    const sending = ref(false);
    const submit = async () => {
      if (!form.name.trim()) return toast('Ponle un nombre a tu mascota');
      if (sending.value) return;
      sending.value = true;
      state.user.name = form.owner;
      try {
        const id = await actions.addPet({ ...form, traits: form.traits.split(',').map(t => t.trim()).filter(Boolean) });
        toast('Perfil creado. Bienvenido a la manada');
        go('/mascota/' + id);
      } catch (e) {
        toast('No se pudo crear el perfil: ' + (e.message || 'revisa tu conexión'));
      } finally { sending.value = false; }
    };
    usePageFx(root, () => intro('.page__head > *, .reg > *', { y: 28, opacity: 0, stagger: .07, duration: .9, ease: 'power3.out', delay: .15 }));
    return { root, fileIn, form, ACCENTS, onFile, submit, SPECIES, ZONES, sending };
  },
  template: `
  <main class="page" ref="root">
    <div class="wrap">
      <header class="page__head">
        <span class="eyebrow">mi mascota</span>
        <h1 class="h-lg">Crea su perfil en un minuto.</h1>
        <p class="lead">Si algún día se pierde, su ficha ya estará lista para convertirse en alerta con un solo toque.</p>
      </header>
      <div class="publish-layout reg">
        <form class="card form-grid" @submit.prevent="submit">
          <div class="field field--full"><label>Especie</label>
            <div class="seg" style="--n:5"><button type="button" v-for="(icon,k) in SPECIES" :key="k" :class="{on:form.species===k}" @click="form.species=k"><ico :name="icon" />{{ k }}</button></div>
          </div>
          <div class="field"><label for="r-name">Nombre *</label><input id="r-name" class="input" v-model="form.name" placeholder="Ej. Canela"></div>
          <div class="field"><label for="r-breed">Raza</label><input id="r-breed" class="input" v-model="form.breed" placeholder="Ej. Mestiza"></div>
          <div class="field"><label for="r-age">Edad</label><input id="r-age" class="input" v-model="form.age" placeholder="Ej. 3 años"></div>
          <div class="field"><label for="r-zone">Barrio</label><select id="r-zone" class="input" v-model="form.zone"><option v-for="(_,z) in ZONES" :key="z">{{ z }}</option></select></div>
          <div class="field"><label for="r-owner">Tu nombre</label><input id="r-owner" class="input" v-model="form.owner" placeholder="Ej. Valeria R."></div>
          <div class="field"><label for="r-traits">Rasgos (separados por coma)</label><input id="r-traits" class="input" v-model="form.traits" placeholder="Juguetón, Con chip, Vacunado"></div>
          <div class="field field--full"><label for="r-bio">Biografía</label><textarea id="r-bio" class="input" v-model="form.bio" placeholder="¿Qué lo hace único? ¿Señas particulares?"></textarea></div>
          <div class="field field--full"><label>Foto de perfil</label>
            <div class="drop" @click="fileIn.click()">
              <img v-if="form.photo" :src="form.photo" alt=""><ico v-else name="camera" />
              <div><b>{{ form.photo ? 'Cambiar foto' : 'Sube su mejor foto' }}</b><br><small class="muted">JPG o PNG</small></div>
              <input type="file" accept="image/*" ref="fileIn" hidden @change="onFile">
            </div>
          </div>
          <div class="field field--full"><label>Color de su ficha</label>
            <div class="swatches"><button type="button" v-for="c in ACCENTS" :key="c" :class="{on:form.accent===c}" :style="{'--c':c}" @click="form.accent=c" :aria-label="'Color '+c" :aria-pressed="form.accent===c"></button></div>
          </div>
          <div class="field field--full"><button class="btn btn--primary" :disabled="sending"><ico name="paw" />{{ sending ? 'Creando…' : 'Crear perfil' }}</button></div>
        </form>
        <aside class="preview-sticky">
          <p class="eyebrow" style="margin-bottom:10px">así se verá</p>
          <div class="pet-card" style="width:100%" :style="{'--accent':form.accent}">
            <div class="pet-card__media"><pet-media :item="form" /></div>
            <div class="pet-card__body">
              <h3>{{ form.name || 'Nombre' }}</h3>
              <p>{{ form.breed || 'Raza' }} · {{ form.zone }}</p>
              <div class="traits"><span v-for="t in form.traits.split(',').filter(x=>x.trim())" :key="t">{{ t.trim() }}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </main>`,
});

/* ===================== MODAL DE ALERTA ===================== */
app.component('alert-modal', {
  props: ['id'],
  emits: ['close'],
  setup(props, { emit }) {
    const box = ref(null);
    const r = computed(() => state.reports.find(x => x.id === props.id));
    const m = computed(() => (r.value ? matches(r.value).slice(0, 3) : []));
    const comment = ref('');
    const send = async () => {
      const text = comment.value.trim(); if (!text) return;
      try { await actions.addComment(r.value, text); comment.value = ''; toast('Gracias por ayudar'); }
      catch (e) { toast('No se pudo enviar: ' + e.message); }
    };
    const reunite = async () => {
      try { await actions.setReportType(r.value, 'reunido'); toast('Reencuentro registrado'); }
      catch (e) { toast('No se pudo actualizar: ' + e.message); }
    };
    const confirmDel = ref(false);
    const remove = async () => {
      if (!confirmDel.value) { confirmDel.value = true; return; }
      try { await actions.removeReport(props.id); emit('close'); toast('Alerta eliminada'); }
      catch (e) { toast('No se pudo eliminar: ' + e.message); }
    };
    const close = () => gsap.to(box.value, { y: 24, opacity: 0, duration: .25, ease: 'power2.in', onComplete: () => emit('close') });
    const onKey = e => e.key === 'Escape' && close();
    onMounted(() => { addEventListener('keydown', onKey); intro(box.value, { y: 30, opacity: 0, duration: .6, ease: 'power3.out' }); });
    onBeforeUnmount(() => removeEventListener('keydown', onKey));
    return { box, r, m, comment, send, reunite, remove, confirmDel, canEdit, close, TYPES, timeAgo, waLink, openAlert, go };
  },
  template: `
    <div class="modal" v-if="r">
      <div class="modal__bg" @click="close"></div>
      <div class="modal__box" ref="box" data-lenis-prevent role="dialog" aria-modal="true" :aria-label="r.name">
        <button class="modal__x" @click="close" aria-label="Cerrar"><ico name="close" /></button>
        <div class="modal__media" :style="{'--c':TYPES[r.type].color}"><pet-media :item="r" /></div>
        <div class="modal__body">
          <div class="flex"><type-tag :type="r.type" /><small class="muted">{{ timeAgo(r.date) }}</small></div>
          <h2 class="h-md">{{ r.name }}</h2>
          <p>{{ r.desc }}</p>
          <dl class="kv">
            <dt>Raza</dt><dd>{{ r.breed || '—' }}</dd>
            <dt>Color</dt><dd>{{ r.color || '—' }}</dd>
            <dt>Zona</dt><dd>{{ r.zone }}</dd>
            <template v-if="r.reward"><dt>Recompensa</dt><dd><b>{{ r.reward }}</b></dd></template>
            <template v-if="r.author"><dt>Publicó</dt><dd>{{ r.author }}</dd></template>
          </dl>
          <div v-if="m.length && r.type!=='reunido'">
            <p style="font-weight:800;margin-bottom:8px"><ico name="spark" /> Posibles coincidencias</p>
            <div class="match" v-for="x in m" :key="x.r.id" @click="openAlert(x.r.id)">
              <div class="thumb" style="--c:var(--card)"><pet-media :item="x.r" /></div>
              <div style="flex:1;font-size:.88rem"><b>{{ x.score }}% de coincidencia</b> · {{ x.r.name }}<br><span class="muted">{{ TYPES[x.r.type].label }} a {{ x.d.toFixed(1) }} km · {{ timeAgo(x.r.date) }}</span></div>
            </div>
          </div>
          <div class="flex">
            <a v-if="r.type!=='reunido'" :href="waLink(r)" target="_blank" rel="noopener" class="btn btn--primary btn--sm"><ico name="whatsapp" />WhatsApp</a>
            <a :href="'#/mapa?focus='+r.id" class="btn btn--sm" @click="close"><ico name="map" />Mapa</a>
            <button v-if="r.type!=='reunido' && canEdit(r)" class="btn btn--sm" @click="reunite"><ico name="heart" />Reunido</button>
            <button v-if="r.mine" class="btn btn--ghost btn--sm" @click="remove" :aria-label="confirmDel ? 'Confirmar eliminar' : 'Eliminar alerta'"><ico name="trash" />{{ confirmDel ? '¿Eliminar? Toca otra vez' : '' }}</button>
          </div>
          <div v-if="r.type!=='reunido'">
            <p style="font-weight:800;margin:6px 0"><ico name="eye" /> ¿La viste? Cuéntanos</p>
            <div class="flex" style="flex-wrap:nowrap"><input class="input" v-model="comment" aria-label="Comentario" placeholder="Ej. La vi en el 3er anillo hace 10 min" @keyup.enter="send"><button class="btn btn--sm" @click="send">Enviar</button></div>
            <div v-for="(c,i) in r.comments" :key="i" class="comment"><b v-if="c.author" style="display:block;font-size:.8rem">{{ c.author }}</b>{{ c.text }} <small class="muted">· {{ timeAgo(c.date) }}</small></div>
          </div>
        </div>
      </div>
    </div>`,
});

app.directive('auto', vAuto);
app.mount('#app');
