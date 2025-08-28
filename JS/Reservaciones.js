// URL del EndPoint de los integrantes - API
const API_URL = "https://retoolapi.dev/5nimly/data";

// Elementos del DOM
const modal = document.getElementById("mdAgregar");
const modalEditar = document.getElementById("mdEditar");
const btnAgregar = document.getElementById("BtnAgregar");
const btnCerrar = document.getElementById("btnCerrar");
const btnCerrarEditar = document.getElementById("btnCerrarEditar");

// Obtener integrantes al cargar la página
document.addEventListener('DOMContentLoaded', function () {
  ObtenerReservaciones();
  inicializarFechaFutura();
});


// Función para obtener integrantes
async function ObtenerReservaciones() {
    try {
        const respuesta = await fetch(API_URL);
        const data = await respuesta.json();
        MostrarDatos(data);
    } catch (error) {
        Swal.fire({
        title: "Error",
        text: "Los registros no fueron cargados correctamente",
        icon: "error", error
    });
    }
}

// Mostrar datos en la tabla
function MostrarDatos(datos) {
    const tabla = document.querySelector("#tabla tbody");
    tabla.innerHTML = "";

    datos.forEach(Reservacion => {
        tabla.innerHTML += `
        <tr>
            <td>${Reservacion.id}</td>
            <td>${Reservacion.cliente}</td>
            <td>${Reservacion.viaje}</td>
            <td>${Reservacion.fecha}</td>
            <td>${Reservacion.personas}</td>
            <td>${Reservacion.estado}</td>
            <td>
                    <button class="button button-edit" onclick="AbrirModalEditar('${Reservacion.id}', '${Reservacion.cliente}', '${Reservacion.viaje}', '${Reservacion.fecha}', '${Reservacion.personas}', '${Reservacion.estado}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="button button-delete" onclick="EliminarViaje(${Reservacion.id})">
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
function AbrirModalEditar(id, cliente, viaje, fecha, personas, estado) {
    document.getElementById("txtIdEditar").value = id;
    document.getElementById("txtClienteEditar").value = cliente;
    document.getElementById("txtViajeEditar").value = viaje;
    document.getElementById("dateFechaEditar").value = fecha;
    document.getElementById("txtPersonasEditar").value = personas;
    document.getElementById("txtEstadoEditar").value = estado;
    modalEditar.showModal();
}

//Agregar nuevio integrante desde el formulario
document.getElementById("frmAgregar").addEventListener("submit",async e =>{
    e.preventDefault(); // e Representa a submit. Evita que el formulario se envie solo.

    //Capturar los valores del formulario
    const cliente = document.getElementById("txtCliente").value.trim();
    const viaje = document.getElementById("txtViaje").value.trim();
    const fecha = document.getElementById("dateFecha").value.trim();
    const personas = document.getElementById("txtPersonas").value.trim();
    const estado = document.getElementById("txtEstado").value.trim();


    //Validadcion basica

    if(!cliente || !viaje || !fecha || !personas || !estado){
        Swal.fire({
        title: "Error",
        text: "Ingrese los valores correctamente",
        icon: "error", error
    });
        return; //Para evitar que el codigo se siga ejecutando
    }

    //Llamar a la API para enviar el registro
    const respuesta = await fetch(API_URL, {
        method: "POST", //Tipo de solicitud
        headers: {'Content-Type':'application/json'}, //Tipo de datos enviados
        body: JSON.stringify({cliente,viaje,fecha,personas,estado})//Datos enviados
    });

    //Verificacion si la API rsponde que los datos fueron enviados correctamente
    if(respuesta.ok){
        Swal.fire({
        title: "Exito",
        text: "El registro fue agregado correctamente",
        icon: "success"
    });

        //Limpiar el formulario
        document.getElementById("frmAgregar").reset();

        //Cerrar el modal (dialog)
        modal.close();

        //Recargar la tabla
        ObtenerReservaciones();
    }else{
        //En caso de que la API no devuelva un codigo diferente a 200-299
        Swal.fire({
        title: "Error",
        text: "El registro no pudo ser actualizado correctamente",
        icon: "error"
    });
    }
});


// Formulario para editar
document.getElementById("frmEditar").addEventListener("submit", async e => {
    e.preventDefault();

    const id = document.getElementById("txtIdEditar").value;
    const cliente = document.getElementById("txtClienteEditar").value.trim();
    const viaje = document.getElementById("txtViajeEditar").value.trim();
    const fecha = document.getElementById("dateFechaEditar").value.trim();
    const personas = document.getElementById("txtPersonasEditar").value.trim();
    const estado = document.getElementById("txtEstadoEditar").value.trim();

    if (!id || !cliente || !viaje || !fecha || !personas || !estado) {
        Swal.fire({
        title: "Error",
        text: "Llene todos los campos",
        icon: "error", error
    });
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({cliente, viaje, fecha, personas, estado})
        });

        if (respuesta.ok) {
            Swal.fire({
            title: "Exito",
            text: "El registro fue actualizado correctamente",
            icon: "success"
            });
            modalEditar.close();
            ObtenerReservaciones();
        } else {
            throw new Error("Error en la respuesta del servidor");
        }
    } catch (error) {
        Swal.fire({
        title: "Error",
        text: "El registro no pudo ser actualizado correctamente",
        icon: "error", error
    });
    }
});

// Eliminar integrante
async function EliminarViaje(id) {
    try {
    // Esperamos la confirmación del usuario
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas eliminar este registro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminarlo",
      cancelButtonText: "Cancelar"
    });

    // Si el usuario confirma, continuamos
    if (result.isConfirmed) {
      const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
      });

      if (respuesta.ok) {
        Swal.fire({
          title: "¡Eliminado!",
          text: "El registro fue eliminado correctamente.",
          icon: "success"
        });
        ObtenerReservaciones(); // Actualiza la lista
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } else {
      // El usuario canceló
      Swal.fire({
        title: "Cancelado",
        text: "El registro no fue eliminado.",
        icon: "info"
      });
    }

  } catch (error) {
    console.error("Error al eliminar:", error);
    Swal.fire({
      title: "Error",
      text: "Hubo un problema al eliminar el registro.",
      icon: "error"
    });
  } 
}

function inicializarFechaFutura() {
  const camposFechas = ['dateFecha', 'dateFechaEditar'];

  const hoy = new Date();
  hoy.setDate(hoy.getDate() + 1); // Mañana

  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');

  const fechaMinima = `${yyyy}-${mm}-${dd}`;

  camposFechas.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.setAttribute('min', fechaMinima);
    }
  });
}

