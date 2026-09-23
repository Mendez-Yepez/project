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
} catch(e){}

// Tema Claro / Oscuro
const root = document.documentElement;
document.getElementById('themeToggle').addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  root.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
});

/* =========================================================
   NAVEGACIÓN ENTRE VISTAS DEL PANEL
   ========================================================= */
function cambiarVista(vista) {
  document.querySelectorAll('.course-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.vista-panel').forEach(el => el.style.display = 'none');

  if (vista === 'alumnos') {
    document.getElementById('menuAlumnos').classList.add('active');
    document.getElementById('seccionAlumnos').style.display = 'block';
  } else if (vista === 'cursos') {
    document.getElementById('menuCursos').classList.add('active');
    document.getElementById('seccionCursos').style.display = 'block';
    cargarCursosAdmin();
  } else if (vista === 'horarios') {
    document.getElementById('menuHorarios').classList.add('active');
    document.getElementById('seccionHorarios').style.display = 'block';
  }
}

/* =========================================================
   CARGAR CURSOS Y ALUMNOS INSCRITOS
   ========================================================= */
let cursosGlobal = [];
let cursoSeleccionadoId = null;
let alumnosGlobal = [];

async function inicializarPanel() {
  try {
    const { data: cursos, error } = await supabaseClient.from('cursos').select('*');
    if (error) throw error;
    cursosGlobal = cursos || [];

    const courseListEl = document.getElementById('courseList');
    courseListEl.innerHTML = '';

    if (cursosGlobal.length === 0) {
      courseListEl.innerHTML = '<span style="font-size:0.8rem; color:var(--text-faint); padding:0.5rem;">No hay cursos. Crea uno nuevo.</span>';
      cargarAlumnosDeCurso(null);
      return;
    }

    cursosGlobal.forEach((curso, index) => {
      const div = document.createElement('div');
      div.className = `course-item ${index === 0 ? 'active' : ''}`;
      div.innerHTML = `<span class="cname">${curso.nombre}</span><span class="ccount" id="count_${curso.id}">Cargando...</span>`;
      div.onclick = () => {
        document.querySelectorAll('.sidebar .course-item').forEach(el => el.classList.remove('active'));
        div.classList.add('active');
        cambiarVista('alumnos');
        cargarAlumnosDeCurso(curso.id);
      };
      courseListEl.appendChild(div);
    });

    if (cursosGlobal.length > 0) {
      cargarAlumnosDeCurso(cursosGlobal[0].id);
    }
  } catch (err) {
    console.error('Error al inicializar panel:', err);
  }
}

async function cargarAlumnosDeCurso(cursoId) {
  cursoSeleccionadoId = cursoId;
  const cursoActual = cursosGlobal.find(c => c.id === cursoId);
  
  document.getElementById('courseTitle').textContent = cursoActual ? cursoActual.nombre : 'Sin curso seleccionado';
  document.getElementById('courseSub').textContent = cursoActual ? (cursoActual.descripcion || 'Alumnos inscritos en este programa') : '';

  try {
    let query = supabaseClient.from('inscripciones').select('*');
    if (cursoId) query = query.eq('curso_id', cursoId);

    const { data, error } = await query;
    if (error) throw error;

    alumnosGlobal = data || [];
    renderizarAlumnos(alumnosGlobal);

    if (cursoId) {
      const badgeCount = document.getElementById(`count_${cursoId}`);
      if (badgeCount) badgeCount.textContent = `${alumnosGlobal.length} inscrito/s`;
    }
  } catch (err) {
    console.error('Error cargando alumnos:', err);
  }
}

function renderizarAlumnos(lista) {
  const tbody = document.getElementById('studentBody');
  const emptyState = document.getElementById('emptyState');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  lista.forEach(alumno => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="stu-name">${alumno.nombres} ${alumno.apellidos}</div>
        <div class="stu-sub">${alumno.nacionalidad || ''}</div>
      </td>
      <td><span class="badge">${alumno.numero_identificacion}</span></td>
      <td>${alumno.telefono || 'N/A'}</td>
      <td>${alumno.correo_electronico || 'N/A'}</td>
      <td>
        <div class="row-actions">
          <button class="ficha-btn" onclick='verFicha(${JSON.stringify(alumno)})'>Ver Ficha</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Búsqueda en tiempo real
document.getElementById('searchInput').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtrados = alumnosGlobal.filter(a => 
    `${a.nombres} ${a.apellidos}`.toLowerCase().includes(term) ||
    a.numero_identificacion.toLowerCase().includes(term)
  );
  renderizarAlumnos(filtrados);
});

