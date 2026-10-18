/* =========================================================
   CONFIGURACIÓN DE SUPABASE Y CONTROL DE SESIÓN
   ========================================================= */
const SUPABASE_URL = "https://fzvjhdeodahtxoolxzkx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dmpoZGVvZGFodHhvb2x4emt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODc5NjYsImV4cCI6MjEwMzc2Mzk2Nn0.CdAgxnvtMwsv1ryyrqpEdmS8ShqQMLALz5_ZwHsjSHc";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TUTORES_BUCKET = 'documentos-inscripcion';

// Control de Acceso por Sesión
(function checkSession() {
  let role = null;
  try { role = sessionStorage.getItem('ceic_role'); } catch (e) {}
  if (role !== 'admin') {
    window.location.href = 'login.html';
  }
})();

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const esPdf = s => /\.pdf(\?|$)/i.test(s || '');

const SEAL_SVG = `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <circle cx="200" cy="200" r="185" fill="none" stroke="#2B547E" stroke-width="18" />
  <path d="M 140 70 Q 160 70 160 90 L 160 110 Q 160 135 140 145 Q 120 135 120 110 L 120 90 Q 120 70 140 70 Z" fill="#800000" />
  <path d="M 140 70 Q 160 70 160 90 L 160 110 Q 160 135 140 145 Z" fill="#2B547E" />
  <text x="200" y="255" font-family="'Times New Roman', Times, serif" font-weight="bold" font-size="95" fill="#000" text-anchor="middle" letter-spacing="2">CEIC</text>
  <text x="200" y="288" font-family="'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="11.5" fill="#111" text-anchor="middle" letter-spacing="0.5">CENTRO EDUCATIVO INTEGRAL COMUNITARIO</text>
</svg>`;

const sealSlot1 = document.getElementById('sealSlot1');
const sealSlot2 = document.getElementById('sealSlot2');
if (sealSlot1) sealSlot1.innerHTML = SEAL_SVG;
if (sealSlot2) sealSlot2.innerHTML = SEAL_SVG;

try {
  const adminName = sessionStorage.getItem('ceic_username') || 'admin';
  const adminLabel = document.getElementById('adminLabel');
  if (adminLabel) adminLabel.textContent = adminName;
} catch (e) {}

const root = document.documentElement;
document.getElementById('themeToggle')?.addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  root.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
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
    tutores:  ['menuTutores',  'seccionTutores'],
    fechas:   ['menuFechas',   'seccionFechas'],
    galeria:  ['menuGaleria',  'seccionGaleria']
  };

  if (mapa[vista]) {
    const [menu, seccion] = mapa[vista];
    document.getElementById(menu)?.classList.add('active');
    const secEl = document.getElementById(seccion);
    if (secEl) secEl.style.display = 'block';
  }

  if (vista === 'cursos') cargarCursosAdmin();
  if (vista === 'pagos') cargarPagos();
  if (vista === 'horarios') cargarHorariosAdmin();
  if (vista === 'tutores') cargarTutoresAdmin();
  if (vista === 'fechas') cargarFechasInscripcion();
  if (vista === 'galeria') cargarGaleriaAdmin();
}

/* =========================================================
   CONFIGURACIÓN DE FECHAS DE INSCRIPCIÓN
   ========================================================= */
