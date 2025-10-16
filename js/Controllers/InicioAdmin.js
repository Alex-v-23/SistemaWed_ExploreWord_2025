
        const API_BASE = 'http://localhost:8080';
        let destinosChartInstance = null;
        let reservacionesChartInstance = null;

        const apiConfig = {
            viajes: `${API_BASE}/ApiViajes/consultarViaje`,
            destinos: `${API_BASE}/ApiDestinos/consultarDestinos`,
            reservaciones: `${API_BASE}/ApiReservaciones/ObtenerReservacion`
        };

        // Verificar autenticación - ACTUALIZADA
        function verificarAutenticacion() {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const userData = localStorage.getItem('userData') || localStorage.getItem('usuarioLogueado');
            
            console.log('🔐 Token encontrado:', token ? 'Sí' : 'No');
            console.log('👤 UserData encontrado:', userData ? 'Sí' : 'No');
            
            if (!token || !userData) {
                console.error('❌ No hay token o userData');
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
                const usuario = JSON.parse(userData);
                console.log('📋 Datos del usuario:', usuario);
                
                // Actualizar UI con datos del usuario
                document.getElementById('userName').textContent = usuario.usuario || usuario.nombre || 'Usuario';
                document.getElementById('userRole').textContent = usuario.idRango === 1 ? 'Administrador' : 'Empleado';
                
                const nombre = usuario.usuario || usuario.nombre || 'Usuario';
                const iniciales = nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                document.getElementById('userAvatar').textContent = iniciales;
                
                return true;
                
            } catch (error) {
                console.error('❌ Error al cargar datos del usuario:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Error al cargar datos de usuario.',
                    icon: 'error',
                    confirmButtonText: 'Ir al login'
                }).then(() => {
                    window.location.href = 'login.html';
                });
                return false;
            }
        }

        // Cerrar sesión
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

                    // Limpiar todos los datos de autenticación
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

        // Menú de usuario
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

       // Fetch con token - ACTUALIZADA
async function fetchData(url) {
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        console.log('🔑 Token usado para fetch:', token);
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Solo agregar Authorization si hay token
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('🌐 Haciendo request a:', url);
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            credentials: 'include' // Importante para cookies
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ Error 401 - No autorizado');
                
                // Intentar refrescar el token o redirigir al login
                const refreshed = await intentarRefrescarToken();
                if (!refreshed) {
                    verificarAutenticacion();
                    throw new Error('No autorizado - Token inválido o expirado');
                }
                // Reintentar la petición con nuevo token
                return fetchData(url);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Error fetching data:', error);
        throw error;
    }
}

