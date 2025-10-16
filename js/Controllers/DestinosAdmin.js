const API_URL = 'http://localhost:8080/ApiDestinos';
let destinos = [];
let paginaActual = 0;
let tamañoPagina = 10;
let destinosFiltrados = [];

// Obtener token de autenticación
function obtenerToken() {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') || 
           sessionStorage.getItem('authToken') || 
           sessionStorage.getItem('token');
}

// Verificar autenticación al cargar la página
function verificarAutenticacion() {
    const token = obtenerToken();
    const userData = localStorage.getItem('userData') || localStorage.getItem('usuarioLogueado');
    
    if (!token) {
        Swal.fire({
            title: 'Sesión expirada',
            text: 'Por favor, inicia sesión nuevamente.',
            icon: 'warning',
            confirmButtonText: 'Ir al login'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return false;
    }
    
    try {
        if (userData) {
            const usuario = JSON.parse(userData);
            document.getElementById('userName').textContent = usuario.usuario || usuario.nombre || 'Usuario';
            document.getElementById('userRole').textContent = usuario.idRango === 1 ? 'Administrador' : 'Empleado';
            
            const nombre = usuario.usuario || usuario.nombre || 'Usuario';
            const iniciales = nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            document.getElementById('userAvatar').textContent = iniciales;
        }
        
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
    
    return true;
}

// Cargar destinos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    if (verificarAutenticacion()) {
        cargarDestinos();
    }
});

