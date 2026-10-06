(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '$' + Number(n).toFixed(2);

// El PIN vive sólo en memoria: al abrir Cocina de nuevo se solicita otra vez.
// Nunca se guarda en el navegador (ni siquiera durante la sesión).
let pin = '';
let maxId = 0, primera = true, timer = null, audio = null;

function pitar() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    [0, .22].forEach(d => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(.2, audio.currentTime + d);
      g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + d + .18);
      o.start(audio.currentTime + d); o.stop(audio.currentTime + d + .2);
    });
  } catch { /* el navegador bloqueó el audio */ }
}

async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', 'X-PIN': pin } });
  if (r.status === 401) { pedirPin(true); throw new Error('pin'); }
  return r.json();
}

function pedirPin(error) {
  clearInterval(timer);
  $('#login').hidden = false; $('#loginErr').textContent = error ? 'PIN incorrecto' : '';
  $('#pin').value = ''; $('#pin').focus();
}

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  pin = $('#pin').value;
  $('#login').hidden = true; primera = true; iniciar();
});

function hora(s) { return (s || '').slice(11, 16); }

function tarjeta(p, nuevoId) {
  const sig = { nuevo: ['A la plancha', 'preparando'], preparando: ['¡Listo!', 'listo'], listo: ['Entregado', 'entregado'] }[p.estado];
  return `<article class="ped ${p.id > nuevoId && !primera ? 'fresh' : ''}">
    <div class="ped-head"><span class="ped-code">${esc(p.codigo)}</span><span class="ped-time">${hora(p.creado)}</span></div>
    <div class="ped-who">${esc(p.nombre)} <small>· ${esc(p.tipo_texto)} · ${esc(p.telefono)}</small></div>
    ${p.direccion ? `<div class="ped-note">${esc(p.direccion)}</div>` : ''}
    <ul>${p.lineas.map(l => `<li><b>${l.cantidad}</b>${esc(l.nombre)}</li>`).join('')}</ul>
    ${p.notas ? `<div class="ped-note">Nota: ${esc(p.notas)}</div>` : ''}
    <div class="ped-tot"><span>Total</span><span>${money(p.total)}</span></div>
    <div class="acts">
      <button class="${p.estado === 'listo' ? 'ok' : ''}" data-c="${esc(p.codigo)}" data-e="${sig[1]}">${sig[0]}</button>
      ${p.estado !== 'listo' ? `<button class="no" data-c="${esc(p.codigo)}" data-e="cancelado">Cancelar</button>` : ''}
    </div></article>`;
}

function pintar(pedidos) {
  const prev = maxId;
  const col = e => pedidos.filter(p => p.estado === e).sort((a, b) => a.id - b.id);
  const llenar = (id, lista) => $(id).innerHTML = lista.length ? lista.map(p => tarjeta(p, prev)).join('') : '<p class="vacio">Nada por aquí</p>';
  const n = col('nuevo'), pr = col('preparando'), l = col('listo');
  llenar('#colNuevo', n); llenar('#colPrep', pr); llenar('#colListo', l);
  $('#cN').textContent = n.length; $('#cP').textContent = pr.length; $('#cL').textContent = l.length;

  // Lo que hay que hacer en el comal: suma de todas las pupusas pendientes
  const suma = {};
  [...n, ...pr].forEach(p => p.lineas.forEach(x => { if (/^p\d+$/.test(x.id)) suma[x.nombre] = (suma[x.nombre] || 0) + x.cantidad; }));
  $('#paraComal').innerHTML = Object.keys(suma).length
    ? Object.entries(suma).map(([k, v]) => `<span class="tag"><b>${v}</b>${esc(k)}</span>`).join(' ')
    : '<span style="opacity:.6">Comal libre</span>';

  const hoy = new Date().toLocaleDateString('sv-SE');
  const deHoy = pedidos.filter(p => p.creado.startsWith(hoy) && p.estado !== 'cancelado');
  $('#stPend').textContent = n.length + pr.length;
  $('#stHoy').textContent = deHoy.length;
  $('#stVend').textContent = money(deHoy.reduce((s, p) => s + p.total, 0));

  $('#hist').innerHTML = pedidos.filter(p => ['entregado', 'cancelado'].includes(p.estado)).slice(0, 25).map(p =>
    `<div class="hist-row"><span>${esc(p.codigo)}</span><span>${hora(p.creado)}</span><span>${esc(p.nombre)}</span><span>${money(p.total)}</span><span>${p.estado}</span></div>`).join('') || '<p class="vacio">Aún no hay historial</p>';

  const nuevoMax = pedidos.reduce((m, p) => Math.max(m, p.id), 0);
  if (!primera && nuevoMax > maxId) pitar();
  maxId = nuevoMax; primera = false;
}

async function cargar() {
  try { const j = await api('/api/cocina/pedidos'); pintar(j.pedidos); } catch { /* sin PIN o sin red */ }
}

function iniciar() { clearInterval(timer); cargar(); timer = setInterval(cargar, 4000); }

document.addEventListener('click', async e => {
  const b = e.target.closest('button[data-c]'); if (!b) return;
  if (b.dataset.e === 'cancelado' && !confirm('¿Cancelar este pedido?')) return;
  b.disabled = true;
  try { await api(`/api/cocina/pedidos/${encodeURIComponent(b.dataset.c)}/estado`, { method: 'POST', body: JSON.stringify({ estado: b.dataset.e }) }); cargar(); } catch { /* ver api() */ }
});

// Siempre pedir el PIN al llegar a Cocina, incluso al volver con el navegador.
pedirPin(false);
window.addEventListener('pageshow', e => {
  if (e.persisted) {
    pin = '';
    primera = true;
    pedirPin(false);
  }
});
})();
