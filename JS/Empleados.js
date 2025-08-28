// URL del EndPoint de los integrantes - API
const API_URL = "https://retoolapi.dev/seLgB9/data";

// Elementos del DOM
const modal = document.getElementById("mdAgregar");
const modalEditar = document.getElementById("mdEditar");
const btnAgregar = document.getElementById("BtnAgregar");
const btnCerrar = document.getElementById("btnCerrar");
const btnCerrarEditar = document.getElementById("btnCerrarEditar");

// Obtener integrantes al cargar la página
document.addEventListener('DOMContentLoaded', function () {
  ObtenerEmpleados();
  inicializarFechaPasada();
});


// Función para obtener integrantes
async function ObtenerEmpleados() {
    try {
        const respuesta = await fetch(API_URL);
        const data = await respuesta.json();
        MostrarDatos(data);
    } catch (error) {
        Swal.fire({
        title: "Error",
        text: "Error al cargar los registros",
        icon: "error", error
    });
    }
}

// Mostrar datos en la tabla
function MostrarDatos(datos) {
    const tabla = document.querySelector("#tabla tbody");
    tabla.innerHTML = "";

    datos.forEach(Empleados => {
        tabla.innerHTML += `
        <tr>
            <td>${Empleados.id}</td>
            <td>${Empleados.Rango}</td>
            <td>${Empleados.Nombres}</td>
            <td>${Empleados.Apellidos}</td>
            <td>${Empleados.Correo}</td>
            <td>${Empleados.FechaNacimiento}</td>
            <td>${Empleados.Telefono}</td>
            <td>${Empleados.Direccion}</td>
            <td>
                    <button class="button button-edit" onclick="AbrirModalEditar('${Empleados.id}', '${Empleados.Rango}', '${Empleados.Nombres}', '${Empleados.Apellidos}', '${Empleados.Correo}', '${Empleados.FechaNacimiento}', '${Empleados.Telefono}', '${Empleados.Direccion}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="button button-delete" onclick="EliminarEmpleado(${Empleados.id})">
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
function AbrirModalEditar(id, Rango, Nombres, Apellidos, Correo, FechaNacimiento, Telefono, Direccion) {
    document.getElementById("txtIdEditar").value = id;
    document.getElementById("IntRangoEditar").value = Rango;
    document.getElementById("txtNombreEditar").value = Nombres;
    document.getElementById("txtApellidoEditar").value = Apellidos;
    document.getElementById("txtCorreoEditar").value = Correo;
    document.getElementById("dateFechaNacimientoEditar").value = FechaNacimiento;
    document.getElementById("txtTelefonoEditar").value = Telefono;
    document.getElementById("txtDireccionEditar").value = Direccion;
    modalEditar.showModal();
}

//Agregar nuevio integrante desde el formulario
document.getElementById("frmAgregar").addEventListener("submit",async e =>{
    e.preventDefault(); // e Representa a submit. Evita que el formulario se envie solo.

    //Capturar los valores del formulario
    const Rango = document.getElementById("IntRango").value.trim();
    const Nombres = document.getElementById("txtNombre").value.trim();
    const Apellidos = document.getElementById("txtApellido").value.trim();
    const Correo = document.getElementById("txtCorreo").value.trim();
    const FechaNacimiento = document.getElementById("dateFechaNacimiento").value.trim();
    const Telefono = document.getElementById("txtTelefono").value.trim();
    const Direccion = document.getElementById("txtDireccion").value.trim();


    //Validadcion basica

    if(!Rango || !Nombres || !Apellidos || !Correo || !FechaNacimiento || !Telefono || !Direccion){
        Swal.fire({
        title: "Error",
        text: "Ingrese los valores correctamente",
        icon: "error"
    });
        
        return; //Para evitar que el codigo se siga ejecutando
    }

    //Llamar a la API para enviar el registro
    const respuesta = await fetch(API_URL, {
        method: "POST", //Tipo de solicitud
        headers: {'Content-Type':'application/json'}, //Tipo de datos enviados
        body: JSON.stringify({Rango,Nombres,Apellidos,Correo,FechaNacimiento,Telefono,Direccion})//Datos enviados
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
        ObtenerEmpleados();
    }else{
        //En caso de que la API no devuelva un codigo diferente a 200-299
        Swal.fire({
        title: "Error",
        text: "El registro no pudo ser agregado correctamente",
        icon: "error"
    });
    }
});


// Formulario para editar
document.getElementById("frmEditar").addEventListener("submit", async e => {
    e.preventDefault();
    
    const id = document.getElementById("txtIdEditar").value.trim();
    const Rango = document.getElementById("IntRangoEditar").value.trim();
    const Nombres = document.getElementById("txtNombreEditar").value.trim();
    const Apellidos = document.getElementById("txtApellidoEditar").value.trim();
    const Correo = document.getElementById("txtCorreoEditar").value.trim();
    const FechaNacimiento = document.getElementById("dateFechaNacimientoEditar").value.trim();
    const Telefono = document.getElementById("txtTelefonoEditar").value.trim();
    const Direccion = document.getElementById("txtDireccionEditar").value.trim();

    if (!Rango || !Nombres || !Apellidos || !Correo || !FechaNacimiento || !Telefono || !Direccion) {
        
        Swal.fire({
        title: "Error",
        text: "Ingrese los datos correctamente",
        icon: "error"
    });
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({Rango,Nombres,Apellidos,Correo,FechaNacimiento,Telefono, Direccion})
        });

        if (respuesta.ok) {
            Swal.fire({
        title: "Exito",
        text: "El registro fue actualizado correctamente",
        icon: "success"
    });
            
            modalEditar.close();
            ObtenerEmpleados();
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
async function EliminarEmpleado(id) {
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
        ObtenerEmpleados(); // Actualiza la lista
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

function inicializarFechaPasada() {
  const campo = document.getElementById('dateFechaNacimiento');
  const campoEditar = document.getElementById('dateFechaNacimientoEditar'); // si también lo usas

  const ahora = new Date();
  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, '0');
  const dd = String(ahora.getDate()).padStart(2, '0');
  const hh = String(ahora.getHours()).padStart(2, '0');
  const min = String(ahora.getMinutes()).padStart(2, '0');

  const fechaHoraActual = `${yyyy}-${mm}-${dd}T${hh}:${min}`;

  if (campo) campo.max = fechaHoraActual;
  if (campoEditar) campoEditar.max = fechaHoraActual;
}
