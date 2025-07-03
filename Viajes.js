// URL del EndPoint de los integrantes - API
const API_URL = "https://retoolapi.dev/LpiuHC/data";

// Elementos del DOM
const modal = document.getElementById("mdAgregar");
const modalEditar = document.getElementById("mdEditar");
const btnAgregar = document.getElementById("BtnAgregar");
const btnCerrar = document.getElementById("btnCerrar");
const btnCerrarEditar = document.getElementById("btnCerrarEditar");

// Obtener integrantes al cargar la página
document.addEventListener('DOMContentLoaded', ObtenerViajes);

// Función para obtener integrantes
async function ObtenerViajes() {
    try {
        const respuesta = await fetch(API_URL);
        const data = await respuesta.json();
        MostrarDatos(data);
    } catch (error) {
        console.error("Error al obtener los viajes:", error);
        alert("Error al cargar los datos. Por favor recarga la página.");
    }
}

// Mostrar datos en la tabla
function MostrarDatos(datos) {
    const tabla = document.querySelector("#tabla tbody");
    tabla.innerHTML = "";

    datos.forEach(Viaje => {
        tabla.innerHTML += `
        <tr>
            <td>${Viaje.id}</td>
            <td>${Viaje.nombre}</td>
            <td>${Viaje.destino}</td>
            <td>${Viaje.fecha}</td>
            <td>${Viaje.precio}</td>
            <td>${Viaje.estado}</td>
            <td>
                    <button class="button button-edit" onclick="AbrirModalEditar('${Viaje.id}', '${Viaje.nombre}', '${Viaje.destino}', '${Viaje.fecha}', '${Viaje.precio}', '${Viaje.estado}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="button button-delete" onclick="EliminarViaje(${Viaje.id})">
                        <i class="fas fa-trash-alt"></i> Eliminar
                    </button>
                </div>
            </td>
        </tr>
        `;
    });
}

// Eventos para el modal de agregar
btnAgregar.addEventListener("click", () => {
    modal.showModal();
});

btnCerrar.addEventListener("click", (e) => {
    e.preventDefault();
    modal.close();
});

// Eventos para el modal de editar
btnCerrarEditar.addEventListener("click", (e) => {
    e.preventDefault();
    modalEditar.close();
});



// Abrir modal de edición
function AbrirModalEditar(id, nombre, destino, fecha, precio, estado) {
    document.getElementById("txtIdEditar").value = id;
    document.getElementById("txtNombreEditar").value = nombre;
    document.getElementById("txtDestinoEditar").value = destino;
    document.getElementById("dateFechaEditar").value = fecha;
    document.getElementById("txtPrecioEditar").value = precio;
    document.getElementById("txtEstadoEditar").value = estado;
    modalEditar.showModal();
}

//Agregar nuevio integrante desde el formulario
document.getElementById("frmAgregar").addEventListener("submit",async e =>{
    e.preventDefault(); // e Representa a submit. Evita que el formulario se envie solo.

    //Capturar los valores del formulario
    const nombre = document.getElementById("txtNombre").value.trim();
    const destino = document.getElementById("txtDestino").value.trim();
    const fecha = document.getElementById("dateFecha").value.trim();
    const precio = document.getElementById("txtPrecio").value.trim();
    const estado = document.getElementById("txtEstado").value.trim();


    //Validadcion basica

    if(!nombre || !destino || !fecha || !precio || !estado){
        alert("Ingresar los valores correctamente");
        return; //Para evitar que el codigo se siga ejecutando
    }

    //Llamar a la API para enviar el registro
    const respuesta = await fetch(API_URL, {
        method: "POST", //Tipo de solicitud
        headers: {'Content-Type':'application/json'}, //Tipo de datos enviados
        body: JSON.stringify({nombre,destino,fecha,precio,estado})//Datos enviados
    });

    //Verificacion si la API rsponde que los datos fueron enviados correctamente
    if(respuesta.ok){
        alert("El registro fue agregado correctamente");

        //Limpiar el formulario
        document.getElementById("frmAgregar").reset();

        //Cerrar el modal (dialog)
        modal.close();

        //Recargar la tabla
        ObtenerViajes();
    }else{
        //En caso de que la API no devuelva un codigo diferente a 200-299
        alert("El registro no pudo ser agregado");
    }
});


// Formulario para editar
document.getElementById("frmEditar").addEventListener("submit", async e => {
    e.preventDefault();

    const id = document.getElementById("txtIdEditar").value;
    const nombre = document.getElementById("txtNombreEditar").value.trim();
    const destino = document.getElementById("txtDestinoEditar").value.trim();
    const fecha = document.getElementById("dateFechaEditar").value.trim();
    const precio = document.getElementById("txtPrecioEditar").value.trim();
    const estado = document.getElementById("txtEstadoEditar").value.trim();

    if (!id || !nombre || !destino || !fecha || !precio || !estado) {
        alert("Por favor complete todos los campos obligatorios");
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({nombre, destino, fecha, precio, estado})
        });

        if (respuesta.ok) {
            alert("Registro actualizado correctamente");
            modalEditar.close();
            ObtenerViajes();
        } else {
            throw new Error("Error en la respuesta del servidor");
        }
    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("Error al actualizar el registro");
    }
});

// Eliminar integrante
async function EliminarViaje(id) {
    const confirmacion = confirm("¿Está seguro que desea eliminar este registro?");

    if (confirmacion) {
        try {
            const respuesta = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            if (respuesta.ok) {
                alert("Registro eliminado correctamente");
                ObtenerViajes();
            } else {
                throw new Error("Error en la respuesta del servidor");
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Error al eliminar el registro");
        }
    }
}