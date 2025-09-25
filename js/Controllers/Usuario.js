        // URL del EndPoint de los usuarios - API
        const API_URL = "http://localhost:8080/apiUsuario";

        // Variables globales
        let modalUsuarios, formUsuario, btnCerrarModal;

        // Inicializar la aplicación cuando el DOM esté cargado
        document.addEventListener('DOMContentLoaded', inicializarApp);

        function inicializarApp() {
            console.log("Inicializando aplicación de Explorer World...");
            
            // Configurar eventos del formulario de login
            const formLogin = document.getElementById("frmLogin");
            const formRegistro = document.getElementById("frmRegistro");
            
            if (formLogin) {
                formLogin.addEventListener("submit", function(e) {
                    e.preventDefault();
                    iniciarSesion();
                });
            }
            
            if (formRegistro) {
                formRegistro.addEventListener("submit", function(e) {
                    e.preventDefault();
                    registrarUsuario();
                });
            }
            
            // Configurar modal de usuarios
            modalUsuarios = document.getElementById("mdUsuarios");
            formUsuario = document.getElementById("frmUsuario");
            btnCerrarModal = document.getElementById("btnCerrarModal");
            
            if (formUsuario) {
                formUsuario.addEventListener("submit", function(e) {
                    e.preventDefault();
                    guardarUsuario();
                });
            }
            
            if (btnCerrarModal) {
                btnCerrarModal.addEventListener("click", function() {
                    modalUsuarios.close();
                });
            }
            
            // Configurar eventos de toggle
            const container = document.getElementById('container');
            const registerBtn = document.getElementById('register');
            const loginBtn = document.getElementById('login');

            if (registerBtn) {
                registerBtn.addEventListener('click', () => {
                    container.classList.add("active");
                });
            }

            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    container.classList.remove("active");
                });
            }
        }

        // Función para iniciar sesión
        async function iniciarSesion() {
            const correo = document.getElementById("txtCorreo").value.trim();
            const contrasena = document.getElementById("txtContrasena").value.trim();

            if (!correo || !contrasena) {
                mostrarError("Por favor, complete todos los campos.");
                return;
            }

            try {
                // En una implementación real, aquí se verificarían las credenciales
                // con el backend
                const respuesta = await fetch(`${API_URL}/consultarUsuario`);
                if (!respuesta.ok) {
                    throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
                }
                
                const usuarios = await respuesta.json();
                const usuarioValido = usuarios.find(u => u.correo === correo && u.contrasena === contrasena);
                
                if (usuarioValido) {
                    mostrarExito("Inicio de sesión exitoso. Redirigiendo...");
                    // Redirigir después de 2 segundos
                    setTimeout(() => {
                        window.location.href = "index.html";
                    }, 2000);
                } else {
                    mostrarError("Credenciales incorrectas. Por favor, verifique su correo y contraseña.");
                }
            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                mostrarError("Error al conectar con el servidor. Intente nuevamente.");
            }
        }

        // Función para registrar usuario
        async function registrarUsuario() {
            const usuario = document.getElementById("txtUsuarioRegistro").value.trim();
            const correo = document.getElementById("txtCorreoRegistro").value.trim();
            const contrasena = document.getElementById("txtContrasenaRegistro").value.trim();
            const estado = document.getElementById("txtEstadoRegistro").value.trim();
            const idRango = document.getElementById("txtRangoRegistro").value;

            if (!usuario || !correo || !contrasena || !estado || !idRango) {
                mostrarError("Por favor, complete todos los campos.");
                return;
            }

            // Preparar datos para enviar
            const data = {
                usuario: usuario,
                correo: correo,
                contrasena: contrasena,
                estado: estado,
                idRango: parseInt(idRango)
            };

            try {
                const respuesta = await fetch(`${API_URL}/registrarUsarios`, {
                    method: "POST",
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify(data)
                });

                if (!respuesta.ok) {
                    const errorData = await respuesta.json().catch(() => ({}));
                    throw new Error(errorData.message || `Error ${respuesta.status}: ${respuesta.statusText}`);
                }

                mostrarExito("Usuario registrado correctamente.");
                document.getElementById("frmRegistro").reset();
                // Cambiar a la vista de login
                document.getElementById('container').classList.remove("active");
            } catch (error) {
                console.error("Error al registrar usuario:", error);
                mostrarError(error.message || "Error al registrar el usuario.");
            }
        }

        // Funciones CRUD para usuarios (similar al de empleados)
        async function obtenerUsuarios() {
            try {
                const respuesta = await fetch(`${API_URL}/consultarUsuario`);
                if (!respuesta.ok) {
                    throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
                }
                
                return await respuesta.json();
            } catch (error) {
                console.error("Error al obtener usuarios:", error);
                mostrarError("No se pudieron cargar los usuarios.");
                return [];
            }
        }

        async function guardarUsuario() {
            const idUsuario = document.getElementById("txtIdUsuario").value;
            const usuario = document.getElementById("txtUsuario").value.trim();
            const correo = document.getElementById("txtCorreoModal").value.trim();
            const contrasena = document.getElementById("txtContrasenaModal").value.trim();
            const estado = document.getElementById("txtEstadoModal").value.trim();
            const idRango = document.getElementById("txtRangoModal").value;

            if (!usuario || !correo || !contrasena || !estado || !idRango) {
                mostrarError("Por favor, complete todos los campos.");
                return;
            }

            const data = {
                usuario: usuario,
                correo: correo,
                contrasena: contrasena,
                estado: estado,
                idRango: parseInt(idRango)
            };

            try {
                let respuesta;
                if (idUsuario) {
                    // Editar usuario existente
                    respuesta = await fetch(`${API_URL}/editarUsuarios/${idUsuario}`, {
                        method: "PUT",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify(data)
                    });
                } else {
                    // Crear nuevo usuario
                    respuesta = await fetch(`${API_URL}/registrarUsarios`, {
                        method: "POST",
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify(data)
                    });
                }

                if (!respuesta.ok) {
                    const errorData = await respuesta.json().catch(() => ({}));
                    throw new Error(errorData.message || `Error ${respuesta.status}: ${respuesta.statusText}`);
                }

                mostrarExito(`Usuario ${idUsuario ? 'actualizado' : 'creado'} correctamente.`);
                modalUsuarios.close();
                // Recargar lista de usuarios si estás en una página de administración
            } catch (error) {
                console.error("Error al guardar usuario:", error);
                mostrarError(error.message || `Error al ${idUsuario ? 'actualizar' : 'crear'} el usuario.`);
            }
        }

        async function eliminarUsuario(id) {
            try {
                const result = await Swal.fire({
                    title: "¿Estás seguro?",
                    text: "¿Deseas eliminar este usuario?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Sí, eliminarlo",
                    cancelButtonText: "Cancelar"
                });

                if (result.isConfirmed) {
                    const respuesta = await fetch(`${API_URL}/eliminarRegistro/${id}`, {
                        method: "DELETE"
                    });

                    if (!respuesta.ok) {
                        const errorData = await respuesta.json().catch(() => ({}));
                        throw new Error(errorData.message || `Error ${respuesta.status}: ${respuesta.statusText}`);
                    }

                    mostrarExito("El usuario fue eliminado correctamente.");
                    // Recargar lista de usuarios
                } else {
                    mostrarInfo("El usuario no fue eliminado.");
                }
            } catch (error) {
                console.error("Error al eliminar usuario:", error);
                mostrarError(error.message || "Hubo un problema al eliminar el usuario.");
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