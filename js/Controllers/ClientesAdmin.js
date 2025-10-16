const API_URL = 'http://localhost:8080/ApiCliente';
let clientes = [];
let paginaActual = 0;
let tamañoPagina = 10;
let clientesFiltrados = [];

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
        console.warn('No se encontró token de autenticación');
        redirigirALogin();
        return false;
    }
    
    try {
        if (userData) {
            const usuario = JSON.parse(userData);
            document.getElementById('userName').textContent = usuario.usuario || usuario.nombre || 'Usuario';
            document.getElementById('userRole').textContent = usuario.rol || (usuario.idRango === 1 ? 'Administrador' : 'Empleado');
            
            const nombre = usuario.usuario || usuario.nombre || 'Usuario';
            const iniciales = nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            document.getElementById('userAvatar').textContent = iniciales;
        }
        
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
    
    return true;
}

function redirigirALogin() {
    Swal.fire({
        title: 'Sesión expirada',
        text: 'Por favor, inicia sesión nuevamente.',
        icon: 'warning',
        confirmButtonText: 'Ir al login'
    }).then(() => {
        window.location.href = 'login.html';
    });
}

// Cargar clientes al iniciar
document.addEventListener('DOMContentLoaded', function() {
    if (verificarAutenticacion()) {
        cargarClientes();
    }
});