async function cargarFechasInscripcion() {
  try {
    const { data, error } = await supabaseClient.from('configuracion').select('*');
    if (error) throw error;
    data?.forEach(item => {
      if (item.clave === 'fecha_inicio_inscripcion') {
        const input = document.getElementById('fechaInicioInscripcion');
        if (input) input.value = item.valor.slice(0, 16);
      }
      if (item.clave === 'fecha_limite_inscripcion') {
        const input = document.getElementById('fechaLimiteInscripcion');
        if (input) input.value = item.valor.slice(0, 16);
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
    if (msg) {
      msg.style.display = 'block';
      msg.style.color = '#3fae5c';
      msg.textContent = 'Fechas guardadas exitosamente';
      setTimeout(() => { msg.style.display = 'none'; }, 3000);
    }
  } catch (err) {
    console.error(err);
    if (msg) {
      msg.style.display = 'block';
      msg.style.color = 'var(--accent-red)';
      msg.textContent = 'Error al guardar las fechas.';
    }
  }
});

/* =========================================================
   DATOS GENERALES: CURSOS E INSCRITOS
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
    llenarSelectHorario();
    llenarSelectTutor();

    const { data: insc, error: e2 } = await supabaseClient.from('inscripciones').select('*');
    if (e2) throw e2;
    alumnosGlobal = insc || [];

    const statsRow = document.getElementById('statsRow');
    if (statsRow) {
      statsRow.innerHTML = `
        <div class="stat"><div class="num">${alumnosGlobal.length}</div><div class="lbl">Total inscritos</div></div>
        <div class="stat"><div class="num">${cursosGlobal.length}</div><div class="lbl">Cursos registrados</div></div>`;
    }

    aplicarBusquedaGeneral();

    const sel = document.getElementById('selectCurso');
    if (sel) {
      const previo = sel.value;
      sel.innerHTML = '<option value="">— Selecciona un curso —</option>' +
        cursosGlobal.map(c => {
          const n = alumnosGlobal.filter(a => String(a.curso_id) === String(c.id)).length;
          return `<option value="${esc(c.id)}">${esc(c.nombre)} (${n})</option>`;
        }).join('');
      sel.value = previo;
    }
    mostrarAlumnosCurso();
    actualizarBadgePagos();
  } catch (err) {
    console.error('Error al inicializar panel:', err);
  }
}

function renderizarAlumnos(lista, tbodyId, emptyId, mostrarCurso) {
  const tbody = document.getElementById(tbodyId);
  const empty = document.getElementById(emptyId);
  if (!tbody || !empty) return;
  tbody.innerHTML = '';

  if (!lista.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  lista.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="stu-name">${esc(a.nombres)} ${esc(a.apellidos)}</div>
        <div class="stu-sub">${esc(a.nacionalidad || 'V')}</div>
      </td>
      ${mostrarCurso ? `<td><span class="badge">${esc(nombreCurso(a.curso_id))}</span></td>` : ''}
      <td><span class="badge">${esc(a.numero_identificacion)}</span></td>
      <td>${esc(a.telefono || 'N/A')}</td>
      <td>${esc(a.correo_electronico || 'N/A')}</td>
      ${mostrarCurso ? '' : `<td>${esc(a.ocupacion || 'N/A')}</td>`}
      <td>
        <div class="row-actions">
          <button class="ficha-btn" onclick="verFichaPorId('${esc(a.id)}')">Ver Ficha</button>
          ${!mostrarCurso ? `
            <button class="ficha-btn" style="background:var(--primary-blue);" onclick="abrirEditarEstudiante('${esc(a.id)}')">Editar</button>
            <button class="ficha-btn btn-bad" onclick="eliminarEstudiante('${esc(a.id)}', '${esc(a.nombres)}${esc(a.apellidos)}')">Eliminar</button>
          ` : ''}
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

function aplicarBusquedaGeneral() {
  const inputSearch = document.getElementById('searchInput');
  if (!inputSearch) return;
  const term = inputSearch.value;
  renderizarAlumnos(filtrar(alumnosGlobal, term), 'studentBody', 'emptyState', true);
}
document.getElementById('searchInput')?.addEventListener('input', aplicarBusquedaGeneral);

function mostrarAlumnosCurso() {
  const selectCurso = document.getElementById('selectCurso');
  const searchCurso = document.getElementById('searchCurso');
  if (!selectCurso || !searchCurso) return;

  const cursoId = selectCurso.value;
  const term = searchCurso.value;
  const lista = cursoId ? alumnosGlobal.filter(a => String(a.curso_id) === String(cursoId)) : [];
  renderizarAlumnos(filtrar(lista, term), 'studentBodyCurso', 'emptyStateCurso', false);
}
document.getElementById('selectCurso')?.addEventListener('change', mostrarAlumnosCurso);
document.getElementById('searchCurso')?.addEventListener('input', mostrarAlumnosCurso);

/* =========================================================
   FICHA PERSONAL DE ESTUDIANTE Y EXP. PDF
   ========================================================= */
const fichaOverlay = document.getElementById('fichaOverlay');

function verFicha(alumno) {
  const fotoSlot = document.getElementById('fichaFotoSlot');
  const urlFoto = alumno.foto_url || alumno.foto_carnet_url || alumno.foto;

  if (fotoSlot) {
    if (urlFoto) {
      fotoSlot.innerHTML = `<img src="${esc(urlFoto)}" alt="Foto" onerror="this.parentNode.innerHTML='<span class=&quot;no-foto&quot;>Sin foto</span>'">`;
    } else {
      fotoSlot.innerHTML = `<span class="no-foto"><br>Sin foto</span>`;
    }
  }

  const fields = document.getElementById('fichaFields');
  if (fields) {
    fields.innerHTML = `
      <div class="ficha-field"><span class="k">Curso:</span><span class="v">${esc(nombreCurso(alumno.curso_id))}</span></div>
      <div class="ficha-field"><span class="k">Nombres y Apellidos:</span><span class="v">${esc(alumno.nombres)} ${esc(alumno.apellidos)}</span></div>
      <div class="ficha-field"><span class="k">Cédula / Identificación:</span><span class="v">${esc(alumno.nacionalidad || 'V')} ${esc(alumno.numero_identificacion)}</span></div>
      <div class="ficha-field"><span class="k">Fecha de Nacimiento:</span><span class="v">${esc(alumno.fecha_nacimiento || 'N/A')}</span></div>
      <div class="ficha-field"><span class="k">Sexo:</span><span class="v">${esc(alumno.sexo || 'N/A')}</span></div>
      <div class="ficha-field"><span class="k">Teléfono / WhatsApp:</span><span class="v">${esc(alumno.telefono || 'N/A')} / ${esc(alumno.whatsapp || 'N/A')}</span></div>
      <div class="ficha-field"><span class="k">Correo Electrónico:</span><span class="v">${esc(alumno.correo_electronico || 'N/A')}</span></div>
      <div class="ficha-field"><span class="k">Ubicación:</span><span class="v">${esc(alumno.municipio_ciudad || '')}, ${esc(alumno.estado || '')}</span></div>
      <div class="ficha-field"><span class="k">Dirección:</span><span class="v">${esc(alumno.direccion || 'N/A')}</span></div>
      <div class="ficha-field"><span class="k">Ocupación:</span><span class="v">${esc(alumno.ocupacion || 'N/A')}</span></div>
      <div class="ficha-field"><span class="k">Nivel Educativo:</span><span class="v">${esc(alumno.nivel_educativo || 'N/A')}</span></div>
      <div class="ficha-field"><span class="k">Institución / Empresa:</span><span class="v">${esc(alumno.institucion || 'N/A')}</span></div>
    `;
  }

  fichaOverlay?.classList.add('show');
}

document.getElementById('fichaClose')?.addEventListener('click', () => fichaOverlay?.classList.remove('show'));
document.getElementById('fichaCancelBtn')?.addEventListener('click', () => fichaOverlay?.classList.remove('show'));
document.getElementById('fichaPrintBtn')?.addEventListener('click', () => window.print());

/* =========================================================
   EDICIÓN Y ELIMINACIÓN DE ESTUDIANTES
   ========================================================= */
const modalEditarEstudianteOverlay = document.getElementById('modalEditarEstudianteOverlay');

function abrirEditarEstudiante(id) {
  const alumno = alumnosGlobal.find(a => String(a.id) === String(id));
  if (!alumno) return;

  document.getElementById('editEstudianteId').value = alumno.id;
  document.getElementById('editNombre').value = alumno.nombres || '';
  document.getElementById('editApellido').value = alumno.apellidos || '';
  document.getElementById('editNacionalidad').value = alumno.nacionalidad || '';
  document.getElementById('editCedula').value = alumno.numero_identificacion || '';
  document.getElementById('editFechaNacimiento').value = alumno.fecha_nacimiento || '';
  document.getElementById('editSexo').value = alumno.sexo || 'Masculino';
  document.getElementById('editTelefono').value = alumno.telefono || '';
  document.getElementById('editWhatsapp').value = alumno.whatsapp || '';
  document.getElementById('editCorreo').value = alumno.correo_electronico || '';
  document.getElementById('editEstado').value = alumno.estado || '';
  document.getElementById('editMunicipio').value = alumno.municipio_ciudad || '';
  document.getElementById('editDireccion').value = alumno.direccion || '';
  document.getElementById('editOcupacion').value = alumno.ocupacion || '';
  document.getElementById('editNivelEducativo').value = alumno.nivel_educativo || '';
  document.getElementById('editInstitucion').value = alumno.institucion || '';

  const selectEditCurso = document.getElementById('editCursoSelect');
  if (selectEditCurso) {
    selectEditCurso.innerHTML = cursosGlobal.map(c => 
      `<option value="${esc(c.id)}" ${String(c.id) === String(alumno.curso_id) ? 'selected' : ''}>${esc(c.nombre)}</option>`
    ).join('');
  }

  modalEditarEstudianteOverlay?.classList.add('show');
}

document.getElementById('modalEditarEstudianteClose')?.addEventListener('click', () => {
  modalEditarEstudianteOverlay?.classList.remove('show');
});
document.getElementById('modalEditarEstudianteCancel')?.addEventListener('click', () => {
  modalEditarEstudianteOverlay?.classList.remove('show');
});

document.getElementById('formEditarEstudiante')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editEstudianteId').value;

  const datosActualizados = {
    nombres: document.getElementById('editNombre').value.trim(),
    apellidos: document.getElementById('editApellido').value.trim(),
    nacionalidad: document.getElementById('editNacionalidad').value.trim(),
    numero_identificacion: document.getElementById('editCedula').value.trim(),
    fecha_nacimiento: document.getElementById('editFechaNacimiento').value || null,
    sexo: document.getElementById('editSexo').value,
    telefono: document.getElementById('editTelefono').value.trim(),
    whatsapp: document.getElementById('editWhatsapp').value.trim(),
    correo_electronico: document.getElementById('editCorreo').value.trim(),
    estado: document.getElementById('editEstado').value.trim(),
    municipio_ciudad: document.getElementById('editMunicipio').value.trim(),
    direccion: document.getElementById('editDireccion').value.trim(),
    ocupacion: document.getElementById('editOcupacion').value.trim(),
    nivel_educativo: document.getElementById('editNivelEducativo').value.trim(),
    institucion: document.getElementById('editInstitucion').value.trim(),
    curso_id: document.getElementById('editCursoSelect').value
  };

  const { error } = await supabaseClient
    .from('inscripciones')
    .update(datosActualizados)
    .eq('id', id);

  if (error) {
    alert('Error al actualizar el estudiante: ' + error.message);
    return;
  }

  alert('Estudiante actualizado con éxito');
  modalEditarEstudianteOverlay?.classList.remove('show');
  await inicializarPanel();
});

