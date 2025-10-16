
        const API_URL = 'http://localhost:8080/ApiViajes';
        let viajes = [];
        let paginaActual = 0;
        let tamañoPagina = 10;
        let viajesFiltrados = [];

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

        // Cargar viajes al iniciar
        document.addEventListener('DOMContentLoaded', function() {
            if (verificarAutenticacion()) {
                cargarViajes();
            }
        });

        // Función para cargar viajes desde la API - CORREGIDA
        async function cargarViajes() {
            try {
                const token = obtenerToken();
                
                if (!token) {
                    throw new Error('No hay token de autenticación');
                }

                console.log('🔑 Token usado:', token ? 'Sí' : 'No');
                console.log('🌐 Haciendo request a:', `${API_URL}/ListaViajes`);

                const response = await fetch(`${API_URL}/ListaViajes`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                console.log('📡 Response status:', response.status, response.statusText);

                if (response.status === 401) {
                    // Token expirado o inválido
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
                console.log('📊 Datos recibidos:', data);

                // CORRECCIÓN: Manejar diferentes formatos de respuesta
                if (Array.isArray(data)) {
                    // Si la respuesta es directamente un array
                    viajes = data;
                } else if (data.content && Array.isArray(data.content)) {
                    // Si es una respuesta paginada de Spring (Page)
                    viajes = data.content;
                } else if (data.viajes && Array.isArray(data.viajes)) {
                    // Si viene en un objeto con propiedad "viajes"
                    viajes = data.viajes;
                } else if (data.data && Array.isArray(data.data)) {
                    // Si viene en un objeto con propiedad "data"
                    viajes = data.data;
                } else {
                    // Si no es ninguno de los formatos esperados, intentar convertir
                    console.warn('Formato de respuesta inesperado, intentando convertir:', data);
                    viajes = Object.values(data).find(val => Array.isArray(val)) || [];
                }

                console.log('✅ Viajes procesados:', viajes);

                // CORRECCIÓN: Verificar que viajes sea un array antes de usarlo
                if (!Array.isArray(viajes)) {
                    console.error('❌ viajes no es un array:', viajes);
                    viajes = [];
                }

                viajesFiltrados = [...viajes];
                mostrarViajes();
                actualizarPaginacion();
                
            } catch (error) {
                console.error('❌ Error cargando viajes:', error);
                
                let mensajeError = 'Error al cargar los viajes';
                if (error.message.includes('401')) {
                    mensajeError = 'No autorizado. Por favor, inicie sesión nuevamente.';
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                }
                
                document.getElementById('tablaBody').innerHTML = `
                    <tr>
                        <td colspan="13" style="text-align: center; padding: 40px; color: var(--danger);">
                            <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                            <p style="margin-top: 10px;">${mensajeError}</p>
                            <p style="font-size: 12px; margin-top: 5px;">${error.message}</p>
                            <button onclick="cargarViajes()" class="btn-action" style="background: var(--primary); color: white; margin-top: 10px;">
                                <i class="fas fa-redo"></i> Reintentar
                            </button>
                        </td>
                    </tr>
                `;
            }
        }

        // Función para mostrar viajes en la tabla - MEJORADA
        function mostrarViajes() {
            const tablaBody = document.getElementById('tablaBody');
            
            // CORRECCIÓN: Verificar que viajesFiltrados sea un array
            if (!Array.isArray(viajesFiltrados)) {
                console.error('❌ viajesFiltrados no es un array:', viajesFiltrados);
                viajesFiltrados = [];
            }

            const inicio = paginaActual * tamañoPagina;
            const fin = inicio + tamañoPagina;
            const viajesPagina = viajesFiltrados.slice(inicio, fin);

            if (viajesPagina.length === 0) {
                tablaBody.innerHTML = `
                    <tr>
                        <td colspan="13" style="text-align: center; padding: 40px;">
                            <i class="fas fa-route" style="font-size: 24px; color: var(--warning);"></i>
                            <p style="margin-top: 10px;">No se encontraron viajes</p>
                        </td>
                    </tr>
                `;
                return;
            }

            // CORRECCIÓN: Manejar posibles errores en el mapeo
            try {
                tablaBody.innerHTML = viajesPagina.map(viaje => {
                    // Verificar que viaje sea un objeto válido
                    if (!viaje || typeof viaje !== 'object') {
                        console.warn('❌ Viaje inválido:', viaje);
                        return '';
                    }

                    const id = viaje.idViaje || viaje.id || 'N/A';
                    const nombre = viaje.nombreViaje || viaje.nombre || viaje.nombre_Viaje || 'N/A';
                    const destino = viaje.destino || 'N/A';
                    const fecha = viaje.fecha ? new Date(viaje.fecha).toLocaleDateString() : 'N/A';
                    const precio = viaje.precio ? parseFloat(viaje.precio).toFixed(2) : '0.00';
                    const estado = viaje.estado || 'Programado';
                    const idCliente = viaje.idCliente || 'N/A';
                    const idEmpleado = viaje.idEmpleado || 'N/A';
                    const idTransporte = viaje.idTransporte || 'N/A';
                    const idHorario = viaje.idHorario || 'N/A';
                    const fechaSalida = viaje.fechaSalida ? new Date(viaje.fechaSalida).toLocaleDateString() : 'N/A';
                    const fechaRegreso = viaje.fechaRegreso ? new Date(viaje.fechaRegreso).toLocaleDateString() : 'N/A';

                    return `
                        <tr>
                            <td>${id}</td>
                            <td>${nombre}</td>
                            <td>${destino}</td>
                            <td>${fecha}</td>
                            <td>$${precio}</td>
                            <td>
                                <span class="status-badge status-${estado.toLowerCase()}">
                                    ${estado}
                                </span>
                            </td>
                            <td>${idCliente}</td>
                            <td>${idEmpleado}</td>
                            <td>${idTransporte}</td>
                            <td>${idHorario}</td>
                            <td>${fechaSalida}</td>
                            <td>${fechaRegreso}</td>
                            <td>
                                <div style="display: flex; gap: 4px; flex-wrap: nowrap;">
                                    <button class="btn-action btn-edit" onclick="abrirModalEditar(${id})" title="Editar viaje">
                                        <i class="fas fa-edit"></i> Editar
                                    </button>
                                    <button class="btn-action btn-delete" onclick="eliminarViaje(${id})" title="Eliminar viaje">
                                        <i class="fas fa-trash"></i> Eliminar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');
            } catch (error) {
                console.error('❌ Error al mostrar viajes:', error);
                tablaBody.innerHTML = `
                    <tr>
                        <td colspan="13" style="text-align: center; padding: 40px; color: var(--danger);">
                            <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                            <p style="margin-top: 10px;">Error al mostrar los viajes</p>
                        </td>
                    </tr>
                `;
            }
        }

        // Función para actualizar la paginación
        function actualizarPaginacion() {
            const pagination = document.getElementById('pagination');
            const totalPaginas = Math.ceil(viajesFiltrados.length / tamañoPagina);
            
            if (totalPaginas <= 1) {
                pagination.innerHTML = '';
                return;
            }

            let paginacionHTML = '';
            
            // Botón anterior
            paginacionHTML += `
                <button class="page-btn" ${paginaActual === 0 ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
            `;

            // Números de página
            for (let i = 0; i < totalPaginas; i++) {
                paginacionHTML += `
                    <button class="page-btn ${i === paginaActual ? 'active' : ''}" onclick="cambiarPagina(${i})">
                        ${i + 1}
                    </button>
                `;
            }

            // Botón siguiente
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
            mostrarViajes();
            actualizarPaginacion();
        }

        // Función para cambiar el tamaño de página
        function cambiarTamañoPagina() {
            tamañoPagina = parseInt(document.getElementById('pageSize').value);
            paginaActual = 0;
            mostrarViajes();
            actualizarPaginacion();
        }

        // Función para filtrar viajes
        function filtrarViajes() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            
            if (searchTerm === '') {
                viajesFiltrados = [...viajes];
            } else {
                viajesFiltrados = viajes.filter(viaje => 
                    (viaje.nombreViaje || viaje.nombre || '').toLowerCase().includes(searchTerm) ||
                    (viaje.destino || '').toLowerCase().includes(searchTerm) ||
                    (viaje.estado || '').toLowerCase().includes(searchTerm)
                );
            }
            
            paginaActual = 0;
            mostrarViajes();
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
            const viaje = viajes.find(v => (v.idViaje || v.id) === id);
            if (viaje) {
                document.getElementById('txtIdEditar').value = viaje.idViaje || viaje.id;
                document.getElementById('txtNombreEditar').value = viaje.nombreViaje || viaje.nombre || '';
                document.getElementById('txtDestinoEditar').value = viaje.destino || '';
                document.getElementById('dateFechaEditar').value = viaje.fecha ? viaje.fecha.split('T')[0] : '';
                document.getElementById('txtPrecioEditar').value = viaje.precio || '';
                document.getElementById('txtEstadoEditar').value = viaje.estado || 'Programado';
                document.getElementById('txtIdClienteEditar').value = viaje.idCliente || '';
                document.getElementById('txtIdEmpleadoEditar').value = viaje.idEmpleado || '';
                document.getElementById('txtIdTransporteEditar').value = viaje.idTransporte || '';
                document.getElementById('txtIdHorarioEditar').value = viaje.idHorario || '';
                document.getElementById('txtIdServicioEditar').value = viaje.idServicio || '';
                document.getElementById('dateFechaSalidaEditar').value = viaje.fechaSalida ? viaje.fechaSalida.split('T')[0] : '';
                document.getElementById('dateFechaRegresoEditar').value = viaje.fechaRegreso ? viaje.fechaRegreso.split('T')[0] : '';
                
                document.getElementById('mdEditar').showModal();
            }
        }

        function cerrarModalEditar() {
            document.getElementById('mdEditar').close();
        }

        // Función para agregar viaje
        async function agregarViaje(event) {
            event.preventDefault();
            
            const nuevoViaje = {
                nombreViaje: document.getElementById('txtNombre').value,
                destino: document.getElementById('txtDestino').value,
                fecha: document.getElementById('dateFecha').value,
                precio: parseFloat(document.getElementById('txtPrecio').value),
                estado: document.getElementById('txtEstado').value,
                idCliente: parseInt(document.getElementById('txtIdCliente').value),
                idEmpleado: parseInt(document.getElementById('txtIdEmpleado').value),
                idTransporte: parseInt(document.getElementById('txtIdTransporte').value),
                idHorario: parseInt(document.getElementById('txtIdHorario').value),
                idServicio: parseInt(document.getElementById('txtIdServicio').value),
                fechaSalida: document.getElementById('dateFechaSalida').value,
                fechaRegreso: document.getElementById('dateFechaRegreso').value
            };

            try {
                const token = obtenerToken();
                const response = await fetch(`${API_URL}/registrarViaje`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(nuevoViaje)
                });

                if (response.status === 401) {
                    throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al agregar viaje');
                }

                const result = await response.json();

                await Swal.fire({
                    title: '¡Éxito!',
                    text: 'Viaje agregado correctamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });

                cerrarModalAgregar();
                await cargarViajes();
                
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'No se pudo agregar el viaje',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
        }

        // Función para actualizar viaje
        async function actualizarViaje(event) {
            event.preventDefault();
            
            const id = document.getElementById('txtIdEditar').value;
            const viajeActualizado = {
                nombreViaje: document.getElementById('txtNombreEditar').value,
                destino: document.getElementById('txtDestinoEditar').value,
                fecha: document.getElementById('dateFechaEditar').value,
                precio: parseFloat(document.getElementById('txtPrecioEditar').value),
                estado: document.getElementById('txtEstadoEditar').value,
                idCliente: parseInt(document.getElementById('txtIdClienteEditar').value),
                idEmpleado: parseInt(document.getElementById('txtIdEmpleadoEditar').value),
                idTransporte: parseInt(document.getElementById('txtIdTransporteEditar').value),
                idHorario: parseInt(document.getElementById('txtIdHorarioEditar').value),
                idServicio: parseInt(document.getElementById('txtIdServicioEditar').value),
                fechaSalida: document.getElementById('dateFechaSalidaEditar').value,
                fechaRegreso: document.getElementById('dateFechaRegresoEditar').value
            };

            try {
                const token = obtenerToken();
                const response = await fetch(`${API_URL}/editarViaje/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(viajeActualizado)
                });

                if (response.status === 401) {
                    throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al actualizar viaje');
                }

                await Swal.fire({
                    title: '¡Éxito!',
                    text: 'Viaje actualizado correctamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });

                cerrarModalEditar();
                await cargarViajes();
                
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'No se pudo actualizar el viaje',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
        }

        // Función para eliminar viaje
        async function eliminarViaje(id) {
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
                    const response = await fetch(`${API_URL}/eliminarViaje/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.status === 401) {
                        throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
                    }

                    if (!response.ok) {
                        throw new Error('Error al eliminar viaje');
                    }

                    await Swal.fire({
                        title: '¡Eliminado!',
                        text: 'Viaje eliminado correctamente',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    });

                    await cargarViajes();
                    
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'No se pudo eliminar el viaje',
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    });
                }
            }
        }

        // Función para cerrar sesión (MANTENIENDO EL DISEÑO ORIGINAL)
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

        // Función para el menú de usuario (MANTENIENDO EL DISEÑO ORIGINAL)
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