/* =========================================================
   CONFIGURACIÓN DE SUPABASE
   ========================================================= */
const SUPABASE_URL = "https://fzvjhdeodahtxoolxzkx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dmpoZGVvZGFodHhvb2x4emt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODc5NjYsImV4cCI6MjEwMzc2Mzk2Nn0.CdAgxnvtMwsv1ryyrqpEdmS8ShqQMLALz5_ZwHsjSHc";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Control de Acceso
(function checkSession() {
  let role = null;
  try { role = sessionStorage.getItem('ceic_role'); } catch (e) {}
  if (role !== 'admin') {
    window.location.href = 'login.html';
  }
})();

// Escapa texto para evitar que datos con símbolos rompan el HTML
function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Sellos SVG institucionales
const SEAL_SVG = `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <circle cx="200" cy="200" r="185" fill="none" stroke="#2B547E" stroke-width="18" />
  <path d="M 140 70 Q 160 70 160 90 L 160 110 Q 160 135 140 145 Q 120 135 120 110 L 120 90 Q 120 70 140 70 Z" fill="#800000" />
  <path d="M 140 70 Q 160 70 160 90 L 160 110 Q 160 135 140 145 Z" fill="#2B547E" />
  <text x="200" y="255" font-family="'Times New Roman', Times, serif" font-weight="bold" font-size="95" fill="#000" text-anchor="middle" letter-spacing="2">CEIC</text>
  <text x="200" y="288" font-family="'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="11.5" fill="#111" text-anchor="middle" letter-spacing="0.5">CENTRO EDUCATIVO INTEGRAL COMUNITARIO</text>
</svg>`;

document.getElementById('sealSlot1').innerHTML = SEAL_SVG;
document.getElementById('sealSlot2').innerHTML = SEAL_SVG;

try {
  const adminName = sessionStorage.getItem('ceic_username') || 'admin';
  document.getElementById('adminLabel').textContent = adminName;
} catch (e) {}

// Tema Claro / Oscuro
const root = document.documentElement;
document.getElementById('themeToggle').addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  root.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
});

// NUEVO: Cerrar Sesión
document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('ceic_role');
  sessionStorage.removeItem('ceic_username');
  window.location.href = 'login.html';
});

/* =========================================================
   NAVEGACIÓN ENTRE VISTAS
   ========================================================= */
function cambiarVista(vista) {
  document.querySelectorAll('.sidebar .course-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.vista-panel').forEach(el => el.style.display = 'none');

  const mapa = {
    alumnos:  ['menuAlumnos',  'seccionAlumnos'],
    porCurso: ['menuPorCurso', 'seccionPorCurso'],
    pagos:    ['menuPagos',    'seccionPagos'],
    cursos:   ['menuCursos',   'seccionCursos'],
    horarios: ['menuHorarios', 'seccionHorarios'],
    fechas:   ['menuFechas',   'seccionFechas']
  };
  const [menu, seccion] = mapa[vista];
  if (menu && seccion) {
    document.getElementById(menu).classList.add('active');
    document.getElementById(seccion).style.display = 'block';
  }

  if (vista === 'cursos') cargarCursosAdmin();
  if (vista === 'pagos') cargarPagos();
  if (vista === 'fechas') cargarFechasInscripcion();
}

async function cargarFechasInscripcion() {
  try {
    const { data, error } = await supabaseClient.from('configuracion').select('*');
    if (error) throw error;

    data.forEach(item => {
      if (item.clave === 'fecha_inicio_inscripcion') {
        document.getElementById('fechaInicioInscripcion').value = item.valor.slice(0, 16);
      }
      if (item.clave === 'fecha_limite_inscripcion') {
        document.getElementById('fechaLimiteInscripcion').value = item.valor.slice(0, 16);
      }
    });
  } catch (err) {
    console.error('Error al cargar fechas:', err);
  }
}

document.getElementById('formFechasInscripcion')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const inicio = document.getElementById('fechaInicioInscripcion').value;
  const limite = document.getElementById('fechaLimiteInscripcion').value;
  const msg = document.getElementById('mensajeFechas');

  try {
    const { error: e1 } = await supabaseClient.from('configuracion').upsert([
      { clave: 'fecha_inicio_inscripcion', valor: inicio },
      { clave: 'fecha_limite_inscripcion', valor: limite }
    ]);

    if (e1) throw e1;

    msg.style.display = 'block';
    msg.style.color = '#3fae5c';
    msg.textContent = '¡Fechas guardadas exitosamente!';
    setTimeout(() => { msg.style.display = 'none'; }, 3000);
  } catch (err) {
    console.error(err);
    msg.style.display = 'block';
    msg.style.color = 'var(--accent-red)';
    msg.textContent = 'Error al guardar las fechas.';
  }
});