// Función para cargar destinos desde la API
async function cargarDestinos() {
    try {
        const token = obtenerToken();
        
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        console.log('🔑 Token usado:', token ? 'Sí' : 'No');
        console.log('🌐 Haciendo request a:', `${API_URL}/ListaDestino`);

        const response = await fetch(`${API_URL}/ListaDestino`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('token');
            
            Swal.fire({
                title: 'Sesión expirada',
                text: 'Por favor, inicia sesión nuevamente.',
                icon: 'warning',
                confirmButtonText: 'Ir al login'
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }

        if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.text();
                console.error('📋 Error del servidor:', errorData);
                if (errorData) {
                    errorMessage += ` - ${errorData}`;
                }
            } catch (e) {
                console.error('No se pudo leer el error:', e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('📊 Datos recibidos:', data);

        // Manejar diferentes formatos de respuesta
        if (Array.isArray(data)) {
            destinos = data;
        } else if (data.content && Array.isArray(data.content)) {
            destinos = data.content;
        } else if (data.destinos && Array.isArray(data.destinos)) {
            destinos = data.destinos;
        } else if (data.data && Array.isArray(data.data)) {
            destinos = data.data;
        } else {
            console.warn('Formato de respuesta inesperado, intentando convertir:', data);
            destinos = Object.values(data).find(val => Array.isArray(val)) || [];
        }

        console.log('✅ Destinos procesados:', destinos);

        // Verificar que destinos sea un array
        if (!Array.isArray(destinos)) {
            console.error('❌ destinos no es un array:', destinos);
            destinos = [];
        }

        destinosFiltrados = [...destinos];
        mostrarDestinos();
        actualizarPaginacion();
        
    } catch (error) {
        console.error('❌ Error cargando destinos:', error);
        
        let mensajeError = 'Error al cargar los destinos';
        if (error.message.includes('401')) {
            mensajeError = 'No autorizado. Por favor, inicie sesión nuevamente.';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
        
        document.getElementById('tablaBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                    <p style="margin-top: 10px;">${mensajeError}</p>
                    <p style="font-size: 12px; margin-top: 5px;">${error.message}</p>
                    <button onclick="cargarDestinos()" class="btn-action" style="background: var(--primary); color: white; margin-top: 10px;">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
}

// Función para mostrar destinos en la tabla
function mostrarDestinos() {
    const tablaBody = document.getElementById('tablaBody');
    
    // Verificar que destinosFiltrados sea un array
    if (!Array.isArray(destinosFiltrados)) {
        console.error('❌ destinosFiltrados no es un array:', destinosFiltrados);
        destinosFiltrados = [];
    }

    const inicio = paginaActual * tamañoPagina;
    const fin = inicio + tamañoPagina;
    const destinosPagina = destinosFiltrados.slice(inicio, fin);

    if (destinosPagina.length === 0) {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="fas fa-map-marker-alt" style="font-size: 24px; color: var(--warning);"></i>
                    <p style="margin-top: 10px;">No se encontraron destinos</p>
                </td>
            </tr>
        `;
        return;
    }

    // Manejar posibles errores en el mapeo
    try {
        tablaBody.innerHTML = destinosPagina.map(destino => {
            // Verificar que destino sea un objeto válido
            if (!destino || typeof destino !== 'object') {
                console.warn('❌ Destino inválido:', destino);
                return '';
            }

            const id = destino.idDestino || destino.id || destino.IdDestino || 'N/A';
            const nombre = destino.nombreDestino || destino.nombre || destino.NombreDestino || destino.NOMBREDESTINO || 'N/A';
            const lugar = destino.lugarDestino || destino.lugar || destino.LugarDestino || destino.LUGARDESTINO || 'N/A';
            const tipo = destino.tipoDestino || destino.tipo || destino.TipoDestino || destino.TIPODESTINO || 'N/A';
            const descripcion = destino.descripcionDestino || destino.descripcion || destino.DescripcionDestino || destino.DESCRIPCIONDESTINO || 'N/A';

            return `
                <tr>
                    <td>${id}</td>
                    <td>${nombre}</td>
                    <td>${lugar}</td>
                    <td>${tipo}</td>
                    <td>${descripcion}</td>
                    <td>
                        <div style="display: flex; gap: 4px; flex-wrap: nowrap;">
                            <button class="btn-action btn-edit" onclick="abrirModalEditar(${id})" title="Editar destino">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-action btn-delete" onclick="eliminarDestino(${id})" title="Eliminar destino">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('❌ Error al mostrar destinos:', error);
        tablaBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                    <p style="margin-top: 10px;">Error al mostrar los destinos</p>
                </td>
            </tr>
        `;
    }
}

// Función para actualizar la paginación
function actualizarPaginacion() {
    const pagination = document.getElementById('pagination');
    const totalPaginas = Math.ceil(destinosFiltrados.length / tamañoPagina);
    
    if (totalPaginas <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginacionHTML = '';
    
    paginacionHTML += `
        <button class="page-btn" ${paginaActual === 0 ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    for (let i = 0; i < totalPaginas; i++) {
        paginacionHTML += `
            <button class="page-btn ${i === paginaActual ? 'active' : ''}" onclick="cambiarPagina(${i})">
                ${i + 1}
            </button>
        `;
    }

    paginacionHTML += `
        <button class="page-btn" ${paginaActual === totalPaginas - 1 ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = paginacionHTML;
}

// Función para cambiar de página
function cambiarPagina(pagina) {
    paginaActual = pagina;
    mostrarDestinos();
    actualizarPaginacion();
}

// Función para cambiar el tamaño de página
function cambiarTamañoPagina() {
    tamañoPagina = parseInt(document.getElementById('pageSize').value);
    paginaActual = 0;
    mostrarDestinos();
    actualizarPaginacion();
}

// Función para filtrar destinos
function filtrarDestinos() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm === '') {
        destinosFiltrados = [...destinos];
    } else {
        destinosFiltrados = destinos.filter(destino => {
            const nombre = (destino.nombreDestino || destino.nombre || destino.NombreDestino || destino.NOMBREDESTINO || '').toLowerCase();
            const lugar = (destino.lugarDestino || destino.lugar || destino.LugarDestino || destino.LUGARDESTINO || '').toLowerCase();
            const tipo = (destino.tipoDestino || destino.tipo || destino.TipoDestino || destino.TIPODESTINO || '').toLowerCase();
            const descripcion = (destino.descripcionDestino || destino.descripcion || destino.DescripcionDestino || destino.DESCRIPCIONDESTINO || '').toLowerCase();
            
            return nombre.includes(searchTerm) ||
                   lugar.includes(searchTerm) ||
                   tipo.includes(searchTerm) ||
                   descripcion.includes(searchTerm);
        });
    }
    
    paginaActual = 0;
    mostrarDestinos();
    actualizarPaginacion();
}

// Funciones para los modales
function abrirModalAgregar() {
    document.getElementById('mdAgregar').showModal();
    document.getElementById('frmAgregar').reset();
}

function cerrarModalAgregar() {
    document.getElementById('mdAgregar').close();
}

function abrirModalEditar(id) {
    const destino = destinos.find(d => (d.idDestino || d.id || d.IdDestino) == id);
    if (destino) {
        document.getElementById('txtIdEditar').value = destino.idDestino || destino.id || destino.IdDestino;
        document.getElementById('txtNombreDestinoEditar').value = destino.nombreDestino || destino.nombre || destino.NombreDestino || '';
        document.getElementById('txtLugarDestinoEditar').value = destino.lugarDestino || destino.lugar || destino.LugarDestino || '';
        document.getElementById('txtTipoDestinoEditar').value = destino.tipoDestino || destino.tipo || destino.TipoDestino || '';
        document.getElementById('txtDescripcionDestinoEditar').value = destino.descripcionDestino || destino.descripcion || destino.DescripcionDestino || '';
        
        document.getElementById('mdEditar').showModal();
    }
}

function cerrarModalEditar() {
    document.getElementById('mdEditar').close();
}

// Función para agregar destino
async function agregarDestino(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;
    
    const nuevoDestino = {
        nombreDestino: document.getElementById('txtNombreDestino').value,
        lugarDestino: document.getElementById('txtLugarDestino').value,
        tipoDestino: document.getElementById('txtTipoDestino').value,
        descripcionDestino: document.getElementById('txtDescripcionDestino').value || null
    };

    try {
        const token = obtenerToken();
        const response = await fetch(`${API_URL}/registrarDestinos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoDestino)
        });

        if (response.status === 401) {
            throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al agregar destino');
        }

        const result = await response.json();

        await Swal.fire({
            title: '¡Éxito!',
            text: 'Destino agregado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });

        cerrarModalAgregar();
        await cargarDestinos();
        
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo agregar el destino',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Función para actualizar destino
async function actualizarDestino(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    submitBtn.disabled = true;
    
    const id = document.getElementById('txtIdEditar').value;
    const destinoActualizado = {
        nombreDestino: document.getElementById('txtNombreDestinoEditar').value,
        lugarDestino: document.getElementById('txtLugarDestinoEditar').value,
        tipoDestino: document.getElementById('txtTipoDestinoEditar').value,
        descripcionDestino: document.getElementById('txtDescripcionDestinoEditar').value || null
    };

    try {
        const token = obtenerToken();
        const response = await fetch(`${API_URL}/editarDestino/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(destinoActualizado)
        });

        if (response.status === 401) {
            throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar destino');
        }

        await Swal.fire({
            title: '¡Éxito!',
            text: 'Destino actualizado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });

        cerrarModalEditar();
        await cargarDestinos();
        
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo actualizar el destino',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Función para eliminar destino
async function eliminarDestino(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const token = obtenerToken();
            const response = await fetch(`${API_URL}/eliminarDestino/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
            }

            if (!response.ok) {
                throw new Error('Error al eliminar destino');
            }

            await Swal.fire({
                title: '¡Eliminado!',
                text: 'Destino eliminado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });

            await cargarDestinos();
            
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo eliminar el destino',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    }
}

// Función para cerrar sesión
async function cerrarSesion() {
    const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Se cerrará tu sesión actual.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#2c5aa0",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Sí, cerrar sesión",
        cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
        try {
            Swal.fire({
                title: 'Cerrando sesión...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('usuarioLogueado');
            localStorage.removeItem('token');
            
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('userData');
            sessionStorage.removeItem('usuarioLogueado');
            sessionStorage.removeItem('token');

            Swal.close();
            
            await Swal.fire({
                title: 'Sesión cerrada',
                text: 'Has cerrado sesión exitosamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            window.location.href = 'login.html?logout=true';

        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al cerrar sesión.',
                icon: 'error',
                confirmButtonText: 'Entendido'
            });
        }
    }
}

// Función para el menú de usuario
function toggleUserMenu() {
    const userData = localStorage.getItem('userData') || localStorage.getItem('usuarioLogueado');
    
    try {
        const usuario = JSON.parse(userData);
        const nombre = usuario.usuario || usuario.nombre || 'Usuario';
        const email = usuario.correo || usuario.email || 'usuario@exploreworld.com';
        const rol = usuario.idRango === 1 ? 'Administrador' : 'Empleado';
        const iniciales = nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

        Swal.fire({
            title: 'Perfil de Usuario',
            html: `
                <div style="text-align: left; padding: 15px 0;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                        <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #2c5aa0, #3b82f6); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">${iniciales}</div>
                        <div>
                            <div style="font-weight: bold; font-size: 18px;">${nombre}</div>
                            <div style="color: #64748B; font-size: 14px;">${rol}</div>
                            <div style="color: #64748B; font-size: 12px;">${email}</div>
                        </div>
                    </div>
                    <div style="border-top: 1px solid #E2E8F0; padding-top: 15px;">
                        <button onclick="cerrarSesion()" style="width: 100%; padding: 12px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; cursor: pointer; color: #DC2626; font-weight: 600;">
                            <i class="fas fa-sign-out-alt" style="margin-right: 8px;"></i>Cerrar Sesión
                        </button>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            width: 400
        });
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los datos del perfil.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }
}