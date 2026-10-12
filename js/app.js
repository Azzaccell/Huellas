/* HUELLAS — app (Vue 3 + GSAP/ScrollTrigger + Lenis + Leaflet), sin build step */
const { createApp, ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick, markRaw } = Vue;
const { state, TYPES, SPECIES, ZONES, CENTER, matches, timeAgo, km, M, LITE, actions, status, canEdit } = window.HUELLAS;
gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- scroll suave (Lenis) sincronizado con ScrollTrigger ---------- */
const lenis = new Lenis({ lerp: 0.1, smoothWheel: !reduced });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ---------- router por hash ---------- */
const ROUTES = [
  ['/', 'page-home'], ['/mapa', 'page-map'], ['/publicar', 'page-publish'],
  ['/comunidad', 'page-community'], ['/registrar', 'page-register'], ['/mascota/:id', 'page-pet'],
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
  try { await navigator.clipboard.writeText(url); toast('🔗 Enlace copiado'); }
  catch (e) { toast('Copia este enlace: ' + url); }
};
const waLink = r => `https://wa.me/${r.contact}?text=${encodeURIComponent(`Hola, te escribo por "${r.name}" en HUELLAS 🐾`)}`;

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

/* ---------- animaciones por página ---------- */
// gsap.context agrupa tweens y ScrollTriggers de la página para limpiarlos al salir
function usePageFx(root, setup) {
  let ctx;
  onMounted(() => nextTick(() => {
    ctx = gsap.context(() => {
      if (!reduced) {
        ScrollTrigger.batch(root.value.querySelectorAll('[data-reveal]'), {
          start: 'top 90%', once: true,
          onEnter: b => gsap.fromTo(b, { opacity: 0, y: 60, rotate: (i) => (i % 2 ? 1.5 : -1.5) },
            { opacity: 1, y: 0, rotate: 0, duration: 1, ease: 'expo.out', stagger: 0.09, overwrite: true }),
        });
      } else gsap.set('[data-reveal]', { opacity: 1 });
      setup && setup();
    }, root.value);
  }));
  onBeforeUnmount(() => ctx && ctx.revert());
}

/* Entrada determinística: fromTo con valores finales fijos (no se "congela" si se re-ejecuta) */
const FROM_KEYS = ['x', 'y', 'opacity', 'scale', 'rotate'];
const intro = (targets, vars) => {
  const from = {}, to = { clearProps: 'opacity,transform,translate,rotate,scale' };
  for (const k in vars) (FROM_KEYS.includes(k) ? from : to)[k] = vars[k];
  for (const k in from) to[k] = k === 'opacity' || k === 'scale' ? 1 : 0;
  return gsap.fromTo(targets, from, to);
};

/* Autoplay solo cuando el video está visible (ahorra batería/CPU) */
const io = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
}), { rootMargin: '100px' });
const vAuto = { mounted: el => io.observe(el), beforeUnmount: el => io.unobserve(el) };

/* Tarjetas que se inclinan con el mouse */
const vTilt = {
  mounted(el) {
    if (reduced || matchMedia('(hover: none)').matches) return;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { rotateY: ((e.clientX - r.left) / r.width - .5) * 8, rotateX: -((e.clientY - r.top) / r.height - .5) * 8, transformPerspective: 900, duration: .5 });
    });
    el.addEventListener('mouseleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1,.5)' }));
  },
};

/* Botones magnéticos */
const vMagnet = {
  mounted(el) {
    if (reduced || matchMedia('(hover: none)').matches) return;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .3, duration: .4 });
    });
    el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }));
  },
};

/* Huellitas al hacer click en cualquier parte */
addEventListener('pointerdown', e => {
  if (reduced || e.target.closest('.map, .leaflet-container, input, textarea, select')) return;
  const p = document.createElement('div');
  p.className = 'paw-fx'; p.textContent = '🐾';
  p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px';
  document.body.appendChild(p);
  gsap.fromTo(p, { scale: 0, rotate: gsap.utils.random(-40, 40) }, { scale: 1.4, y: -40, opacity: 0, duration: .9, ease: 'power2.out', onComplete: () => p.remove() });
});

