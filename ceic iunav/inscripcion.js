// Configuración de Supabase (Reemplaza con tus credenciales de tu proyecto)
const SUPABASE_URL ='https://fzvjhdeodahtxoolxzxx.supabase.co';
const SUPABASE_ANON_KEY ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dmpoZGVvZGFodHhvb2x4emt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODc5NjYsImV4cCI6MjEwMzc2Mzk2Nn0.CdAgxnvtMwsv1ryyrqpEdmS8ShqQMLALz5_ZwHsjSHc';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Cargar los cursos al abrir la página
async function cargarCursos() {
    const { data, error } = await supabaseClient.from('cursos').select('id, nombre');
    const select = document.getElementById('cursoSelect');
    
    if (error) {
        console.error('Error cargando cursos:', error);
        select.innerHTML = '<option value="">Error al cargar cursos</option>';
        return;
    }

    select.innerHTML = '<option value="">Seleccione un curso...</option>';
    data.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso.id;
        option.textContent = curso.nombre;
        select.appendChild(option);
    });
}

// 2. Función auxiliar para subir archivos a Supabase Storage
async function subirArchivo(file, carpeta) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabaseClient.storage
        .from('documentos-inscripcion')
        .upload(`${carpeta}/${fileName}`, file);

    if (error) throw error;

    // Obtener la URL pública del archivo subido
    const { data: publicUrlData } = supabaseClient.storage
        .from('documentos-inscripcion')
        .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
}

// 3. Manejar el envío del formulario
document.getElementById('formInscripcion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnEnviar = document.getElementById('btnEnviar');
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Procesando inscripción...';

    try {
        const cursoId = document.getElementById('cursoSelect').value;

        // Validar límite de 30 cupos en el curso seleccionado
        const { count, error: countError } = await supabaseClient
            .from('inscripciones')
            .select('*', { count: 'exact', head: true })
            .eq('curso_id', cursoId);

        if (countError) throw countError;

        if (count >= 30) {
            alert('Lo sentimos, este curso ya alcanzó el límite máximo de 30 personas.');
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Enviar Inscripción';
            return;
        }

        // Subir archivos al Storage
        const carnetFile = document.getElementById('fotoCarnet').files[0];
        const cedulaFile = document.getElementById('fotoCedula').files[0];
        const pagoFile = document.getElementById('comprobantePago').files[0];

        const carnetUrl = await subirArchivo(carnetFile, 'carnets');
        const cedulaUrl = await subirArchivo(cedulaFile, 'cedulas');
        const pagoUrl = await subirArchivo(pagoFile, 'pagos');

        // Insertar datos en la base de datos
        const { error: insertError } = await supabaseClient.from('inscripciones').insert([
            {
                curso_id: cursoId,
                numero_identificacion: document.getElementById('identificacion').value,
                nacionalidad: document.getElementById('nacionalidad').value,
                nombres: document.getElementById('nombres').value,
                apellidos: document.getElementById('apellidos').value,
                fecha_nacimiento: document.getElementById('fechaNacimiento').value,
                sexo: document.getElementById('sexo').value,
                telefono: document.getElementById('telefono').value,
                whatsapp: document.getElementById('whatsapp').value,
                correo_electronico: document.getElementById('correo').value,
                direccion: document.getElementById('direccion').value,
                municipio_ciudad: document.getElementById('municipio').value,
                estado: document.getElementById('estado').value,
                ocupacion: document.getElementById('ocupacion').value,
                nivel_educativo: document.getElementById('nivelEducativo').value,
                institucion: document.getElementById('institucion').value,
                foto_carnet_url: carnetUrl,
                foto_cedula_url: cedulaUrl,
                comprobante_pago_url: pagoUrl
            }
        ]);

        if (insertError) throw insertError;

        alert('¡Inscripción realizada con éxito! Sus datos y documentos han sido guardados.');
        document.getElementById('formInscripcion').reset();

    } catch (error) {
        console.error('Error en el proceso:', error);
        alert('Hubo un error al procesar la inscripción: ' + error.message);
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = 'Enviar Inscripción';
    }
});

// Inicializar la carga de cursos al cargar la ventana
window.onload = cargarCursos;