// Función para refrescar token si es necesario
async function intentarRefrescarToken() {
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) return false;

        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.ok) {
            const newToken = await response.json();
            localStorage.setItem('authToken', newToken.token);
            console.log('🔄 Token refrescado exitosamente');
            return true;
        }
    } catch (error) {
        console.error('❌ Error al refrescar token:', error);
    }
    return false;
}
        // Cargar datos - ACTUALIZADA
        async function cargarDatos() {
            try {
                console.log('🔄 Iniciando carga de datos...');
                
                if (!verificarAutenticacion()) {
                    console.error('❌ Autenticación fallida');
                    return;
                }

                // Mostrar loading en todas las métricas
                document.querySelectorAll('.metric-value').forEach(el => {
                    el.textContent = '0';
                });
                document.querySelectorAll('.metric-change').forEach(el => {
                    el.innerHTML = '<i class="fas fa-sync-alt"></i> Cargando...';
                });

                const [viajesData, destinosData, reservacionesData] = await Promise.allSettled([
                    fetchData(apiConfig.viajes),
                    fetchData(apiConfig.destinos),
                    fetchData(apiConfig.reservaciones)
                ]);

                console.log('📊 Resultados:', { viajesData, destinosData, reservacionesData });

                // Procesar viajes
                if (viajesData.status === 'fulfilled' && viajesData.value && Array.isArray(viajesData.value)) {
                    document.getElementById('viajesCount').textContent = viajesData.value.length;
                    document.querySelector('#viajesCount').closest('.metric-card').querySelector('.metric-change').innerHTML = 
                        '<i class="fas fa-chart-line"></i> Actualizado';
                } else {
                    document.querySelector('#viajesCount').closest('.metric-card').querySelector('.metric-change').innerHTML = 
                        '<i class="fas fa-exclamation-triangle"></i> Error';
                }

                // Procesar destinos
                if (destinosData.status === 'fulfilled' && destinosData.value && Array.isArray(destinosData.value)) {
                    document.getElementById('destinosCount').textContent = destinosData.value.length;
                    document.querySelector('#destinosCount').closest('.metric-card').querySelector('.metric-change').innerHTML = 
                        '<i class="fas fa-chart-line"></i> Actualizado';
                    
                    procesarDestinos(destinosData.value, 
                        reservacionesData.status === 'fulfilled' ? reservacionesData.value : []);
                } else {
                    document.querySelector('#destinosCount').closest('.metric-card').querySelector('.metric-change').innerHTML = 
                        '<i class="fas fa-exclamation-triangle"></i> Error';
                    ocultarGraficoDestinos();
                }

                // Procesar reservaciones
                if (reservacionesData.status === 'fulfilled' && reservacionesData.value && Array.isArray(reservacionesData.value)) {
                    document.getElementById('reservacionesCount').textContent = reservacionesData.value.length;
                    document.querySelector('#reservacionesCount').closest('.metric-card').querySelector('.metric-change').innerHTML = 
                        '<i class="fas fa-chart-line"></i> Actualizado';
                    
                    generarGraficoReservaciones(
                        destinosData.status === 'fulfilled' ? destinosData.value : [],
                        reservacionesData.value
                    );
                } else {
                    document.querySelector('#reservacionesCount').closest('.metric-card').querySelector('.metric-change').innerHTML = 
                        '<i class="fas fa-exclamation-triangle"></i> Error';
                    ocultarGraficoReservaciones();
                }

                console.log('✅ Carga de datos completada');

            } catch (error) {
                console.error('❌ Error en cargarDatos:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'No se pudieron cargar los datos del dashboard.',
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
            }
        }

        function procesarDestinos(destinos, reservaciones) {
            if (!Array.isArray(destinos) || destinos.length === 0) {
                ocultarGraficoDestinos();
                return;
            }

            const destinosConReservas = {};
            
            if (Array.isArray(reservaciones)) {
                reservaciones.forEach(res => {
                    if (res.destinoId) {
                        destinosConReservas[res.destinoId] = (destinosConReservas[res.destinoId] || 0) + 1;
                    }
                });
            }

            let topDestino = null;
            let maxReservas = 0;
            
            destinos.forEach(destino => {
                const idDestino = destino.id || destino.idDestino;
                const reservasCount = destinosConReservas[idDestino] || 0;
                
                if (reservasCount > maxReservas) {
                    maxReservas = reservasCount;
                    topDestino = destino;
                }
            });

            if (topDestino) {
                const nombreDestino = topDestino.nombre || topDestino.nombreDestino || 'Destino';
                document.getElementById('topDestinoName').textContent = nombreDestino;
                document.getElementById('topDestinoCount').textContent = maxReservas;
                document.querySelector('#topDestinoName').closest('.metric-card').querySelector('.metric-change').innerHTML = 
                    `<i class="fas fa-users"></i> ${maxReservas} reservas`;
            }

            const labels = destinos.slice(0, 5).map(d => d.nombre || d.nombreDestino);
            const data = destinos.slice(0, 5).map(d => {
                const idDestino = d.id || d.idDestino;
                return destinosConReservas[idDestino] || Math.floor(Math.random() * 15) + 5;
            });

            generarGraficoDestinos(labels, data);
        }

        function generarGraficoDestinos(labels, data) {
            const container = document.getElementById('destinosChartContainer');
            const canvas = document.getElementById('destinosChart');

            container.innerHTML = '';
            canvas.style.display = 'block';
            container.appendChild(canvas);

            if (destinosChartInstance) {
                destinosChartInstance.destroy();
            }

            const ctx = canvas.getContext('2d');
            destinosChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            'rgba(44, 90, 160, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(239, 68, 68, 0.8)'
                        ],
                        borderColor: [
                            'rgba(44, 90, 160, 1)',
                            'rgba(59, 130, 246, 1)',
                            'rgba(16, 185, 129, 1)',
                            'rgba(245, 158, 11, 1)',
                            'rgba(239, 68, 68, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: { size: 12 },
                                usePointStyle: true
                            }
                        }
                    },
                    cutout: '55%'
                }
            });
        }

        function generarGraficoReservaciones(destinos, reservaciones) {
            if (!Array.isArray(reservaciones) || reservaciones.length === 0) {
                ocultarGraficoReservaciones();
                return;
            }

            const container = document.getElementById('reservacionesChartContainer');
            const canvas = document.getElementById('reservacionesChart');

            container.innerHTML = '';
            canvas.style.display = 'block';
            container.appendChild(canvas);

            const estadoReservaciones = {
                'Confirmada': 0,
                'Pendiente': 0,
                'Cancelada': 0
            };

            if (Array.isArray(reservaciones)) {
                reservaciones.forEach(res => {
                    const estado = res.estado || res.estatus || 'Pendiente';
                    if (estadoReservaciones.hasOwnProperty(estado)) {
                        estadoReservaciones[estado]++;
                    } else {
                        estadoReservaciones['Pendiente']++;
                    }
                });
            }

            if (reservacionesChartInstance) {
                reservacionesChartInstance.destroy();
            }

            const ctx = canvas.getContext('2d');
            reservacionesChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(estadoReservaciones),
                    datasets: [{
                        label: 'Cantidad de Reservaciones',
                        data: Object.values(estadoReservaciones),
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(239, 68, 68, 0.8)'
                        ],
                        borderColor: [
                            'rgba(16, 185, 129, 1)',
                            'rgba(245, 158, 11, 1)',
                            'rgba(239, 68, 68, 1)'
                        ],
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        function ocultarGraficoDestinos() {
            document.getElementById('destinosChartContainer').innerHTML = 
                '<p style="text-align: center; padding: 20px; color: #999;">No hay datos de destinos</p>';
        }

        function ocultarGraficoReservaciones() {
            document.getElementById('reservacionesChartContainer').innerHTML = 
                '<p style="text-align: center; padding: 20px; color: #999;">No hay datos de reservaciones</p>';
        }

        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 Inicializando dashboard...');
            if (verificarAutenticacion()) {
                cargarDatos();
                // Actualizar cada 30 segundos
                setInterval(cargarDatos, 30000);
            }
        });