/* =========================================================
   FICHA PERSONAL Y EXPORTAR A PDF
   ========================================================= */
const fichaOverlay = document.getElementById('fichaOverlay');

function verFicha(alumno) {
  const camposContainer = document.getElementById('fichaFields');
  camposContainer.innerHTML = `
    <div class="ficha-field"><span class="k">Nombres y Apellidos:</span><span class="v">${alumno.nombres} ${alumno.apellidos}</span></div>
    <div class="ficha-field"><span class="k">Cédula / Identificación:</span><span class="v">${alumno.nacionalidad || ''} - ${alumno.numero_identificacion}</span></div>
    <div class="ficha-field"><span class="k">Fecha de Nacimiento:</span><span class="v">${alumno.fecha_nacimiento || 'N/A'}</span></div>
    <div class="ficha-field"><span class="k">Sexo:</span><span class="v">${alumno.sexo || 'N/A'}</span></div>
    <div class="ficha-field"><span class="k">Teléfono / WhatsApp:</span><span class="v">${alumno.telefono} / ${alumno.whatsapp}</span></div>
    <div class="ficha-field"><span class="k">Correo Electrónico:</span><span class="v">${alumno.correo_electronico}</span></div>
    <div class="ficha-field"><span class="k">Ubicación:</span><span class="v">${alumno.municipio_ciudad || ''}, ${alumno.estado || ''}</span></div>
    <div class="ficha-field"><span class="k">Dirección:</span><span class="v">${alumno.direccion || 'N/A'}</span></div>
    <div class="ficha-field"><span class="k">Ocupación:</span><span class="v">${alumno.ocupacion || 'N/A'}</span></div>
    <div class="ficha-field"><span class="k">Nivel Educativo:</span><span class="v">${alumno.nivel_educativo || 'N/A'}</span></div>
    <div class="ficha-field"><span class="k">Institución / Empresa:</span><span class="v">${alumno.institucion || 'N/A'}</span></div>
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
      // Actualizar
      const { error } = await supabaseClient.from('cursos').update({
        nombre, descripcion, modalidad, costo, cupo_maximo, fecha_culminacion
      }).eq('id', id);
      if (error) throw error;
      alert('¡Curso actualizado con éxito!');
    } else {
      // Insertar nuevo
      const { error } = await supabaseClient.from('cursos').insert([{
        nombre, descripcion, modalidad, costo, cupo_maximo, fecha_culminacion
      }]);
      if (error) throw error;
      alert('¡Curso registrado con éxito!');
    }

    modalCursoOverlay.classList.remove('show');
    inicializarPanel();
    if(document.getElementById('seccionCursos').style.display === 'block') {
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

  contenedor.innerHTML = '';
  data.forEach(curso => {
    contenedor.innerHTML += `
      <div style="background:var(--input-bg); border:1px solid var(--panel-border); padding:1rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <strong style="font-size:1rem; color:var(--text-main);">${curso.nombre}</strong>
          <p style="font-size:0.8rem; color:var(--text-faint); margin-top:0.2rem;">${curso.descripcion || 'Sin descripción'} | Modalidad: ${curso.modalidad || 'N/A'} | Costo: $${curso.costo || 0}</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="ficha-btn" onclick='abrirModalCurso(${JSON.stringify(curso)})'>Modificar</button>
          <button class="ficha-btn" style="background:var(--accent-red);" onclick="eliminarCurso('${curso.id}')">Eliminar</button>
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
    inicializarPanel();
    cargarCursosAdmin();
  }
}

/* =========================================================
   SUBIR HORARIOS
   ========================================================= */
document.getElementById('formHorario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('tituloHorario').value;
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

// Inicializar al cargar la ventana
window.onload = inicializarPanel;