// Función para cargar clientes desde la API
async function cargarClientes() {
    try {
        const token = obtenerToken();
        
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        console.log('🔑 Token usado:', token);
        console.log('🌐 Haciendo request a:', `${API_URL}/ListaClientes`);

        const response = await fetch(`${API_URL}/ListaClientes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('token');
            redirigirALogin();
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
            clientes = data;
        } else if (data.content && Array.isArray(data.content)) {
            clientes = data.content;
        } else if (data.clientes && Array.isArray(data.clientes)) {
            clientes = data.clientes;
        } else if (data.data && Array.isArray(data.data)) {
            clientes = data.data;
        } else {
            console.warn('Formato de respuesta inesperado, intentando convertir:', data);
            clientes = Object.values(data).find(val => Array.isArray(val)) || [];
        }

        console.log('✅ Clientes procesados:', clientes);

        // Verificar que clientes sea un array
        if (!Array.isArray(clientes)) {
            console.error('❌ clientes no es un array:', clientes);
            clientes = [];
        }

        clientesFiltrados = [...clientes];
        mostrarClientes();
        actualizarPaginacion();
        
    } catch (error) {
        console.error('❌ Error cargando clientes:', error);
        
        let mensajeError = 'Error al cargar los clientes';
        if (error.message.includes('401')) {
            mensajeError = 'No autorizado. Por favor, inicie sesión nuevamente.';
            redirigirALogin();
        }
        
        document.getElementById('tablaBody').innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                    <p style="margin-top: 10px;">${mensajeError}</p>
                    <p style="font-size: 12px; margin-top: 5px;">${error.message}</p>
                    <button onclick="cargarClientes()" class="btn-action" style="background: var(--primary); color: white; margin-top: 10px;">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
}

// Función para mostrar clientes en la tabla
function mostrarClientes() {
    const tablaBody = document.getElementById('tablaBody');
    
    if (!Array.isArray(clientesFiltrados)) {
        console.error('❌ clientesFiltrados no es un array:', clientesFiltrados);
        clientesFiltrados = [];
    }

    const inicio = paginaActual * tamañoPagina;
    const fin = inicio + tamañoPagina;
    const clientesPagina = clientesFiltrados.slice(inicio, fin);

    if (clientesPagina.length === 0) {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <i class="fas fa-user-friends" style="font-size: 24px; color: var(--warning);"></i>
                    <p style="margin-top: 10px;">No se encontraron clientes</p>
                </td>
            </tr>
        `;
        return;
    }

    try {
        tablaBody.innerHTML = clientesPagina.map(cliente => {
            if (!cliente || typeof cliente !== 'object') {
                console.warn('❌ Cliente inválido:', cliente);
                return '';
            }

            const id = cliente.idCliente || cliente.id || cliente.IdCliente || 'N/A';
            const nombre = cliente.nombreCliente || cliente.nombre || cliente.NombreCliente || cliente.NOMBRECLIENTE || 'N/A';
            const apellido = cliente.apellidoCliente || cliente.apellido || cliente.ApellidoCliente || cliente.APELLIDOCLIENTE || 'N/A';
            const email = cliente.emailCliente || cliente.email || cliente.EmailCliente || cliente.EMAILCLIENTE || 'N/A';
            const telefono = cliente.telefono || cliente.Telefono || cliente.TELEFONO || 'N/A';
            const direccion = cliente.direccion || cliente.Direccion || cliente.DIRECCION || 'N/A';
            const dui = cliente.dui || cliente.DUI || 'N/A';

            return `
                <tr>
                    <td>${id}</td>
                    <td>${nombre}</td>
                    <td>${apellido}</td>
                    <td>${email}</td>
                    <td>${telefono}</td>
                    <td>${direccion}</td>
                    <td>${dui}</td>
                    <td>
                        <div style="display: flex; gap: 4px; flex-wrap: nowrap;">
                            <button class="btn-action btn-edit" onclick="abrirModalEditar(${id})" title="Editar cliente">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-action btn-delete" onclick="eliminarCliente(${id})" title="Eliminar cliente">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('❌ Error al mostrar clientes:', error);
        tablaBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                    <p style="margin-top: 10px;">Error al mostrar los clientes</p>
                </td>
            </tr>
        `;
    }
}

// Función para actualizar la paginación
function actualizarPaginacion() {
    const pagination = document.getElementById('pagination');
    const totalPaginas = Math.ceil(clientesFiltrados.length / tamañoPagina);
    
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
        if (i === 0 || i === totalPaginas - 1 || (i >= paginaActual - 2 && i <= paginaActual + 2)) {
            paginacionHTML += `
                <button class="page-btn ${i === paginaActual ? 'active' : ''}" onclick="cambiarPagina(${i})">
                    ${i + 1}
                </button>
            `;
        } else if (i === paginaActual - 3 || i === paginaActual + 3) {
            paginacionHTML += `<span class="page-btn" style="border: none; background: transparent;">...</span>`;
        }
    }

    paginacionHTML += `
        <button class="page-btn" ${paginaActual === totalPaginas - 1 ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = paginacionHTML;
}

// Función para cambiar de página
function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(clientesFiltrados.length / tamañoPagina);
    
    if (nuevaPagina >= 0 && nuevaPagina < totalPaginas) {
        paginaActual = nuevaPagina;
        mostrarClientes();
        actualizarPaginacion();
    }
}

// Función para cambiar el tamaño de página
function cambiarTamañoPagina() {
    tamañoPagina = parseInt(document.getElementById('pageSize').value);
    paginaActual = 0;
    mostrarClientes();
    actualizarPaginacion();
}

// Función para filtrar clientes
function filtrarClientes() {
    const filtro = document.getElementById('searchInput').value.toLowerCase();
    
    if (!Array.isArray(clientes)) {
        console.error('❌ clientes no es un array en filtrarClientes:', clientes);
        clientesFiltrados = [];
        return;
    }

    clientesFiltrados = clientes.filter(cliente => {
        if (!cliente || typeof cliente !== 'object') return false;
        
        const nombre = (cliente.nombreCliente || cliente.nombre || cliente.NombreCliente || cliente.NOMBRECLIENTE || '').toLowerCase();
        const apellido = (cliente.apellidoCliente || cliente.apellido || cliente.ApellidoCliente || cliente.APELLIDOCLIENTE || '').toLowerCase();
        const email = (cliente.emailCliente || cliente.email || cliente.EmailCliente || cliente.EMAILCLIENTE || '').toLowerCase();
        const telefono = (cliente.telefono || cliente.Telefono || cliente.TELEFONO || '').toLowerCase();
        const direccion = (cliente.direccion || cliente.Direccion || cliente.DIRECCION || '').toLowerCase();
        const dui = (cliente.dui || cliente.DUI || '').toLowerCase();

        return nombre.includes(filtro) || 
               apellido.includes(filtro) || 
               email.includes(filtro) || 
               telefono.includes(filtro) || 
               direccion.includes(filtro) || 
               dui.includes(filtro);
    });

    paginaActual = 0;
    mostrarClientes();
    actualizarPaginacion();
}

// Funciones para abrir modales
function abrirModalAgregar() {
    document.getElementById('mdAgregar').showModal();
    document.getElementById('frmAgregar').reset();
}

function cerrarModalAgregar() {
    document.getElementById('mdAgregar').close();
}

function abrirModalEditar(idCliente) {
    const cliente = clientes.find(c => {
        const clienteId = c.idCliente || c.id || c.IdCliente;
        return clienteId == idCliente;
    });

    if (!cliente) {
        Swal.fire('Error', 'Cliente no encontrado', 'error');
        return;
    }

    document.getElementById('txtIdEditar').value = idCliente;
    document.getElementById('txtNombreEditar').value = cliente.nombreCliente || cliente.nombre || cliente.NombreCliente || '';
    document.getElementById('txtApellidoEditar').value = cliente.apellidoCliente || cliente.apellido || cliente.ApellidoCliente || '';
    document.getElementById('txtEmailEditar').value = cliente.emailCliente || cliente.email || cliente.EmailCliente || '';
    document.getElementById('txtTelefonoEditar').value = cliente.telefono || cliente.Telefono || '';
    document.getElementById('txtDireccionEditar').value = cliente.direccion || cliente.Direccion || '';
    document.getElementById('txtDUIEditar').value = cliente.dui || cliente.DUI || '';

    document.getElementById('mdEditar').showModal();
}

function cerrarModalEditar() {
    document.getElementById('mdEditar').close();
}

// Función para agregar cliente
async function agregarCliente(event) {
    event.preventDefault();
    
    const nuevoCliente = {
        nombreCliente: document.getElementById('txtNombre').value,
        apellidoCliente: document.getElementById('txtApellido').value,
        emailCliente: document.getElementById('txtEmail').value,
        telefono: document.getElementById('txtTelefono').value,
        direccion: document.getElementById('txtDireccion').value,
        dui: document.getElementById('txtDUI').value || null
    };

    try {
        const token = obtenerToken();
        const response = await fetch(`${API_URL}/registrarCliente`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoCliente)
        });

        if (response.status === 401) {
            redirigirALogin();
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al crear el cliente');
        }

        const clienteCreado = await response.json();
        
        Swal.fire({
            title: '¡Éxito!',
            text: 'Cliente creado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });

        cerrarModalAgregar();
        cargarClientes();
        
    } catch (error) {
        console.error('Error al crear cliente:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo crear el cliente',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Función para actualizar cliente
async function actualizarCliente(event) {
    event.preventDefault();
    
    const idCliente = document.getElementById('txtIdEditar').value;
    const clienteActualizado = {
        nombreCliente: document.getElementById('txtNombreEditar').value,
        apellidoCliente: document.getElementById('txtApellidoEditar').value,
        emailCliente: document.getElementById('txtEmailEditar').value,
        telefono: document.getElementById('txtTelefonoEditar').value,
        direccion: document.getElementById('txtDireccionEditar').value,
        dui: document.getElementById('txtDUIEditar').value || null
    };

    try {
        const token = obtenerToken();
        const response = await fetch(`${API_URL}/editarCliente/${idCliente}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(clienteActualizado)
        });

        if (response.status === 401) {
            redirigirALogin();
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al actualizar el cliente');
        }

        Swal.fire({
            title: '¡Éxito!',
            text: 'Cliente actualizado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });

        cerrarModalEditar();
        cargarClientes();
        
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo actualizar el cliente',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Función para eliminar cliente
async function eliminarCliente(idCliente) {
    const resultado = await Swal.fire({
        title: '¿Estás seguro?',
        text: "¡No podrás revertir esta acción!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!resultado.isConfirmed) return;

    try {
        const token = obtenerToken();
        const response = await fetch(`${API_URL}/eliminarCliente/${idCliente}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            redirigirALogin();
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al eliminar el cliente');
        }

        Swal.fire({
            title: '¡Eliminado!',
            text: 'El cliente ha sido eliminado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });

        cargarClientes();
        
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo eliminar el cliente',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Función para cerrar sesión
function cerrarSesion() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro de que deseas salir?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            localStorage.removeItem('usuarioLogueado');
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('token');
            
            window.location.href = 'login.html';
        }
    });
}

// Función para toggle del menú de usuario
function toggleUserMenu() {
    // Aquí puedes implementar un menú desplegable si lo deseas
    console.log('Menú de usuario clickeado');
}