/* =========================================================
   DATOS: CURSOS E INSCRITOS
   ========================================================= */
let cursosGlobal = [];
let alumnosGlobal = [];

const nombreCurso = id =>
  (cursosGlobal.find(c => String(c.id) === String(id)) || {}).nombre || 'Sin curso';

async function inicializarPanel() {
  try {
    const { data: cursos, error: e1 } = await supabaseClient.from('cursos').select('*');
    if (e1) throw e1;
    cursosGlobal = cursos || [];

    const { data: insc, error: e2 } = await supabaseClient.from('inscripciones').select('*');
    if (e2) throw e2;
    alumnosGlobal = insc || [];

    // Estadísticas
    document.getElementById('statsRow').innerHTML = `
      <div class="stat"><div class="num">${alumnosGlobal.length}</div><div class="lbl">Total inscritos</div></div>
      <div class="stat"><div class="num">${cursosGlobal.length}</div><div class="lbl">Cursos registrados</div></div>`;

    // Vista general
    aplicarBusquedaGeneral();

    // Desplegable de cursos (con conteo)
    const sel = document.getElementById('selectCurso');
    const previo = sel.value;
    sel.innerHTML = '<option value="">— Selecciona un curso —</option>' +
      cursosGlobal.map(c => {
        const n = alumnosGlobal.filter(a => String(a.curso_id) === String(c.id)).length;
        return `<option value="${esc(c.id)}">${esc(c.nombre)} (${n})</option>`;
      }).join('');
    sel.value = previo;
    mostrarAlumnosCurso();
    actualizarBadgePagos();
  } catch (err) {
    console.error('Error al inicializar panel:', err);
  }
}