async function eliminarEstudiante(id, nombreCompleto) {
  if (!confirm(`¿Estás seguro de eliminar permanentemente a "${nombreCompleto}" del registro de inscritos?`)) return;

  const { error } = await supabaseClient
    .from('inscripciones')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Error al eliminar el registro: ' + error.message);
    return;
  }

  alert('Estudiante eliminado correctamente.');
  await inicializarPanel();
}

/* =========================================================
   GESTIÓN DE CURSOS E IMÁGENES
   ========================================================= */
const modalCursoOverlay = document.getElementById('modalCursoOverlay');

function abrirModalCurso(curso = null) {
  document.getElementById('formCrearCurso').reset();
  const preview = document.getElementById('previewCursoAdmin');
  if (preview) preview.innerHTML = '';

  if (curso) {
    document.getElementById('modalCursoTitulo').textContent = 'Modificar Curso';
    document.getElementById('cursoIdEdit').value = curso.id;
    document.getElementById('nuevoNombre').value = curso.nombre || '';
    document.getElementById('nuevoDesc').value = curso.descripcion || '';
    document.getElementById('nuevoModalidad').value = curso.modalidad || '';
    document.getElementById('nuevoCosto').value = curso.costo || '';
    document.getElementById('nuevoCupo').value = curso.cupo_maximo || curso.cupo || '';
    document.getElementById('nuevoFecha').value = curso.fecha_culminacion || curso.fecha || '';
    
    if (curso.imagen_url && preview) {
      preview.innerHTML = `<img src="${esc(curso.imagen_url)}" alt="Imagen actual" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--panel-border);">`;
    }
  } else {
    document.getElementById('modalCursoTitulo').textContent = 'Registrar Nuevo Curso';
    document.getElementById('cursoIdEdit').value = '';
  }
  modalCursoOverlay?.classList.add('show');
}

