// URL del EndPoint de los integrantes - API
const API_URL = "https://retoolapi.dev/LpiuHC/data";

// Elementos del DOM
const modal = document.getElementById("mdAgregar");
const modalEditar = document.getElementById("mdEditar");
const btnAgregar = document.getElementById("BtnAgregar");
const btnCerrar = document.getElementById("btnCerrar");
const btnCerrarEditar = document.getElementById("btnCerrarEditar");

// Obtener integrantes al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    ObtenerViajes();
    inicializarValidacionesPrecios();
    inicializarFechaFutura();
});

// Función para obtener integrantes
async function ObtenerViajes() {
    try {
        const respuesta = await fetch(API_URL);
        const data = await respuesta.json();
        MostrarDatos(data);
    } catch (error) {
        Swal.fire({
          title: "Error",
          text: "Los registros no pudieron ser cargados.",
          icon: "error", error
        });
    }
}

// Mostrar datos en la tabla
function MostrarDatos(datos) {
    const tabla = document.querySelector("#tabla tbody");
    tabla.innerHTML = "";

    datos.forEach(Viaje => {
       
      const precioFormateado = '$' + parseFloat(Viaje.precio || 0).toFixed(2);

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
        body: JSON.stringify({nombre,destino,fecha,precio,estado})//Datos enviados
    });

    //Verificacion si la API rsponde que los datos fueron enviados correctamente
    if(respuesta.ok){
        Swal.fire({
          title: "Exito",
          text: "El registro fue agregado correctamente.",
          icon: "success"
        });

        //Limpiar el formulario
        document.getElementById("frmAgregar").reset();

        //Cerrar el modal (dialog)
        modal.close();

        //Recargar la tabla
        ObtenerViajes();
    }else{
        //En caso de que la API no devuelva un codigo diferente a 200-299
        Swal.fire({
          title: "Error",
          text: "El registro no pudo ser agregado correctamente.",
          icon: "error"
        });
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
        Swal.fire({
          title: "error",
          text: "Ingrese los valores correctamente",
          icon: "error"
        });
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({nombre, destino, fecha, precio, estado})
        });

        if (respuesta.ok) {
            Swal.fire({
          title: "Exito",
          text: "El registro fue actualizado correctamente.",
          icon: "success"
        });
            modalEditar.close();
            ObtenerViajes();
        } else {
            throw new Error("Error en la respuesta del servidor");
        }
    } catch (error) {
        Swal.fire({
          title: "Error",
          text: "El registro no pudo ser actualizado correctamente.",
          icon: "error"
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
        ObtenerViajes(); // Actualiza la lista
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

function formatearPrecio(valor) {
    // Limpiar el valor de caracteres no numéricos excepto punto
    let numero = valor.replace(/[^0-9.]/g, '');
    
    // Prevenir múltiples puntos
    const partes = numero.split('.');
    if (partes.length > 2) {
        numero = partes[0] + '.' + partes[1];
    }
    
    // Limitar a 2 decimales
    if (partes[1] && partes[1].length > 2) {
        numero = partes[0] + '.' + partes[1].substring(0, 2);
    }
    
    return numero;
}

// Función para obtener valor numérico del campo con $
function obtenerValorNumerico(valor) {
    return valor.replace(/[$,]/g, '');
}

// Validaciones para campos de precio - Prevenir números negativos
document.addEventListener('DOMContentLoaded', function() {
    // Prevenir entrada de signo menos en campos de precio
    const camposPrecios = ['txtPrecio', 'txtPrecioEditar'];
    
    camposPrecios.forEach(function(campoId) {
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
});

//Validaciones para campos de precio - Prevenir números negativos
function inicializarValidacionesPrecios() {
  const camposPrecios = ['txtPrecio', 'txtPrecioEditar'];

  camposPrecios.forEach(function (campoId) {
    const campo = document.getElementById(campoId);
    if (campo) {
      // Formato en tiempo real
      campo.addEventListener('input', function (e) {
        const valorFormateado = formatearPrecio(this.value);
        if (valorFormateado && !isNaN(valorFormateado) && parseFloat(valorFormateado) >= 0) {
          if (this.value !== valorFormateado) {
            this.value = valorFormateado;
          }
        } else if (valorFormateado === '') {
          this.value = '';
        }
      });

      // Prevenir caracteres no deseados
      campo.addEventListener('keydown', function (e) {
        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
          e.preventDefault();
        }
      });

      // Formatear al perder el foco
      campo.addEventListener('blur', function (e) {
        if (this.value && !isNaN(this.value)) {
          const numero = parseFloat(this.value);
          if (numero >= 0) {
            this.value = numero.toFixed(2);
          }
        }
      });
    }
  });


}

function inicializarFechaFutura() {
  const campoFecha = document.getElementById("dateFecha");

  if (campoFecha) {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 1); // Mañana

    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');

    const fechaMinima = `${yyyy}-${mm}-${dd}`;
    campoFecha.setAttribute("min", fechaMinima);
  }
}