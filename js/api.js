/* 4 PATITAS — acciones de datos. Modo local (localStorage) o en línea (Supabase + tiempo real).
   Toda la app escribe a través de HUELLAS.actions; así el mismo código sirve en ambos modos.
   Sesión: anónima por defecto; "Continuar con Google" convierte esa sesión en una cuenta
   (linkIdentity), así lo publicado antes sigue siendo tuyo. */
(() => {
  const H = window.HUELLAS, { state } = H;
  const cfg = window.HUELLAS_CONFIG || {};
  const sb = cfg.supabaseUrl && cfg.supabaseKey && window.supabase
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, flowType: 'pkce', detectSessionInUrl: true } })
    : null;

  const status = Vue.reactive({ online: false, connecting: !!sb, uid: null, user: null, authBusy: false, hasAuthor: false, googleReady: null, emailReady: null, autoconfirm: null, recovery: false });
  const notify = msg => H.onError && H.onError(msg);
  const liked = new Set(state.user.liked || []);
  const followed = new Set(state.user.followed || []);
  const remember = () => { state.user.liked = [...liked]; state.user.followed = [...followed]; };
  // La web abierta como archivo (file://, content:// de WhatsApp) no puede recibir la vuelta de Google
  const hosted = /^https?:$/.test(location.protocol);
  const redirectTo = () => location.origin + location.pathname;

  // ---------- conversión fila de la base ↔ objeto de la app ----------
  const toReport = row => H.lite([{
    id: row.id, type: row.type, species: row.species, name: row.name, breed: row.breed || '', color: row.color || '',
    zone: row.zone || '', lat: row.lat, lng: row.lng, desc: row.description || '', reward: row.reward || '',
    contact: row.contact || '', photo: row.photo, video: row.video, petId: row.pet_id, likes: row.likes,
    date: Date.parse(row.created_at), comments: [], liked: liked.has(row.id),
    ownerId: row.user_id, mine: !!status.uid && row.user_id === status.uid, author: row.author || '', avatar: row.avatar || '',
  }])[0];
  const toPet = row => H.lite([{
    id: row.id, name: row.name, species: row.species, breed: row.breed || '', age: row.age || '', owner: row.owner || '',
    zone: row.zone || '', bio: row.bio || '', traits: row.traits || [], photo: row.photo, video: row.video,
    accent: row.accent || '#EEDDB9', followers: row.followers, lost: row.lost,
    ownerId: row.user_id, mine: !!status.uid && row.user_id === status.uid, author: row.author || '', avatar: row.avatar || '',
  }])[0];
  const toComment = row => ({ id: row.id, text: row.text, date: Date.parse(row.created_at), author: row.author || '', avatar: row.avatar || '' });
  // Nombre y foto de Google para guardar junto a lo publicado (solo si la base ya tiene esas columnas)
  const byline = () => (status.hasAuthor && status.user ? { author: status.user.name, avatar: status.user.avatar || null } : {});

  const digits = c => { const d = String(c || '').replace(/\D/g, ''); return d.startsWith('591') ? d : '591' + d; };

  // Sube una foto (data URL comprimida por la app) a Storage y devuelve su URL pública
  async function uploadPhoto(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl || null;
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${status.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error } = await sb.storage.from('fotos').upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    return sb.storage.from('fotos').getPublicUrl(path).data.publicUrl;
  }

  // ---------- sesión ----------
  function setSession(session) {
    const u = session && session.user;
    status.uid = u ? u.id : null;
    if (u && !u.is_anonymous) {
      const m = u.user_metadata || {};
      status.user = { name: m.full_name || m.name || (u.email || '').split('@')[0], email: u.email || '', avatar: m.avatar_url || m.picture || '' };
      if (!state.user.name) state.user.name = status.user.name;
    } else status.user = null;
    // recalcula qué publicaciones son de esta persona
    state.reports.forEach(r => { if (r.ownerId !== undefined) r.mine = !!status.uid && r.ownerId === status.uid; });
    state.pets.forEach(p => { if (p.ownerId !== undefined) p.mine = !!status.uid && p.ownerId === status.uid; });
  }

  // Vuelta de Google: limpia ?code= / ?error= de la dirección y avisa si algo falló
  function handleReturn() {
    const q = new URLSearchParams(location.search);
    const hq = new URLSearchParams((location.hash.split('?')[1]) || '');
    const code = q.get('error_code') || hq.get('error_code');
    const desc = q.get('error_description') || hq.get('error_description');
    if (q.has('code') || code || q.has('error')) {
      try {
        history.replaceState(null, '', location.pathname + (location.hash.startsWith('#/') ? location.hash.split('?')[0] : '#/cuenta'));
        dispatchEvent(new HashChangeEvent('hashchange')); // el router muestra "Mi cuenta"
      } catch (e) {}
    }
    if (code === 'identity_already_exists') {
      // esa cuenta de Google ya existe: entra directamente con ella
      sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } });
      return true;
    }
    if (code || desc) notify('No se pudo iniciar sesión: ' + (desc || code).replace(/\+/g, ' '));
    return false;
  }

  async function loginGoogle() {
    if (!sb || !status.online) return notify('El inicio de sesión necesita conexión a internet');
    if (!hosted) { location.href = (cfg.siteUrl || '') + '#/cuenta'; return; }
    if (status.googleReady === false) return notify('El inicio con Google todavía no está activado en 4 Patitas');
    status.authBusy = true;
    const { data: { session } } = await sb.auth.getSession();
    const opts = { provider: 'google', options: { redirectTo: redirectTo() } };
    // con una sesión anónima se vincula Google a ella para conservar lo publicado
    const res = session && session.user.is_anonymous && sb.auth.linkIdentity
      ? await sb.auth.linkIdentity(opts)
      : await sb.auth.signInWithOAuth(opts);
    if (res.error) {
      // p. ej. vinculación manual desactivada: entrar normalmente con Google
      const again = await sb.auth.signInWithOAuth(opts);
      if (again.error) { status.authBusy = false; notify('No se pudo abrir Google: ' + again.error.message); }
    }
  }

  // ---------- correo y contraseña ----------
  const ES = [
    [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
    [/already (been )?registered|already exists|email_exists/i, 'Ese correo ya tiene cuenta. Entra con tu contraseña.'],
    [/at least 6|weak_password|password should/i, 'La contraseña debe tener al menos 6 caracteres.'],
    [/not confirmed/i, 'Confirma tu correo con el enlace que te enviamos y vuelve a intentar.'],
    [/rate limit|too many|over_email_send/i, 'Demasiados intentos. Espera unos minutos y prueba de nuevo.'],
    [/invalid.*email|unable to validate email/i, 'Ese correo no parece válido.'],
    [/signups? not allowed|signup.*disabled/i, 'El registro con correo está desactivado en 4 Patitas.'],
    [/fetch|network/i, 'Sin conexión. Revisa tu internet.'],
  ];
  const es = e => { const m = (e && (e.code || '') + ' ' + (e.message || '')) || ''; const hit = ES.find(([rx]) => rx.test(m)); return hit ? hit[1] : (e && e.message) || 'Algo salió mal. Inténtalo de nuevo.'; };
  const ready = () => { if (!sb || !status.online) throw new Error('Sin conexión. Revisa tu internet.'); };

  // Crear cuenta: si hay sesión anónima, se le agrega correo y contraseña (lo publicado sigue siendo tuyo)
  async function signUp({ name, email, password }) {
    ready(); status.authBusy = true;
    try {
      const data = { full_name: name.trim() };
      const { data: { session } } = await sb.auth.getSession();
      let res;
      if (session && session.user.is_anonymous) {
        res = await sb.auth.updateUser({ email: email.trim(), password, data });
        if (res.error) throw res.error;
        // con "Confirm email" activado, el correo queda pendiente hasta que se confirme
        if (res.data.user && res.data.user.is_anonymous) return { pending: true };
      } else {
        res = await sb.auth.signUp({ email: email.trim(), password, options: { data, emailRedirectTo: cfg.siteUrl || redirectTo() } });
        if (res.error) throw res.error;
        if (!res.data.session) return { pending: true };
      }
      const s = (await sb.auth.getSession()).data.session;
      setSession(s);
      return { ok: true };
    } catch (e) { throw new Error(es(e)); }
    finally { status.authBusy = false; }
  }

  async function signIn({ email, password }) {
    ready(); status.authBusy = true;
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setSession(data.session);
      return { ok: true };
    } catch (e) { throw new Error(es(e)); }
    finally { status.authBusy = false; }
  }

  async function resetPassword(email) {
    ready(); status.authBusy = true;
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: cfg.siteUrl || redirectTo() });
      if (error) throw error;
      return { ok: true };
    } catch (e) { throw new Error(es(e)); }
    finally { status.authBusy = false; }
  }

  async function setNewPassword(password) {
    ready(); status.authBusy = true;
    try {
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      status.recovery = false;
      return { ok: true };
    } catch (e) { throw new Error(es(e)); }
    finally { status.authBusy = false; }
  }

  async function logout() {
    if (!sb) return;
    status.authBusy = true;
    await sb.auth.signOut();
    const res = await sb.auth.signInAnonymously();
    setSession(res.data && res.data.session);
    status.authBusy = false;
    notify('Cerraste sesión');
  }

  // ---------- carga inicial + tiempo real ----------
  async function connect() {
    try {
      // getSession espera a que supabase-js canjee el ?code= de Google; recién después se limpia la dirección
      let { data: { session } } = await sb.auth.getSession();
      if (handleReturn()) return;
      if (!session) {
        const res = await sb.auth.signInAnonymously();
        if (res.error) throw res.error;
        session = res.data.session;
      }
      setSession(session);
      // ¿Está activado el proveedor Google en Supabase? (Authentication → Sign In / Providers)
      fetch(cfg.supabaseUrl + '/auth/v1/settings', { headers: { apikey: cfg.supabaseKey } })
        .then(r => r.json()).then(s => {
          status.googleReady = !!(s.external && s.external.google);
          status.emailReady = !(s.external && s.external.email === false) && !s.disable_signup;
          status.autoconfirm = !!s.mailer_autoconfirm; // true = "Confirm email" desactivado
        })
        .catch(() => { status.googleReady = false; });
      sb.auth.onAuthStateChange((event, s) => {
        if (s) setSession(s);
        if (event === 'PASSWORD_RECOVERY') { status.recovery = true; location.hash = '#/cuenta'; }
        if (event === 'SIGNED_IN' && s && !s.user.is_anonymous && status.user) notify('👋 ¡Hola, ' + status.user.name + '!');
      });

      const [reports, pets, comments] = await Promise.all([
        sb.from('reports').select('*').order('created_at', { ascending: false }).limit(500),
        sb.from('pets').select('*').order('created_at', { ascending: true }).limit(500),
        sb.from('comments').select('*').order('created_at', { ascending: true }).limit(3000),
      ]);
      const err = reports.error || pets.error || comments.error;
      if (err) throw err;
      status.hasAuthor = !!(reports.data[0] && 'author' in reports.data[0]);

      const list = reports.data.map(toReport);
      const byId = Object.fromEntries(list.map(r => [r.id, r]));
      comments.data.forEach(c => byId[c.report_id] && byId[c.report_id].comments.push(toComment(c)));
      state.reports = list;
      state.pets = pets.data.map(toPet);
      status.online = true;
      subscribe();
    } catch (e) {
      console.warn('4 Patitas sin conexión a la base de datos:', e);
      notify('Sin conexión con la comunidad: mostrando datos guardados en este equipo');
    } finally {
      status.connecting = false;
      status.authBusy = false;
    }
  }

  function subscribe() {
    sb.channel('huellas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, ({ eventType, new: row, old }) => {
        const i = state.reports.findIndex(r => r.id === (row && row.id) || r.id === (old && old.id));
        if (eventType === 'DELETE') { if (i > -1) state.reports.splice(i, 1); return; }
        const r = toReport(row);
        if (i > -1) Object.assign(state.reports[i], { ...r, comments: state.reports[i].comments, liked: state.reports[i].liked });
        else state.reports.unshift(r);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pets' }, ({ eventType, new: row, old }) => {
        const i = state.pets.findIndex(p => p.id === (row && row.id) || p.id === (old && old.id));
        if (eventType === 'DELETE') { if (i > -1) state.pets.splice(i, 1); return; }
        if (i > -1) Object.assign(state.pets[i], toPet(row)); else state.pets.unshift(toPet(row));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, ({ new: row }) => {
        const r = state.reports.find(x => x.id === row.report_id);
        if (r && !r.comments.some(c => c.id === row.id)) r.comments.push(toComment(row));
      })
      .subscribe();
  }

  // ---------- acciones ----------
  const local = {
    async addReport(form) {
      const id = 'r' + Date.now();
      state.reports.unshift({ ...form, id, contact: digits(form.contact), date: Date.now(), likes: 0, liked: false, comments: [], mine: true });
      if (form.petId) { const p = state.pets.find(x => x.id === form.petId); if (p) p.lost = true; }
      return id;
    },
    async addPet(form) {
      const id = 'p' + Date.now();
      state.pets.unshift({ ...form, id, followers: 0, mine: true });
      return id;
    },
    async toggleLike(r) { r.liked = !r.liked; r.likes += r.liked ? 1 : -1; r.liked ? liked.add(r.id) : liked.delete(r.id); remember(); },
    async toggleFollow(p) { const on = !followed.has(p.id); on ? followed.add(p.id) : followed.delete(p.id); p.followers += on ? 1 : -1; remember(); return on; },
    async addComment(r, text) { r.comments.push({ id: Date.now(), text, date: Date.now(), author: state.user.name || '' }); },
    async setReportType(r, type) { r.type = type; },
    async setPetLost(p, lost) { p.lost = lost; },
    async removeReport(id) { const i = state.reports.findIndex(x => x.id === id); if (i > -1) state.reports.splice(i, 1); },
  };

  const remote = {
    async addReport(form) {
      const photo = await uploadPhoto(form.photo);
      const { data, error } = await sb.from('reports').insert({
        type: form.type, species: form.species, name: form.name.trim(), breed: form.breed, color: form.color, zone: form.zone,
        lat: form.lat, lng: form.lng, description: form.desc, reward: form.type === 'perdido' ? form.reward : null,
        contact: digits(form.contact), photo, video: form.video || null, pet_id: form.petId || null, ...byline(),
      }).select().single();
      if (error) throw error;
      if (!state.reports.some(r => r.id === data.id)) state.reports.unshift(toReport(data));
      if (form.petId) { const p = state.pets.find(x => x.id === form.petId); if (p && p.mine) await remote.setPetLost(p, true); }
      return data.id;
    },
    async addPet(form) {
      const photo = await uploadPhoto(form.photo);
      const { data, error } = await sb.from('pets').insert({
        name: form.name.trim(), species: form.species, breed: form.breed, age: form.age, owner: form.owner, zone: form.zone,
        bio: form.bio, traits: form.traits, photo, accent: form.accent, ...byline(),
      }).select().single();
      if (error) throw error;
      if (!state.pets.some(p => p.id === data.id)) state.pets.unshift(toPet(data));
      return data.id;
    },
    async toggleLike(r) {
      await local.toggleLike(r);
      const { data, error } = await sb.rpc('like_report', { rid: r.id, delta: r.liked ? 1 : -1 });
      if (!error && typeof data === 'number') r.likes = data;
    },
    async toggleFollow(p) {
      const on = await local.toggleFollow(p);
      const { data, error } = await sb.rpc('follow_pet', { pid: p.id, delta: on ? 1 : -1 });
      if (!error && typeof data === 'number') p.followers = data;
      return on;
    },
    async addComment(r, text) {
      const { data, error } = await sb.from('comments').insert({ report_id: r.id, text, ...byline() }).select().single();
      if (error) throw error;
      if (!r.comments.some(c => c.id === data.id)) r.comments.push(toComment(data));
    },
    async setReportType(r, type) {
      const { error } = await sb.from('reports').update({ type }).eq('id', r.id);
      if (error) throw error;
      r.type = type;
    },
    async setPetLost(p, lost) {
      const { error } = await sb.from('pets').update({ lost }).eq('id', p.id);
      if (error) throw error;
      p.lost = lost;
    },
    async removeReport(id) {
      const { error } = await sb.from('reports').delete().eq('id', id);
      if (error) throw error;
      await local.removeReport(id);
    },
  };

  // En línea solo si la conexión funcionó; si no, todo sigue en modo local
  const actions = Object.fromEntries(Object.keys(local).map(k => [k, (...a) => (status.online ? remote : local)[k](...a)]));
  // ¿Puede esta persona editar la alerta/mascota? En local: siempre. En línea: solo si es suya.
  const canEdit = item => !status.online || !!item.mine;
  const auth = {
    signUp, signIn, resetPassword, setNewPassword, logout,
    login: loginGoogle, google: !!(sb && cfg.googleLogin),
    enabled: !!sb, hosted, siteUrl: cfg.siteUrl || '',
  };

  Object.assign(H, { actions, status, canEdit, auth });
  if (sb) connect();
})();