function editarCursoPorId(id) {
  const curso = cursosGlobal.find(c => String(c.id) === String(id));
  if (curso) abrirModalCurso(curso);
}

document.getElementById('nuevoImagen')?.addEventListener('change', (e) => {
  const prev = document.getElementById('previewCursoAdmin');
  const f = e.target.files[0];
  if (!f) return;
  if (prev && f.type.startsWith('image/')) {
    prev.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="Vista previa" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--panel-border);">`;
  }
});

document.getElementById('modalCursoClose')?.addEventListener('click', () => modalCursoOverlay?.classList.remove('show'));
document.getElementById('modalCursoCancel')?.addEventListener('click', () => modalCursoOverlay?.classList.remove('show'));

document.getElementById('formCrearCurso')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('cursoIdEdit').value;
  const nombre = document.getElementById('nuevoNombre').value.trim();
  const descripcion = document.getElementById('nuevoDesc').value.trim();
  const modalidad = document.getElementById('nuevoModalidad').value.trim();
  const costo = document.getElementById('nuevoCosto').value ? parseFloat(document.getElementById('nuevoCosto').value) : 0;
  const cupo_maximo = document.getElementById('nuevoCupo').value ? parseInt(document.getElementById('nuevoCupo').value) : 30;
  const fecha_culminacion = document.getElementById('nuevoFecha').value || null;
  const archivoImagen = document.getElementById('nuevoImagen').files[0];

  const btn = document.getElementById('btnGuardarCursoData');
  if (btn) { btn.textContent = 'Guardando...'; btn.disabled = true; }

  try {
    let imagenUrl = null;
    if (id) {
      const cursoExistente = cursosGlobal.find(c => String(c.id) === String(id));
      imagenUrl = cursoExistente ? cursoExistente.imagen_url : null;
    }

    if (archivoImagen) {
      const ext = (archivoImagen.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `curso_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const { error: errUp } = await supabaseClient.storage
        .from(TUTORES_BUCKET)
        .upload(path, archivoImagen, { contentType: archivoImagen.type });
      if (errUp) throw errUp;

      const { data: pub } = supabaseClient.storage.from(TUTORES_BUCKET).getPublicUrl(path);
      imagenUrl = pub.publicUrl;
    }

    if (id) {
      const { error } = await supabaseClient.from('cursos').update({
        nombre, descripcion, modalidad, costo, cupo_maximo, fecha_culminacion,
        ...(imagenUrl ? { imagen_url: imagenUrl } : {})
      }).eq('id', id);
      if (error) throw error;
      alert('Curso actualizado con éxito');
    } else {
      const { error } = await supabaseClient.from('cursos').insert([{
        nombre, descripcion, modalidad, costo, cupo_maximo, fecha_culminacion,
        imagen_url: imagenUrl
      }]);
      if (error) throw error;
      alert('Curso registrado con éxito');
    }

    modalCursoOverlay?.classList.remove('show');
    await inicializarPanel();
    if (document.getElementById('seccionCursos')?.style.display === 'block') {
      cargarCursosAdmin();
    }
  } catch (err) {
    alert('Error al guardar curso: ' + err.message);
  } finally {
    if (btn) { btn.textContent = 'Guardar Curso'; btn.disabled = false; }
  }
});

async function cargarCursosAdmin() {
  const contenedor = document.getElementById('listaCursosAdmin');
  if (!contenedor) return;
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
    const imgThumb = curso.imagen_url
      ? `<img src="${esc(curso.imagen_url)}" alt="Curso" style="width: 50px; height: 40px; object-fit: cover; border-radius: 6px;">`
      : `<div style="width: 50px; height: 40px; background: var(--chip-bg); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: var(--text-faint);">Sin foto</div>`;

    contenedor.innerHTML += `
      <div style="background:var(--input-bg); border:1px solid var(--panel-border); padding:1rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div style="display:flex; align-items:center; gap:0.8rem;">
          ${imgThumb}
          <div>
            <strong style="font-size:1rem; color:var(--text-main);">${esc(curso.nombre)}</strong>
            <p style="font-size:0.8rem; color:var(--text-faint); margin-top:0.2rem;">${esc(curso.descripcion || 'Sin descripción')} | Modalidad: ${esc(curso.modalidad || 'N/A')} | Costo: $${esc(curso.costo || 0)}</p>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="ficha-btn" onclick="editarCursoPorId('${esc(curso.id)}')">Modificar</button>
          <button class="ficha-btn btn-bad" onclick="eliminarCurso('${esc(curso.id)}')">Eliminar</button>
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
   SUBIR Y CONTROL DE HORARIOS
   ========================================================= */
const HORARIOS_BUCKET = 'horarios';

function llenarSelectHorario() {
  const sel = document.getElementById('cursoHorario');
  if (!sel) return;
  const previo = sel.value;
  sel.innerHTML = '<option value="">— Selecciona un curso —</option>' +
    cursosGlobal.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>`).join('');
  sel.value = previo;
}

function pathDesdeUrlHorario(url) {
  const m = (url || '').match(/\/object\/public\/horarios\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

document.getElementById('archivoHorario')?.addEventListener('change', (e) => {
  const prev = document.getElementById('previewHorario');
  const f = e.target.files[0];
  if (!f) { if (prev) prev.innerHTML = ''; return; }
  if (prev) {
    if (f.type.startsWith('image/')) {
      prev.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="Vista previa" style="max-width:100%; max-height:220px; border-radius:8px; border:1px solid var(--panel-border);">`;
    } else {
      prev.innerHTML = `<div class="stu-sub">${esc(f.name)}</div>`;
    }
  }
});

