// URL del EndPoint de los empleados - API
const API_URL = "http://localhost:8080/ApiEmpleado";

// Variables globales para paginación
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;

// Elementos del DOM
let modal, modalEditar, btnAddEmpleado, btnCerrar, btnCerrarEditar, pageSizeSelect, paginationContainer;

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', inicializarApp);

function inicializarApp() {
    console.log("Inicializando aplicación de Empleados...");
    
    // Obtener elementos del DOM
    modal = document.getElementById("mdAgregar");
    modalEditar = document.getElementById("mdEditar");
    btnAddEmpleado = document.getElementById("btnAddEmpleado");
    btnCerrar = document.getElementById("btnCerrar");
    btnCerrarEditar = document.getElementById("btnCerrarEditar");
    pageSizeSelect = document.getElementById("pageSize");
    paginationContainer = document.getElementById("pagination");

    // Verificar que todos los elementos existan
    if (!modal || !modalEditar || !btnAddEmpleado || !pageSizeSelect || !paginationContainer) {
        console.error("Error: No se encontraron algunos elementos del DOM");
        mostrarError("Error al inicializar la aplicación. Recarga la página.");
        return;
    }

    // Configurar eventos
    configurarEventos();
    
    // Cargar datos iniciales
    pageSize = parseInt(pageSizeSelect.value);
    obtenerEmpleados();
    inicializarValidacionesSalario();
}

function configurarEventos() {
    // Evento para cambiar el tamaño de página
    pageSizeSelect.addEventListener("change", () => {
        pageSize = parseInt(pageSizeSelect.value);
        currentPage = 0;
        obtenerEmpleados();
    });
    
    // Evento para botón flotante (único botón)
    btnAddEmpleado.addEventListener("click", () => {
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
            agregarEmpleado();
        });
    }
    
    if (formEditar) {
        formEditar.addEventListener("submit", function(e) {
            e.preventDefault();
            editarEmpleado();
        });
    }
}

// Función para obtener empleados con paginación
async function obtenerEmpleados() {
    try {
        const respuesta = await fetch(`${API_URL}/ListaEmpleado?page=${currentPage}&size=${pageSize}`);
        if (!respuesta.ok) {
            throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
        }
        
        const data = await respuesta.json();
        totalPages = data.totalPages;
        mostrarDatos(data.content);
        actualizarPaginacion();
    } catch (error) {
        console.error("Error al obtener empleados:", error);
        mostrarError("Los registros no pudieron ser cargados.");
    }
}

// Mostrar datos en la tabla
function mostrarDatos(datos) {
    const tabla = document.querySelector("#tabla tbody");
    tabla.innerHTML = "";

    if (!datos || datos.length === 0) {
        tabla.innerHTML = '<tr><td colspan="10">No hay registros de empleados</td></tr>';
        return;
    }

    datos.forEach(empleado => {
        const fechaNacimientoFormateada = empleado.fechaNacimiento 
            ? new Date(empleado.fechaNacimiento).toLocaleDateString('es-ES') 
            : 'N/A';
        
        const salarioFormateado = empleado.salario 
            ? `$${empleado.salario.toFixed(2)}` 
            : '$0.00';

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${empleado.idEmpleado || 'N/A'}</td>
            <td>${empleado.idRango || 'N/A'}</td>
            <td>${empleado.nombreEmpleado || 'N/A'}</td>
            <td>${empleado.apellidoEmpleado || 'N/A'}</td>
            <td>${empleado.emailEmpleado || 'N/A'}</td>
            <td>${fechaNacimientoFormateada}</td>
            <td>${empleado.telefono || 'N/A'}</td>
            <td>${empleado.direccion || 'N/A'}</td>
            <td>${salarioFormateado}</td>
            <td>
                <button class="button button-edit" data-id="${empleado.idEmpleado}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="button button-delete" data-id="${empleado.idEmpleado}">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            </td>
        `;

        // Agregar eventos a los botones
        tr.querySelector(".button-edit").addEventListener("click", function() {
            abrirModalEditar(empleado);
        });

        tr.querySelector(".button-delete").addEventListener("click", function() {
            eliminarEmpleado(empleado.idEmpleado);
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
            obtenerEmpleados();
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
            obtenerEmpleados();
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
            obtenerEmpleados();
        }
    });
    paginationContainer.appendChild(nextLi);
}

// Abrir modal de edición
function abrirModalEditar(empleado) {
    document.getElementById("txtIdEditar").value = empleado.idEmpleado;
    document.getElementById("txtIdRangoEditar").value = empleado.idRango || '';
    document.getElementById("txtNombreEditar").value = empleado.nombreEmpleado || '';
    document.getElementById("txtApellidoEditar").value = empleado.apellidoEmpleado || '';
    document.getElementById("txtEmailEditar").value = empleado.emailEmpleado || '';
    
    if (empleado.fechaNacimiento) {
        const fechaObj = new Date(empleado.fechaNacimiento);
        document.getElementById("dateFechaNacimientoEditar").value = fechaObj.toISOString().split('T')[0];
    }
    
    document.getElementById("txtTelefonoEditar").value = empleado.telefono || '';
    document.getElementById("txtDireccionEditar").value = empleado.direccion || '';
    document.getElementById("txtSalarioEditar").value = empleado.salario || '';
    
    modalEditar.showModal();
}

// Agregar nuevo empleado
async function agregarEmpleado() {
    // Capturar los valores del formulario
    const idRango = parseInt(document.getElementById("txtIdRango").value);
    const nombre = document.getElementById("txtNombre").value.trim();
    const apellido = document.getElementById("txtApellido").value.trim();
    const email = document.getElementById("txtEmail").value.trim();
    const fechaNacimiento = document.getElementById("dateFechaNacimiento").value;
    const telefono = document.getElementById("txtTelefono").value.trim();
    const direccion = document.getElementById("txtDireccion").value.trim();
    const salario = parseFloat(document.getElementById("txtSalario").value) || 0;

    // Validación básica
    if(isNaN(idRango) || !nombre || !apellido || !fechaNacimiento) {
        mostrarError("Por favor, complete todos los campos obligatorios correctamente.");
        return;
    }

    // Preparar datos para enviar
    const data = {
        idRango: idRango,
        nombreEmpleado: nombre,
        apellidoEmpleado: apellido,
        emailEmpleado: email,
        fechaNacimiento: new Date(fechaNacimiento).toISOString(),
        telefono: telefono,
        direccion: direccion,
        salario: salario
    };

    try {
        // Llamar a la API para enviar el registro
        const respuesta = await fetch(`${API_URL}/registrarEmpleado`, {
            method: "POST",
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(data)
        });

        if(!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${respuesta.status}: ${respuesta.statusText}`);
        }

        mostrarExito("El empleado fue agregado correctamente.");
        document.getElementById("frmAgregar").reset();
        modal.close();
        obtenerEmpleados();
    } catch (error) {
        console.error("Error al agregar empleado:", error);
        mostrarError(error.message || "El empleado no pudo ser agregado correctamente.");
    }
}