function renderizarAlumnos(lista, tbodyId, emptyId, mostrarCurso) {
  const tbody = document.getElementById(tbodyId);
  const empty = document.getElementById(emptyId);
  tbody.innerHTML = '';

  if (!lista.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  lista.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="stu-name">${esc(a.nombres)} ${esc(a.apellidos)}</div>
        <div class="stu-sub">${esc(a.nacionalidad)}</div>
      </td>
      ${mostrarCurso ? `<td><span class="badge">${esc(nombreCurso(a.curso_id))}</span></td>` : ''}
      <td><span class="badge">${esc(a.numero_identificacion)}</span></td>
      <td>${esc(a.telefono || 'N/A')}</td>
      <td>${esc(a.correo_electronico || 'N/A')}</td>
      ${mostrarCurso ? '' : `<td>${esc(a.ocupacion || 'N/A')}</td>`}
      <td>
        <div class="row-actions">
          <button class="ficha-btn" onclick="verFichaPorId('${esc(a.id)}')">Ver Ficha</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function verFichaPorId(id) {
  const alumno = alumnosGlobal.find(a => String(a.id) === String(id));
  if (alumno) verFicha(alumno);
}

function filtrar(lista, term) {
  term = (term || '').toLowerCase();
  return lista.filter(a =>
    `${a.nombres} ${a.apellidos}`.toLowerCase().includes(term) ||
    String(a.numero_identificacion || '').toLowerCase().includes(term)
  );
}

// Vista general: búsqueda
function aplicarBusquedaGeneral() {
  const term = document.getElementById('searchInput').value;
  renderizarAlumnos(filtrar(alumnosGlobal, term), 'studentBody', 'emptyState', true);
}
document.getElementById('searchInput').addEventListener('input', aplicarBusquedaGeneral);

// Vista por curso: selección + búsqueda
function mostrarAlumnosCurso() {
  const cursoId = document.getElementById('selectCurso').value;
  const term = document.getElementById('searchCurso').value;
  const lista = cursoId ? alumnosGlobal.filter(a => String(a.curso_id) === String(cursoId)) : [];
  renderizarAlumnos(filtrar(lista, term), 'studentBodyCurso', 'emptyStateCurso', false);
}
document.getElementById('selectCurso').addEventListener('change', mostrarAlumnosCurso);
document.getElementById('searchCurso').addEventListener('input', mostrarAlumnosCurso);

/* =========================================================
   FICHA PERSONAL Y EXPORTAR A PDF (CON FOTO TIPO CARNET)
   ========================================================= */
const fichaOverlay = document.getElementById('fichaOverlay');

function verFicha(alumno) {
  const fotoSlot = document.getElementById('fichaFotoSlot');
  const urlFoto = alumno.foto_url || alumno.foto_carnet_url || alumno.foto;

  if (urlFoto) {
    fotoSlot.innerHTML = `<img src="${esc(urlFoto)}" alt="Foto" onerror="this.parentNode.innerHTML='<span class=&quot;no-foto&quot;>Sin foto</span>'">`;
  } else {
    fotoSlot.innerHTML = `<span class="no-foto">📷<br>Sin foto</span>`;
  }

  document.getElementById('fichaFields').innerHTML = `
    <div class="ficha-field"><span class="k">Curso:</span><span class="v">${esc(nombreCurso(alumno.curso_id))}</span></div>
    <div class="ficha-field"><span class="k">Nombres y Apellidos:</span><span class="v">${esc(alumno.nombres)} ${esc(alumno.apellidos)}</span></div>
    <div class="ficha-field"><span class="k">Cédula / Identificación:</span><span class="v">${esc(alumno.nacionalidad)} ${esc(alumno.numero_identificacion)}</span></div>
    <div class="ficha-field"><span class="k">Fecha de Nacimiento:</span><span class="v">${esc(alumno.fecha_nacimiento || 'N/A')}</span></div>
    <div class="ficha-field"><span class="k">Sexo:</span><span class="v">${esc(alumno.sexo || 'N/A')}</span></div>
    <div class="ficha-field"><span class="k">Teléfono / WhatsApp:</span><span class="v">${esc(alumno.telefono || 'N/A')} / ${esc(alumno.whatsapp || 'N/A')}</span></div>
    <div class="ficha-field"><span class="k">Correo Electrónico:</span><span class="v">${esc(alumno.correo_electronico || 'N/A')}</span></div>
    <div class="ficha-field"><span class="k">Ubicación:</span><span class="v">${esc(alumno.municipio_ciudad)}, ${esc(alumno.estado)}</span></div>
    <div class="ficha-field"><span class="k">Dirección:</span><span class="v">${esc(alumno.direccion || 'N/A')}</span></div>
    <div class="ficha-field"><span class="k">Ocupación:</span><span class="v">${esc(alumno.ocupacion || 'N/A')}</span></div>
    <div class="ficha-field"><span class="k">Nivel Educativo:</span><span class="v">${esc(alumno.nivel_educativo || 'N/A')}</span></div>
    <div class="ficha-field"><span class="k">Institución / Empresa:</span><span class="v">${esc(alumno.institucion || 'N/A')}</span></div>
  `;

  fichaOverlay.classList.add('show');
}

document.getElementById('fichaClose').onclick = () => fichaOverlay.classList.remove('show');
document.getElementById('fichaCancelBtn').onclick = () => fichaOverlay.classList.remove('show');
document.getElementById('fichaPrintBtn').onclick = () => window.print();

/* =========================================================
   GESTIÓN DE CURSOS (CRUD: CREAR, MODIFICAR, ELIMINAR)
   ========================================================= */
const modalCursoOverlay = document.getElementById('modalCursoOverlay');

function abrirModalCurso(curso = null) {
  document.getElementById('formCrearCurso').reset();
  if (curso) {
    document.getElementById('modalCursoTitulo').textContent = 'Modificar Curso';
    document.getElementById('cursoIdEdit').value = curso.id;
    document.getElementById('nuevoNombre').value = curso.nombre || '';
    document.getElementById('nuevoDesc').value = curso.descripcion || '';
    document.getElementById('nuevoModalidad').value = curso.modalidad || '';
    document.getElementById('nuevoCosto').value = curso.costo || '';
    document.getElementById('nuevoCupo').value = curso.cupo_maximo || '';
    document.getElementById('nuevoFecha').value = curso.fecha_culminacion || '';
  } else {
    document.getElementById('modalCursoTitulo').textContent = 'Registrar Nuevo Curso';
    document.getElementById('cursoIdEdit').value = '';
  }
  modalCursoOverlay.classList.add('show');
}

function editarCursoPorId(id) {
  const curso = cursosGlobal.find(c => String(c.id) === String(id));
  if (curso) abrirModalCurso(curso);
}

document.getElementById('modalCursoClose').onclick = () => modalCursoOverlay.classList.remove('show');
document.getElementById('modalCursoCancel').onclick = () => modalCursoOverlay.classList.remove('show');

document.getElementById('formCrearCurso').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('cursoIdEdit').value;
  const nombre = document.getElementById('nuevoNombre').value.trim();
  const descripcion = document.getElementById('nuevoDesc').value.trim();
  const modalidad = document.getElementById('nuevoModalidad').value.trim();
  const costo = document.getElementById('nuevoCosto').value ? parseFloat(document.getElementById('nuevoCosto').value) : 0;
  const cupo_maximo = document.getElementById('nuevoCupo').value ? parseInt(document.getElementById('nuevoCupo').value) : 30;
  const fecha_culminacion = document.getElementById('nuevoFecha').value || null;

  const btn = document.getElementById('btnGuardarCursoData');
  btn.textContent = 'Guardando...';
  btn.disabled = true;

  try {
    if (id) {
      const { error } = await supabaseClient.from('cursos').update({
        nombre, descripcion, modalidad, costo, cupo_maximo, fecha_culminacion
      }).eq('id', id);
      if (error) throw error;
      alert('¡Curso actualizado con éxito!');
    } else {
      const { error } = await supabaseClient.from('cursos').insert([{
        nombre, descripcion, modalidad, costo, cupo_maximo, fecha_culminacion
      }]);
      if (error) throw error;
      alert('¡Curso registrado con éxito!');
    }

    modalCursoOverlay.classList.remove('show');
    await inicializarPanel();
    if (document.getElementById('seccionCursos').style.display === 'block') {
      cargarCursosAdmin();
    }
  } catch (err) {
    alert('Error al guardar curso: ' + err.message);
  } finally {
    btn.textContent = 'Guardar Curso';
    btn.disabled = false;
  }
});