document.getElementById('formHorario')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cursoId = document.getElementById('cursoHorario').value;
  const archivo = document.getElementById('archivoHorario').files[0];
  if (!cursoId || !archivo) { alert('Selecciona un curso y un archivo.'); return; }

  const btn = document.getElementById('btnSubirHorario');
  if (btn) { btn.textContent = 'Subiendo...'; btn.disabled = true; }

  try {
    const curso = cursosGlobal.find(c => String(c.id) === String(cursoId));
    const ext = (archivo.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `curso_${cursoId}_${Date.now()}.${ext}`;

    const { error: errUp } = await supabaseClient.storage
      .from(HORARIOS_BUCKET).upload(path, archivo, { contentType: archivo.type });
    if (errUp) throw errUp;

    const { data: pub } = supabaseClient.storage.from(HORARIOS_BUCKET).getPublicUrl(path);

    const { error: errDb } = await supabaseClient.from('cursos')
      .update({ horario_url: pub.publicUrl }).eq('id', cursoId);
    if (errDb) throw errDb;

    const anterior = pathDesdeUrlHorario(curso && curso.horario_url);
    if (anterior) await supabaseClient.storage.from(HORARIOS_BUCKET).remove([anterior]);

    alert('Horario subido con éxito');
    document.getElementById('formHorario').reset();
    const prev = document.getElementById('previewHorario');
    if (prev) prev.innerHTML = '';
    await inicializarPanel();
    cargarHorariosAdmin();
  } catch (err) {
    alert('Error al subir el horario: ' + err.message);
  } finally {
    if (btn) { btn.textContent = 'Subir Horario'; btn.disabled = false; }
  }
});

async function cargarHorariosAdmin() {
  const cont = document.getElementById('listaHorariosAdmin');
  if (!cont) return;
  cont.innerHTML = '<p style="color:var(--text-faint);">Cargando...</p>';

  const { data, error } = await supabaseClient.from('cursos').select('*');
  if (error) { cont.innerHTML = '<p style="color:red;">Error al cargar cursos.</p>'; return; }
  cursosGlobal = data || [];
  llenarSelectHorario();

  if (!cursosGlobal.length) {
    cont.innerHTML = '<p style="color:var(--text-faint);">No hay cursos registrados.</p>';
    return;
  }

  cont.innerHTML = cursosGlobal.map(c => {
    const tiene = !!c.horario_url;
    const pdf = esPdf(c.horario_url);
    const mini = !tiene
      ? `<div class="media-box" style="width:70px; aspect-ratio:1; cursor:default;">—</div>`
      : pdf
        ? `<div class="media-box" style="width:70px; aspect-ratio:1;" onclick="verHorarioAdmin('${esc(c.id)}')">PDF</div>`
        : `<div class="media-box" style="width:70px; aspect-ratio:1;" onclick="verHorarioAdmin('${esc(c.id)}')"><img src="${esc(c.horario_url)}" alt="Horario" loading="lazy"></div>`;
    return `
      <div style="background:var(--input-bg); border:1px solid var(--panel-border); padding:0.8rem 1rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div style="display:flex; align-items:center; gap:0.8rem;">
          ${mini}
          <div>
            <strong>${esc(c.nombre)}</strong>
            <div class="stu-sub">${tiene ? 'Horario cargado' : 'Sin horario'}</div>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          ${tiene ? `<button class="ficha-btn" onclick="verHorarioAdmin('${esc(c.id)}')">Ver</button>
          <button class="ficha-btn btn-bad" onclick="eliminarHorario('${esc(c.id)}')">Quitar</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

function verHorarioAdmin(id) {
  const c = cursosGlobal.find(x => String(x.id) === String(id));
  if (!c || !c.horario_url) return;
  const visor = document.getElementById('visorContenido');
  if (visor) {
    visor.innerHTML = esPdf(c.horario_url)
      ? `<iframe src="${esc(c.horario_url)}"></iframe>`
      : `<img src="${esc(c.horario_url)}" alt="Horario">`;
  }
  document.getElementById('visorOverlay')?.classList.add('show');
}

async function eliminarHorario(id) {
  if (!confirm('¿Quitar el horario de este curso?')) return;
  const c = cursosGlobal.find(x => String(x.id) === String(id));
  try {
    const { error } = await supabaseClient.from('cursos')
      .update({ horario_url: null }).eq('id', id);
    if (error) throw error;
    const path = pathDesdeUrlHorario(c && c.horario_url);
    if (path) await supabaseClient.storage.from(HORARIOS_BUCKET).remove([path]);
    await inicializarPanel();
    cargarHorariosAdmin();
  } catch (err) {
    alert('Error al quitar el horario: ' + err.message);
  }
}

/* =========================================================
   GESTIÓN DE TUTORES / INSTRUCTORES POR CURSO
   ========================================================= */
function llenarSelectTutor() {
  const sel = document.getElementById('cursoTutor');
  if (!sel) return;
  const previo = sel.value;
  sel.innerHTML = '<option value="">— Selecciona un curso —</option>' +
    cursosGlobal.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>`).join('');
  sel.value = previo;
}

document.getElementById('cursoTutor')?.addEventListener('change', (e) => {
  const cursoId = e.target.value;
  const curso = cursosGlobal.find(c => String(c.id) === String(cursoId));
  const preview = document.getElementById('previewTutor');

  if (curso) {
    document.getElementById('nombreTutorInput').value = curso.instructor_nombre || '';
    document.getElementById('tituloTutorInput').value = curso.instructor_titulo || '';
    if (preview) {
      preview.innerHTML = curso.instructor_foto
        ? `<img src="${esc(curso.instructor_foto)}" alt="Foto tutor" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border:2px solid var(--primary-blue);">`
        : '';
    }
  } else {
    document.getElementById('nombreTutorInput').value = '';
    document.getElementById('tituloTutorInput').value = '';
    if (preview) preview.innerHTML = '';
  }
});