// Editar empleado existente
async function editarEmpleado() {
    const id = document.getElementById("txtIdEditar").value;
    const idRango = parseInt(document.getElementById("txtIdRangoEditar").value);
    const nombre = document.getElementById("txtNombreEditar").value.trim();
    const apellido = document.getElementById("txtApellidoEditar").value.trim();
    const email = document.getElementById("txtEmailEditar").value.trim();
    const fechaNacimiento = document.getElementById("dateFechaNacimientoEditar").value;
    const telefono = document.getElementById("txtTelefonoEditar").value.trim();
    const direccion = document.getElementById("txtDireccionEditar").value.trim();
    const salario = parseFloat(document.getElementById("txtSalarioEditar").value) || 0;

    if (!id || isNaN(idRango) || !nombre || !apellido || !fechaNacimiento) {
        mostrarError("Por favor, complete todos los campos obligatorios correctamente.");
        return;
    }

    // Preparar datos para enviar
    const data = {
        idRango: idRango,
        nombreEmpleado: nombre,
        apellidoEmpleado: apellido,
        emailEmpleado: email,
        fechaNacimiento: new Date(fechaNacimiento).toISOString(),
        telefono: telefono,
        direccion: direccion,
        salario: salario
    };

    try {
        const respuesta = await fetch(`${API_URL}/editarEmpleado/${id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });

        if (!respuesta.ok) {
            const errorData = await respuesta.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${respuesta.status}: ${respuesta.statusText}`);
        }

        mostrarExito("El empleado fue actualizado correctamente.");
        modalEditar.close();
        obtenerEmpleados();
    } catch (error) {
        console.error("Error al actualizar empleado:", error);
        mostrarError(error.message || "El empleado no pudo ser actualizado correctamente.");
    }
}

// Eliminar empleado
async function eliminarEmpleado(id) {
    try {
        const result = await Swal.fire({
            title: "¿Estás seguro?",
            text: "¿Deseas eliminar este empleado?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, eliminarlo",
            cancelButtonText: "Cancelar"
        });

        if (result.isConfirmed) {
            const respuesta = await fetch(`${API_URL}/eliminarEmpleado/${id}`, {
                method: "DELETE"
            });

            if (!respuesta.ok) {
                const errorData = await respuesta.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${respuesta.status}: ${respuesta.statusText}`);
            }

            mostrarExito("El empleado fue eliminado correctamente.");
            obtenerEmpleados();
        } else {
            mostrarInfo("El empleado no fue eliminado.");
        }
    } catch (error) {
        console.error("Error al eliminar empleado:", error);
        mostrarError(error.message || "Hubo un problema al eliminar el empleado.");
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

// Validaciones para campos de salario
function inicializarValidacionesSalario() {
    const camposSalario = ['txtSalario', 'txtSalarioEditar'];

    camposSalario.forEach(function (campoId) {
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