/* ---------- Leaflet helpers ---------- */
// Teselas de OpenStreetMap (gratis, sin API key); el estilo cálido/oscuro se da con filtros CSS
const TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const pinIcon = r => L.divIcon({
  className: '', iconSize: [46, 46], iconAnchor: [23, 52], popupAnchor: [0, -48],
  html: `<div class="pin ${r.type === 'perdido' ? 'pulse' : ''}" style="--c:${TYPES[r.type].color};position:relative"><span>${SPECIES[r.species] || '🐾'}</span></div>`,
});
// Mapa vectorial propio de Santa Cruz (anillos, radiales, río Piraí, barrios).
// Se usa en la versión compartible, donde no se pueden cargar teselas externas.
const VECTOR = !!window.HUELLAS_VECTOR_MAP;
const RINGS = [['1er', 750], ['2do', 1450], ['3er', 2350], ['4to', 3350], ['5to', 4450], ['6to', 5650], ['7mo', 6900], ['8vo', 8200]];
const RADIALS = [ // [rumbo en grados desde el norte, nombre]
  [-12, 'Av. Banzer'], [18, 'Av. Beni'], [48, 'Av. Alemana'], [82, 'Av. V. de Cotoca'], [128, 'Av. Santos Dumont'],
  [168, 'Av. Grigotá'], [205, 'Doble vía La Guardia'], [240, 'Av. Roca y Coronado'], [300, 'Av. San Martín'], [335, 'Av. Cristo Redentor'],
];
const offset = ([lat, lng], m, deg) => {
  const r = deg * Math.PI / 180;
  return [lat + (m * Math.cos(r)) / 111320, lng + (m * Math.sin(r)) / (111320 * Math.cos(lat * Math.PI / 180))];
};
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function drawCity(map, { labels = true } = {}) {
  const ring = cssVar('--map-ring'), road = cssVar('--map-road'), river = cssVar('--map-river'), dark = cssVar('--night');
  // calles radiales primero, anillos encima
  RADIALS.forEach(([deg]) => L.polyline([offset(CENTER, 300, deg), offset(CENTER, 9600, deg)], { color: road, weight: 5, interactive: false }).addTo(map));
  RINGS.forEach(([name, m], i) => {
    L.circle(CENTER, { radius: m, color: ring, weight: i < 4 ? 4 : 3, fill: false, interactive: false }).addTo(map);
    if (labels) L.marker(offset(CENTER, m, 0), { interactive: false, icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="ring-label">${name} anillo</div>` }) }).addTo(map);
  });
  // río Piraí al oeste de la ciudad
  L.polyline([[-17.70, -63.215], [-17.73, -63.222], [-17.76, -63.214], [-17.79, -63.221], [-17.82, -63.214], [-17.86, -63.222]], { color: river, weight: 12, opacity: .9, lineCap: 'round', interactive: false }).addTo(map);
  // plaza 24 de Septiembre
  L.circleMarker(CENTER, { radius: 6, color: dark, fillColor: cssVar('--orange'), fillOpacity: 1, weight: 2, interactive: false }).addTo(map);
  if (labels) {
    Object.entries(ZONES).forEach(([z, ll]) => L.marker(ll, { interactive: false, icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="zone-label">${z}</div>` }) }).addTo(map));
    L.marker([-17.775, -63.226], { interactive: false, icon: L.divIcon({ className: '', iconSize: [0, 0], html: '<div class="ring-label" style="color:var(--map-river)">Río Piraí</div>' }) }).addTo(map);
  }
}
const makeMap = (el, opts = {}) => {
  const map = L.map(el, { zoomControl: false, attributionControl: true, ...opts }).setView(opts.center || CENTER, opts.zoom || 13);
  const vector = () => { if (map._city) return; map._city = true; drawCity(map, { labels: !opts.static }); };
  if (VECTOR) vector();
  else {
    // OpenStreetMap; si no hay internet o el visor bloquea las teselas, se dibuja el mapa de anillos
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
    // transición de página: cortina naranja/tinta con huellas
    const curtain = ref(null);
    let first = true;
    const leave = (el, done) => {
      if (reduced) return done();
      const c = curtain.value;
      gsap.timeline({ onComplete: done })
        .set(c, { visibility: 'visible' })
        .fromTo(c.querySelectorAll('.curtain__panel'), { scaleY: 0, transformOrigin: 'bottom' }, { scaleY: 1, duration: .55, ease: 'expo.inOut', stagger: .08 })
        .fromTo(c.querySelectorAll('.curtain__paw span'), { y: 40, opacity: 0, scale: .4 }, { y: 0, opacity: 1, scale: 1, stagger: .07, duration: .35, ease: 'back.out(3)' }, '-=.25')
        .to(el, { y: -60, duration: .5, ease: 'expo.in' }, 0);
    };
    const enter = (el, done) => {
      lenis.scrollTo(0, { immediate: true, force: true });
      if (first || reduced) { first = false; ScrollTrigger.refresh(); return done(); }
      const c = curtain.value;
      gsap.timeline({ onComplete: () => { gsap.set(c, { visibility: 'hidden' }); ScrollTrigger.refresh(); done(); } })
        .to(c.querySelectorAll('.curtain__paw span'), { y: -30, opacity: 0, stagger: .05, duration: .25, ease: 'power2.in' })
        .to([...c.querySelectorAll('.curtain__panel')].reverse(), { scaleY: 0, transformOrigin: 'top', duration: .6, ease: 'expo.inOut', stagger: .08 }, '-=.05')
        .fromTo(el, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'expo.out', clearProps: 'transform,opacity' }, '-=.45');
    };
    return { route, ui, curtain, leave, enter, closeAlert };
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
      <div class="curtain__paw"><span>🐾</span><span>🐾</span><span>🐾</span></div>
    </div>
    <transition name="fade"><alert-modal v-if="ui.modal" :id="ui.modal" @close="closeAlert" /></transition>
    <transition name="fade"><div class="toast" v-if="ui.toast">{{ ui.toast }}</div></transition>
  `,
});

/* ---------- navegación ---------- */
const LINKS = [['/', 'Inicio', '🏠'], ['/mapa', 'Mapa', '🗺️'], ['/publicar', 'Publicar', '＋'], ['/comunidad', 'Comunidad', '💬'], ['/registrar', 'Mi mascota', '🐶']];
app.component('site-nav', {
  setup() {
    const hide = ref(false);
    let last = 0;
    lenis.on('scroll', ({ scroll }) => { hide.value = scroll > last && scroll > 200; last = scroll; });
    const isActive = p => (p === '/' ? route.value.path === '/' : route.value.path.startsWith(p));
    return { hide, links: LINKS.filter(l => l[0] !== '/publicar'), isActive };
  },
  template: `
    <header class="nav" :class="{hide}">
      <div class="wrap nav__in">
        <a href="#/" class="logo"><span class="logo__paw">🐾</span>HUELLAS</a>
        <nav class="nav__links">
          <a v-for="l in links" :key="l[0]" :href="'#'+l[0]" :class="{active:isActive(l[0])}">{{ l[1] }}</a>
        </nav>
        <a href="#/publicar" class="btn btn--orange btn--sm" v-magnet>🚨 Reportar mascota</a>
      </div>
    </header>`,
});
app.component('tab-bar', {
  setup: () => ({ links: LINKS, route, isActive: p => (p === '/' ? route.value.path === '/' : route.value.path.startsWith(p)) }),
  template: `
    <nav class="tabbar">
      <a v-for="l in links" :key="l[0]" :href="'#'+l[0]" :class="{active:isActive(l[0]), plus:l[0]==='/publicar'}">
        <em>{{ l[2] }}</em><span v-if="l[0]!=='/publicar'">{{ l[1] }}</span>
      </a>
    </nav>`,
});
app.component('site-footer', {
  template: `
    <footer class="foot">
      <div class="wrap">
        <div class="foot__grid">
          <div>
            <a href="#/" class="logo"><span class="logo__paw">🐾</span>HUELLAS</a>
            <p class="mt" style="max-width:36ch">La red social de mascotas de Santa Cruz de la Sierra. Hecha por cambas que aman a sus peludos. 🇧🇴</p>
          </div>
          <div><h4>Explorar</h4><a href="#/mapa">Mapa en vivo</a><a href="#/comunidad">Comunidad</a><a href="#/publicar">Reportar</a></div>
          <div><h4>Tu mascota</h4><a href="#/registrar">Registrar perfil</a><a href="#/comunidad">Ver perfiles</a></div>
          <div><h4>Ayuda</h4><a href="#/">Preguntas frecuentes</a><a href="#/">Refugios aliados</a><a href="#/">Contacto</a></div>
        </div>
        <div class="foot__big">huellas</div>
        <p class="muted mt">© ${new Date().getFullYear()} HUELLAS · Santa Cruz de la Sierra, Bolivia</p>
      </div>
    </footer>`,
});

/* ---------- media reutilizable (video / foto / emoji) ---------- */
app.component('pet-media', {
  props: ['item'],
  setup: () => ({ SPECIES, M, hide: e => (e.target.style.visibility = 'hidden') }),
  template: `
    <video v-if="item.video" v-auto :src="M(item.video)" muted loop playsinline preload="none"></video>
    <img v-else-if="item.photo" :src="M(item.photo)" :alt="item.name" loading="lazy" @error="hide">
    <div v-else class="pet-card__emoji" style="background:transparent">{{ item.emoji || SPECIES[item.species] || '🐾' }}</div>`,
});
app.component('type-tag', {
  props: ['type'],
  setup: () => ({ TYPES }),
  template: `<span class="tag" :style="{'--c':TYPES[type].color}">{{ TYPES[type].icon }} {{ TYPES[type].label }}</span>`,
});
app.component('pet-card', {
  props: ['pet'],
  template: `
    <a :href="'#/mascota/'+pet.id" class="pet-card" :style="{'--accent':pet.accent}">
      <div class="pet-card__media"><pet-media :item="pet" />
        <span v-if="pet.lost" class="pet-card__badge"><type-tag type="perdido" /></span>
      </div>
      <div class="pet-card__body">
        <h3>{{ pet.name }} <small class="muted" style="font-size:.85rem;font-family:var(--f-body)">{{ (pet.followers||0).toLocaleString('es-BO') }} ♥</small></h3>
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
    const byId = (...ids) => ids.map(id => state.pets.find(p => p.id === id)).filter(Boolean);
    const heroPet = computed(() => byId('p1')[0] || state.pets[0]);
    const polaroids = computed(() => byId('p7', 'p10', 'p9'));
    const faces = computed(() => byId('p8', 'p12', 'p11', 'p13'));
    const reel = LITE ? { photo: 'media/pets/golden.jpg', name: 'Golden' } : { video: 'media/v3.mp4', name: 'Tigre' };
    let map;

    usePageFx(root, () => {
      // historias y polaroids con rebote
      intro('.story', { y: 20, opacity: 0, duration: .7, ease: 'back.out(2)', stagger: .05, delay: .1 });
      gsap.from('.polaroid', { y: 80, rotate: 0, scale: .6, opacity: 0, duration: 1.1, ease: 'back.out(1.6)', stagger: .12, delay: .6 });
      gsap.utils.toArray('.polaroid').forEach((s, i) => gsap.to(s, { y: i % 2 ? 10 : -10, duration: 2.6 + i * .4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.8 }));
      // título del hero
      gsap.from('.hero h1 .line>span', { yPercent: 115, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: .1, delay: .15 });
      intro('.hero .lead, .hero__cta > *, .hero__proof', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, delay: .5 });
      gsap.from('.scribble path', { strokeDasharray: 400, strokeDashoffset: 400, duration: 1.2, ease: 'power3.inOut', delay: 1 });
      gsap.from('.hero__phone', { y: 120, rotate: 14, opacity: 0, duration: 1.4, ease: 'expo.out', delay: .3 });
      gsap.from('.sticker', { scale: 0, opacity: 0, duration: .8, ease: 'back.out(2.5)', stagger: .15, delay: 1 });
      gsap.utils.toArray('.sticker').forEach((s, i) => gsap.to(s, { y: i % 2 ? 14 : -14, rotate: i % 2 ? 3 : -3, duration: 2.4 + i * .3, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.6 }));
      // parallax del hero al hacer scroll
      gsap.to('.hero__phone', { yPercent: -18, rotate: -2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.blob', { yPercent: 60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

      // el video principal se expande al hacer scroll
      gsap.fromTo('.reel__frame', { clipPath: 'inset(8% 14% 8% 14% round 60px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none',
        scrollTrigger: { trigger: '.reel', start: 'top 85%', end: 'center 55%', scrub: 1 },
      });
      intro('.reel__over > *', { y: 40, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.reel', start: 'center 70%' } });

      // contadores
      gsap.utils.toArray('[data-count]').forEach(el => {
        const o = { v: 0 }, end = +el.dataset.count;
        gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => (el.textContent = Math.round(o.v) + (el.dataset.suffix || '')) });
      });

      // "Cómo funciona": scroll horizontal fijado (solo escritorio)
      gsap.matchMedia().add('(min-width: 721px)', () => {
        const track = document.querySelector('.how__track');
        const dist = () => track.scrollWidth - innerWidth;
        gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.how', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
      });

      // parallax de imagen
      gsap.fromTo('.parallax img', { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.parallax', scrub: true } });
      // huellas del CTA
      gsap.utils.toArray('.cta .paws span').forEach(p => gsap.to(p, { y: gsap.utils.random(-30, 30), rotate: gsap.utils.random(-30, 30), duration: gsap.utils.random(2, 4), repeat: -1, yoyo: true, ease: 'sine.inOut' }));
    });

    onMounted(() => {
      // mini mapa decorativo con pins reales
      map = makeMap(mini.value, { static: true, dark: true, zoom: 12, zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, keyboard: false, attributionControl: false });
      state.reports.forEach(r => L.marker([r.lat, r.lng], { icon: pinIcon(r), interactive: false }).addTo(map));
      setTimeout(() => map.invalidateSize(), 900);
    });
    onBeforeUnmount(() => map && map.remove());

    const paws = Array.from({ length: 12 }, () => ({ left: Math.random() * 100 + '%', top: Math.random() * 100 + '%' }));
    return { root, mini, pets, lostCount, paws, heroPet, polaroids, faces, reel, state, M };
  },
  template: `
  <main ref="root">
    <!-- HERO -->
    <section class="hero">
      <div class="blob" style="width:420px;height:420px;background:var(--orange);top:-80px;right:-60px"></div>
      <div class="blob" style="width:300px;height:300px;background:var(--violet);bottom:0;left:-120px;opacity:.25"></div>
      <div class="wrap">
        <div class="stories" aria-label="Mascotas de la comunidad">
          <a href="#/registrar" class="story story--add"><span class="story__ring"><span class="story__plus">＋</span></span><small>Tu mascota</small></a>
          <a v-for="p in pets" :key="p.id" :href="'#/mascota/'+p.id" class="story">
            <span class="story__ring" :class="{lost:p.lost}"><pet-media :item="p" /></span>
            <small>{{ p.name }}</small>
          </a>
        </div>
      </div>
      <div class="wrap hero__grid">
        <div>
          <span class="eyebrow">Santa Cruz de la Sierra · Bolivia</span>
          <h1 class="h-xl" style="margin:18px 0 22px">
            <span class="line"><span>Cada huella</span></span>
            <span class="line"><span>vuelve a</span></span>
            <span class="line"><span class="scribble hl">casa.<svg viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M3 14 C 50 2, 120 2, 197 12"/></svg></span></span>
          </h1>
          <p class="lead">La red social que conecta a los amantes de los animales de Santa Cruz. Registra a tu mascota, marca en el mapa a las que se perdieron y ayuda a que vuelvan con su familia en horas, no semanas.</p>
          <div class="hero__cta">
            <a href="#/publicar" class="btn btn--orange" v-magnet>🚨 Perdí a mi mascota</a>
            <a href="#/mapa" class="btn btn--ghost" v-magnet>🗺️ Ver el mapa en vivo</a>
          </div>
          <div class="hero__proof">
            <div class="avatars">
              <span v-for="p in faces" :key="p.id"><pet-media :item="p" /></span>
            </div>
            <span><b>{{ state.pets.length }} mascotas</b> en la manada y <b>{{ lostCount }} alertas activas</b> en la ciudad</span>
          </div>
        </div>
        <div class="collage">
          <figure v-for="(p,i) in polaroids" :key="p.id" class="polaroid" :class="'polaroid--'+i">
            <a :href="'#/mascota/'+p.id"><pet-media :item="p" /></a>
            <figcaption>{{ p.name }} <span>{{ p.zone }}</span></figcaption>
          </figure>
          <div class="hero__phone">
            <pet-media :item="heroPet" />
            <div class="hero__phone-ui">
              <div class="row"><span class="pfp">🐱</span><div><b>{{ heroPet.name }}</b><br><small style="opacity:.8">{{ heroPet.zone }} · {{ heroPet.age }}</small></div></div>
              <div>
                <span class="tag" style="--c:var(--mint)">💚 En casa · con chip</span>
                <p style="margin-top:8px;font-weight:600">"La hora de comer es sagrada" 🍽️</p>
              </div>
            </div>
          </div>
          <div class="sticker" style="bottom:4%;right:-4%"><span class="ico" style="--c:#D4F5E4">💚</span><div>¡Nube volvió a casa!<small>Las Palmas · 210 ♥</small></div></div>
        </div>
      </div>
    </section>

    <!-- VIDEO PRINCIPAL -->
    <section class="reel">
      <div class="wrap">
        <div class="reel__frame">
          <pet-media :item="reel" />
          <div class="reel__over">
            <span class="eyebrow" style="color:var(--yellow)">Nuestra misión</span>
            <h2 class="h-lg" style="margin:12px 0">Ningún peludo debería dormir lejos de su plato.</h2>
            <p style="max-width:48ch;opacity:.85">Miles de mascotas se pierden cada año en Santa Cruz por cohetes, portones abiertos o un descuido. Con HUELLAS, todo el barrio se convierte en su red de búsqueda.</p>
          </div>
        </div>
      </div>
    </section>

    <div class="marquee"><div class="marquee__track">
      <span v-for="n in 2" :key="n">Registra <i>✦</i> Reporta <i>✦</i> Encuentra <i>✦</i> Reúne <i>✦</i> Adopta <i>✦</i> Comparte <i>✦</i></span>
    </div></div>

    <!-- POR QUÉ HUELLAS -->
    <section class="section">
      <div class="wrap">
        <div class="section__head">
          <div><span class="eyebrow">¿Por qué HUELLAS?</span><h2 class="h-lg" style="margin-top:14px">Hecha para encontrarlos <span class="hl">rápido.</span></h2></div>
          <p class="lead" style="max-width:40ch">Los grupos de Facebook y WhatsApp se llenan de mensajes y las alertas se pierden. HUELLAS las pone en un mapa, las cruza entre sí y avisa a quien está cerca.</p>
        </div>
        <div class="features">
          <article class="feature feature--big" data-reveal v-tilt>
            <div>
              <div class="feature__ico" style="--c:var(--orange)">🗺️</div>
              <h3 style="font-size:2rem">Mapa en vivo de toda la ciudad</h3>
              <p>Del Plan 3000 al Urubó: cada alerta queda marcada en el punto exacto donde se perdió o se vio. Filtra por perros, gatos, aves y por estado.</p>
              <a href="#/mapa" class="btn btn--light btn--sm mt">Abrir mapa →</a>
            </div>
            <div class="mini-map" ref="mini"></div>
          </article>
          <article class="feature feature--accent" data-reveal v-tilt>
            <div class="feature__ico" style="--c:rgba(255,255,255,.2)">🧠</div>
            <h3>Coincidencias inteligentes</h3>
            <p>Si alguien ve un beagle cerca de donde se perdió el tuyo, HUELLAS los conecta automáticamente por especie, color y distancia.</p>
          </article>
          <article class="feature" data-reveal v-tilt>
            <div class="feature__ico" style="--c:#E7E1FF">🪪</div>
            <h3>Perfil con QR</h3>
            <p>Cada mascota tiene su perfil con fotos, señas y un QR para su collar. Quien la encuentre te contacta en un toque.</p>
          </article>
          <article class="feature" data-reveal v-tilt>
            <div class="feature__ico" style="--c:#FFF1C4">📣</div>
            <h3>Alertas por barrio</h3>
            <p>Recibe solo lo que pasa a tu alrededor. Una alerta nueva llega primero a los vecinos en un radio de 5 km.</p>
          </article>
          <article class="feature" data-reveal v-tilt>
            <div class="feature__ico" style="--c:#D4F5E4">💬</div>
            <h3>Comunidad camba</h3>
            <p>Comparte fotos, sigue a otras mascotas, celebra reencuentros y conoce a otros amantes de los animales.</p>
          </article>
          <article class="feature" data-reveal v-tilt>
            <div class="feature__ico" style="--c:#FFE1D3">⚡</div>
            <h3>Liviana y gratis</h3>
            <p>Funciona desde el navegador del celular, sin descargar nada y con pocos datos. Publicar una alerta toma menos de un minuto.</p>
          </article>
        </div>
        <div class="stats">
          <div class="stat" style="--c:var(--night);--fg:#fff" data-reveal><b>24/7</b><span>mapa actualizado en vivo</span></div>
          <div class="stat" style="--c:var(--yellow)" data-reveal><b data-count="15">0</b><span>barrios cubiertos</span></div>
          <div class="stat" style="--c:#E7E1FF" data-reveal><b data-count="5" data-suffix=" km">0</b><span>radio de alerta vecinal</span></div>
          <div class="stat" style="--c:#D4F5E4" data-reveal><b>Bs 0</b><span>siempre gratis para dueños</span></div>
        </div>
      </div>
    </section>

    <!-- CÓMO FUNCIONA -->
    <section class="how section">
      <div class="how__scroller">
        <div class="how__track">
          <div class="how__intro">
            <span class="eyebrow">Cómo funciona</span>
            <h2 class="h-lg">De perdido a <span class="hl" style="color:var(--yellow)">en casa</span> en 4 pasos.</h2>
            <p>Desliza → así es como la comunidad trabaja para traerlos de vuelta.</p>
          </div>
          <article class="step" style="--c:var(--orange)"><span class="step__n">01</span><h3>Crea su perfil</h3><p>Sube fotos, señas particulares, chip y vacunas. Si algún día se pierde, todo ya está listo.</p><span class="step__emoji">📸</span></article>
          <article class="step" style="--c:var(--yellow)"><span class="step__n">02</span><h3>Activa la alerta</h3><p>Con un toque marcas dónde y cuándo se perdió. Tu perfil se convierte en un afiche digital.</p><span class="step__emoji">🚨</span></article>
          <article class="step" style="--c:var(--violet)"><span class="step__n">03</span><h3>El barrio se activa</h3><p>Los vecinos cercanos reciben la alerta y pueden marcar en el mapa dónde la vieron.</p><span class="step__emoji">🏘️</span></article>
          <article class="step" style="--c:var(--mint)"><span class="step__n">04</span><h3>¡Reencuentro!</h3><p>Te avisamos de cada coincidencia, hablas directo por WhatsApp y celebras con la comunidad.</p><span class="step__emoji">💚</span></article>
        </div>
      </div>
    </section>

    <!-- PERFILES -->
    <section class="section">
      <div class="wrap">
        <div class="section__head">
          <div><span class="eyebrow">La manada</span><h2 class="h-lg" style="margin-top:14px">Conoce a los <span class="hl">vecinos.</span></h2></div>
          <a href="#/comunidad" class="btn btn--ghost" v-magnet>Ver todos los perfiles →</a>
        </div>
        <div class="pets-rail" data-lenis-prevent-wheel>
          <pet-card v-for="p in pets" :key="p.id" :pet="p" data-reveal />
        </div>
      </div>
    </section>

    <!-- IMAGEN PARALLAX -->
    <section class="wrap">
      <div class="parallax" data-reveal>
        <img :src="M('media/img2.avif')" alt="Gato mirando a cámara" loading="lazy">
        <div class="parallax__txt">
          <div style="max-width:520px">
            <span class="eyebrow" style="color:var(--yellow)">Su propia identidad</span>
            <h2 class="h-lg" style="margin:14px 0 18px">Tu mascota merece su propio perfil.</h2>
            <a href="#/registrar" class="btn btn--orange" v-magnet>Registrar a mi mascota 🐾</a>
          </div>
        </div>
      </div>
    </section>

    <!-- COMPARATIVA -->
    <section class="section">
      <div class="wrap">
        <div class="section__head"><div><span class="eyebrow">La diferencia</span><h2 class="h-lg" style="margin-top:14px">No es otro grupo de WhatsApp.</h2></div></div>
        <div class="compare" data-reveal>
          <div class="compare__row"><span></span><span>HUELLAS</span><span>Grupos y redes</span></div>
          <div class="compare__row"><span>Ubicación exacta en un mapa</span><span>✅</span><span>❌</span></div>
          <div class="compare__row"><span>Cruce automático perdido ↔ avistado</span><span>✅</span><span>❌</span></div>
          <div class="compare__row"><span>Alertas solo de tu zona</span><span>✅</span><span>❌</span></div>
          <div class="compare__row"><span>Perfil permanente con QR</span><span>✅</span><span>❌</span></div>
          <div class="compare__row"><span>Las alertas no se pierden entre mensajes</span><span>✅</span><span>😩</span></div>
        </div>
      </div>
    </section>

    <!-- HISTORIAS -->
    <section class="section" style="padding-top:0">
      <div class="wrap">
        <div class="section__head"><div><span class="eyebrow">Reencuentros</span><h2 class="h-lg" style="margin-top:14px">Historias con final feliz.</h2></div></div>
        <div class="quotes">
          <blockquote class="quote" style="--c:#FFE1D3" data-reveal><p>"Nube se escapó por el balcón. Una vecina la marcó en el mapa a 3 cuadras y en 2 días estaba en casa."</p><footer><span>🐱</span><div><b>Andrés M.</b><br>Las Palmas</div></footer></blockquote>
          <blockquote class="quote" style="--c:#E7E1FF" data-reveal><p>"Encontré un golden en el condominio y en una hora su familia me escribió por WhatsApp. Increíble."</p><footer><span>🐕</span><div><b>Mariela T.</b><br>Urubó</div></footer></blockquote>
          <blockquote class="quote" style="--c:#D4F5E4" data-reveal><p>"Ahora todos en el barrio tenemos el perfil de nuestros perros. Es como un vecindario que se cuida."</p><footer><span>🐶</span><div><b>Familia Rojas</b><br>Mutualista</div></footer></blockquote>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section" style="padding-top:0">
      <div class="wrap" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px">
        <div><span class="eyebrow">Preguntas</span><h2 class="h-lg" style="margin-top:14px">Lo que nos preguntan.</h2></div>
        <div class="faq">
          <details data-reveal><summary>¿HUELLAS es gratis?</summary><p>Sí. Registrar mascotas, publicar alertas y usar el mapa es y será gratis para los dueños.</p></details>
          <details data-reveal><summary>¿Qué hago si encuentro una mascota en la calle?</summary><p>Toca "Reportar", elige "La vi" o "La rescaté", marca el lugar en el mapa y sube una foto. Si coincide con una alerta, avisamos a su familia.</p></details>
          <details data-reveal><summary>¿Mis datos de contacto son públicos?</summary><p>Solo se muestra un botón para escribirte por WhatsApp en las alertas que tú publicas. Puedes borrar la alerta cuando quieras.</p></details>
          <details data-reveal><summary>¿Funciona fuera de Santa Cruz?</summary><p>Empezamos en Santa Cruz de la Sierra y el área metropolitana (Urubó, Warnes, La Guardia). ¡Pronto más ciudades de Bolivia!</p></details>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="wrap">
      <div class="cta" data-reveal>
        <div class="paws"><span v-for="(p,i) in paws" :key="i" :style="p">🐾</span></div>
        <span class="eyebrow" style="color:#fff">Únete a la manada</span>
        <h2 class="h-lg" style="margin-top:14px">Haz que tu barrio cuide a tu mascota.</h2>
        <p>Crea su perfil en 1 minuto. Si algún día se pierde, miles de vecinos estarán listos para ayudar.</p>
        <div class="flex" style="justify-content:center">
          <a href="#/registrar" class="btn btn--light" v-magnet>Crear perfil gratis</a>
          <a href="#/mapa" class="btn" v-magnet>Ver el mapa</a>
        </div>
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
          .bindPopup(`<div class="pop"><h4>${r.name}</h4><p>${TYPES[r.type].icon} ${TYPES[r.type].label} · ${r.zone} · ${timeAgo(r.date)}</p><button data-open="${r.id}">Ver detalles</button></div>`)
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
        toast(`📍 ${near} alertas a menos de 5 km de ti`);
      }, () => toast('No pudimos obtener tu ubicación'));
    };

    usePageFx(root, () => {
      intro('.mapside > *', { x: -40, opacity: 0, stagger: .08, duration: .9, ease: 'expo.out', delay: .2 });
      intro('.map', { scale: .96, opacity: 0, duration: 1.1, ease: 'expo.out', delay: .1 });
    });

    onMounted(() => {
      map = makeMap(el.value, { zoom: 13 });
      layer = L.layerGroup().addTo(map);
      draw();
      map.on('click', e => {
        temp && temp.remove();
        const { lat, lng } = e.latlng;
        temp = L.popup().setLatLng(e.latlng).setContent(`<div class="pop"><h4>¿Reportar aquí?</h4><p>Marca este punto para una mascota perdida o vista.</p><button data-here="${lat.toFixed(5)},${lng.toFixed(5)}">🚨 Reportar en este lugar</button></div>`).openOn(map);
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
          <div><span class="eyebrow">Mapa en vivo<template v-if="status.online"> · <span class="live-dot"></span>conectado</template></span><h1 class="h-md" style="margin-top:8px">Santa Cruz de la Sierra</h1></div>
          <input class="input" v-model="f.q" placeholder="🔎 Buscar por nombre, raza, barrio, color…">
          <div class="filters">
            <button class="chip" :class="{on:f.type==='todos'}" @click="f.type='todos'">Todos</button>
            <button v-for="(t,k) in TYPES" :key="k" class="chip" :class="{on:f.type===k}" @click="f.type=k">{{ t.icon }} {{ t.label }}</button>
          </div>
          <div class="filters">
            <button class="chip" :class="{on:f.species==='todas'}" @click="f.species='todas'">Todas</button>
            <button v-for="(e,k) in SPECIES" :key="k" class="chip" :class="{on:f.species===k}" @click="f.species=k">{{ e }}</button>
          </div>
          <div class="mapside__list" data-lenis-prevent>
            <button v-for="r in list" :key="r.id" class="alert-item" :class="{on:sel===r.id}" @click="focus(r.id)" @dblclick="openAlert(r.id)">
              <div class="thumb" :style="{'--c':TYPES[r.type].color+'22'}"><pet-media :item="r" /></div>
              <div style="min-width:0">
                <h4>{{ r.name }}</h4>
                <p>{{ r.breed }} · {{ r.zone }} · {{ timeAgo(r.date) }}</p>
                <div style="margin-top:6px"><type-tag :type="r.type" /></div>
              </div>
            </button>
            <p v-if="!list.length" class="empty">No hay alertas con esos filtros 🐾</p>
          </div>
          <a href="#/publicar" class="btn btn--orange" style="justify-content:center">🚨 Publicar una alerta</a>
        </aside>
        <div class="map" ref="el" data-lenis-prevent>
          <div class="map__hint">👆 Toca el mapa para reportar en ese punto</div>
          <div class="map__tools"><button class="btn btn--light btn--sm" @click.stop="locate">📍 Cerca de mí</button></div>
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
    const types = { perdido: ['🚨', 'Perdí a mi mascota'], visto: ['👀', 'Vi una mascota'], encontrado: ['🏠', 'La rescaté'] };

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
        toast('✅ ¡Alerta publicada! Ya está en el mapa');
        go('/mapa?focus=' + id);
        setTimeout(() => openAlert(id), 1700);
      } catch (e) {
        toast('No se pudo publicar: ' + (e.message || 'revisa tu conexión e inténtalo de nuevo'));
      } finally { sending.value = false; }
    };

    usePageFx(root, () => {
      intro('.page__head > *', { y: 40, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out', delay: .15 });
      intro('.publish-layout > *', { y: 60, opacity: 0, stagger: .12, duration: 1, ease: 'expo.out', delay: .3 });
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
        <span class="eyebrow">Nueva alerta</span>
        <h1 class="h-lg">Publica y deja que <span class="hl">el barrio</span> ayude.</h1>
        <p class="lead">Mientras más detalles des, más fácil será reconocerla. Toma menos de un minuto.</p>
      </header>
      <div class="publish-layout">
        <form class="card form-grid" @submit.prevent="submit">
          <div class="field field--full"><label>¿Qué pasó?</label>
            <div class="seg">
              <button type="button" v-for="(t,k) in types" :key="k" :class="{on:form.type===k}" :style="{'--c':TYPES[k].color}" @click="form.type=k"><em>{{ t[0] }}</em>{{ t[1] }}</button>
            </div>
          </div>
          <div class="field field--full"><label>Especie</label>
            <div class="seg" style="--n:5">
              <button type="button" v-for="(e,k) in SPECIES" :key="k" :class="{on:form.species===k}" @click="form.species=k"><em>{{ e }}</em>{{ k }}</button>
            </div>
          </div>
          <div class="field"><label>{{ form.type==='perdido' ? 'Nombre de tu mascota' : 'Título corto' }} *</label><input class="input" v-model="form.name" :placeholder="form.type==='perdido' ? 'Ej. Toby' : 'Ej. Perrito café con collar'"></div>
          <div class="field"><label>Raza</label><input class="input" v-model="form.breed" placeholder="Ej. Beagle, mestizo…"></div>
          <div class="field"><label>Color / señas</label><input class="input" v-model="form.color" placeholder="Ej. Tricolor, collar rojo"></div>
          <div class="field"><label>Barrio / zona</label><select class="input" v-model="form.zone"><option v-for="(_,z) in ZONES" :key="z">{{ z }}</option></select></div>
          <div class="field field--full"><label>📍 ¿Dónde exactamente? <span class="muted" style="font-weight:400">— toca el mapa o arrastra el pin</span></label>
            <div class="pick-map" ref="pick" data-lenis-prevent></div>
          </div>
          <div class="field field--full"><label>Descripción</label><textarea class="input" v-model="form.desc" placeholder="¿Cómo es su carácter? ¿Qué llevaba puesto? ¿Hacia dónde iba?"></textarea></div>
          <div class="field field--full"><label>Foto</label>
            <div class="drop" @click="fileIn.click()">
              <img v-if="form.photo" :src="form.photo" alt="">
              <span v-else style="font-size:2.4rem">📷</span>
              <div><b>{{ form.photo ? 'Cambiar foto' : 'Sube una foto clara' }}</b><br><small class="muted">La comprimimos para que cargue rápido</small></div>
              <input type="file" accept="image/*" ref="fileIn" hidden @change="onFile">
            </div>
          </div>
          <div class="field" v-if="form.type==='perdido'"><label>Recompensa (opcional)</label><input class="input" v-model="form.reward" placeholder="Ej. Bs 300"></div>
          <div class="field" :class="{'field--full': form.type!=='perdido'}"><label>Tu WhatsApp *</label><input class="input" v-model="form.contact" inputmode="tel" placeholder="7XXXXXXX"></div>
          <div class="field field--full"><button class="btn btn--orange" style="justify-content:center" :disabled="!valid || sending">{{ sending ? 'Publicando…' : 'Publicar alerta en el mapa 🐾' }}</button></div>
        </form>
        <aside class="preview-sticky">
          <p class="eyebrow" style="margin-bottom:12px">Vista previa</p>
          <div class="post" style="margin:0">
            <div class="post__media" :style="{'--c':TYPES[form.type].color+'22'}"><pet-media :item="form" /></div>
            <div class="post__body">
              <type-tag :type="form.type" />
              <h3 style="font-size:1.6rem;margin:10px 0 4px">{{ form.name || 'Nombre' }}</h3>
              <p class="muted">{{ form.breed || 'Raza' }} · {{ form.color || 'Color' }} · {{ form.zone }}</p>
              <p style="margin-top:10px">{{ form.desc || 'La descripción aparecerá aquí.' }}</p>
              <p v-if="form.reward" style="margin-top:10px;font-weight:700">🎁 Recompensa: {{ form.reward }}</p>
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
    const like = r => actions.toggleLike(r);
    usePageFx(root, () => intro('.page__head > *, .feed-tabs', { y: 40, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out', delay: .15 }));
    watch(tab, () => nextTick(() => {
      gsap.fromTo(root.value.querySelectorAll('.tabpane > *'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .7, ease: 'expo.out' });
      ScrollTrigger.refresh();
    }));
    return { root, tab, feed, urgent, happy, state, like, TYPES, timeAgo, share, openAlert };
  },
  template: `
  <main class="page" ref="root">
    <div class="wrap">
      <header class="page__head">
        <span class="eyebrow">Comunidad</span>
        <h1 class="h-lg">La manada de <span class="hl">Santa Cruz.</span></h1>
      </header>
      <div class="flex feed-tabs" style="margin-bottom:24px">
        <button class="chip" :class="{on:tab==='muro'}" @click="tab='muro'">📰 Muro</button>
        <button class="chip" :class="{on:tab==='perfiles'}" @click="tab='perfiles'">🐾 Perfiles</button>
        <button class="chip" :class="{on:tab==='reunidos'}" @click="tab='reunidos'">💚 Reencuentros</button>
      </div>

      <div v-if="tab==='perfiles'" class="pets-grid tabpane">
        <a href="#/registrar" class="pet-card" style="--accent:var(--cream);display:grid;place-items:center;min-height:380px;text-align:center;box-shadow:inset 0 0 0 2px var(--orange)">
          <div><div style="font-size:4rem">➕</div><h3 style="font-size:1.5rem">Registra a tu mascota</h3><p class="muted">Gratis · 1 minuto</p></div>
        </a>
        <pet-card v-for="p in state.pets" :key="p.id" :pet="p" />
      </div>

      <div v-else class="feed-layout">
        <div class="tabpane">
          <article v-for="r in (tab==='reunidos' ? happy : feed)" :key="r.id" class="post" data-reveal>
            <div class="post__head">
              <div class="thumb" :style="{'--c':TYPES[r.type].color+'22'}">{{ TYPES[r.type].icon }}</div>
              <div style="flex:1"><b>{{ r.name }}</b> <small>{{ TYPES[r.type].verb }} {{ r.zone }}</small><br><small>{{ timeAgo(r.date) }}</small></div>
              <type-tag :type="r.type" />
            </div>
            <div class="post__media" :style="{'--c':TYPES[r.type].color+'1a'}" @click="openAlert(r.id)" style="cursor:pointer"><pet-media :item="r" /></div>
            <div class="post__body">
              <p>{{ r.desc }}</p>
              <p v-if="r.reward" style="margin-top:8px;font-weight:700">🎁 Recompensa: {{ r.reward }}</p>
              <div class="post__actions">
                <button class="like" :class="{on:r.liked}" @click="like(r)"><em>{{ r.liked ? '❤️' : '🤍' }}</em> {{ r.likes }}</button>
                <button class="like" @click="openAlert(r.id)">💬 {{ r.comments.length }} · Lo vi</button>
                <a class="like" :href="'#/mapa?focus='+r.id">🗺️ En el mapa</a>
                <button class="like" @click="share(r.name+' en HUELLAS','#/mapa?focus='+r.id)">↗ Compartir</button>
              </div>
            </div>
          </article>
        </div>
        <aside>
          <div class="side-card" style="background:var(--night);color:#fff">
            <h3>🚨 Urgente cerca de ti</h3>
            <div v-for="r in urgent" :key="r.id" class="mini-pet" style="cursor:pointer" @click="openAlert(r.id)">
              <div class="thumb" style="--c:#2c2b44"><pet-media :item="r" /></div>
              <div><b>{{ r.name }}</b><small style="color:rgba(255,255,255,.6)">{{ r.zone }} · {{ timeAgo(r.date) }}</small></div>
            </div>
          </div>
          <div class="side-card">
            <h3>⭐ Mascotas populares</h3>
            <a v-for="p in [...state.pets].sort((a,b)=>b.followers-a.followers).slice(0,4)" :key="p.id" :href="'#/mascota/'+p.id" class="mini-pet">
              <div class="thumb" :style="{'--c':p.accent}"><pet-media :item="p" /></div>
              <div><b>{{ p.name }}</b><small>{{ p.followers.toLocaleString('es-BO') }} seguidores</small></div>
            </a>
          </div>
          <div class="side-card" style="background:var(--yellow);color:var(--ink-fixed);box-shadow:none">
            <h3>🏆 Héroes del barrio</h3>
            <p style="font-size:.92rem">Los vecinos que más ayudan a reunir familias ganan insignias en su perfil. ¡Reporta lo que veas!</p>
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
        toast('💚 ¡Qué alegría! Marcada como en casa');
      } catch (e) { toast('No se pudo actualizar: ' + e.message); }
    };
    // QR decorativo determinístico a partir del id
    const qr = computed(() => { let s = [...(pet.value?.id || 'x')].reduce((a, c) => a * 31 + c.charCodeAt(0), 7); return Array.from({ length: 81 }, () => ((s = (s * 9301 + 49297) % 233280) / 233280) > .5); });
    usePageFx(root, () => {
      gsap.from('.profile__media', { clipPath: 'inset(100% 0 0 0 round 28px)', duration: 1.3, ease: 'expo.inOut', delay: .1 });
      intro('.profile__info > *', { y: 40, opacity: 0, stagger: .07, duration: 1, ease: 'expo.out', delay: .4 });
    });
    return { root, pet, following, follow, alert, markHome, qr, share, openAlert, SPECIES, canEdit };
  },
  template: `
  <main class="page" ref="root">
    <div class="wrap" v-if="pet">
      <a href="#/comunidad?tab=perfiles" class="chip" style="margin-bottom:24px">← Perfiles</a>
      <div class="profile">
        <div class="profile__media" :style="{'--accent':pet.accent}"><pet-media :item="pet" /></div>
        <div class="profile__info">
          <span class="eyebrow">{{ SPECIES[pet.species] }} {{ pet.breed }} · {{ pet.age }}</span>
          <h1 class="h-xl" style="margin:10px 0">{{ pet.name }}</h1>
          <div v-if="pet.lost" style="margin-bottom:12px"><type-tag type="perdido" /> <span class="muted">Esta mascota está perdida — ¡ayuda a encontrarla!</span></div>
          <p class="lead">{{ pet.bio }}</p>
          <div class="profile__stats">
            <div><b>{{ pet.followers.toLocaleString('es-BO') }}</b><span>seguidores</span></div>
            <div><b>{{ pet.zone }}</b><span>barrio</span></div>
            <div><b>{{ pet.owner }}</b><span>familia</span></div>
          </div>
          <div class="traits" style="margin-bottom:26px"><span v-for="t in pet.traits" :key="t" style="font-size:.9rem;padding:8px 14px">{{ t }}</span></div>
          <div class="flex">
            <button class="btn" :class="following ? 'btn--ghost' : ''" @click="follow">{{ following ? '✓ Siguiendo' : '+ Seguir' }}</button>
            <a v-if="!pet.lost && canEdit(pet)" :href="'#/publicar?pet='+pet.id" class="btn btn--orange">🚨 Reportar como perdida</a>
            <template v-else-if="pet.lost">
              <button v-if="alert" class="btn btn--orange" @click="openAlert(alert.id)">Ver alerta</button>
              <button v-if="canEdit(pet)" class="btn btn--ghost" @click="markHome">💚 Ya volvió a casa</button>
            </template>
            <button class="btn btn--ghost" @click="share(pet.name+' en HUELLAS','#/mascota/'+pet.id)">↗ Compartir</button>
          </div>
          <div class="card mt flex" style="gap:22px;align-items:center">
            <div class="qr"><i v-for="(b,i) in qr" :key="i" :class="{o:!b}"></i></div>
            <div style="flex:1;min-width:200px"><h3 style="font-size:1.3rem">Placa QR para el collar</h3><p class="muted">Quien encuentre a {{ pet.name }} escanea el QR y te avisa al instante, con su ubicación.</p></div>
          </div>
        </div>
      </div>
    </div>
    <div class="wrap empty" v-else><h2>No encontramos esta mascota 🐾</h2><a href="#/comunidad" class="btn mt">Volver</a></div>
  </main>`,
});