document.getElementById('fotoTutorInput')?.addEventListener('change', (e) => {
  const prev = document.getElementById('previewTutor');
  const f = e.target.files[0];
  if (!f) return;
  if (prev && f.type.startsWith('image/')) {
    prev.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="Vista previa" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border:2px solid var(--primary-blue);">`;
  }
});

document.getElementById('formTutor')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cursoId = document.getElementById('cursoTutor').value;
  const nombreTutor = document.getElementById('nombreTutorInput').value.trim();
  const tituloTutor = document.getElementById('tituloTutorInput').value.trim();
  const archivoFoto = document.getElementById('fotoTutorInput').files[0];

  if (!cursoId || !nombreTutor) {
    alert('Selecciona un curso e ingresa el nombre del tutor.');
    return;
  }

  const btn = document.getElementById('btnGuardarTutor');
  if (btn) { btn.textContent = 'Guardando...'; btn.disabled = true; }

  try {
    const curso = cursosGlobal.find(c => String(c.id) === String(cursoId));
    let fotoUrl = curso?.instructor_foto || null;

    if (archivoFoto) {
      const ext = (archivoFoto.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `tutor_curso_${cursoId}_${Date.now()}.${ext}`;

      const { error: errUp } = await supabaseClient.storage
        .from(TUTORES_BUCKET)
        .upload(path, archivoFoto, { contentType: archivoFoto.type });

      if (errUp) throw errUp;

      const { data: pub } = supabaseClient.storage.from(TUTORES_BUCKET).getPublicUrl(path);
      fotoUrl = pub.publicUrl;
    }

    const { error: errDb } = await supabaseClient.from('cursos').update({
      instructor_nombre: nombreTutor,
      instructor_titulo: tituloTutor || null,
      instructor_foto: fotoUrl
    }).eq('id', cursoId);

    if (errDb) throw errDb;

    alert('Datos del tutor guardados con éxito.');
    document.getElementById('formTutor').reset();
    const prev = document.getElementById('previewTutor');
    if (prev) prev.innerHTML = '';
    await inicializarPanel();
    cargarTutoresAdmin();

  } catch (err) {
    alert('Error al guardar tutor: ' + err.message);
  } finally {
    if (btn) { btn.textContent = 'Guardar Tutor'; btn.disabled = false; }
  }
});