async function cargarCursosAdmin() {
  const contenedor = document.getElementById('listaCursosAdmin');
  contenedor.innerHTML = '<p style="color:var(--text-faint);">Cargando cursos...</p>';

  const { data, error } = await supabaseClient.from('cursos').select('*');
  if (error) {
    contenedor.innerHTML = '<p style="color:red;">Error al cargar cursos.</p>';
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p style="color:var(--text-faint);">No hay cursos registrados.</p>';
    return;
  }

  cursosGlobal = data;
  contenedor.innerHTML = '';
  data.forEach(curso => {
    contenedor.innerHTML += `
      <div style="background:var(--input-bg); border:1px solid var(--panel-border); padding:1rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <strong style="font-size:1rem; color:var(--text-main);">${esc(curso.nombre)}</strong>
          <p style="font-size:0.8rem; color:var(--text-faint); margin-top:0.2rem;">${esc(curso.descripcion || 'Sin descripción')} | Modalidad: ${esc(curso.modalidad || 'N/A')} | Costo: $${esc(curso.costo || 0)}</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="ficha-btn" onclick="editarCursoPorId('${esc(curso.id)}')">Modificar</button>
          <button class="ficha-btn" style="background:var(--accent-red);" onclick="eliminarCurso('${esc(curso.id)}')">Eliminar</button>
        </div>
      </div>
    `;
  });
}

async function eliminarCurso(id) {
  if (!confirm("¿Estás seguro de eliminar este curso del catálogo y base de datos?")) return;

  const { error } = await supabaseClient.from('cursos').delete().eq('id', id);
  if (error) {
    alert('Error al eliminar: ' + error.message);
  } else {
    alert('Curso eliminado correctamente.');
    await inicializarPanel();
    cargarCursosAdmin();
  }
}

/* =========================================================
   SUBIR HORARIOS
   ========================================================= */
document.getElementById('formHorario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const archivo = document.getElementById('archivoHorario').files[0];

  try {
    const fileName = `${Date.now()}_${archivo.name}`;
    const { data, error } = await supabaseClient.storage
      .from('documentos-inscripcion')
      .upload(`horarios/${fileName}`, archivo);

    if (error) throw error;

    const { data: publicUrl } = supabaseClient.storage
      .from('documentos-inscripcion')
      .getPublicUrl(data.path);

    alert('¡Horario subido con éxito! Enlace disponible: ' + publicUrl.publicUrl);
    document.getElementById('formHorario').reset();
  } catch (err) {
    alert('Error al subir el horario: ' + err.message);
  }
});