/* ===================== REGISTRAR MASCOTA ===================== */
app.component('page-register', {
  setup() {
    const root = ref(null), fileIn = ref(null);
    const accents = ['#FF6B35', '#7B61FF', '#1DBF73', '#FFB020', '#FF4D4D'];
    const form = reactive({ name: '', species: 'perro', breed: '', age: '', zone: 'Centro', owner: state.user.name || '', bio: '', traits: '', photo: null, accent: accents[0] });
    const onFile = async e => { const f = e.target.files[0]; if (f) form.photo = await readImage(f, 800); };
    const sending = ref(false);
    const submit = async () => {
      if (!form.name.trim()) return toast('Ponle un nombre a tu mascota');
      if (sending.value) return;
      sending.value = true;
      state.user.name = form.owner;
      try {
        const id = await actions.addPet({ ...form, traits: form.traits.split(',').map(t => t.trim()).filter(Boolean) });
        toast('🎉 ¡Perfil creado! Bienvenido a la manada');
        go('/mascota/' + id);
      } catch (e) {
        toast('No se pudo crear el perfil: ' + (e.message || 'revisa tu conexión'));
      } finally { sending.value = false; }
    };
    usePageFx(root, () => intro('.page__head > *, .reg > *', { y: 50, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out', delay: .15 }));
    return { root, fileIn, form, accents, onFile, submit, SPECIES, ZONES, sending };
  },
  template: `
  <main class="page" ref="root">
    <div class="wrap">
      <header class="page__head">
        <span class="eyebrow">Mi mascota</span>
        <h1 class="h-lg">Crea su perfil <span class="hl">en 1 minuto.</span></h1>
        <p class="lead">Si algún día se pierde, su ficha ya estará lista para convertirse en alerta con un solo toque.</p>
      </header>
      <div class="publish-layout reg">
        <form class="card form-grid" @submit.prevent="submit">
          <div class="field field--full"><label>Especie</label>
            <div class="seg" style="--n:5"><button type="button" v-for="(e,k) in SPECIES" :key="k" :class="{on:form.species===k}" @click="form.species=k"><em>{{ e }}</em>{{ k }}</button></div>
          </div>
          <div class="field"><label>Nombre *</label><input class="input" v-model="form.name" placeholder="Ej. Canela"></div>
          <div class="field"><label>Raza</label><input class="input" v-model="form.breed" placeholder="Ej. Mestiza"></div>
          <div class="field"><label>Edad</label><input class="input" v-model="form.age" placeholder="Ej. 3 años"></div>
          <div class="field"><label>Barrio</label><select class="input" v-model="form.zone"><option v-for="(_,z) in ZONES" :key="z">{{ z }}</option></select></div>
          <div class="field"><label>Tu nombre</label><input class="input" v-model="form.owner" placeholder="Ej. Valeria R."></div>
          <div class="field"><label>Rasgos (separados por coma)</label><input class="input" v-model="form.traits" placeholder="Juguetón, Con chip, Vacunado"></div>
          <div class="field field--full"><label>Biografía</label><textarea class="input" v-model="form.bio" placeholder="¿Qué lo hace único? ¿Señas particulares?"></textarea></div>
          <div class="field field--full"><label>Foto de perfil</label>
            <div class="drop" @click="fileIn.click()">
              <img v-if="form.photo" :src="form.photo" alt=""><span v-else style="font-size:2.4rem">📸</span>
              <div><b>{{ form.photo ? 'Cambiar foto' : 'Sube su mejor foto' }}</b><br><small class="muted">JPG o PNG</small></div>
              <input type="file" accept="image/*" ref="fileIn" hidden @change="onFile">
            </div>
          </div>
          <div class="field field--full"><label>Color de su perfil</label>
            <div class="flex"><button type="button" v-for="c in accents" :key="c" @click="form.accent=c" :style="{width:'40px',height:'40px',borderRadius:'50%',background:c,boxShadow:form.accent===c?'0 0 0 3px #fff, 0 0 0 5px '+c:'none'}"></button></div>
          </div>
          <div class="field field--full"><button class="btn btn--orange" style="justify-content:center" :disabled="sending">{{ sending ? 'Creando…' : 'Crear perfil 🐾' }}</button></div>
        </form>
        <aside class="preview-sticky">
          <p class="eyebrow" style="margin-bottom:12px">Así se verá</p>
          <div class="pet-card" style="width:100%" :style="{'--accent':form.accent}">
            <div class="pet-card__media"><pet-media :item="{...form, emoji: SPECIES[form.species]}" /></div>
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
      try { await actions.addComment(r.value, text); comment.value = ''; toast('🙌 Gracias por ayudar'); }
      catch (e) { toast('No se pudo enviar: ' + e.message); }
    };
    const reunite = async () => {
      try { await actions.setReportType(r.value, 'reunido'); toast('💚 ¡Reencuentro registrado!'); }
      catch (e) { toast('No se pudo actualizar: ' + e.message); }
    };
    const confirmDel = ref(false);
    const remove = async () => {
      if (!confirmDel.value) { confirmDel.value = true; return; }
      try { await actions.removeReport(props.id); emit('close'); toast('Alerta eliminada'); }
      catch (e) { toast('No se pudo eliminar: ' + e.message); }
    };
    const close = () => gsap.to(box.value, { y: 40, opacity: 0, scale: .96, duration: .3, ease: 'power2.in', onComplete: () => emit('close') });
    const onKey = e => e.key === 'Escape' && close();
    onMounted(() => { addEventListener('keydown', onKey); intro(box.value, { y: 60, opacity: 0, scale: .94, duration: .7, ease: 'expo.out' }); });
    onBeforeUnmount(() => removeEventListener('keydown', onKey));
    return { box, r, m, comment, send, reunite, remove, confirmDel, canEdit, close, TYPES, timeAgo, waLink, openAlert, go };
  },
  template: `
    <div class="modal" v-if="r">
      <div class="modal__bg" @click="close"></div>
      <div class="modal__box" ref="box" data-lenis-prevent role="dialog" aria-modal="true">
        <button class="modal__x" @click="close" aria-label="Cerrar">✕</button>
        <div class="modal__media" :style="{'--c':TYPES[r.type].color+'22'}"><pet-media :item="r" /></div>
        <div class="modal__body">
          <div><type-tag :type="r.type" /> <small class="muted">· {{ timeAgo(r.date) }}</small></div>
          <h2 class="h-md">{{ r.name }}</h2>
          <p>{{ r.desc }}</p>
          <dl class="kv">
            <dt>Raza</dt><dd>{{ r.breed || '—' }}</dd>
            <dt>Color</dt><dd>{{ r.color || '—' }}</dd>
            <dt>Zona</dt><dd>{{ r.zone }}</dd>
            <dt v-if="r.reward">Recompensa</dt><dd v-if="r.reward"><b>🎁 {{ r.reward }}</b></dd>
          </dl>
          <div v-if="m.length && r.type!=='reunido'">
            <p style="font-weight:700;margin-bottom:8px">🧠 Posibles coincidencias</p>
            <div class="match" v-for="x in m" :key="x.r.id" @click="openAlert(x.r.id)" style="margin-bottom:6px">
              <div class="thumb" style="--c:#fff"><pet-media :item="x.r" /></div>
              <div style="flex:1;font-size:.88rem"><b>{{ x.score }}% match</b> · {{ x.r.name }}<br><span class="muted">{{ TYPES[x.r.type].label }} a {{ x.d.toFixed(1) }} km · {{ timeAgo(x.r.date) }}</span></div>
            </div>
          </div>
          <div class="flex">
            <a v-if="r.type!=='reunido'" :href="waLink(r)" target="_blank" rel="noopener" class="btn btn--orange btn--sm">💬 WhatsApp</a>
            <a :href="'#/mapa?focus='+r.id" class="btn btn--ghost btn--sm" @click="close">🗺️ Mapa</a>
            <button v-if="r.type!=='reunido' && canEdit(r)" class="btn btn--ghost btn--sm" @click="reunite">💚 Reunido</button>
            <button v-if="r.mine" class="btn btn--ghost btn--sm" @click="remove">{{ confirmDel ? '¿Eliminar? Toca otra vez' : '🗑️' }}</button>
          </div>
          <div v-if="r.type!=='reunido'">
            <p style="font-weight:700;margin:6px 0">👀 ¿La viste? Cuéntanos</p>
            <div class="flex" style="flex-wrap:nowrap"><input class="input" v-model="comment" placeholder="Ej. La vi en el 3er anillo hace 10 min" @keyup.enter="send"><button class="btn btn--sm" @click="send">Enviar</button></div>
            <div v-for="(c,i) in r.comments" :key="i" style="margin-top:8px;font-size:.88rem;padding:10px 12px;border-radius:14px;background:var(--cream)">{{ c.text }} <small class="muted">· {{ timeAgo(c.date) }}</small></div>
          </div>
        </div>
      </div>
    </div>`,
});

app.directive('auto', vAuto);
app.directive('tilt', vTilt);
app.directive('magnet', vMagnet);
app.mount('#app');