async function cargarTutoresAdmin() {
  const cont = document.getElementById('listaTutoresAdmin');
  if (!cont) return;
  cont.innerHTML = '<p style="color:var(--text-faint);">Cargando tutores...</p>';

  const { data, error } = await supabaseClient.from('cursos').select('*');
  if (error) { cont.innerHTML = '<p style="color:red;">Error al cargar tutores.</p>'; return; }
  cursosGlobal = data || [];
  llenarSelectTutor();

  if (!cursosGlobal.length) {
    cont.innerHTML = '<p style="color:var(--text-faint);">No hay cursos registrados.</p>';
    return;
  }

  cont.innerHTML = cursosGlobal.map(c => {
    const tieneTutor = !!c.instructor_nombre;
    const foto = c.instructor_foto
      ? `<img src="${esc(c.instructor_foto)}" alt="Tutor" style="width:50px; height:50px; border-radius:50%; object-fit:cover;">`
      : `<div style="width:50px; height:50px; border-radius:50%; background:var(--chip-bg); display:flex; align-items:center; justify-content:center; font-weight:bold;">👤</div>`;

    return `
      <div style="background:var(--input-bg); border:1px solid var(--panel-border); padding:0.8rem 1rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div style="display:flex; align-items:center; gap:0.8rem;">
          ${foto}
          <div>
            <strong>${esc(c.nombre)}</strong>
            <div style="font-size:0.85rem; color:var(--text-muted);">${tieneTutor ? esc(c.instructor_nombre) : 'Sin tutor asignado'} ${c.instructor_titulo ? `· ${esc(c.instructor_titulo)}` : ''}</div>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="ficha-btn" onclick="editarTutorAdmin('${esc(c.id)}')">${tieneTutor ? 'Modificar' : 'Asignar'}</button>
          ${tieneTutor ? `<button class="ficha-btn btn-bad" onclick="eliminarTutorAdmin('${esc(c.id)}')">Quitar Tutor</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

function editarTutorAdmin(id) {
  const sel = document.getElementById('cursoTutor');
  if (sel) {
    sel.value = id;
    sel.dispatchEvent(new Event('change'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

async function eliminarTutorAdmin(id) {
  if (!confirm('¿Seguro que deseas quitar la foto y datos del tutor de este curso?')) return;
  try {
    const { error } = await supabaseClient.from('cursos').update({
      instructor_nombre: null,
      instructor_titulo: null,
      instructor_foto: null
    }).eq('id', id);

    if (error) throw error;

    alert('Tutor eliminado del curso.');
    await inicializarPanel();
    cargarTutoresAdmin();
  } catch (err) {
    alert('Error al eliminar tutor: ' + err.message);
  }
}

/* =========================================================
   GESTIÓN DE LA GALERÍA WEB
   ========================================================= */
const GALERIA_BUCKET = 'fotos-galeria';

document.getElementById('galeriaArchivoInput')?.addEventListener('change', (e) => {
  const prev = document.getElementById('previewGaleriaAdmin');
  const f = e.target.files[0];
  if (!f) { if (prev) prev.innerHTML = ''; return; }
  if (prev) {
    if (f.type.startsWith('image/')) {
      prev.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="Vista previa" style="max-width:100%; max-height:200px; border-radius:8px; border:1px solid var(--panel-border);">`;
    } else {
      prev.innerHTML = `<div class="stu-sub">${esc(f.name)}</div>`;
    }
  }
});

document.getElementById('formGaleriaAdmin')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('galeriaTituloInput').value.trim();
  const archivo = document.getElementById('galeriaArchivoInput').files[0];
  if (!archivo) { alert('Selecciona una imagen.'); return; }

  const btn = document.getElementById('btnSubirGaleriaAdmin');
  if (btn) { btn.textContent = 'Subiendo...'; btn.disabled = true; }

  try {
    const ext = (archivo.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = `galeria_${fileName}`;

    const { error: uploadError } = await supabaseClient.storage
      .from(GALERIA_BUCKET)
      .upload(filePath, archivo, { contentType: archivo.type });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabaseClient.storage
      .from(GALERIA_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;

    const { error: dbError } = await supabaseClient
      .from('galeria')
      .insert([{ titulo: titulo || 'Actividad CEIC', imagen_url: publicUrl }]);

    if (dbError) throw dbError;

    alert('Imagen subida a la galería con éxito');
    document.getElementById('formGaleriaAdmin').reset();
    const prev = document.getElementById('previewGaleriaAdmin');
    if (prev) prev.innerHTML = '';
    cargarGaleriaAdmin();

  } catch (err) {
    alert('Error al subir la imagen: ' + err.message);
  } finally {
    if (btn) { btn.textContent = 'Subir a la Galería'; btn.disabled = false; }
  }
});

async function cargarGaleriaAdmin() {
  const contenedor = document.getElementById('listaGaleriaAdmin');
  if (!contenedor) return;
  contenedor.innerHTML = '<p style="color:var(--text-faint); grid-column:1/-1;">Cargando galería...</p>';

  try {
    const { data, error } = await supabaseClient
      .from('galeria')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      contenedor.innerHTML = '<p style="color:var(--text-faint); grid-column:1/-1;">No hay imágenes cargadas en la galería.</p>';
      return;
    }

    contenedor.innerHTML = data.map(item => `
      <div style="background:var(--input-bg); border:1px solid var(--panel-border); border-radius:8px; overflow:hidden; display:flex; flex-direction:column;">
        <div style="width:100%; height:150px; background:#000; overflow:hidden;">
          <img src="${esc(item.imagen_url)}" alt="${esc(item.titulo)}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
        </div>
        <div style="padding:0.7rem; display:flex; flex-direction:column; gap:0.4rem; flex:1; justify-content:space-between;">
          <div style="font-size:0.82rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${esc(item.titulo)}">${esc(item.titulo || 'Sin título')}</div>
          <button class="ficha-btn btn-bad" style="width:100%; padding:0.3rem;" onclick="eliminarFotoGaleria('${esc(item.id)}', '${esc(item.imagen_url)}')">Eliminar</button>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error al cargar galería admin:', err);
    contenedor.innerHTML = '<p style="color:red; grid-column:1/-1;">Error al cargar las imágenes de la galería.</p>';
  }
}

function extraerPathGaleria(url) {
  try {
    const urlObj = new URL(url);
    const partes = urlObj.pathname.split('/');
    const indexBucket = partes.indexOf(GALERIA_BUCKET);
    if (indexBucket !== -1 && indexBucket < partes.length - 1) {
      return partes.slice(indexBucket + 1).join('/');
    }
  } catch (e) {
    console.error('Error al parsear URL de galería:', e);
  }
  const m = (url || '').match(/\/fotos-galeria\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function eliminarFotoGaleria(id, url) {
  if (!confirm('¿Estás seguro de eliminar esta imagen de la galería?')) return;

  try {
    const path = extraerPathGaleria(url);
    if (path) {
      await supabaseClient.storage.from(GALERIA_BUCKET).remove([path]);
    }

    const { error: dbError } = await supabaseClient
      .from('galeria')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    alert('Imagen eliminada de la galería correctamente.');
    cargarGaleriaAdmin();

  } catch (err) {
    alert('Error al eliminar la imagen: ' + err.message);
  }
}

/* =========================================================
   PAGOS DE INSCRIPCIÓN Y VALIDACIÓN DE COMPROBANTES
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
  for (const c of cols) if (o && o[c] !== undefined && o[c] !== null && o[c] !== '') return o[c];
  return null;
};
const estadoDe = a => a[PAGOS_CFG.colEstado] || 'pendiente';

function extraerPath(url) {
  const m = (url || '').match(/\/object\/(?:public|sign|authenticated)\/[^/]+\/([^?]+)/);
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
  if (b) {
    b.textContent = pendientes;
    b.style.display = pendientes ? 'inline-block' : 'none';
  }
}

async function cargarPagos() {
  const cont = document.getElementById('listaPagos');
  if (!cont) return;
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
  if (info.pdf) return `<div class="media-box" ${clic}>Ver PDF</div>`;
  return `<div class="media-box" ${clic}><img src="${esc(info.url)}" alt="${tipo}" loading="lazy"></div>`;
}

function renderPagos() {
  const cont = document.getElementById('listaPagos');
  if (!cont) return;
  const filtro = document.getElementById('filtroEstadoPago')?.value || 'todos';
  const term = document.getElementById('searchPagos')?.value || '';

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
            <div class="stu-sub">${esc(a.nacionalidad || 'V')} ${esc(a.numero_identificacion)}</div>
          </div>
          <span class="badge st-${esc(est)}">${esc(est.toUpperCase())}</span>
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
          ${est !== 'aceptado' ? `<button class="ficha-btn btn-ok" onclick="aceptarPago('${id}')">Aceptar</button>` : ''}
          ${est !== 'archivado' ? `<button class="ficha-btn btn-warn" onclick="abrirArchivarPago('${id}')">Archivar</button>` : ''}
          <button class="ficha-btn btn-bad" onclick="rechazarPago('${id}')">Rechazar</button>
        </div>
        <button class="ficha-btn" style="background:transparent; border:1px solid var(--panel-border); color:var(--text-muted); margin-top:0.4rem;" onclick="verFichaPorId('${id}')">Ver ficha completa</button>
      </div>`;
  }).join('');
}

document.getElementById('filtroEstadoPago')?.addEventListener('change', renderPagos);
document.getElementById('searchPagos')?.addEventListener('input', renderPagos);

const visorOverlay = document.getElementById('visorOverlay');
function verMedia(id, tipo) {
  const info = (pagosCache[id] || {})[tipo];
  if (!info || !info.url) return;
  const visor = document.getElementById('visorContenido');
  if (visor) {
    visor.innerHTML = info.pdf
      ? `<iframe src="${esc(info.url)}"></iframe>`
      : `<img src="${esc(info.url)}" alt="${esc(tipo)}">`;
  }
  visorOverlay?.classList.add('show');
}

document.getElementById('visorClose')?.addEventListener('click', () => {
  visorOverlay?.classList.remove('show');
  const visor = document.getElementById('visorContenido');
  if (visor) visor.innerHTML = '';
});

async function actualizarEstadoPago(id, estado, motivo) {
  const { error } = await supabaseClient.from('inscripciones')
    .update({
      [PAGOS_CFG.colEstado]: estado,
      [PAGOS_CFG.colMotivo]: motivo || null,
      [PAGOS_CFG.colFechaRevision]: new Date().toISOString()
    })
    .eq('id', id);
  if (error) throw error;
}

async function aceptarPago(id) {
  if (!confirm('¿Aceptar este pago?')) return;
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
    await supabaseClient.from('pagos').upsert(registro, { onConflict: 'inscripcion_id' });
    await actualizarEstadoPago(id, 'aceptado', null);
    await cargarPagos();
  } catch (err) {
    alert('Error al aceptar el pago: ' + err.message);
  }
}

const motivoOverlay = document.getElementById('motivoOverlay');
function abrirArchivarPago(id) {
  pagoArchivandoId = id;
  const txt = document.getElementById('motivoTexto');
  if (txt) txt.value = '';
  motivoOverlay?.classList.add('show');
}

const cerrarMotivo = () => { motivoOverlay?.classList.remove('show'); pagoArchivandoId = null; };
document.getElementById('motivoClose')?.addEventListener('click', cerrarMotivo);
document.getElementById('motivoCancel')?.addEventListener('click', cerrarMotivo);
document.getElementById('motivoConfirm')?.addEventListener('click', async () => {
  const motivoInput = document.getElementById('motivoTexto');
  const motivo = motivoInput ? motivoInput.value.trim() : '';
  if (!motivo) { alert('Especifica el motivo.'); return; }
  try {
    await actualizarEstadoPago(pagoArchivandoId, 'archivado', motivo);
    await supabaseClient.from('pagos').delete().eq('inscripcion_id', pagoArchivandoId);
    cerrarMotivo();
    await cargarPagos();
  } catch (err) {
    alert('Error al archivar: ' + err.message);
  }
});

async function rechazarPago(id) {
  if (!confirm('¿Rechazar y eliminar la inscripción de este alumno?')) return;
  try {
    await supabaseClient.from('inscripciones').delete().eq('id', id);
    delete pagosCache[id];
    listadoCarpetas = {};
    await cargarPagos();
  } catch (err) {
    alert('Error al rechazar: ' + err.message);
  }
}

/* =========================================================
   INICIALIZACIÓN AL CARGAR LA PÁGINA
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  inicializarPanel();
});