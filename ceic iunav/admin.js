const SUPABASE_URL = "https://fzvjhdeodahtxoolxzkx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dmpoZGVvZGFodHhvb2x4emt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODc5NjYsImV4cCI6MjEwMzc2Mzk2Nn0.CdAgxnvtMwsv1ryyrqpEdmS8ShqQMLALz5_ZwHsjSHc";
const LOGIN_URL = "ceic iunav/login.html"; // a donde te devuelve si no hay sesión

const TABLE_COURSES = "cursos";
const TABLE_STUDENTS = "inscripciones";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

(function checkSession() {
  let role = null;
  try { role = sessionStorage.getItem('ceic_role'); } catch (e) {}
  if (role !== 'admin' && LOGIN_URL !== "ceic iunav/login.html") {
    window.location.href = LOGIN_URL;
  }
})();

const SEAL_SVG = `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <circle cx="200" cy="200" r="185" fill="none" stroke="#2B547E" stroke-width="18" />
  <path d="M 140 70 Q 160 70 160 90 L 160 110 Q 160 135 140 145 Q 120 135 120 110 L 120 90 Q 120 70 140 70 Z" fill="#800000" />
  <path d="M 140 70 Q 160 70 160 90 L 160 110 Q 160 135 140 145 Z" fill="#2B547E" />
  <path d="M 130 95 L 150 85 M 130 108 L 152 97 M 130 120 L 152 110" stroke="white" stroke-width="3" stroke-linecap="round" />
  <path d="M 230 100 L 260 85 L 290 100 Z" fill="#2B547E" />
  <rect x="232" y="100" width="56" height="6" fill="#2B547E" />
  <circle cx="260" cy="94" r="3" fill="white" />
  <rect x="237" y="110" width="6" height="25" fill="#2B547E" />
  <rect x="248" y="110" width="6" height="25" fill="#2B547E" />
  <rect x="259" y="110" width="6" height="25" fill="#2B547E" />
  <rect x="270" y="110" width="6" height="25" fill="#2B547E" />
  <rect x="281" y="110" width="6" height="25" fill="#2B547E" />
  <rect x="232" y="137" width="56" height="5" fill="#2B547E" />
  <path d="M 180 135 Q 190 128 200 135 Q 210 128 220 135 L 220 160 Q 210 153 200 160 Q 190 153 180 160 Z" fill="#800000" />
  <path d="M 200 135 L 200 160" stroke="white" stroke-width="2" />
  <line x1="80" y1="145" x2="110" y2="145" stroke="#000" stroke-width="5" />
  <line x1="80" y1="155" x2="110" y2="155" stroke="#000" stroke-width="5" />
  <line x1="290" y1="145" x2="320" y2="145" stroke="#000" stroke-width="5" />
  <line x1="290" y1="155" x2="320" y2="155" stroke="#000" stroke-width="5" />
  <text x="200" y="255" font-family="'Times New Roman', Times, serif" font-weight="bold" font-size="95" fill="#000" text-anchor="middle" letter-spacing="2">CEIC</text>
  <text x="200" y="288" font-family="'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="11.5" fill="#111" text-anchor="middle" letter-spacing="0.5">CENTRO EDUCATIVO INTEGRAL COMUNITARIO</text>
</svg>`;
document.getElementById('sealSlot1').innerHTML = SEAL_SVG;
document.getElementById('sealSlot2').innerHTML = SEAL_SVG;

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

let COURSES = [];
let activeCourseId = null;
let searchTerm = "";

async function loadFromSupabase() {
  const { data: courses, error: e1 } = await supabaseClient.from(TABLE_COURSES).select('*');
  if (e1) { console.error(e1); return loadMockData(); }

  const { data: students, error: e2 } = await supabaseClient.from(TABLE_STUDENTS).select('*');
  if (e2) { console.error(e2); return loadMockData(); }

  return courses.map(c => ({
    id: c.id, name: c.nombre, period: c.periodo || "",
    students: students.filter(s => s.curso_id === c.id)
  }));
}

function loadMockData() {
  return [
    {
      id: "1basA", name: "Primero Básico A", period: "2026",
      students: [
        { 
          numero_identificacion: "12345678", nombres: "Camila Andrea", apellidos: "Fuentes Rojas", 
          fecha_nacimiento: "2019-03-12", sexo: "Femenino", telefono: "+56 9 1234 5678", 
          whatsapp: "+56 9 1234 5678", correo_electronico: "camila@correo.com", direccion: "Pasaje Los Aromos 214", 
          municipio_ciudad: "Santiago", estado: "Metropolitana", nacionalidad: "Chilena", 
          ocupacion: "Estudiante", nivel_educativo: "Básica", institucion: "CEIC" 
        }
      ]
    }
  ];
}

function renderSidebar() {
  document.getElementById('courseList').innerHTML = COURSES.map(c => `
    <div class="course-item ${c.id === activeCourseId ? 'active' : ''}" data-id="${esc(c.id)}">
      <div class="cname">${esc(c.name)}</div>
      <div class="ccount">${c.students.length} alumnos · ${esc(c.period)}</div>
    </div>
  `).join('');
}

function renderStats() {
  const totalStudents = COURSES.reduce((a, c) => a + c.students.length, 0);
  document.getElementById('statsRow').innerHTML = `
    <div class="stat"><div class="num">${COURSES.length}</div><div class="lbl">Cursos activos</div></div>
    <div class="stat"><div class="num">${totalStudents}</div><div class="lbl">Alumnos inscritos</div></div>
    <div class="stat"><div class="num">2</div><div class="lbl">Administradores</div></div>
  `;
}

