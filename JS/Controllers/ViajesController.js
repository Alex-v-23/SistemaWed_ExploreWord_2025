        // URL del EndPoint de los viajes - API
        const API_URL = "http://localhost:8080/ApiViajes";

        // Variables globales para paginación
        let currentPage = 0;
        let pageSize = 10;
        let totalPages = 0;

        // Elementos del DOM
        let modal, modalEditar, btnAddViaje, btnCerrar, btnCerrarEditar, pageSizeSelect, paginationContainer;

        // Inicializar la aplicación cuando el DOM esté cargado
        document.addEventListener('DOMContentLoaded', inicializarApp);

        function inicializarApp() {
            console.log("Inicializando aplicación de Viajes...");
            
            // Obtener elementos del DOM
            modal = document.getElementById("mdAgregar");
            modalEditar = document.getElementById("mdEditar");
            btnAddViaje = document.getElementById("btnAddViaje");
            btnCerrar = document.getElementById("btnCerrar");
            btnCerrarEditar = document.getElementById("btnCerrarEditar");
            pageSizeSelect = document.getElementById("pageSize");
            paginationContainer = document.getElementById("pagination");

            // Verificar que todos los elementos existan
            if (!modal || !modalEditar || !btnAddViaje || !pageSizeSelect || !paginationContainer) {
                console.error("Error: No se encontraron algunos elementos del DOM");
                mostrarError("Error al inicializar la aplicación. Recarga la página.");
                return;
            }

            // Configurar eventos
            configurarEventos();
            
            // Cargar datos iniciales
            pageSize = parseInt(pageSizeSelect.value);
            obtenerViajes();
            inicializarValidacionesPrecios();
        }

        function configurarEventos() {
            // Evento para cambiar el tamaño de página
            pageSizeSelect.addEventListener("change", () => {
                pageSize = parseInt(pageSizeSelect.value);
                currentPage = 0;
                obtenerViajes();
            });
            
            // Evento para botón flotante (único botón)
            btnAddViaje.addEventListener("click", () => {
                modal.showModal();
            });

            if (btnCerrar) {
                btnCerrar.addEventListener("click", (e) => {
                    e.preventDefault();
                    modal.close();
                });
            }

            if (btnCerrarEditar) {
                btnCerrarEditar.addEventListener("click", (e) => {
                    e.preventDefault();
                    modalEditar.close();
                });
            }

            // Eventos para formularios
            const formAgregar = document.getElementById("frmAgregar");
            const formEditar = document.getElementById("frmEditar");
            
            if (formAgregar) {
                formAgregar.addEventListener("submit", function(e) {
                    e.preventDefault();
                    agregarViaje();
                });
            }
            
            if (formEditar) {
                formEditar.addEventListener("submit", function(e) {
                    e.preventDefault();
                    editarViaje();
                });
            }
        }

        // Función para obtener viajes con paginación
        async function obtenerViajes() {
            try {
                const respuesta = await fetch(`${API_URL}/ListaViajes?page=${currentPage}&size=${pageSize}`);
                if (!respuesta.ok) {
                    throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
                }
                
                const data = await respuesta.json();
                totalPages = data.totalPages;
                mostrarDatos(data.content);
                actualizarPaginacion();
            } catch (error) {
                console.error("Error al obtener viajes:", error);
                mostrarError("Los registros no pudieron ser cargados.");
            }
        }

        // Mostrar datos en la tabla
        function mostrarDatos(datos) {
            const tabla = document.querySelector("#tabla tbody");
            tabla.innerHTML = "";

            if (!datos || datos.length === 0) {
                tabla.innerHTML = '<tr><td colspan="13">No hay registros de viajes</td></tr>';
                return;
            }

            datos.forEach(viaje => {
                const fechaFormateada = viaje.fecha 
                    ? new Date(viaje.fecha).toLocaleDateString('es-ES') 
                    : 'N/A';
                
                const precioFormateado = viaje.precio 
                    ? `$${viaje.precio.toFixed(2)}` 
                    : '$0.00';
                    
                const fechaSalidaFormateada = viaje.fechaSalida 
                    ? new Date(viaje.fechaSalida).toLocaleDateString('es-ES') 
                    : 'N/A';
                    
                const fechaRegresoFormateada = viaje.fechaRegreso 
                    ? new Date(viaje.fechaRegreso).toLocaleDateString('es-ES') 
                    : 'N/A';

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${viaje.idViaje || 'N/A'}</td>
                    <td>${viaje.nombreViaje || 'N/A'}</td>
                    <td>${viaje.destino || 'N/A'}</td>
                    <td>${fechaFormateada}</td>
                    <td>${precioFormateado}</td>
                    <td>${viaje.estado || 'N/A'}</td>
                    <td>${viaje.idCliente || 'N/A'}</td>
                    <td>${viaje.idEmpleado || 'N/A'}</td>
                    <td>${viaje.idTransporte || 'N/A'}</td>
                    <td>${viaje.idHorario || 'N/A'}</td>
                    <td>${fechaSalidaFormateada}</td>
                    <td>${fechaRegresoFormateada}</td>
                    <td>
                        <button class="button button-edit" data-id="${viaje.idViaje}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="button button-delete" data-id="${viaje.idViaje}">
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </button>
                    </td>
                `;

                // Agregar eventos a los botones
                tr.querySelector(".button-edit").addEventListener("click", function() {
                    abrirModalEditar(viaje);
                });

                tr.querySelector(".button-delete").addEventListener("click", function() {
                    eliminarViaje(viaje.idViaje);
                });

                tabla.appendChild(tr);
            });
        }

        // Función para actualizar la paginación
        function actualizarPaginacion() {
            paginationContainer.innerHTML = '';
            
            if (totalPages <= 1) return;
            
            // Botón anterior
            const prevLi = document.createElement('li');
            prevLi.className = `page-item ${currentPage === 0 ? 'disabled' : ''}`;
            prevLi.innerHTML = `<a class="page-link" href="#">Anterior</a>`;
            prevLi.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentPage > 0) {
                    currentPage--;
                    obtenerViajes();
                }
            });
            paginationContainer.appendChild(prevLi);
            
            // Números de página
            for (let i = 0; i < totalPages; i++) {
                const pageLi = document.createElement('li');
                pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
                pageLi.innerHTML = `<a class="page-link" href="#">${i + 1}</a>`;
                pageLi.addEventListener('click', (e) => {
                    e.preventDefault();
                    currentPage = i;
                    obtenerViajes();
                });
                paginationContainer.appendChild(pageLi);
            }
            
            // Botón siguiente
            const nextLi = document.createElement('li');
                nextLi.className = `page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`;
                nextLi.innerHTML = `<a class="page-link" href="#">Siguiente</a>`;
                nextLi.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (currentPage < totalPages - 1) {
                        currentPage++;
                        obtenerViajes();
                    }
                });
                paginationContainer.appendChild(nextLi);
            }

            // Abrir modal de edición
            function abrirModalEditar(viaje) {
                document.getElementById("txtIdEditar").value = viaje.idViaje;
                document.getElementById("txtNombreEditar").value = viaje.nombreViaje || '';
                document.getElementById("txtDestinoEditar").value = viaje.destino || '';
                
                if (viaje.fecha) {
                    const fechaObj = new Date(viaje.fecha);
                    document.getElementById("dateFechaEditar").value = fechaObj.toISOString().split('T')[0];
                }
                
                document.getElementById("txtPrecioEditar").value = viaje.precio || '';
                document.getElementById("txtEstadoEditar").value = viaje.estado || '';
                document.getElementById("txtIdClienteEditar").value = viaje.idCliente || '';
                document.getElementById("txtIdEmpleadoEditar").value = viaje.idEmpleado || '';
                document.getElementById("txtIdTransporteEditar").value = viaje.idTransporte || '';
                document.getElementById("txtIdHorarioEditar").value = viaje.idHorario || '';
                
                if (viaje.fechaSalida) {
                    const fechaSalidaObj = new Date(viaje.fechaSalida);
                    document.getElementById("dateFechaSalidaEditar").value = fechaSalidaObj.toISOString().split('T')[0];
                }
                
                if (viaje.fechaRegreso) {
                    const fechaRegresoObj = new Date(viaje.fechaRegreso);
                    document.getElementById("dateFechaRegresoEditar").value = fechaRegresoObj.toISOString().split('T')[0];
                }
                
                modalEditar.showModal();
            }

            // Agregar nuevo viaje
            async function agregarViaje() {
                // Capturar los valores del formulario
                const nombre = document.getElementById("txtNombre").value.trim();
                const destino = document.getElementById("txtDestino").value.trim();
                const fecha = document.getElementById("dateFecha").value;
                const precio = parseFloat(document.getElementById("txtPrecio").value);
                const estado = document.getElementById("txtEstado").value;
                const idCliente = parseInt(document.getElementById("txtIdCliente").value);
                const idEmpleado = parseInt(document.getElementById("txtIdEmpleado").value);
                const idTransporte = parseInt(document.getElementById("txtIdTransporte").value);
                const idHorario = parseInt(document.getElementById("txtIdHorario").value);
                const fechaSalida = document.getElementById("dateFechaSalida").value;
                const fechaRegreso = document.getElementById("dateFechaRegreso").value;

                // Validación básica
                if(!nombre || !destino || !fecha || isNaN(precio) || !estado || 
                   isNaN(idCliente) || isNaN(idEmpleado) || isNaN(idTransporte) || isNaN(idHorario) ||
                   !fechaSalida || !fechaRegreso) {
                    mostrarError("Por favor, complete todos los campos correctamente.");
                    return;
                }

                // Preparar datos para enviar
                const data = {
                    nombreViaje: nombre,
                    destino: destino,
                    fecha: new Date(fecha).toISOString(),
                    precio: precio,
                    estado: estado,
                    idCliente: idCliente,
                    idEmpleado: idEmpleado,
                    idTransporte: idTransporte,
                    idHorario: idHorario,
                    fechaSalida: new Date(fechaSalida).toISOString(),
                    fechaRegreso: new Date(fechaRegreso).toISOString()
                };

                try {
                    // Llamar a la API para enviar el registro
                    const respuesta = await fetch(`${API_URL}/registrarViaje`, {
                        method: "POST",
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify(data)
                    });

                    if(!respuesta.ok) {
                        const errorData = await respuesta.json().catch(() => ({}));
                        throw new Error(errorData.message || `Error ${respuesta.status}: ${respuesta.statusText}`);
                    }

                    mostrarExito("El viaje fue agregado correctamente.");
                    document.getElementById("frmAgregar").reset();
                    modal.close();
                    obtenerViajes();
                } catch (error) {
                    console.error("Error al agregar viaje:", error);
                    mostrarError(error.message || "El viaje no pudo ser agregado correctamente.");
                }
            }

            // Editar viaje existente
            async function editarViaje() {
                const id = document.getElementById("txtIdEditar").value;
                const nombre = document.getElementById("txtNombreEditar").value.trim();
                const destino = document.getElementById("txtDestinoEditar").value.trim();
                const fecha = document.getElementById("dateFechaEditar").value;
                const precio = parseFloat(document.getElementById("txtPrecioEditar").value);
                const estado = document.getElementById("txtEstadoEditar").value;
                const idCliente = parseInt(document.getElementById("txtIdClienteEditar").value);
                const idEmpleado = parseInt(document.getElementById("txtIdEmpleadoEditar").value);
                const idTransporte = parseInt(document.getElementById("txtIdTransporteEditar").value);
                const idHorario = parseInt(document.getElementById("txtIdHorarioEditar").value);
                const fechaSalida = document.getElementById("dateFechaSalidaEditar").value;
                const fechaRegreso = document.getElementById("dateFechaRegresoEditar").value;

                if (!id || !nombre || !destino || !fecha || isNaN(precio) || !estado || 
                    isNaN(idCliente) || isNaN(idEmpleado) || isNaN(idTransporte) || isNaN(idHorario) ||
                    !fechaSalida || !fechaRegreso) {
                    mostrarError("Por favor, complete todos los campos correctamente.");
                    return;
                }

                // Preparar datos para enviar
                const data = {
                    nombreViaje: nombre,
                    destino: destino,
                    fecha: new Date(fecha).toISOString(),
                    precio: precio,
                    estado: estado,
                    idCliente: idCliente,
                    idEmpleado: idEmpleado,
                    idTransporte: idTransporte,
                    idHorario: idHorario,
                    fechaSalida: new Date(fechaSalida).toISOString(),
                    fechaRegreso: new Date(fechaRegreso).toISOString()
                };

                try {
                    const respuesta = await fetch(`${API_URL}/editarViaje/${id}`, {
                        method: "PUT",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify(data)
                    });

                    if (!respuesta.ok) {
                        const errorData = await respuesta.json().catch(() => ({}));
                        throw new Error(errorData.message || `Error ${respuesta.status}: ${respuesta.statusText}`);
                    }

                    mostrarExito("El viaje fue actualizado correctamente.");
                    modalEditar.close();
                    obtenerViajes();
                } catch (error) {
                    console.error("Error al actualizar viaje:", error);
                    mostrarError(error.message || "El viaje no pudo ser actualizado correctamente.");
                }
            }

            // Eliminar viaje
            async function eliminarViaje(id) {
                try {
                    const result = await Swal.fire({
                        title: "¿Estás seguro?",
                        text: "¿Deseas eliminar este viaje?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#3085d6",
                        cancelButtonColor: "#d33",
                        confirmButtonText: "Sí, eliminarlo",
                        cancelButtonText: "Cancelar"
                    });

                    if (result.isConfirmed) {
                        const respuesta = await fetch(`${API_URL}/eliminarViaje/${id}`, {
                            method: "DELETE"
                        });

                        if (!respuesta.ok) {
                            const errorData = await respuesta.json().catch(() => ({}));
                            throw new Error(errorData.message || `Error ${respuesta.status}: ${respuesta.statusText}`);
                        }

                        mostrarExito("El viaje fue eliminado correctamente.");
                        obtenerViajes();
                    } else {
                        mostrarInfo("El viaje no fue eliminado.");
                    }
                } catch (error) {
                    console.error("Error al eliminar viaje:", error);
                    mostrarError(error.message || "Hubo un problema al eliminar el viaje.");
                }
            }

            // Mostrar mensajes de alerta
            function mostrarExito(mensaje) {
                Swal.fire({
                    title: "Éxito",
                    text: mensaje,
                    icon: "success"
                });
            }

            function mostrarError(mensaje) {
                Swal.fire({
                    title: "Error",
                    text: mensaje,
                    icon: "error"
                });
            }

            function mostrarInfo(mensaje) {
                Swal.fire({
                    title: "Información",
                    text: mensaje,
                    icon: "info"
                });
            }

            // Validaciones para campos de precio
            function inicializarValidacionesPrecios() {
                const camposPrecios = ['txtPrecio', 'txtPrecioEditar'];

                camposPrecios.forEach(function (campoId) {
                    const campo = document.getElementById(campoId);
                    if (campo) {
                        // Prevenir tecla de signo menos
                        campo.addEventListener('keydown', function(e) {
                            if (e.key === '-' || e.key === 'Subtract') {
                                e.preventDefault();
                            }
                        });

                        // Prevenir valores negativos al pegar
                        campo.addEventListener('paste', function(e) {
                            setTimeout(() => {
                                if (this.value < 0) {
                                    this.value = '';
                                }
                            }, 10);
                        });

                        // Validar en tiempo real
                        campo.addEventListener('input', function(e) {
                            if (this.value < 0) {
                                this.value = '';
                            }
                        });
                    }
                });
            }