
    // Variables globales
    let empleados = [];
    let paginaActual = 0;
    let tamañoPagina = 10;
    let empleadosFiltrados = [];

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

    // Cargar empleados al iniciar
    document.addEventListener('DOMContentLoaded', function() {
        if (verificarAutenticacion()) {
            cargarEmpleados();
        }
    });

    // Función para cargar empleados desde la API
    async function cargarEmpleados() {
        try {
            const token = obtenerToken();
            
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            console.log('Token:', token);

            const response = await fetch('http://localhost:8080/ApiEmpleado/consultarEmpleado', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

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
            empleados = data;
            empleadosFiltrados = [...empleados];
            mostrarEmpleados();
            actualizarPaginacion();
            
        } catch (error) {
            console.error('Error:', error);
            
            let mensajeError = 'Error al cargar los empleados';
            if (error.message.includes('401')) {
                mensajeError = 'No autorizado. Por favor, inicie sesión nuevamente.';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
            
            document.getElementById('tablaBody').innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 40px; color: var(--danger);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i>
                        <p style="margin-top: 10px;">${mensajeError}</p>
                        <p style="font-size: 12px; margin-top: 5px;">${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }

    // Función para mostrar empleados en la tabla
    function mostrarEmpleados() {
        const tablaBody = document.getElementById('tablaBody');
        const inicio = paginaActual * tamañoPagina;
        const fin = inicio + tamañoPagina;
        const empleadosPagina = empleadosFiltrados.slice(inicio, fin);

        if (empleadosPagina.length === 0) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 40px;">
                        <i class="fas fa-user-slash" style="font-size: 24px; color: var(--warning);"></i>
                        <p style="margin-top: 10px;">No se encontraron empleados</p>
                    </td>
                </tr>
            `;
            return;
        }

        tablaBody.innerHTML = empleadosPagina.map(empleado => {
            return `
            <tr>
                <td>${empleado.idEmpleado || empleado.id}</td>
                <td>${empleado.nombreEmpleado || empleado.nombre || empleado.NOMBRE || 'N/A'}</td>
                <td>${empleado.apellidoEmpleado || empleado.apellido || empleado.APELLIDO || 'N/A'}</td>
                <td>${empleado.emailEmpleado || empleado.email || empleado.EMAIL || 'N/A'}</td>
                <td>${empleado.telefono || empleado.TELÉFONO || 'N/A'}</td>
                <td>${empleado.direccion || empleado.DIRECCIÓN || 'N/A'}</td>
                <td>$${empleado.salario ? empleado.salario.toFixed(2) : '0.00'}</td>
                <td>${empleado.fechaNacimiento ? new Date(empleado.fechaNacimiento).toLocaleDateString() : 'N/A'}</td>
                <td>${empleado.idRango || 'N/A'}</td>
                <td>
                    <div style="display: flex; gap: 4px; flex-wrap: nowrap;">
                        <button class="btn-action btn-edit" onclick="abrirModalEditar(${empleado.idEmpleado || empleado.id})" title="Editar empleado">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-action btn-delete" onclick="eliminarEmpleado(${empleado.idEmpleado || empleado.id})" title="Eliminar empleado">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    // Función para actualizar la paginación
    function actualizarPaginacion() {
        const pagination = document.getElementById('pagination');
        const totalPaginas = Math.ceil(empleadosFiltrados.length / tamañoPagina);
        
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
        mostrarEmpleados();
        actualizarPaginacion();
    }

    // Función para cambiar el tamaño de página
    function cambiarTamañoPagina() {
        tamañoPagina = parseInt(document.getElementById('pageSize').value);
        paginaActual = 0;
        mostrarEmpleados();
        actualizarPaginacion();
    }

    // Función para filtrar empleados
    function filtrarEmpleados() {
        const textoBusqueda = document.getElementById('searchInput').value.toLowerCase();
        
        if (textoBusqueda === '') {
            empleadosFiltrados = [...empleados];
        } else {
            empleadosFiltrados = empleados.filter(empleado => {
                const nombre = (empleado.nombreEmpleado || empleado.nombre || empleado.NOMBRE || '').toLowerCase();
                const apellido = (empleado.apellidoEmpleado || empleado.apellido || empleado.APELLIDO || '').toLowerCase();
                const email = (empleado.emailEmpleado || empleado.email || empleado.EMAIL || '').toLowerCase();
                const telefono = (empleado.telefono || empleado.TELÉFONO || '').toLowerCase();
                const direccion = (empleado.direccion || empleado.DIRECCIÓN || '').toLowerCase();
                const id = (empleado.idEmpleado || empleado.id || '').toString();
                
                return (
                    nombre.includes(textoBusqueda) ||
                    apellido.includes(textoBusqueda) ||
                    email.includes(textoBusqueda) ||
                    telefono.includes(textoBusqueda) ||
                    direccion.includes(textoBusqueda) ||
                    id.includes(textoBusqueda)
                );
            });
        }
        
        paginaActual = 0;
        mostrarEmpleados();
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

    function abrirModalEditar(idEmpleado) {
        const empleado = empleados.find(e => (e.idEmpleado || e.id) == idEmpleado);
        if (empleado) {
            document.getElementById('txtIdEditar').value = empleado.idEmpleado || empleado.id;
            document.getElementById('txtIdRangoEditar').value = empleado.idRango || '';
            document.getElementById('txtNombreEditar').value = empleado.nombreEmpleado || empleado.nombre || empleado.NOMBRE || '';
            document.getElementById('txtApellidoEditar').value = empleado.apellidoEmpleado || empleado.apellido || empleado.APELLIDO || '';
            document.getElementById('txtEmailEditar').value = empleado.emailEmpleado || empleado.email || empleado.EMAIL || '';
            
            const fechaNacimiento = empleado.fechaNacimiento;
            if (fechaNacimiento && fechaNacimiento !== 'N/A') {
                const fecha = new Date(fechaNacimiento);
                document.getElementById('dateFechaNacimientoEditar').value = fecha.toISOString().split('T')[0];
            } else {
                document.getElementById('dateFechaNacimientoEditar').value = '';
            }
            
            document.getElementById('txtTelefonoEditar').value = empleado.telefono || empleado.TELÉFONO || '';
            document.getElementById('txtDireccionEditar').value = empleado.direccion || empleado.DIRECCIÓN || '';
            document.getElementById('txtSalarioEditar').value = empleado.salario || '';
            
            document.getElementById('mdEditar').showModal();
        }
    }

    function cerrarModalEditar() {
        document.getElementById('mdEditar').close();
    }

    // Función para agregar empleado
    async function agregarEmpleado(event) {
        event.preventDefault();
        
        const nuevoEmpleado = {
            idRango: parseInt(document.getElementById('txtIdRango').value),
            nombreEmpleado: document.getElementById('txtNombre').value,
            apellidoEmpleado: document.getElementById('txtApellido').value,
            emailEmpleado: document.getElementById('txtEmail').value,
            fechaNacimiento: document.getElementById('dateFechaNacimiento').value,
            telefono: document.getElementById('txtTelefono').value || null,
            direccion: document.getElementById('txtDireccion').value || null,
            salario: parseFloat(document.getElementById('txtSalario').value)
        };

        try {
            const token = obtenerToken();
            const response = await fetch('http://localhost:8080/ApiEmpleado/registrarEmpleado', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevoEmpleado)
            });

            if (response.status === 401) {
                throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al agregar empleado: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const result = await response.json();

            await Swal.fire({
                title: '¡Éxito!',
                text: 'Empleado agregado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });

            cerrarModalAgregar();
            await cargarEmpleados();
            
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo agregar el empleado',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    }

    // Función para actualizar empleado
    async function actualizarEmpleado(event) {
        event.preventDefault();
        
        const id = document.getElementById('txtIdEditar').value;
        const empleadoActualizado = {
            idRango: parseInt(document.getElementById('txtIdRangoEditar').value),
            nombreEmpleado: document.getElementById('txtNombreEditar').value,
            apellidoEmpleado: document.getElementById('txtApellidoEditar').value,
            emailEmpleado: document.getElementById('txtEmailEditar').value,
            fechaNacimiento: document.getElementById('dateFechaNacimientoEditar').value,
            telefono: document.getElementById('txtTelefonoEditar').value || null,
            direccion: document.getElementById('txtDireccionEditar').value || null,
            salario: parseFloat(document.getElementById('txtSalarioEditar').value)
        };

        try {
            const token = obtenerToken();
            const response = await fetch(`http://localhost:8080/ApiEmpleado/editarEmpleado/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(empleadoActualizado)
            });

            if (response.status === 401) {
                throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al actualizar empleado: ${response.status} ${response.statusText}. ${errorText}`);
            }

            await Swal.fire({
                title: '¡Éxito!',
                text: 'Empleado actualizado correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });

            cerrarModalEditar();
            await cargarEmpleados();
            
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo actualizar el empleado',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        }
    }

    // Función para eliminar empleado
    async function eliminarEmpleado(id) {
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
                const response = await fetch(`http://localhost:8080/ApiEmpleado/eliminarEmpleado/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error al eliminar empleado: ${response.status} ${response.statusText}. ${errorText}`);
                }

                await Swal.fire({
                    title: '¡Eliminado!',
                    text: 'Empleado eliminado correctamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });

                await cargarEmpleados();
                
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'No se pudo eliminar el empleado',
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