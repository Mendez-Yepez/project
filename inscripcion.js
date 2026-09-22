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
    // Capturar valores
    const cedula = document.getElementById('identificacion').value.trim();
    const nacionalidad = document.getElementById('nacionalidad').value;
    const nombres = document.getElementById('nombres').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const municipio = document.getElementById('municipio').value.trim();
    const ocupacion = document.getElementById('ocupacion').value.trim();
    const institucion = document.getElementById('institucion').value.trim();

    // Expresiones regulares
    const soloNumeros = /^[0-9]+$/;
    const soloLetrasYEspacios = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    // ==========================================
    // NUEVAS REGLAS DE VALIDACIÓN
    // ==========================================

    // 1. Validación de Cédula según Nacionalidad y tamaño
    if (!soloNumeros.test(cedula)) {
        alert('La Cédula de Identidad solo debe contener números.');
        document.getElementById('identificacion').focus();
        return;
    }

    if (nacionalidad === 'Venezolana') {
        // Cédula venezolana típica (ej. 6 a 8 dígitos)
        if (cedula.length < 6 || cedula.length > 8) {
            alert('Para nacionalidad Venezolana, la cédula debe tener entre 6 y 8 dígitos.');
            document.getElementById('identificacion').focus();
            return;
        } 
    } else if (nacionalidad === 'Extranjero') {
        // Cédula de extranjero / pasaporte (suele ser más grande, ej. mayor a 8 o hasta 12 dígitos)
        if (cedula.length < 7 || cedula.length > 15) {
            alert('Para extranjeros, la cédula o documento debe ser válido (entre 7 y 15 dígitos).');
            document.getElementById('identificacion').focus();
            return;
        }
    }

    // 2. Validación de Nombres y Apellidos (Máximo 20 caracteres)
    if (!soloLetrasYEspacios.test(nombres) || !soloLetrasYEspacios.test(apellidos)) {
        alert('Los Nombres y Apellidos solo deben contener letras.');
        return;
    }

    if (nombres.length > 20 || apellidos.length > 20) {
        alert('Los Nombres y Apellidos no pueden tener más de 20 caracteres cada uno.');
        return;
    }

    // 3. Validación de Teléfonos (Solo números y longitud coherente, ej. mínimo 10, máximo 15)
    if (!soloNumeros.test(telefono) || !soloNumeros.test(whatsapp)) {
        alert('Los campos de Teléfono y WhatsApp solo deben contener números.');
        return;
    }

    if (telefono.length < 10 || telefono.length > 15 || whatsapp.length < 10 || whatsapp.length > 15) {
        alert('El número de teléfono o WhatsApp debe tener una longitud válida (entre 10 y 15 dígitos).');
        return;
    }

    // 4. Otros campos de texto
    if (!soloLetrasYEspacios.test(municipio) || !soloLetrasYEspacios.test(ocupacion) || !soloLetrasYEspacios.test(institucion)) {
        alert('Los campos de Municipio, Ocupación e Institución no deben contener números ni caracteres especiales.');
        return;
    }
    // ==========================================
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