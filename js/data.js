/* HUELLAS — datos semilla y store persistente (localStorage) */
window.HUELLAS = (() => {
  const CENTER = [-17.7834, -63.1821]; // Plaza 24 de Septiembre

  const ZONES = {
    'Centro': [-17.7834, -63.1821], 'Equipetrol': [-17.7630, -63.1960], 'Urbarí': [-17.7950, -63.1950],
    'Plan 3000': [-17.8270, -63.1280], 'Villa 1ro de Mayo': [-17.7570, -63.1300], 'Los Lotes': [-17.8390, -63.1660],
    'Hamacas': [-17.7550, -63.1720], 'Sirari': [-17.7700, -63.1930], 'Las Palmas': [-17.7960, -63.2050],
    'Pampa de la Isla': [-17.7720, -63.1180], 'Urubó': [-17.7560, -63.2380], 'Mutualista': [-17.7650, -63.1600],
    'Banzer 4to anillo': [-17.7400, -63.1780], 'Parque Urbano': [-17.7880, -63.1770], 'Doble Vía La Guardia': [-17.8200, -63.2000],
  };

  const TYPES = {
    perdido: { label: 'Perdido', color: '#FF4D4D', icon: '🚨', verb: 'se perdió en' },
    visto: { label: 'Avistado', color: '#FFB020', icon: '👀', verb: 'fue visto en' },
    encontrado: { label: 'Rescatado', color: '#7B61FF', icon: '🏠', verb: 'está resguardado en' },
    reunido: { label: 'Reunido', color: '#1DBF73', icon: '💚', verb: 'volvió a casa en' },
  };
  const SPECIES = { perro: '🐶', gato: '🐱', ave: '🦜', conejo: '🐰', otro: '🐾' };

  const ago = h => Date.now() - h * 3600e3;
  const jitter = ([a, b], k = 0.006) => [a + (Math.random() - .5) * k, b + (Math.random() - .5) * k];

  const seedReports = () => [
    { type: 'perdido', species: 'perro', name: 'Toby', breed: 'Jack Russell', color: 'Blanco y café', zone: 'Equipetrol', h: 5, petId: 'p6', reward: 'Bs 500', desc: 'Collar rojo con placa. Se asustó con los cohetes y salió por el portón. Es muy amigable.', likes: 48 },
    { type: 'visto', species: 'perro', name: 'Jack Russell sin collar', breed: 'Jack Russell', color: 'Blanco y café', zone: 'Sirari', h: 2, desc: 'Lo vi caminando por la avenida San Martín, parecía desorientado. Iba hacia el 3er anillo.', likes: 12 },
    { type: 'perdido', species: 'gato', name: 'Mishi', breed: 'Mestizo', color: 'Blanco y gris', zone: 'Urbarí', h: 20, desc: 'Gata esterilizada, muy tímida. Tiene una mancha gris en la cola.', likes: 31, video: 'media/v1.mp4' },
    { type: 'encontrado', species: 'perro', name: 'Cachorro café', breed: 'Mestizo', color: 'Café', zone: 'Plan 3000', h: 9, desc: 'Lo tengo resguardado en casa, está bien alimentado. Busco a su familia.', likes: 64 },
    { type: 'reunido', species: 'gato', name: 'Nube', breed: 'Siamés', color: 'Crema', zone: 'Las Palmas', h: 50, desc: '¡Gracias a una vecina que la vio en el mapa, Nube ya está en casa! 💚', likes: 210, video: 'media/v4.mp4' },
    { type: 'perdido', species: 'perro', name: 'Rocky', breed: 'Pastor alemán', color: 'Negro y fuego', zone: 'Banzer 4to anillo', h: 30, reward: 'Bs 1000', desc: 'Tiene chip. Responde a su nombre. Necesita medicación diaria.', likes: 89 },
    { type: 'visto', species: 'gato', name: 'Gato atigrado', breed: 'Mestizo', color: 'Atigrado', zone: 'Hamacas', h: 7, desc: 'Está en el techo de una tienda en la calle 2, maúlla mucho.', likes: 9 },
    { type: 'perdido', species: 'ave', name: 'Paco', breed: 'Loro hablador', color: 'Verde', zone: 'Centro', h: 12, desc: 'Dice "hola Paco" y silba. Se escapó cerca de la plaza.', likes: 57 },
    { type: 'encontrado', species: 'perro', name: 'Golden con pañuelo', breed: 'Golden retriever', color: 'Dorado', zone: 'Urubó', h: 16, desc: 'Apareció en el condominio con pañuelo azul. Muy cariñoso.', likes: 41 },
    { type: 'perdido', species: 'gato', name: 'Tigre', breed: 'Mestizo', color: 'Naranja y blanco', zone: 'Mutualista', h: 3, desc: 'Gato naranja con pecho blanco. Último avistamiento en el mercado.', likes: 22, video: 'media/v3.mp4' },
    { type: 'reunido', species: 'perro', name: 'Lola', breed: 'Poodle', color: 'Blanco', zone: 'Villa 1ro de Mayo', h: 72, desc: 'Volvió a casa en menos de 24h. ¡Gracias comunidad HUELLAS!', likes: 180 },
    { type: 'visto', species: 'perro', name: 'Perrito negro', breed: 'Mestizo', color: 'Negro', zone: 'Pampa de la Isla', h: 1, desc: 'Corriendo por la doble vía, cojea de la pata trasera.', likes: 6 },
  ].map((r, i) => {
    const [lat, lng] = jitter(ZONES[r.zone]);
    return { id: 'r' + (i + 1), lat, lng, date: ago(r.h), contact: '5917000000' + (i % 10), comments: [], liked: false, photo: PHOTOS[r.name] || null, ...r };
  });

  // Fotos de Pixabay (licencia libre, sin atribución obligatoria) guardadas en media/pets
  const P = 'media/pets/';
  const PHOTOS = {
    'Toby': P + 'toby.jpg', 'Rocky': P + 'rocky.jpg', 'Lola': P + 'lola.jpg', 'Golden con pañuelo': P + 'golden.jpg',
    'Cachorro café': P + 'cachorro.jpg', 'Perrito negro': P + 'negrito.jpg', 'Gato atigrado': P + 'atigrado.jpg',
  };

  const seedPets = () => [
    { id: 'p1', name: 'Canela', species: 'gato', breed: 'Mestiza', age: '2 años', owner: 'Valeria R.', zone: 'Equipetrol', video: 'media/v0.mp4', bio: 'Reina del sofá, experta en siestas y en pedir comida a las 6 a.m.', traits: ['Dormilona', 'Glotona', 'Con chip'], followers: 1240, accent: '#FF6B35' },
    { id: 'p2', name: 'Mishi', species: 'gato', breed: 'Mestizo', age: '1 año', owner: 'Diego A.', zone: 'Urbarí', video: 'media/v1.mp4', bio: 'Tímido pero curioso. Ahora mismo está perdido, ¡ayúdanos a encontrarlo!', traits: ['Tímido', 'Esterilizado'], followers: 860, accent: '#7B61FF', lost: true },
    { id: 'p3', name: 'Luna', species: 'gato', breed: 'Bicolor', age: '4 años', owner: 'Camila S.', zone: 'Sirari', video: 'media/v2.mp4', bio: 'Patas blancas, corazón enorme. Aprendió a abrir la puerta del refri.', traits: ['Inteligente', 'Vacunada'], followers: 2310, accent: '#1DBF73' },
    { id: 'p4', name: 'Nube', species: 'gato', breed: 'Siamés', age: '3 años', owner: 'Andrés M.', zone: 'Las Palmas', video: 'media/v4.mp4', bio: 'Se perdió 2 días y volvió gracias a HUELLAS. Hoy es la embajadora del barrio.', traits: ['Reunida 💚', 'Con chip'], followers: 5120, accent: '#FFB020' },
    { id: 'p5', name: 'Tigre', species: 'gato', breed: 'Naranja', age: '5 años', owner: 'Familia Rojas', zone: 'Mutualista', video: 'media/v3.mp4', bio: 'Comelón profesional. Patrulla el mercado como si fuera el dueño.', traits: ['Callejero', 'Sociable'], followers: 970, accent: '#FF4D4D' },
    { id: 'p6', name: 'Toby', species: 'perro', breed: 'Jack Russell', age: '6 años', owner: 'Jorge P.', zone: 'Equipetrol', photo: P + 'toby.jpg', bio: 'Olfato de detective. Le teme a los cohetes de fin de año.', traits: ['Juguetón', 'Collar rojo'], followers: 640, accent: '#FFB020', lost: true },
    { id: 'p7', name: 'Coco', species: 'perro', breed: 'Dálmata', age: '3 años', owner: 'Lucía V.', zone: 'Urbarí', photo: P + 'coco.jpg', bio: 'Tiene 101 manchas (las contamos). Le encanta mirar la calle desde el balcón.', traits: ['Curiosa', 'Vacunada', 'Con chip'], followers: 3020, accent: '#1B1A2E' },
    { id: 'p8', name: 'Max', species: 'perro', breed: 'Yorkshire terrier', age: '4 años', owner: 'Paola G.', zone: 'Sirari', photo: P + 'max.jpg', bio: 'Pequeño en tamaño, gigante en actitud. Guardián oficial del condominio.', traits: ['Valiente', 'Peluquería al día'], followers: 1580, accent: '#FFB020' },
    { id: 'p9', name: 'Bruno', species: 'perro', breed: 'Pug', age: '5 años', owner: 'Rodrigo C.', zone: 'Centro', photo: P + 'bruno.jpg', bio: 'Ronca más fuerte que su dueño. Fan número uno del pollo broaster.', traits: ['Dormilón', 'Glotón'], followers: 2740, accent: '#FF6B35' },
    { id: 'p10', name: 'Kira', species: 'perro', breed: 'Border collie', age: '2 años', owner: 'Sofía M.', zone: 'Urubó', photo: P + 'kira.jpg', bio: 'La más rápida del parque. Atrapa frisbees y corazones.', traits: ['Atlética', 'Obediente', 'Con chip'], followers: 4210, accent: '#7B61FF' },
    { id: 'p11', name: 'Simón', species: 'conejo', breed: 'Holandés enano', age: '1 año', owner: 'Mateo F.', zone: 'Las Palmas', photo: P + 'simon.jpg', bio: 'Come zanahorias, salta de felicidad y muerde cables si no lo vigilas.', traits: ['Saltarín', 'Tierno'], followers: 990, accent: '#1DBF73' },
    { id: 'p12', name: 'Nala', species: 'gato', breed: 'Gata negra', age: '3 años', owner: 'Fernanda L.', zone: 'Hamacas', photo: P + 'nala.jpg', bio: 'Trae buena suerte, digan lo que digan. Ojos color miel.', traits: ['Misteriosa', 'Esterilizada'], followers: 1870, accent: '#1B1A2E' },
    { id: 'p13', name: 'Lucas', species: 'perro', breed: 'Mestizo', age: '2 años', owner: 'Familia Suárez', zone: 'Plan 3000', photo: P + 'lucas.jpg', bio: 'Rescatado de la calle gracias a HUELLAS. Hoy es el payaso de la casa.', traits: ['Adoptado 💚', 'Sociable'], followers: 3560, accent: '#FF4D4D' },
  ];

  // Versión liviana de un solo archivo (huellas-movil.html): los medios van incrustados en
  // window.HUELLAS_MEDIA y los dos videos grandes se reemplazan por fotos.
  const LITE = !!window.HUELLAS_LITE;
  const LITE_SWAP = { 'media/v0.mp4': 'media/img2.avif', 'media/v3.mp4': 'media/pets/atigrado.jpg' };
  const M = p => (p && window.HUELLAS_MEDIA && window.HUELLAS_MEDIA[p]) || p;
  const lite = list => {
    if (LITE) list.forEach(x => { if (LITE_SWAP[x.video]) { x.photo = LITE_SWAP[x.video]; x.video = null; } });
    return list;
  };

  const KEY = LITE ? 'huellas:movil1' : 'huellas:v2'; // v2: fotos reales; invalida los datos guardados de la versión anterior
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}

  const state = Vue.reactive(saved && saved.reports ? saved : {
    reports: lite(seedReports()), pets: lite(seedPets()), user: { name: '', zone: '' },
  });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('No se pudo guardar', e); } };
  Vue.watch(state, save, { deep: true });

  const reset = () => { Object.assign(state, { reports: lite(seedReports()), pets: lite(seedPets()) }); };

  // Distancia en km (haversine)
  const km = (a, b) => {
    const R = 6371, r = x => x * Math.PI / 180;
    const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  // Coincidencias: misma especie, tipo opuesto (perdido ↔ visto/encontrado), < 5 km
  const matches = rep => state.reports
    .filter(o => o.id !== rep.id && o.species === rep.species && o.type !== 'reunido' &&
      ((rep.type === 'perdido') !== (o.type === 'perdido')))
    .map(o => {
      const d = km(rep, o);
      const colorHit = rep.color && o.color && rep.color.toLowerCase().split(/\s+/)[0] === o.color.toLowerCase().split(/\s+/)[0];
      const breedHit = rep.breed && o.breed && rep.breed.toLowerCase() === o.breed.toLowerCase();
      return { r: o, d, score: Math.round(Math.max(0, 60 - d * 10) + (colorHit ? 25 : 0) + (breedHit ? 15 : 0)) };
    })
    .filter(m => m.d < 5 && m.score >= 40)
    .sort((a, b) => b.score - a.score);

  const timeAgo = t => {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 60) return `hace ${Math.max(1, m)} min`;
    const h = Math.round(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    return `hace ${d} día${d > 1 ? 's' : ''}`;
  };

  return { CENTER, ZONES, TYPES, SPECIES, state, reset, km, matches, timeAgo, M, LITE };
})();