/* =========================================================
   PAGOS DE INSCRIPCIÓN
   ========================================================= */
const PAGOS_CFG = {
  bucket: 'documentos-inscripcion',
  carpetaPagos: 'pagos',
  carpetaCedulas: 'cedulas',
  colComprobante: ['comprobante_url', 'comprobante_pago_url', 'pago_url', 'comprobante_pago', 'comprobante'],
  colCedula: ['cedula_url', 'foto_cedula_url', 'foto_cedula', 'cedula_foto'],
  colMonto: ['monto', 'monto_pagado'],
  colReferencia: ['referencia', 'nro_referencia', 'numero_referencia'],
  colMetodo: ['metodo_pago', 'forma_pago'],
  colFechaPago: ['fecha_pago'],
  colEstado: 'estado_pago',
  colMotivo: 'motivo_estado',
  colFechaRevision: 'fecha_revision'
};

let pagosCache = {};
let listadoCarpetas = {};
let pagoArchivandoId = null;

const pick = (o, cols) => {
  for (const c of cols) if (o[c] !== undefined && o[c] !== null && o[c] !== '') return o[c];
  return null;
};
const estadoDe = a => a[PAGOS_CFG.colEstado] || 'pendiente';
const esPdf = s => /\.pdf(\?|$)/i.test(s || '');

