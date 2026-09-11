// Configuración de Supabase (Reemplaza con tus credenciales de tu proyecto)
const SUPABASE_URL ='https://fzvjhdeodahtxoolxzkx.supabase.co'; 
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


async function subirArchivo(file, carpeta) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabaseClient.storage
        .from('documentos-inscripcion')
        .upload(`${carpeta}/${fileName}`, file);

    if (error) throw error;

    const { data: publicUrlData } = supabaseClient.storage
        .from('documentos-inscripcion')
        .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
}

document.getElementById('formInscripcion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnEnviar = document.getElementById('btnEnviar');

    // ==========================================
    // VALIDACIONES DE CAMPOS
    // ==========================================
    const cedula = document.getElementById('identificacion').value;
    const nombres = document.getElementById('nombres').value;
    const apellidos = document.getElementById('apellidos').value;
    const telefono = document.getElementById('telefono').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const municipio = document.getElementById('municipio').value;
    const ocupacion = document.getElementById('ocupacion').value;
    const institucion = document.getElementById('institucion').value;

    // Expresiones regulares
    const soloNumeros = /^[0-9]+$/;
    const soloLetrasYEspacios = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!soloNumeros.test(cedula)) {
        alert('La Cédula de Identidad solo debe contener números.');
        document.getElementById('identificacion').focus();
        return;
    }

    if (!soloNumeros.test(telefono) || !soloNumeros.test(whatsapp)) {
        alert('Los campos de Teléfono y WhatsApp solo deben contener números.');
        return;
    }

    if (!soloLetrasYEspacios.test(nombres) || !soloLetrasYEspacios.test(apellidos)) {
        alert('Los Nombres y Apellidos no deben contener números ni caracteres especiales.');
        return;
    }

    if (!soloLetrasYEspacios.test(municipio) || !soloLetrasYEspacios.test(ocupacion) || !soloLetrasYEspacios.test(institucion)) {
        alert('Los campos de Municipio, Ocupación e Institución no deben contener números ni caracteres especiales.');
        return;
    }
    // ==========================================

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
                numero_identificacion: cedula,
                nacionalidad: document.getElementById('nacionalidad').value,
                nombres: nombres,
                apellidos: apellidos,
                fecha_nacimiento: document.getElementById('fechaNacimiento').value,
                sexo: document.getElementById('sexo').value,
                telefono: telefono,
                whatsapp: whatsapp,
                correo_electronico: document.getElementById('correo').value,
                direccion: document.getElementById('direccion').value,
                municipio_ciudad: municipio,
                estado: document.getElementById('estado').value,
                ocupacion: ocupacion,
                nivel_educativo: document.getElementById('nivelEducativo').value,
                institucion: institucion,
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