function renderStudents() {
  const course = COURSES.find(c => c.id === activeCourseId);
  if (!course) return;

  document.getElementById('courseTitle').textContent = course.name;
  document.getElementById('courseSub').textContent = `${course.students.length} alumnos inscritos · Año ${course.period}`;

  const term = searchTerm.toLowerCase();
  const filtered = course.students.filter(s =>
    (`${s.nombres} ${s.apellidos}`.toLowerCase().includes(term)) || 
    String(s.numero_identificacion || "").toLowerCase().includes(term)
  );

  const body = document.getElementById('studentBody');
  const empty = document.getElementById('emptyState');

  if (filtered.length === 0) {
    body.innerHTML = "";
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  body.innerHTML = filtered.map(s => `
    <tr>
      <td><div class="stu-name">${esc(s.nombres)} ${esc(s.apellidos)}</div><div class="stu-sub">Nac. ${esc(s.fecha_nacimiento)}</div></td>
      <td><span class="badge">#${esc(s.numero_identificacion)}</span></td>
      <td>${esc(s.correo_electronico || 'N/D')}</td>
      <td>${esc(s.telefono || s.whatsapp || 'N/D')}</td>
      <td class="row-actions"><button class="ficha-btn" data-id="${esc(s.numero_identificacion)}">Generar ficha</button></td>
    </tr>
  `).join('');
}

function render() {
  renderSidebar();
  renderStats();
  renderStudents();
}

function openFicha(numeroId) {
  const course = COURSES.find(c => c.id === activeCourseId);
  const s = course?.students.find(x => String(x.numero_identificacion) === String(numeroId));
  if (!s) return;
  
  document.getElementById('fichaFields').innerHTML = `
    <div class="ficha-field"><span class="k">Nombres y Apellidos</span><span class="v">${esc(s.nombres)} ${esc(s.apellidos)}</span></div>
    <div class="ficha-field"><span class="k">N° de Identificación</span><span class="v">${esc(s.numero_identificacion)}</span></div>
    <div class="ficha-field"><span class="k">Curso</span><span class="v">${esc(course.name)}</span></div>
    <div class="ficha-field"><span class="k">Fecha de Nacimiento</span><span class="v">${esc(s.fecha_nacimiento)}</span></div>
    <div class="ficha-field"><span class="k">Sexo</span><span class="v">${esc(s.sexo)}</span></div>
    <div class="ficha-field"><span class="k">Teléfono</span><span class="v">${esc(s.telefono)}</span></div>
    <div class="ficha-field"><span class="k">WhatsApp</span><span class="v">${esc(s.whatsapp)}</span></div>
    <div class="ficha-field"><span class="k">Correo Electrónico</span><span class="v">${esc(s.correo_electronico)}</span></div>
    <div class="ficha-field"><span class="k">Dirección</span><span class="v">${esc(s.direccion)}</span></div>
    <div class="ficha-field"><span class="k">Municipio / Ciudad</span><span class="v">${esc(s.municipio_ciudad)}</span></div>
    <div class="ficha-field"><span class="k">Estado</span><span class="v">${esc(s.estado)}</span></div>
    <div class="ficha-field"><span class="k">Nacionalidad</span><span class="v">${esc(s.nacionalidad)}</span></div>
    <div class="ficha-field"><span class="k">Ocupación</span><span class="v">${esc(s.ocupacion)}</span></div>
    <div class="ficha-field"><span class="k">Nivel Educativo</span><span class="v">${esc(s.nivel_educativo)}</span></div>
    <div class="ficha-field"><span class="k">Institución</span><span class="v">${esc(s.institucion)}</span></div>
  `;
  document.getElementById('fichaOverlay').classList.add('show');
}

document.getElementById('courseList').addEventListener('click', e => {
  const item = e.target.closest('.course-item');
  if (!item) return;
  activeCourseId = item.dataset.id;
  searchTerm = "";
  document.getElementById('searchInput').value = "";
  render();
});

document.getElementById('studentBody').addEventListener('click', e => {
  const btn = e.target.closest('.ficha-btn');
  if (btn) openFicha(btn.dataset.id);
});

document.getElementById('searchInput').addEventListener('input', e => {
  searchTerm = e.target.value;
  renderStudents();
});

document.getElementById('fichaClose').addEventListener('click', () => document.getElementById('fichaOverlay').classList.remove('show'));
document.getElementById('fichaCancelBtn').addEventListener('click', () => document.getElementById('fichaOverlay').classList.remove('show'));
document.getElementById('fichaPrintBtn').addEventListener('click', () => window.print());
document.getElementById('fichaOverlay').addEventListener('click', e => {
  if (e.target.id === 'fichaOverlay') e.currentTarget.classList.remove('show');
});

try {
  const storedUser = sessionStorage.getItem('ceic_username');
  if (storedUser) document.getElementById('adminLabel').textContent = storedUser;
} catch (e) {}

const SUN_SVG = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
const MOON_SVG = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
document.getElementById('themeToggle').addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  document.getElementById('themeIcon').innerHTML = next === 'dark' ? SUN_SVG : MOON_SVG;
});

(async function init() {
  COURSES = supabaseClient ? await loadFromSupabase() : loadMockData();
  if (COURSES.length === 0) COURSES = loadMockData();
  activeCourseId = COURSES[0].id;
  render();
})();