function extraerPath(url) {
  const m = url.match(/\/object\/(?:public|sign|authenticated)\/[^/]+\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function firmarArchivo(valor) {
  if (!valor) return null;
  let path = valor;
  if (/^https?:/i.test(valor)) {
    path = extraerPath(valor);
    if (!path) return { url: valor, path: null, pdf: esPdf(valor) };
  }
  const { data, error } = await supabaseClient.storage
    .from(PAGOS_CFG.bucket).createSignedUrl(path, 3600);
  if (error || !data) return { url: null, path, pdf: esPdf(path) };
  return { url: data.signedUrl, path, pdf: esPdf(path) };
}

async function listarCarpeta(carpeta) {
  if (!listadoCarpetas[carpeta]) {
    const { data } = await supabaseClient.storage
      .from(PAGOS_CFG.bucket).list(carpeta, { limit: 1000 });
    listadoCarpetas[carpeta] = (data || []).filter(f => f.id);
  }
  return listadoCarpetas[carpeta];
}

async function resolverArchivo(alumno, columnas, carpeta) {
  const valor = pick(alumno, columnas);
  if (valor) return firmarArchivo(valor);

  const clave = String(alumno.numero_identificacion || '').trim();
  if (!clave) return null;
  const archivos = await listarCarpeta(carpeta);
  const f = archivos.find(x => x.name.includes(clave));
  return f ? firmarArchivo(`${carpeta}/${f.name}`) : null;
}

function actualizarBadgePagos() {
  const pendientes = alumnosGlobal.filter(a => estadoDe(a) === 'pendiente').length;
  const b = document.getElementById('badgePagos');
  b.textContent = pendientes;
  b.style.display = pendientes ? 'inline-block' : 'none';
}

async function cargarPagos() {
  const cont = document.getElementById('listaPagos');
  cont.innerHTML = '<div class="empty" style="grid-column:1/-1;">Cargando pagos...</div>';
  listadoCarpetas = {};
  await inicializarPanel();
  await Promise.all(alumnosGlobal.map(async a => {
    if (!pagosCache[a.id]) {
      pagosCache[a.id] = {
        pago: await resolverArchivo(a, PAGOS_CFG.colComprobante, PAGOS_CFG.carpetaPagos),
        cedula: await resolverArchivo(a, PAGOS_CFG.colCedula, PAGOS_CFG.carpetaCedulas)
      };
    }
  }));
  renderPagos();
}

function mediaHTML(info, id, tipo) {
  if (!info || !info.url) return `<div class="media-box" style="cursor:default;">Sin archivo</div>`;
  const clic = `onclick="verMedia('${esc(id)}','${tipo}')"`;
  if (info.pdf) return `<div class="media-box" ${clic}>📄 Ver PDF</div>`;
  return `<div class="media-box" ${clic}><img src="${esc(info.url)}" alt="${tipo}" loading="lazy"></div>`;
}

function renderPagos() {
  const cont = document.getElementById('listaPagos');
  const filtro = document.getElementById('filtroEstadoPago').value;
  const term = document.getElementById('searchPagos').value;

  let lista = alumnosGlobal.filter(a => filtro === 'todos' || estadoDe(a) === filtro);
  lista = filtrar(lista, term);

  if (!lista.length) {
    cont.innerHTML = '<div class="empty" style="grid-column:1/-1;">No hay pagos en esta categoría.</div>';
    return;
  }

  cont.innerHTML = lista.map(a => {
    const est = estadoDe(a);
    const c = pagosCache[a.id] || {};
    const monto = pick(a, PAGOS_CFG.colMonto);
    const ref = pick(a, PAGOS_CFG.colReferencia);
    const met = pick(a, PAGOS_CFG.colMetodo);
    const fec = pick(a, PAGOS_CFG.colFechaPago);
    const motivo = a[PAGOS_CFG.colMotivo];
    const id = esc(a.id);
    return `
      <div class="pago-card">
        <div class="pago-top">
          <div>
            <div class="stu-name">${esc(a.nombres)} ${esc(a.apellidos)}</div>
            <div class="stu-sub">${esc(a.nacionalidad)} ${esc(a.numero_identificacion)}</div>
          </div>
          <span class="badge st-${esc(est)}">${esc(est)}</span>
        </div>
        <div class="pago-media">
          <div><div class="media-cap">COMPROBANTE DE PAGO</div>${mediaHTML(c.pago, a.id, 'pago')}</div>
          <div><div class="media-cap">FOTO DE CÉDULA</div>${mediaHTML(c.cedula, a.id, 'cedula')}</div>
        </div>
        <div class="pago-datos">
          <div class="row"><span>Curso</span><span>${esc(nombreCurso(a.curso_id))}</span></div>
          ${monto !== null ? `<div class="row"><span>Monto</span><span>$${esc(monto)}</span></div>` : ''}
          ${ref ? `<div class="row"><span>Referencia</span><span>${esc(ref)}</span></div>` : ''}
          ${met ? `<div class="row"><span>Método</span><span>${esc(met)}</span></div>` : ''}
          ${fec ? `<div class="row"><span>Fecha de pago</span><span>${esc(fec)}</span></div>` : ''}
          <div class="row"><span>Teléfono</span><span>${esc(a.telefono || 'N/A')}</span></div>
        </div>
        ${est === 'archivado' && motivo ? `<div class="pago-motivo"><strong>Motivo:</strong> ${esc(motivo)}</div>` : ''}
        <div class="pago-btns">
          ${est !== 'aceptado' ? `<button class="ficha-btn btn-ok" onclick="aceptarPago('${id}')">✔ Aceptar</button>` : ''}
          ${est !== 'archivado' ? `<button class="ficha-btn btn-warn" onclick="abrirArchivarPago('${id}')">🗂 Archivar</button>` : ''}
          <button class="ficha-btn btn-bad" onclick="rechazarPago('${id}')">✖ Rechazar</button>
        </div>
        <button class="ficha-btn" style="background:transparent; border:1px solid var(--panel-border); color:var(--text-muted);" onclick="verFichaPorId('${id}')">Ver ficha completa</button>
      </div>`;
  }).join('');
}

document.getElementById('filtroEstadoPago').addEventListener('change', renderPagos);
document.getElementById('searchPagos').addEventListener('input', renderPagos);

/* ---- Visor de imagen / PDF ---- */
const visorOverlay = document.getElementById('visorOverlay');
function verMedia(id, tipo) {
  const info = (pagosCache[id] || {})[tipo];
  if (!info || !info.url) return;
  document.getElementById('visorContenido').innerHTML = info.pdf
    ? `<iframe src="${esc(info.url)}"></iframe>`
    : `<img src="${esc(info.url)}" alt="${esc(tipo)}">`;
  visorOverlay.classList.add('show');
}
document.getElementById('visorClose').onclick = () => {
  visorOverlay.classList.remove('show');
  document.getElementById('visorContenido').innerHTML = '';
};

/* ---- Acciones ---- */
async function actualizarEstadoPago(id, estado, motivo) {
  const { data, error } = await supabaseClient.from('inscripciones')
    .update({
      [PAGOS_CFG.colEstado]: estado,
      [PAGOS_CFG.colMotivo]: motivo || null,
      [PAGOS_CFG.colFechaRevision]: new Date().toISOString()
    })
    .eq('id', id)
    .select();
  if (error) throw error;
  if (!data || !data.length) {
    throw new Error('No se modificó ningún registro. Revisa las políticas RLS de la tabla inscripciones.');
  }
}

async function aceptarPago(id) {
  if (!confirm('¿Aceptar este pago? Se guardará en la tabla de pagos y la inscripción se conservará como pagada.')) return;
  const a = alumnosGlobal.find(x => String(x.id) === String(id));
  if (!a) return;
  const c = pagosCache[id] || {};
  let adminName = 'admin';
  try { adminName = sessionStorage.getItem('ceic_username') || 'admin'; } catch (e) {}

  try {
    const registro = {
      inscripcion_id: a.id,
      curso_id: a.curso_id || null,
      nombres: a.nombres,
      apellidos: a.apellidos,
      nacionalidad: a.nacionalidad || null,
      numero_identificacion: a.numero_identificacion,
      telefono: a.telefono || null,
      correo_electronico: a.correo_electronico || null,
      monto: pick(a, PAGOS_CFG.colMonto),
      referencia: pick(a, PAGOS_CFG.colReferencia),
      metodo_pago: pick(a, PAGOS_CFG.colMetodo),
      fecha_pago: pick(a, PAGOS_CFG.colFechaPago),
      comprobante_path: (c.pago && c.pago.path) || null,
      cedula_path: (c.cedula && c.cedula.path) || null,
      estado: 'aceptado',
      aprobado_por: adminName,
      fecha_aprobacion: new Date().toISOString()
    };
    const { error: errPago } = await supabaseClient.from('pagos')
      .upsert(registro, { onConflict: 'inscripcion_id' });
    if (errPago) throw errPago;

    try {
      await actualizarEstadoPago(id, 'aceptado', null);
    } catch (err) {
      await supabaseClient.from('pagos').delete().eq('inscripcion_id', id);
      throw err;
    }

    await cargarPagos();
  } catch (err) {
    alert('Error al aceptar el pago: ' + err.message);
  }
}

const motivoOverlay = document.getElementById('motivoOverlay');
function abrirArchivarPago(id) {
  const a = alumnosGlobal.find(x => String(x.id) === String(id));
  pagoArchivandoId = id;
  document.getElementById('motivoSub').textContent = a ? `${a.nombres} ${a.apellidos}` : '';
  document.getElementById('motivoTexto').value = '';
  motivoOverlay.classList.add('show');
}
const cerrarMotivo = () => { motivoOverlay.classList.remove('show'); pagoArchivandoId = null; };
document.getElementById('motivoClose').onclick = cerrarMotivo;
document.getElementById('motivoCancel').onclick = cerrarMotivo;
document.getElementById('motivoConfirm').onclick = async () => {
  const motivo = document.getElementById('motivoTexto').value.trim();
  if (!motivo) { alert('Debes especificar el motivo para archivar el pago.'); return; }
  const id = pagoArchivandoId;
  try {
    await actualizarEstadoPago(id, 'archivado', motivo);
    await supabaseClient.from('pagos').delete().eq('inscripcion_id', id);
    cerrarMotivo();
    await cargarPagos();
  } catch (err) {
    alert('Error al archivar el pago: ' + err.message);
  }
};

async function rechazarPago(id) {
  const a = alumnosGlobal.find(x => String(x.id) === String(id));
  const nombre = a ? `${a.nombres} ${a.apellidos}` : 'este alumno';
  if (!confirm(`¿Rechazar el pago de ${nombre}?\n\nSe ELIMINARÁ su inscripción de la base de datos junto con el comprobante y la foto de cédula. Esta acción no se puede deshacer.`)) return;

  try {
    const { data, error } = await supabaseClient.from('inscripciones')
      .delete().eq('id', id).select();
    if (error) throw error;
    if (!data || !data.length) {
      throw new Error('No se eliminó ningún registro. Revisa las políticas RLS de la tabla inscripciones.');
    }

    const c = pagosCache[id] || {};
    const rutas = [c.pago && c.pago.path, c.cedula && c.cedula.path].filter(Boolean);
    if (rutas.length) {
      const { error: errFiles } = await supabaseClient.storage.from(PAGOS_CFG.bucket).remove(rutas);
      if (errFiles) console.warn('No se pudieron eliminar los archivos:', errFiles);
    }

    delete pagosCache[id];
    listadoCarpetas = {};
    alert('Pago rechazado. La inscripción fue eliminada.');
    await cargarPagos();
  } catch (err) {
    alert('Error al rechazar el pago: ' + err.message);
  }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
  inicializarPanel();
});