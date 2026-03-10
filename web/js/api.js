/* ════════════════════════════════════════════
   AppPortal – Shared JS (api.js)
   Java 21 HTTP Server backend on port 8080
   ════════════════════════════════════════════ */

const API = 'http://localhost:8080/api';

/* ── Auth helpers ─────────────────────────── */
const Auth = {
  save(data)  { localStorage.setItem('ap_user', JSON.stringify(data)) },
  get()       { try { return JSON.parse(localStorage.getItem('ap_user') || 'null') } catch { return null } },
  clear()     { localStorage.removeItem('ap_user') },
  required()  {
    const u = Auth.get();
    if (!u) { location.href = '/pages/login.html'; return null; }
    return u;
  },
  initials(name) {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  }
};

/* ── HTTP helpers ─────────────────────────── */
async function apiPost(endpoint, data) {
  const res  = await fetch(API + endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data)
  });
  // FIX 5: Safe JSON parse — non-JSON responses (nginx 502, proxy errors) return error object
  let json;
  try {
    json = await res.json();
  } catch {
    json = { status: 'error', message: 'Server returned an unexpected response (HTTP ' + res.status + ')' };
  }
  json._status = res.status;
  return json;
}

async function apiGet(endpoint) {
  // FIX 6: Wrap in try/catch — network failures are silently handled by callers
  try {
    const res = await fetch(API + endpoint);
    return await res.json();
  } catch {
    return {};
  }
}

/* ── Toast ────────────────────────────────── */
function toast(msg, type = 'info', duration = 3500) {
  let el = document.getElementById('_toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '_toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  const icons = { ok: '✓', err: '✕', info: '◎' };
  el.className = `toast t-${type}`;
  el.innerHTML = `<span>${icons[type] || '◎'}</span><span>${msg}</span>`;
  requestAnimationFrame(() => { el.classList.add('show') });
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}

/* ── Form utils ───────────────────────────── */
function collectForm(formId) {
  const form = document.getElementById(formId);
  if (!form) { console.warn('collectForm: form not found:', formId); return {}; }
  const data = {};
  form.querySelectorAll('[name]').forEach(el => {
    if (el.type === 'radio')    { if (el.checked) data[el.name] = el.value; }
    else if (el.type === 'file') { /* handled separately */ }
    else if (el.type === 'checkbox') { data[el.name] = el.checked; }
    else data[el.name] = (el.value || '').trim();
  });
  return data;
}

function setLoading(btn, loading) {
  if (loading) {
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML    = '<span class="spinner"></span> Processing…';
    btn.disabled     = true;
  } else {
    btn.innerHTML = btn.dataset.orig || btn.innerHTML;
    btn.disabled  = false;
  }
}

/* ── Progress steps tracker ───────────────── */
const Progress = {
  KEY: 'ap_progress',
  get()    { try { return JSON.parse(localStorage.getItem(this.KEY) || '{}') } catch { return {} } },
  mark(k)  { const p = this.get(); p[k] = true; localStorage.setItem(this.KEY, JSON.stringify(p)); },
  done(k)  { return !!this.get()[k] },
  clear()  { localStorage.removeItem(this.KEY) }
};

/* ── Navbar builder ───────────────────────── */
function buildNav(active) {
  const user = Auth.get();
  const nav  = document.getElementById('nav');
  if (!nav) return;
  nav.innerHTML = `
    <a class="nav-logo" href="/index.html"><span class="logo-dot"></span>AppPortal</a>
    <div class="nav-right">
      ${user ? `<div class="avatar" title="${user.name}">${Auth.initials(user.name)}</div>` : ''}
      ${user ? `<span style="font-size:.85rem;color:var(--txt-2)">${user.name}</span>` : ''}
      ${user
        ? `<button class="btn btn-ghost btn-sm" onclick="logout()">Sign out</button>`
        : `<a class="btn btn-secondary btn-sm" href="/pages/login.html">Sign in</a>`}
    </div>`;
}

function logout() {
  Auth.clear();
  Progress.clear();
  location.href = '/index.html';
}

/* ── Spinner CSS inject ───────────────────── */
(function() {
  const s = document.createElement('style');
  s.textContent = `
    .spinner{
      display:inline-block;width:14px;height:14px;
      border:2px solid rgba(255,255,255,.3);
      border-top-color:#fff;border-radius:50%;
      animation:spin .7s linear infinite;vertical-align:middle;
    }
    @keyframes spin{to{transform:rotate(360deg)}}
  `;
  document.head.appendChild(s);
})();
