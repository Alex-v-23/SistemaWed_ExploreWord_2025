
        const API_URL = 'http://localhost:8080/ApiReservaciones';
        let reservaciones = [];
        let paginaActual = 0;
        let tamañoPagina = 10;
        let reservacionesFiltradas = [];

        // Función para obtener el token
        function obtenerToken() {
            const token = localStorage.getItem('authToken') || 
                          localStorage.getItem('token') || 
                          sessionStorage.getItem('authToken') || 
                          sessionStorage.getItem('token');
            
            if (token) {
                return token;
            }
            
            console.error('No se encontró token de autenticación');
            return null;
        }

        // Función para verificar autenticación
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

        // Función para crear headers
        function crearHeaders() {
            const token = obtenerToken();
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            return headers;
        }

        // Función principal para cargar reservaciones
        async function cargarReservaciones() {
            try {
                console.log('Cargando reservaciones desde ObtenerReservacion...');
                
                const response = await fetch(`${API_URL}/ObtenerReservacion`, {
                    method: 'GET',
                    headers: crearHeaders(),
                    credentials: 'include'
                });

                console.log('Respuesta del servidor:', response.status, response.statusText);

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
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Datos recibidos:', data);

                // Procesar la respuesta
                if (Array.isArray(data)) {
                    reservaciones = data;
                } else if (data.content && Array.isArray(data.content)) {
                    reservaciones = data.content;
                } else if (data.reservaciones && Array.isArray(data.reservaciones)) {
                    reservaciones = data.reservaciones;
                } else if (data.data && Array.isArray(data.data)) {
                    reservaciones = data.data;
                } else {
                    console.warn('Formato de respuesta inesperado, usando array vacío');
                    reservaciones = [];
                }

                console.log(`Se cargaron ${reservaciones.length} reservaciones`);
                reservacionesFiltradas = [...reservaciones];
                mostrarReservaciones();
                actualizarPaginacion();
                
            } catch (error) {
                console.error('Error cargando reservaciones:', error);
                
                let mensajeError = 'Error al cargar las reservaciones';
                if (error.message.includes('401')) {
                    mensajeError = 'No autorizado. Por favor, inicie sesión nuevamente.';
                } else if (error.message.includes('Failed to fetch')) {
                    mensajeError = 'Error de conexión. Verifique que el servidor esté ejecutándose.';
                }
                
                document.getElementById('tablaBody').innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 40px; color: var(--danger);">
                            <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                            <p style="margin-top: 10px;">${mensajeError}</p>
                            <button onclick="cargarReservaciones()" class="btn-action" style="background: var(--primary); color: white; margin-top: 10px;">
                                <i class="fas fa-redo"></i> Reintentar
                            </button>
                        </td>
                    </tr>
                `;
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            if (verificarAutenticacion()) {
                cargarReservaciones();
            }
        });

        function mostrarReservaciones() {
            const tablaBody = document.getElementById('tablaBody');
            
            const inicio = paginaActual * tamañoPagina;
            const fin = inicio + tamañoPagina;
            const reservacionesPagina = reservacionesFiltradas.slice(inicio, fin);

            if (reservacionesPagina.length === 0) {
                tablaBody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 40px;">
                            <i class="fas fa-calendar-times" style="font-size: 24px; color: var(--warning);"></i>
                            <p style="margin-top: 10px;">No se encontraron reservaciones</p>
                            <button onclick="cargarReservaciones()" class="btn-action" style="background: var(--primary); color: white; margin-top: 10px;">
                                <i class="fas fa-redo"></i> Recargar
                            </button>
                        </td>
                    </tr>
                `;
                return;
            }

            try {
                tablaBody.innerHTML = reservacionesPagina.map(reservacion => {
                    console.log('Reservación raw:', reservacion); // Para debug
                    
                    // Mapeo CORREGIDO según la estructura de tu tabla
                    const id = reservacion.idReservacion || reservacion.id || 'N/A';
                    const idCliente = reservacion.IdCliente || reservacion.idCliente || 'N/A';
                    
                    // Usar los nombres EXACTOS de tu tabla
                    const nombreCliente = reservacion.nombreCliente || 'N/A';
                    const tipoReservacion = reservacion.TipoReservacion || reservacion.tipoReservacion || 'N/A';
                    const nombreViaje = reservacion.Nombre_Viaje || reservacion.nombre_Viaje || reservacion.NombreViaje || 'N/A';
                    
                    // Formatear fecha
                    let fechaReservacion = reservacion.FechaReservacion || reservacion.fechaReservacion || 'N/A';
                    if (fechaReservacion !== 'N/A' && fechaReservacion.includes('T')) {
                        fechaReservacion = fechaReservacion.split('T')[0];
                    }
                    
                    const personas = reservacion.Personas || reservacion.personas || 'N/A';
                    const estadoReservacion = reservacion.EstadoReservacion || reservacion.estadoReservacion || 'Pendiente';
                    
                    const estadoClass = estadoReservacion.toLowerCase()
                        .replace('á', 'a').replace('é', 'e').replace('í', 'i')
                        .replace('ó', 'o').replace('ú', 'u');

                    return `
                        <tr>
                            <td>${id}</td>
                            <td>${idCliente}</td>
                            <td>${nombreCliente}</td>
                            <td>${tipoReservacion}</td>
                            <td>${nombreViaje}</td>
                            <td>${fechaReservacion}</td>
                            <td>${personas}</td>
                            <td><span class="status-badge status-${estadoClass}">${estadoReservacion}</span></td>
                            <td>
                                <div style="display: flex; gap: 4px; flex-wrap: nowrap;">
                                    <button class="btn-action btn-edit" onclick="abrirModalEditar(${id})" title="Editar reservación">
                                        <i class="fas fa-edit"></i> Editar
                                    </button>
                                    <button class="btn-action btn-delete" onclick="eliminarReservacion(${id})" title="Eliminar reservación">
                                        <i class="fas fa-trash"></i> Eliminar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            } catch (error) {
                console.error('Error al mostrar reservaciones:', error);
                tablaBody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 40px; color: var(--danger);">
                            <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                            <p style="margin-top: 10px;">Error al mostrar las reservaciones</p>
                            <button onclick="cargarReservaciones()" class="btn-action" style="background: var(--primary); color: white; margin-top: 10px;">
                                <i class="fas fa-redo"></i> Reintentar
                            </button>
                        </td>
                    </tr>
                `;
            }
        }

        function actualizarPaginacion() {
            const pagination = document.getElementById('pagination');
            const totalPaginas = Math.ceil(reservacionesFiltradas.length / tamañoPagina);
            
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

            const inicioPagina = Math.max(0, paginaActual - 2);
            const finPagina = Math.min(totalPaginas, inicioPagina + 5);
            
            for (let i = inicioPagina; i < finPagina; i++) {
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

        function cambiarPagina(pagina) {
            paginaActual = pagina;
            mostrarReservaciones();
            actualizarPaginacion();
        }

        function cambiarTamañoPagina() {
            tamañoPagina = parseInt(document.getElementById('pageSize').value);
            paginaActual = 0;
            mostrarReservaciones();
            actualizarPaginacion();
        }

        function filtrarReservaciones() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            
            if (searchTerm === '') {
                reservacionesFiltradas = [...reservaciones];
            } else {
                reservacionesFiltradas = reservaciones.filter(res => {
                    const nombreCliente = (res.nombreCliente || '').toLowerCase();
                    const tipoReservacion = (res.TipoReservacion || res.tipoReservacion || '').toLowerCase();
                    const nombreViaje = (res.Nombre_Viaje || res.nombre_Viaje || res.NombreViaje || '').toLowerCase();
                    const idCliente = (res.IdCliente || res.idCliente || '').toString();
                    
                    return nombreCliente.includes(searchTerm) ||
                           tipoReservacion.includes(searchTerm) ||
                           nombreViaje.includes(searchTerm) ||
                           idCliente.includes(searchTerm);
                });
            }
            
            paginaActual = 0;
            mostrarReservaciones();
            actualizarPaginacion();
        }

        function abrirModalAgregar() {
            document.getElementById('mdAgregar').showModal();
            document.getElementById('frmAgregar').reset();
            
            const hoy = new Date().toISOString().split('T')[0];
            document.getElementById('txtFechaReservacion').min = hoy;
        }

        function cerrarModalAgregar() {
            document.getElementById('mdAgregar').close();
        }

        function abrirModalEditar(id) {
            const reservacion = reservaciones.find(r => (r.idReservacion || r.id) == id);
            if (reservacion) {
                document.getElementById('txtIdEditar').value = reservacion.idReservacion || reservacion.id;
                document.getElementById('txtIdClienteEditar').value = reservacion.IdCliente || reservacion.idCliente || '';
                document.getElementById('txtNombreClienteEditar').value = reservacion.nombreCliente || '';
                document.getElementById('txtTipoReservacionEditar').value = reservacion.TipoReservacion || reservacion.tipoReservacion || '';
                document.getElementById('txtNombreViajeEditar').value = reservacion.Nombre_Viaje || reservacion.nombre_Viaje || reservacion.NombreViaje || '';
                document.getElementById('txtDetalleReservacionEditar').value = reservacion.DetalleDeReservacion || reservacion.detalleDeReservacion || '';
                
                // Formatear fecha para el input date
                let fecha = reservacion.FechaReservacion || reservacion.fechaReservacion || '';
                if (fecha && fecha.includes('T')) {
                    fecha = fecha.split('T')[0];
                }
                document.getElementById('txtFechaReservacionEditar').value = fecha;
                
                document.getElementById('txtPersonasEditar').value = reservacion.Personas || reservacion.personas || '';
                document.getElementById('txtEstadoReservacionEditar').value = reservacion.EstadoReservacion || reservacion.estadoReservacion || '';
                
                document.getElementById('mdEditar').showModal();
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudo encontrar la reservación para editar',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
        }

        function cerrarModalEditar() {
            document.getElementById('mdEditar').close();
        }

async function agregarReservacion(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;
    
    try {
        // Validaciones del lado del cliente
        const idCliente = parseInt(document.getElementById('txtIdCliente').value);
        const personas = parseInt(document.getElementById('txtPersonas').value);
        const fechaInput = document.getElementById('txtFechaReservacion').value;
        
        if (idCliente <= 0) {
            throw new Error('El ID del cliente debe ser mayor a 0');
        }
        
        if (personas <= 0) {
            throw new Error('La cantidad de personas debe ser mayor a 0');
        }
        
        if (!fechaInput) {
            throw new Error('La fecha de reservación es requerida');
        }
        
        // Formatear fecha
        const fechaReservacion = new Date(fechaInput).toISOString().split('T')[0];
        
        // CORREGIDO: Usar los nombres exactos que espera el backend
        const nuevaReservacion = {
            idCliente: idCliente, // CORREGIDO: minúscula
            nombreCliente: document.getElementById('txtNombreCliente').value.trim(),
            tipoReservacion: document.getElementById('txtTipoReservacion').value, // CORREGIDO: minúscula
            nombre_Viaje: document.getElementById('txtNombreViaje').value.trim(), // CORREGIDO: minúscula y guión bajo
            detalleDeReservacion: document.getElementById('txtDetalleReservacion').value.trim() || null, // CORREGIDO: minúscula
            fechaReservacion: fechaReservacion, // CORREGIDO: minúscula
            personas: personas, // CORREGIDO: minúscula
            estadoReservacion: document.getElementById('txtEstadoReservacion').value // CORREGIDO: minúscula
        };

        console.log('📤 Enviando reservación:', nuevaReservacion);

        const response = await fetch(`${API_URL}/AgregarReservacion`, {
            method: 'POST',
            headers: crearHeaders(),
            body: JSON.stringify(nuevaReservacion)
        });

        console.log('📥 Status de respuesta:', response.status);
        console.log('📥 OK:', response.ok);

        if (response.status === 401) {
            throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
        }

        if (!response.ok) {
            let errorMessage = 'Error al agregar reservación';
            let errorDetails = '';
            
            try {
                const errorText = await response.text();
                console.log('Error del servidor (texto):', errorText);
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                    errorDetails = errorData.details || errorData.error || '';
                } catch (e) {
                    // Si no es JSON, usar el texto directamente
                    errorMessage = errorText || errorMessage;
                }
            } catch (e) {
                console.error('No se pudo leer el error:', e);
            }
            
            throw new Error(`${errorMessage} ${errorDetails ? `- ${errorDetails}` : ''}`);
        }

        const result = await response.json();
        console.log('✅ Respuesta del servidor:', result);

        // CORREGIDO: Cerrar el modal primero y luego mostrar la alerta
        cerrarModalAgregar();
        
        await Swal.fire({
            title: '¡Éxito!',
            text: 'Reservación agregada correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });

        await cargarReservaciones();
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        Swal.fire({
            title: 'Error del Servidor',
            text: error.message || 'No se pudo agregar la reservación. Verifique los datos e intente nuevamente.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}
        async function actualizarReservacion(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    submitBtn.disabled = true;
    
    try {
        const id = document.getElementById('txtIdEditar').value;
        const idCliente = parseInt(document.getElementById('txtIdClienteEditar').value);
        const personas = parseInt(document.getElementById('txtPersonasEditar').value);
        const fechaInput = document.getElementById('txtFechaReservacionEditar').value;
        
        if (idCliente <= 0) {
            throw new Error('El ID del cliente debe ser mayor a 0');
        }
        
        if (personas <= 0) {
            throw new Error('La cantidad de personas debe ser mayor a 0');
        }
        
        if (!fechaInput) {
            throw new Error('La fecha de reservación es requerida');
        }
        
        // Formatear fecha
        const fechaReservacion = new Date(fechaInput).toISOString().split('T')[0];
        
        // CORREGIDO: Usar el nombre exacto que usa tu backend para el detalle
        const reservacionActualizada = {
            idCliente: idCliente,
            nombreCliente: document.getElementById('txtNombreClienteEditar').value.trim(),
            tipoReservacion: document.getElementById('txtTipoReservacionEditar').value,
            nombre_Viaje: document.getElementById('txtNombreViajeEditar').value.trim(),
            detalleDeReservacion: document.getElementById('txtDetalleReservacionEditar').value.trim() || null, // CORREGIDO
            fechaReservacion: fechaReservacion,
            personas: personas,
            estadoReservacion: document.getElementById('txtEstadoReservacionEditar').value
        };

        console.log('🔄 Actualizando reservación:', id, reservacionActualizada);

        const response = await fetch(`${API_URL}/EditarReservacion/${id}`, {
            method: 'PUT',
            headers: crearHeaders(),
            body: JSON.stringify(reservacionActualizada)
        });

        console.log('📥 Status de respuesta:', response.status);

        if (response.status === 401) {
            throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
        }

        if (!response.ok) {
            let errorMessage = 'Error al actualizar reservación';
            try {
                const errorText = await response.text();
                console.log('Error del servidor:', errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
            } catch (e) {
                console.error('No se pudo leer el error:', e);
            }
            throw new Error(errorMessage);
        }

        // Cerrar el modal primero y luego mostrar la alerta
        cerrarModalEditar();
        
        await Swal.fire({
            title: '¡Éxito!',
            text: 'Reservación actualizada correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        });

        await cargarReservaciones();
        
    } catch (error) {
        console.error('❌ Error:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo actualizar la reservación',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

        async function eliminarReservacion(id) {
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
                    const response = await fetch(`${API_URL}/EliminarReservacion/${id}`, {
                        method: 'DELETE',
                        headers: crearHeaders()
                    });

                    if (response.status === 401) {
                        throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
                    }

                    if (!response.ok) {
                        throw new Error('Error al eliminar reservación');
                    }

                    await Swal.fire({
                        title: '¡Eliminado!',
                        text: 'Reservación eliminada correctamente',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    });

                    await cargarReservaciones();
                    
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'No se pudo eliminar la reservación',
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    });
                }
            }
        }

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

                    await fetch('http://localhost:8080/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });

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