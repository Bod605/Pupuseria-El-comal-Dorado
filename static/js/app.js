(() => {
'use strict';

/* ============================== Utilidades ============================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => '$' + Number(n).toFixed(2);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let DATA = null, BY_ID = {}, tipo = 'aqui', pollTimer = null, filtro = 'todas';
let cart = {};
try { cart = JSON.parse(localStorage.getItem('pup_cart') || '{}'); } catch { cart = {}; }

/* ============================== Ilustraciones (SVG) ============================== */
let uid = 0;
const SPOTS = [[60,88,7],[112,78,6],[88,118,8],[132,110,5],[70,112,4],[104,96,5]];
const SHADOW = '<ellipse cx="100" cy="164" rx="84" ry="10" fill="rgba(0,0,0,.28)"/>';
const svg = (inner, vb = '0 0 200 180', label = '') =>
  `<svg class="art" viewBox="${vb}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

const ART = {
  pupusa(c = '#c0462f') {
    const i = ++uid;
    return svg(`<defs><radialGradient id="pg${i}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#fde39a"/><stop offset=".65" stop-color="#e8ac45"/><stop offset="1" stop-color="#b6702a"/></radialGradient></defs>
${SHADOW}
<ellipse cx="100" cy="112" rx="88" ry="54" fill="#9a5c20"/>
<ellipse cx="100" cy="100" rx="88" ry="54" fill="url(#pg${i})"/>
${SPOTS.map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r * 1.6}" ry="${r}" fill="#9a5314" opacity=".55"/>`).join('')}
<path d="M150 70c18 2 30 14 24 28-5 11-18 12-26 6 8-6 6-14 2-34z" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
<path d="M164 100c2 12 0 20-5 26-3-8-2-16 5-26z" fill="${c}"/>
<ellipse cx="62" cy="80" rx="22" ry="8" fill="#fff" opacity=".25" transform="rotate(-18 62 80)"/>`, '0 0 200 180', 'Pupusa');
  },
  curtido() {
    const cols = ['#9ccc65', '#c5e1a5', '#7cb342', '#ffb74d', '#e8412c', '#dcedc8'];
    let s = '';
    for (let k = 0; k < 52; k++) {
      const x = 40 + (k * 37) % 120, y = 66 + (k * 53) % 34;
      const d = 14 + (k * 7) % 22, a = (k * 41) % 120 - 60;
      s += `<path d="M${x} ${y} q ${d / 2} ${-8 - k % 9} ${d} ${(k % 5) - 2}" stroke="${cols[k % cols.length]}" stroke-width="${3 + k % 3}" fill="none" stroke-linecap="round" transform="rotate(${a} ${x} ${y})"/>`;
    }
    return svg(`${SHADOW}
<path d="M22 92h156c0 46-32 70-78 70S22 138 22 92z" fill="#b5532a"/>
<path d="M22 92h156c0 8-1 15-3 22H25c-2-7-3-14-3-22z" fill="#c9653a"/>
${s}
<path d="M30 124h140" stroke="#f6e3b4" stroke-width="5" stroke-dasharray="10 8" stroke-linecap="round" opacity=".8"/>`, '0 0 200 180', 'Curtido');
  },
  salsa() {
    return svg(`${SHADOW}
<path d="M22 92h156c0 46-32 70-78 70S22 138 22 92z" fill="#2a5db0"/>
<ellipse cx="100" cy="92" rx="78" ry="18" fill="#1d4584"/>
<ellipse cx="100" cy="92" rx="66" ry="12" fill="#e8412c"/>
<ellipse cx="100" cy="89" rx="52" ry="7" fill="#ff6a4a"/>
${[[70,92],[96,95],[126,91],[110,88],[84,89]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#8f2417"/>`).join('')}
<path d="M30 124h140" stroke="#f6e3b4" stroke-width="5" stroke-dasharray="10 8" stroke-linecap="round" opacity=".8"/>
<path d="M150 70l24-36" stroke="#d9c8a0" stroke-width="7" stroke-linecap="round"/><ellipse cx="148" cy="74" rx="11" ry="7" fill="#d9c8a0" transform="rotate(-50 148 74)"/>`, '0 0 200 180', 'Salsa roja');
  },
  horchata(c = '#f2dfb8') {
    return svg(`${SHADOW}
<path d="M58 34h84l-9 120a10 10 0 0 1-10 9H77a10 10 0 0 1-10-9z" fill="rgba(255,255,255,.4)" stroke="#fff6df" stroke-width="3"/>
<path d="M63 66h74l-5 86a7 7 0 0 1-7 6H75a7 7 0 0 1-7-6z" fill="${c}"/>
<path d="M63 66q18 -9 37 0t37 0" fill="rgba(255,255,255,.35)"/>
${[[84,96],[108,112],[94,134],[118,92],[100,78]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#8a5a2b" opacity=".6"/>`).join('')}
<path d="M112 14L132 76" stroke="#e8412c" stroke-width="7" stroke-linecap="round"/>
<path d="M76 40h14" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`, '0 0 200 180', 'Bebida');
  },
  comal() {
    return svg(`<ellipse cx="100" cy="150" rx="92" ry="14" fill="rgba(0,0,0,.3)"/>
<ellipse cx="100" cy="100" rx="92" ry="58" fill="#0b0907"/>
<ellipse cx="100" cy="94" rx="86" ry="52" fill="#2a221c"/>
<ellipse cx="100" cy="90" rx="74" ry="42" fill="#1a1410"/>
${[[62,82],[128,76],[96,106]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="28" ry="17" fill="#e5a843"/><ellipse cx="${x - 5}" cy="${y - 3}" rx="10" ry="5" fill="#9a5314" opacity=".6"/><ellipse cx="${x + 8}" cy="${y + 4}" rx="6" ry="3" fill="#9a5314" opacity=".6"/>`).join('')}
<path d="M70 52c-8-14 8-18 0-32M104 46c-8-14 8-18 0-32M138 52c-8-14 8-18 0-32" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>`, '0 0 200 180', 'Comal con pupusas');
  },
  chile() {
    return svg(`<path d="M52 60c40-14 92 4 106 56 6 24-10 46-34 32-28-16-22-52-72-48-14 1-18-34 0-40z" fill="#e8412c" stroke="#8f2417" stroke-width="4" stroke-linejoin="round"/>
<path d="M48 50c-6-20 10-30 24-26l-4 16z" fill="#4f9d2d" stroke="#2e6b17" stroke-width="3"/>
<path d="M78 66c24-4 48 4 58 26" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".4"/>`, '0 0 180 160', 'Chile');
  },
  maiz() {
    let g = '';
    for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) g += `<rect x="${72 + c * 14}" y="${24 + r * 18}" width="11" height="14" rx="4" fill="${(r + c) % 3 ? '#ffc83d' : '#ffdc6d'}"/>`;
    return svg(`<path d="M100 20c-40 24-60 70-50 134 24-8 40-34 50-60z" fill="#7cb342" stroke="#4a7a1f" stroke-width="3"/>
<path d="M104 20c40 24 60 70 50 134-24-8-40-34-50-60z" fill="#8bc34a" stroke="#4a7a1f" stroke-width="3"/>
<rect x="66" y="16" width="68" height="136" rx="30" fill="#e0a82a"/>${g}`, '0 0 200 170', 'Elote');
  },
  logo() {
    return svg(`<circle cx="50" cy="50" r="48" fill="#ffc83d" stroke="#2a1d12" stroke-width="4"/><ellipse cx="50" cy="54" rx="34" ry="24" fill="#9a5c20"/><ellipse cx="50" cy="48" rx="34" ry="24" fill="#e8ac45"/><circle cx="38" cy="44" r="4" fill="#9a5314" opacity=".7"/><circle cx="60" cy="52" r="5" fill="#9a5314" opacity=".7"/><path d="M70 38c8 2 12 8 8 14-4 5-10 4-12 0 4-3 4-8 4-14z" fill="#e8412c"/>`, '0 0 100 100', 'Logo');
  },
  masa() {
    return svg(`${SHADOW}<ellipse cx="100" cy="112" rx="64" ry="38" fill="#e2c88a"/><ellipse cx="100" cy="100" rx="64" ry="38" fill="#f6e3b4"/><ellipse cx="80" cy="88" rx="26" ry="9" fill="#fff" opacity=".5"/><path d="M40 132c-14 6-22 16-14 26M160 132c14 6 22 16 14 26" stroke="#e5a843" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`, '0 0 200 180', 'Masa');
  },
  relleno() {
    return svg(`${SHADOW}<ellipse cx="100" cy="112" rx="70" ry="40" fill="#e2c88a"/><ellipse cx="100" cy="100" rx="70" ry="40" fill="#f6e3b4"/><ellipse cx="100" cy="98" rx="30" ry="16" fill="#f6d767"/><ellipse cx="88" cy="94" rx="10" ry="5" fill="#c46a3b"/><ellipse cx="112" cy="102" rx="9" ry="5" fill="#7a4a30"/><ellipse cx="102" cy="92" rx="7" ry="4" fill="#4f7d36"/>`, '0 0 200 180', 'Relleno');
  },
  palmeo() {
    return svg(`${SHADOW}<ellipse cx="100" cy="124" rx="70" ry="22" fill="#e2c88a"/><ellipse cx="100" cy="116" rx="70" ry="22" fill="#f6e3b4"/>
<path d="M58 70c0-18 8-30 16-30s10 12 10 24c0 0 6-22 14-22s8 20 4 30c4-12 12-18 18-14s0 24-6 38c-8 12-26 18-44 14s-12-24-12-40z" fill="#e8b88c" stroke="#a96f43" stroke-width="3" stroke-linejoin="round"/>
<path d="M148 52l12-12M156 66h16M144 40l4-14" stroke="#e8412c" stroke-width="4" stroke-linecap="round"/>`, '0 0 200 180', 'Palmeo');
  },
  local() {
    let aw = '';
    for (let k = 0; k < 10; k++) aw += `<path d="M${40 + k * 32} 96h32v12q-16 16-32 0z" fill="${k % 2 ? '#fff6df' : '#e8412c'}" stroke="#2a1d12" stroke-width="2"/>`;
    let lights = '';
    for (let k = 0; k < 14; k++) lights += `<circle cx="${34 + k * 26}" cy="${84 + Math.sin(k) * 4}" r="4" fill="${['#ffc83d', '#ff6a4a', '#8bc34a'][k % 3]}"/>`;
    return svg(`<rect width="400" height="300" fill="#1b2a4a"/>
${Array.from({ length: 22 }, (_, k) => `<circle cx="${(k * 83) % 400}" cy="${(k * 37) % 70 + 6}" r="1.6" fill="#fff" opacity=".8"/>`).join('')}
<circle cx="340" cy="38" r="20" fill="#fff6df"/><circle cx="332" cy="32" r="20" fill="#1b2a4a"/>
<rect x="30" y="64" width="340" height="190" fill="#f6e3b4" stroke="#2a1d12" stroke-width="4"/>
<rect x="30" y="30" width="340" height="40" fill="#2a1d12"/>
<text x="200" y="60" text-anchor="middle" font-family="Bowlby One,Impact,sans-serif" font-size="28" fill="#ffc83d">PUPUSERÍA</text>
<rect x="46" y="130" width="120" height="84" fill="#ffc83d" stroke="#2a1d12" stroke-width="4"/>
<path d="M106 130v84M46 172h120" stroke="#2a1d12" stroke-width="3"/>
<rect x="206" y="124" width="62" height="130" fill="#6b3f1f" stroke="#2a1d12" stroke-width="4"/><circle cx="256" cy="192" r="4" fill="#ffc83d"/>
<rect x="296" y="130" width="60" height="84" fill="#ffc83d" stroke="#2a1d12" stroke-width="4"/><path d="M326 130v84" stroke="#2a1d12" stroke-width="3"/>
<ellipse cx="86" cy="196" rx="22" ry="9" fill="#e5a843"/><ellipse cx="136" cy="196" rx="22" ry="9" fill="#e5a843"/>
${aw}${lights}
<rect x="0" y="254" width="400" height="46" fill="#3a3a44"/><rect x="0" y="254" width="400" height="6" fill="#55555f"/>`, '0 0 400 300', 'Fachada de la pupusería');
  },
};
const art = (k, c) => (ART[k] || ART.pupusa)(c);

/* ============================== Efectos ============================== */
function burst(x, y, colors = ['#ffc83d', '#e8412c', '#8bc34a', '#fff6df']) {
  if (reduce) return;
  for (let i = 0; i < 16; i++) {
    const e = document.createElement('i');
    e.className = 'confetti';
    const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
    e.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px`;
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 950);
  }
}
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}
function reveal() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.reveal:not(.in)').forEach(el => io.observe(el));
}
function countUp(el) {
  const to = +el.dataset.count, t0 = performance.now();
  const tick = t => { const p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function tilt() {
  $$('.card').forEach(c => {
    if (c._t) return; c._t = 1;
    c.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const r = c.getBoundingClientRect();
      c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 12 + 'deg');
      c.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 12 + 'deg');
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });
}

/* ============================== Menú ============================== */
function renderMenu() {
  const list = DATA.productos.filter(p => p.cat === 'pupusas' && (filtro === 'todas' || p.grupo === filtro));
  $('#menuGrid').innerHTML = list.map(p => `
    <article class="card reveal" style="--c:${p.color}">
      <div class="card-art">${art('pupusa', p.color)}<span class="badge">${money(p.precio)}</span></div>
      <div class="card-body"><h3>${esc(p.nombre)}</h3><p>${esc(p.desc)}</p>
      <button class="btn btn-fire btn-sm" type="button" data-add="${p.id}">+ Agregar</button></div>
    </article>`).join('');
  reveal(); tilt();
}

function renderMarquee() {
  const names = DATA.productos.filter(p => p.cat === 'pupusas').map(p => p.nombre.toUpperCase());
  const one = names.map(n => `<span>${esc(n)}</span><span>★</span>`).join('');
  $('#marquee').innerHTML = one + one;
}

/* ============================== Pedido ============================== */
const GRUPOS = { pupusas: 'Pupusas', bebidas: 'Bebidas', extras: 'Extras' };
function renderOrderList() {
  $('#orderList').innerHTML = Object.entries(GRUPOS).map(([cat, label]) =>
    `<h4 class="grp">${label}</h4>` + DATA.productos.filter(p => p.cat === cat).map(p => `
    <div class="row" data-row="${p.id}">
      <div class="row-art">${art(p.art, p.color)}</div>
      <div class="row-info"><b>${esc(p.nombre)}</b><small>${money(p.precio)}</small></div>
      <div class="stepper"><button type="button" data-dec="${p.id}" aria-label="Quitar uno de ${esc(p.nombre)}">−</button><output id="q-${p.id}">0</output><button type="button" data-inc="${p.id}" aria-label="Agregar uno de ${esc(p.nombre)}">+</button></div>
    </div>`).join('')).join('');
}

function totals() {
  let cents = 0, n = 0; const lines = [];
  for (const [id, q] of Object.entries(cart)) {
    const p = BY_ID[id]; if (!p || q <= 0) continue;
    cents += Math.round(p.precio * 100) * q; n += q; lines.push({ p, q });
  }
  const envio = tipo === 'domicilio' && n > 0 ? Math.round(DATA.domicilio * 100) : 0;
  return { lines, n, sub: cents / 100, envio: envio / 100, total: (cents + envio) / 100 };
}

function sync() {
  localStorage.setItem('pup_cart', JSON.stringify(cart));
  const t = totals();
  $$('.row').forEach(r => {
    const id = r.dataset.row, q = cart[id] || 0;
    $('#q-' + id).textContent = q; r.classList.toggle('has', q > 0);
  });
  $('#cartCount').textContent = t.n; $('#cartTotal').textContent = t.total.toFixed(2);
  $('#summary').innerHTML = t.n ? t.lines.map(({ p, q }) =>
      `<div class="sum-line"><span>${q} × ${esc(p.nombre)}</span><span>${money(p.precio * q)}</span></div>`).join('')
    + (t.envio ? `<div class="sum-line"><span>Domicilio</span><span>${money(t.envio)}</span></div>` : '')
    + `<div class="sum-total"><span>Total</span><span>${money(t.total)}</span></div>`
    : '<p class="empty">Tu canasta está vacía. Las pupusas no se piden solas.</p>';
}

function setQty(id, q, ev) {
  q = Math.max(0, Math.min(50, q));
  if (q) cart[id] = q; else delete cart[id];
  sync();
  if (ev && q) burst(ev.clientX, ev.clientY);
  const pill = $('#pillCart'); pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
}

function renderTipos() {
  $('#tipoSeg').innerHTML = Object.entries(DATA.tipos).map(([k, v]) =>
    `<button type="button" role="radio" aria-checked="${k === tipo}" data-tipo="${k}" class="${k === tipo ? 'on' : ''}">${esc(v)}</button>`).join('');
  $('#dirWrap').hidden = tipo !== 'domicilio';
}

async function enviar(e) {
  e.preventDefault();
  const err = $('#formError'); err.hidden = true;
  const t = totals();
  if (!t.n) { toast('Agrega al menos una pupusa'); return; }
  const f = new FormData(e.target);
  const body = {
    nombre: f.get('nombre'), telefono: f.get('telefono'), tipo,
    direccion: f.get('direccion') || '', notas: f.get('notas') || '',
    items: t.lines.map(({ p, q }) => ({ id: p.id, cantidad: q })),
  };
  const btn = $('#btnEnviar'); btn.disabled = true; btn.textContent = 'Enviando...';
  try {
    const r = await fetch('/api/pedido', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) { err.textContent = (j.errores || ['No pudimos enviar el pedido.']).join(' '); err.hidden = false; return; }
    localStorage.setItem('pup_codigo', j.pedido.codigo);
    cart = {}; sync();
    mostrarTicket(j);
    const b = $('#ticketWrap').getBoundingClientRect();
    burst(b.left + b.width / 2, b.top + 60);
    poll(j.pedido.codigo);
  } catch {
    err.textContent = 'No hay conexión con el servidor. Revisa que app.py esté corriendo.'; err.hidden = false;
  } finally { btn.disabled = false; btn.textContent = 'Enviar pedido a la cocina'; }
}

/* ---------- Ticket y seguimiento ---------- */
const PASOS = ['Recibido', 'En el comal', 'Listo', 'Entregado'];
const IDX = { nuevo: 0, preparando: 1, listo: 2, entregado: 3 };
const MENSAJE = { nuevo: 'Tu pedido llegó a la cocina', preparando: 'Tus pupusas están en el comal', listo: 'Tu pedido está listo', entregado: 'Buen provecho', cancelado: '' };
let ultimoEstado = null;

function mostrarTicket({ pedido: p, posicion }) {
  $('#checkout').hidden = true;
  const w = $('#ticketWrap'); w.hidden = false;
  const i = IDX[p.estado] ?? 0;
  const cancel = p.estado === 'cancelado';
  w.innerHTML = `
    <h3>Pedido enviado</h3>
    <div class="t-sub">Tu código de pedido</div>
    <div class="t-code">${esc(p.codigo)}</div>
    <div class="t-sub">${esc(p.nombre)} · ${esc(p.tipo_texto)}</div>
    <div class="t-lines">${p.lineas.map(l => `<div><span>${l.cantidad} × ${esc(l.nombre)}</span><span>${money(l.precio * l.cantidad)}</span></div>`).join('')}</div>
    <div class="t-total"><span>Total</span><span>${money(p.total)}</span></div>
    ${cancel ? '<div class="t-cancel">Este pedido fue cancelado. Llámanos si tienes dudas.</div>' : `
    <div class="track"><div class="track-bar"><i style="width:${(i + (i < 3 ? .5 : 1)) / 4 * 100}%"></i></div>
      <div class="track-steps">${PASOS.map((s, k) => `<span class="${k <= i ? 'on' : ''}">${s}</span>`).join('')}</div></div>
    <div class="t-state ${p.estado}">${MENSAJE[p.estado]}</div>
    ${posicion > 0 ? `<p class="t-sub" style="text-align:center">Hay ${posicion} pedido${posicion > 1 ? 's' : ''} antes del tuyo</p>` : ''}`}
    <button class="btn btn-dark btn-block" type="button" id="btnNuevo" style="margin-top:18px">Hacer otro pedido</button>`;
  if (ultimoEstado && ultimoEstado !== p.estado) {
    toast(MENSAJE[p.estado] || 'Tu pedido cambió de estado');
    if (p.estado === 'listo') { const b = w.getBoundingClientRect(); burst(b.left + b.width / 2, b.top + 80); }
  }
  ultimoEstado = p.estado;
}

function poll(codigo) {
  clearInterval(pollTimer);
  const go = async () => {
    try {
      const r = await fetch('/api/pedido/' + encodeURIComponent(codigo));
      if (r.status === 404) { limpiarPedido(); return; }
      const j = await r.json(); mostrarTicket(j);
      if (['entregado', 'cancelado'].includes(j.pedido.estado)) clearInterval(pollTimer);
    } catch { /* sin conexión: reintenta en el próximo ciclo */ }
  };
  go(); pollTimer = setInterval(go, 4000);
}
function limpiarPedido() {
  clearInterval(pollTimer); ultimoEstado = null;
  localStorage.removeItem('pup_codigo');
  $('#ticketWrap').hidden = true; $('#checkout').hidden = false;
}

/* ============================== Sorpréndeme ============================== */
let sorteado = null;
function sorpresa() {
  const m = $('#modal'), box = $('.modal-box', m);
  const lista = DATA.productos.filter(p => p.cat === 'pupusas');
  m.hidden = false; box.classList.add('spin');
  $('#mAdd').disabled = $('#mAgain').disabled = true;
  $('#mKicker').textContent = 'Girando el comal...'; $('#mDesc').textContent = '';
  const destino = lista[Math.floor(Math.random() * lista.length)];
  let i = 0, delay = 60, pasos = 0;
  const total = 16 + Math.floor(Math.random() * 6);
  const paso = () => {
    const p = pasos >= total ? destino : lista[i++ % lista.length];
    $('#mArt').innerHTML = art('pupusa', p.color); $('#mName').textContent = p.nombre;
    if (pasos++ >= total) {
      sorteado = destino; box.classList.remove('spin');
      $('#mKicker').textContent = '¡Te tocó!'; $('#mDesc').textContent = destino.desc + ' · ' + money(destino.precio);
      $('#mAdd').disabled = $('#mAgain').disabled = false;
      const r = box.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 100);
      return;
    }
    delay *= 1.1; setTimeout(paso, reduce ? 20 : delay);
  };
  paso();
}

/* ============================== Fotos reales con respaldo ilustrado ============================== */
function fotos() {
  $$('[data-foto]').forEach(f => {
    f.insertAdjacentHTML('afterbegin', `<div class="foto-art">${art(f.dataset.art)}</div>`);
    const exts = ['jpg', 'jpeg', 'png', 'webp'];
    const probar = () => {
      const ext = exts.shift(); if (!ext) return;
      const im = new Image();
      im.alt = f.dataset.alt || ''; im.loading = 'lazy';
      im.onload = () => f.prepend(im);
      im.onerror = probar;
      im.src = `img/${f.dataset.foto}.${ext}`;
    };
    probar();
  });
}

/* ============================== Arranque ============================== */
function pintarArte() {
  $$('[data-art]:not([data-foto])').forEach(el => { if (!el.firstChild) el.innerHTML = art(el.dataset.art); });
}

function listeners() {
  document.addEventListener('click', e => {
    const t = e.target.closest('button,a'); if (!t) return;
    if (t.dataset.add) { setQty(t.dataset.add, (cart[t.dataset.add] || 0) + 1, e); toast(BY_ID[t.dataset.add].nombre + ' agregada'); }
    else if (t.dataset.inc) setQty(t.dataset.inc, (cart[t.dataset.inc] || 0) + 1, e);
    else if (t.dataset.dec) setQty(t.dataset.dec, (cart[t.dataset.dec] || 0) - 1);
    else if (t.dataset.tipo) { tipo = t.dataset.tipo; renderTipos(); sync(); }
    else if (t.classList.contains('chip')) { filtro = t.dataset.f; $$('.chip').forEach(c => c.classList.toggle('on', c === t)); renderMenu(); }
    else if (t.id === 'btnNuevo') limpiarPedido();
    else if (t.id === 'btnSorpresa' || t.id === 'mAgain') sorpresa();
    else if (t.id === 'modalX') $('#modal').hidden = true;
    else if (t.id === 'mAdd' && sorteado) { setQty(sorteado.id, (cart[sorteado.id] || 0) + 1, e); $('#modal').hidden = true; toast(sorteado.nombre + ' agregada'); location.hash = '#pedido'; }
  });
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') e.target.hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#modal').hidden = true; });
  $('#orderForm').addEventListener('submit', enviar);

  addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 40), { passive: true });

  const cur = $('#cursor');
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    cur.classList.add('on'); cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
    cur.classList.toggle('big', !!e.target.closest('a,button,.card,.row'));
    if (!reduce) $$('.floaty').forEach(el => {
      const d = +el.dataset.depth;
      el.style.transform = `translate(${(e.clientX / innerWidth - .5) * d}px,${(e.clientY / innerHeight - .5) * d}px)`;
    });
  });

  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { countUp(x.target); io.unobserve(x.target); } }), { threshold: .6 });
  $$('[data-count]').forEach(el => io.observe(el));
}

async function init() {
  pintarArte(); fotos(); listeners(); reveal();
  if (location.protocol === 'file:') {
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:300;background:#e8412c;color:#fff;padding:14px 20px;text-align:center;font-weight:700';
    b.innerHTML = 'Abriste el archivo directamente. Para que funcionen el menú y los pedidos, inicia el servidor: doble clic en <u>iniciar.bat</u> (Windows) o ejecuta <u>python app.py</u> y entra a http://localhost:5000';
    document.body.appendChild(b);
  }
  try {
    DATA = await (await fetch('/api/menu')).json();
  } catch {
    $('#menuGrid').innerHTML = '<p>No se pudo cargar el menú. Inicia el servidor con <code>python app.py</code> y abre <code>http://localhost:5000</code>.</p>';
    return;
  }
  BY_ID = Object.fromEntries(DATA.productos.map(p => [p.id, p]));
  for (const id of Object.keys(cart)) if (!BY_ID[id]) delete cart[id];

  const n = DATA.negocio;
  $$('[data-negocio]').forEach(el => el.textContent = n[el.dataset.negocio] || '');
  document.title = n.nombre + ' · Pupusería';
  $('#btnMapa').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(n.direccion);
  $('#btnWsp').href = 'https://wa.me/' + n.whatsapp + '?text=' + encodeURIComponent('Hola, quiero hacer un pedido');

  renderMarquee(); renderMenu(); renderOrderList(); renderTipos(); sync();

  const codigo = localStorage.getItem('pup_codigo');
  if (codigo) poll(codigo);
}
init();
})();
