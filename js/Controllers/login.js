
        // Configuración de la API
        const API_CONFIG = {
            BASE_URL: 'http://localhost:8080',
            ENDPOINTS: {
                LOGIN: '/api/auth/login',
                ME: '/api/auth/me'
            }
        };

        // Clase para manejar la autenticación (compatible con auth.js)
        class AuthService {
            static getToken() {
                return localStorage.getItem('authToken') || localStorage.getItem('token');
            }

            static setToken(token) {
                localStorage.setItem('authToken', token);
                localStorage.setItem('token', token); // Compatibilidad
            }

            static removeToken() {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                localStorage.removeItem('token');
                localStorage.removeItem('usuarioLogueado');
            }

            static getUserData() {
                const userData = localStorage.getItem('userData') || localStorage.getItem('usuarioLogueado');
                try {
                    return userData ? JSON.parse(userData) : null;
                } catch (e) {
                    console.error('Error parsing user data:', e);
                    return null;
                }
            }

            static setUserData(userData) {
                localStorage.setItem('userData', JSON.stringify(userData));
                localStorage.setItem('usuarioLogueado', JSON.stringify(userData)); // Compatibilidad
            }

            static isAuthenticated() {
                return !!this.getToken();
            }
        }

        // Servicio de usuarios
        class UserService {
            static async login(credentials) {
                try {
                    console.log('Intentando login con:', credentials.correo);
                    
                    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(credentials)
                    });

                    console.log('Respuesta del servidor:', response.status, response.statusText);

                    if (!response.ok) {
                        const errorText = await response.text();
                        let errorMessage = `Error ${response.status}: `;
                        
                        if (response.status === 401) {
                            errorMessage += 'Credenciales incorrectas';
                        } else if (response.status === 404) {
                            errorMessage += 'Usuario no encontrado';
                        } else {
                            errorMessage += errorText || 'Error del servidor';
                        }
                        
                        throw new Error(errorMessage);
                    }

                    const data = await response.json();
                    console.log('Login exitoso:', data);
                    return data;

                } catch (error) {
                    console.error('Error en login:', error);
                    throw new Error(error.message);
                }
            }
        }

        // Utilidades
        class Utils {
            static showLoading(message = 'Procesando...') {
                return Swal.fire({
                    title: message,
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
            }

            static showSuccess(message, timer = 3000) {
                return Swal.fire({
                    title: '¡Éxito!',
                    text: message,
                    icon: 'success',
                    timer: timer,
                    showConfirmButton: false
                });
            }

            static showError(message) {
                return Swal.fire({
                    title: 'Error',
                    text: message,
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
            }

            static validateEmail(email) {
                const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return regex.test(email);
            }
        }

        // Controlador principal
        class LoginController {
            constructor() {
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.checkAuthentication();
            }

            setupEventListeners() {
                const loginForm = document.getElementById('frmLogin');

                if (loginForm) {
                    loginForm.addEventListener('submit', (e) => this.handleLogin(e));
                }
            }

            checkAuthentication() {
                // Si ya está autenticado, redirigir al dashboard
                if (AuthService.isAuthenticated()) {
                    window.location.href = 'InicioAdmin.html';
                }
            }

            async handleLogin(e) {
                e.preventDefault();
                
                const correo = document.getElementById('txtCorreo').value.trim();
                const contrasena = document.getElementById('txtContrasena').value.trim();

                if (!correo || !contrasena) {
                    await Utils.showError('Por favor, complete todos los campos.');
                    return;
                }

                if (!Utils.validateEmail(correo)) {
                    await Utils.showError('Por favor, ingrese un correo electrónico válido.');
                    return;
                }

                try {
                    const loadingAlert = Utils.showLoading('Iniciando sesión...');

                    const credentials = {
                        correo: correo,
                        contrasena: contrasena
                    };

                    const authData = await UserService.login(credentials);
                    
                    loadingAlert.close();

                    if (!authData.token) {
                        throw new Error('No se recibió token de autenticación');
                    }

                    // Guardar datos de autenticación de forma consistente
                    AuthService.setToken(authData.token);

                    // Asegurar que los datos del usuario tengan la estructura correcta
                    const userData = {
                        id: authData.usuario?.id || authData.id,
                        usuario: authData.usuario?.usuario || authData.usuario?.nombre || 'Usuario',
                        nombre: authData.usuario?.nombre || authData.nombre || 'Usuario',
                        correo: authData.usuario?.correo || authData.correo,
                        idRango: authData.usuario?.idRango || authData.idRango || 1
                    };

                    AuthService.setUserData(userData);

                    console.log('Token guardado:', AuthService.getToken());
                    console.log('User data guardado:', AuthService.getUserData());

                    await Utils.showSuccess(`¡Bienvenido ${userData.usuario}!`, 2000);
                    
                    // Redirigir después del mensaje de éxito
                    setTimeout(() => {
                        window.location.href = 'InicioAdmin.html';
                    }, 2000);

                } catch (error) {
                    Swal.close();
                    console.error('Error completo:', error);
                    await Utils.showError(error.message || 'Error al iniciar sesión. Verifique sus credenciales.');
                }
            }
        }

        // Inicializar la aplicación
        document.addEventListener('DOMContentLoaded', () => {
            new LoginController();
        });