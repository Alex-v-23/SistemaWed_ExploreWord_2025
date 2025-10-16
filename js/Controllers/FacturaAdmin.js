
        const API_URL = 'http://localhost:8080/ApiFacturas';
        let facturas = [];
        let facturaSeleccionada = null;

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

        // Cargar facturas al iniciar
        document.addEventListener('DOMContentLoaded', function() {
            if (verificarAutenticacion()) {
                cargarFacturas();
                configurarEventos();
            }
        });

        function configurarEventos() {
            // Evento para el formulario
            document.getElementById('facturaForm').addEventListener('submit', guardarFactura);
            
            // Evento para el botón de limpiar
            document.getElementById('resetButton').addEventListener('click', limpiarFormulario);
            
            // Evento para buscar facturas
            document.getElementById('searchFacturasButton').addEventListener('click', buscarFacturas);
            document.getElementById('searchFacturasList').addEventListener('input', buscarFacturas);
            
            // Evento para generar PDF
            document.getElementById('generateInvoiceBtn').addEventListener('click', generarPDF);
            
            // Establecer fecha actual por defecto
            document.getElementById('fechaPago').valueAsDate = new Date();
        }

        // Función para cargar facturas desde la API
        async function cargarFacturas() {
            try {
                const token = obtenerToken();
                
                if (!token) {
                    throw new Error('No hay token de autenticación');
                }

                const response = await fetch(`${API_URL}/consultarFactura`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

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
                
                // Tu API retorna un array directamente
                if (Array.isArray(data)) {
                    facturas = data;
                } else if (data.content && Array.isArray(data.content)) {
                    facturas = data.content;
                } else {
                    console.warn('Formato de respuesta inesperado:', data);
                    facturas = [];
                }

                mostrarFacturas();
                
            } catch (error) {
                console.error('❌ Error cargando facturas:', error);
                
                document.getElementById('facturasList').innerHTML = `
                    <div class="text-center p-4 text-red-600">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <p>Error al cargar las facturas</p>
                        <button onclick="cargarFacturas()" class="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">
                            Reintentar
                        </button>
                    </div>
                `;
            }
        }

        // Función para mostrar facturas en la lista
        function mostrarFacturas() {
            const facturasList = document.getElementById('facturasList');
            
            if (facturas.length === 0) {
                facturasList.innerHTML = `
                    <p class="text-gray-500 italic text-center py-4">No hay facturas registradas</p>
                `;
                return;
            }

            facturasList.innerHTML = facturas.map(factura => {
                const id = factura.idFactura || 'N/A';
                const idReservacion = factura.idReservacion || 'N/A';
                const fechaPago = factura.fechaPago ? new Date(factura.fechaPago).toLocaleDateString('es-ES') : 'N/A';
                const metodoPago = factura.metodoPago || 'N/A';
                const montoTotal = factura.montoTotal ? `$${parseFloat(factura.montoTotal).toFixed(2)}` : '$0.00';
                
                const esSeleccionada = facturaSeleccionada && facturaSeleccionada.idFactura === factura.idFactura;

                return `
                    <div class="travel-item ${esSeleccionada ? 'selected' : ''}" onclick="seleccionarFactura(${factura.idFactura})">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-semibold text-blue-800">Factura #${id}</h4>
                                <p class="text-sm text-gray-600">Reservación: ${idReservacion}</p>
                                <p class="text-sm text-gray-600">Método: ${metodoPago}</p>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-green-600">${montoTotal}</p>
                                <p class="text-sm text-gray-500">${fechaPago}</p>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-2">
                            <button onclick="event.stopPropagation(); editarFactura(${factura.idFactura})" 
                                class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                                <i class="fas fa-edit mr-1"></i>Editar
                            </button>
                            <button onclick="event.stopPropagation(); eliminarFactura(${factura.idFactura})" 
                                class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                                <i class="fas fa-trash mr-1"></i>Eliminar
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Función para buscar facturas
        function buscarFacturas() {
            const searchTerm = document.getElementById('searchFacturasList').value.toLowerCase();
            
            if (searchTerm === '') {
                mostrarFacturas();
                return;
            }

            const facturasFiltradas = facturas.filter(factura => {
                const id = (factura.idFactura || '').toString().toLowerCase();
                const idReservacion = (factura.idReservacion || '').toString().toLowerCase();
                const metodoPago = (factura.metodoPago || '').toLowerCase();
                const montoTotal = (factura.montoTotal || 0).toString().toLowerCase();
                
                return id.includes(searchTerm) ||
                       idReservacion.includes(searchTerm) ||
                       metodoPago.includes(searchTerm) ||
                       montoTotal.includes(searchTerm);
            });

            const facturasList = document.getElementById('facturasList');
            
            if (facturasFiltradas.length === 0) {
                facturasList.innerHTML = `
                    <p class="text-gray-500 italic text-center py-4">No se encontraron facturas</p>
                `;
                return;
            }

            facturasList.innerHTML = facturasFiltradas.map(factura => {
                const id = factura.idFactura || 'N/A';
                const idReservacion = factura.idReservacion || 'N/A';
                const fechaPago = factura.fechaPago ? new Date(factura.fechaPago).toLocaleDateString('es-ES') : 'N/A';
                const metodoPago = factura.metodoPago || 'N/A';
                const montoTotal = factura.montoTotal ? `$${parseFloat(factura.montoTotal).toFixed(2)}` : '$0.00';

                return `
                    <div class="travel-item" onclick="seleccionarFactura(${factura.idFactura})">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-semibold text-blue-800">Factura #${id}</h4>
                                <p class="text-sm text-gray-600">Reservación: ${idReservacion}</p>
                                <p class="text-sm text-gray-600">Método: ${metodoPago}</p>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-green-600">${montoTotal}</p>
                                <p class="text-sm text-gray-500">${fechaPago}</p>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-2">
                            <button onclick="event.stopPropagation(); editarFactura(${factura.idFactura})" 
                                class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                                <i class="fas fa-edit mr-1"></i>Editar
                            </button>
                            <button onclick="event.stopPropagation(); eliminarFactura(${factura.idFactura})" 
                                class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                                <i class="fas fa-trash mr-1"></i>Eliminar
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Función para seleccionar una factura
        function seleccionarFactura(id) {
            facturaSeleccionada = facturas.find(f => f.idFactura == id);
            mostrarFacturas();
            actualizarVistaPrevia();
            document.getElementById('generateInvoiceBtn').disabled = false;
        }

        // Función para actualizar la vista previa de la factura
        function actualizarVistaPrevia() {
            if (!facturaSeleccionada) return;

            document.getElementById('invoiceNumber').textContent = facturaSeleccionada.idFactura;
            document.getElementById('invoiceDate').textContent = facturaSeleccionada.fechaPago ? 
                new Date(facturaSeleccionada.fechaPago).toLocaleDateString('es-ES') : 'N/A';
            document.getElementById('invoiceCustomerId').textContent = `ID Reservación: ${facturaSeleccionada.idReservacion}`;
            document.getElementById('invoiceMetodoPago').textContent = `Método: ${facturaSeleccionada.metodoPago}`;
            document.getElementById('invoiceFechaPago').textContent = `Fecha: ${facturaSeleccionada.fechaPago ? 
                new Date(facturaSeleccionada.fechaPago).toLocaleDateString('es-ES') : 'N/A'}`;
            document.getElementById('invoiceReservacionId').textContent = facturaSeleccionada.idReservacion;
            document.getElementById('invoicePrecioUnitario').textContent = `$${parseFloat(facturaSeleccionada.montoTotal).toFixed(2)}`;
            document.getElementById('invoiceTotalItem').textContent = `$${parseFloat(facturaSeleccionada.montoTotal).toFixed(2)}`;
            document.getElementById('invoiceTotal').textContent = `$${parseFloat(facturaSeleccionada.montoTotal).toFixed(2)}`;
        }

        // Función para guardar factura (crear o actualizar)
        async function guardarFactura(event) {
            event.preventDefault();
            
            const facturaId = document.getElementById('facturaId').value;
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            submitBtn.disabled = true;

            const facturaData = {
                idReservacion: parseInt(document.getElementById('idReservacion').value),
                fechaPago: document.getElementById('fechaPago').value,
                metodoPago: document.getElementById('metodoPago').value,
                montoTotal: parseFloat(document.getElementById('montoTotal').value)
            };

            try {
                const token = obtenerToken();
                let response;

                if (facturaId) {
                    // Actualizar factura existente
                    response = await fetch(`${API_URL}/editarFactura/${facturaId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(facturaData)
                    });
                } else {
                    // Crear nueva factura
                    response = await fetch(`${API_URL}/registrarFactura`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(facturaData)
                    });
                }

                if (response.status === 401) {
                    throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Error al guardar la factura');
                }

                await Swal.fire({
                    title: '¡Éxito!',
                    text: facturaId ? 'Factura actualizada correctamente' : 'Factura creada correctamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });

                limpiarFormulario();
                await cargarFacturas();
                
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'No se pudo guardar la factura',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }

        // Función para editar factura
        function editarFactura(id) {
            const factura = facturas.find(f => f.idFactura == id);
            if (factura) {
                document.getElementById('facturaId').value = factura.idFactura;
                document.getElementById('idReservacion').value = factura.idReservacion || '';
                
                // Formatear fecha para el input date
                if (factura.fechaPago) {
                    const fechaPago = new Date(factura.fechaPago);
                    document.getElementById('fechaPago').value = fechaPago.toISOString().split('T')[0];
                }
                
                document.getElementById('metodoPago').value = factura.metodoPago || '';
                document.getElementById('montoTotal').value = factura.montoTotal || '';
                
                // Cambiar texto del botón
                document.querySelector('#facturaForm button[type="submit"]').textContent = 'Actualizar Factura';
                
                // Scroll al formulario
                document.getElementById('facturaForm').scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Función para eliminar factura
        async function eliminarFactura(id) {
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
                    const response = await fetch(`${API_URL}/eliminarFactura/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.status === 401) {
                        throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
                    }

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.message || 'Error al eliminar factura');
                    }

                    await Swal.fire({
                        title: '¡Eliminado!',
                        text: 'Factura eliminada correctamente',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    });

                    await cargarFacturas();
                    
                    // Si la factura eliminada era la seleccionada, limpiar vista previa
                    if (facturaSeleccionada && facturaSeleccionada.idFactura == id) {
                        facturaSeleccionada = null;
                        document.getElementById('generateInvoiceBtn').disabled = true;
                        limpiarVistaPrevia();
                    }
                    
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'No se pudo eliminar la factura',
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    });
                }
            }
        }

        // Función para limpiar el formulario
        function limpiarFormulario() {
            document.getElementById('facturaForm').reset();
            document.getElementById('facturaId').value = '';
            document.getElementById('fechaPago').valueAsDate = new Date();
            document.querySelector('#facturaForm button[type="submit"]').textContent = 'Guardar Factura';
        }

        // Función para limpiar la vista previa
        function limpiarVistaPrevia() {
            document.getElementById('invoiceNumber').textContent = '00001';
            document.getElementById('invoiceDate').textContent = '01/01/2023';
            document.getElementById('invoiceCustomerId').textContent = 'ID Reservación: ';
            document.getElementById('invoiceMetodoPago').textContent = 'Método: ';
            document.getElementById('invoiceFechaPago').textContent = 'Fecha: ';
            document.getElementById('invoiceReservacionId').textContent = '';
            document.getElementById('invoicePrecioUnitario').textContent = '$0.00';
            document.getElementById('invoiceTotalItem').textContent = '$0.00';
            document.getElementById('invoiceTotal').textContent = '$0.00';
        }

        // Función para generar PDF REAL
        function generarPDF() {
            if (!facturaSeleccionada) return;

            // Mostrar loading
            Swal.fire({
                title: 'Generando PDF',
                text: 'Por favor espere...',
                icon: 'info',
                showConfirmButton: false,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Usar setTimeout para permitir que se muestre el loading
            setTimeout(() => {
                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();

                    // Configuración del documento
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const margin = 20;
                    const contentWidth = pageWidth - (margin * 2);

                    // Logo y encabezado
                    doc.setFontSize(20);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(44, 90, 160); // Color azul de Explore World
                    doc.text('EXPLORE WORLD', pageWidth / 2, margin, { align: 'center' });
                    
                    doc.setFontSize(12);
                    doc.setTextColor(100, 100, 100);
                    doc.text('Sistema de Facturación de Viajes', pageWidth / 2, margin + 8, { align: 'center' });

                    // Línea separadora
                    doc.setDrawColor(44, 90, 160);
                    doc.setLineWidth(0.5);
                    doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

                    // Información de la factura
                    let yPosition = margin + 30;

                    doc.setFontSize(16);
                    doc.setTextColor(0, 0, 0);
                    doc.text(`FACTURA #${facturaSeleccionada.idFactura}`, margin, yPosition);

                    doc.setFontSize(10);
                    doc.setTextColor(100, 100, 100);
                    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - margin, yPosition, { align: 'right' });

                    yPosition += 15;

                    // Información del cliente
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text('INFORMACIÓN DEL CLIENTE:', margin, yPosition);
                    
                    yPosition += 8;
                    doc.setFontSize(10);
                    doc.text(`ID de Reservación: ${facturaSeleccionada.idReservacion}`, margin, yPosition);
                    yPosition += 5;
                    doc.text(`Nombre: Cliente Explore World`, margin, yPosition);
                    yPosition += 5;
                    doc.text(`Email: cliente@exploreworld.com`, margin, yPosition);

                    // Información de pago
                    const paymentX = pageWidth / 2 + 10;
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);
                    doc.text('DETALLES DE PAGO:', paymentX, yPosition - 13);
                    
                    doc.setFontSize(10);
                    doc.text(`Método: ${facturaSeleccionada.metodoPago}`, paymentX, yPosition - 5);
                    doc.text(`Fecha de Pago: ${facturaSeleccionada.fechaPago ? new Date(facturaSeleccionada.fechaPago).toLocaleDateString('es-ES') : 'N/A'}`, paymentX, yPosition);
                    doc.text(`Estado: PAGADO`, paymentX, yPosition + 5);

                    yPosition += 20;

                    // Tabla de items
                    const tableHeaders = [['DESCRIPCIÓN', 'CANTIDAD', 'PRECIO UNITARIO', 'TOTAL']];
                    const tableData = [
                        [
                            `Servicio de Viaje - Reservación ${facturaSeleccionada.idReservacion}`,
                            '1',
                            `$${parseFloat(facturaSeleccionada.montoTotal).toFixed(2)}`,
                            `$${parseFloat(facturaSeleccionada.montoTotal).toFixed(2)}`
                        ]
                    ];

                    doc.autoTable({
                        startY: yPosition,
                        head: tableHeaders,
                        body: tableData,
                        theme: 'grid',
                        headStyles: {
                            fillColor: [44, 90, 160],
                            textColor: [255, 255, 255],
                            fontStyle: 'bold'
                        },
                        styles: {
                            fontSize: 10,
                            cellPadding: 3
                        },
                        margin: { left: margin, right: margin }
                    });

                    // Obtener la posición Y final después de la tabla
                    const finalY = doc.lastAutoTable.finalY + 10;

                    // Total
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text('TOTAL:', pageWidth - margin - 40, finalY);
                    doc.text(`$${parseFloat(facturaSeleccionada.montoTotal).toFixed(2)}`, pageWidth - margin, finalY, { align: 'right' });

                    // Pie de página
                    const footerY = doc.internal.pageSize.getHeight() - 20;
                    
                    doc.setFontSize(8);
                    doc.setTextColor(100, 100, 100);
                    doc.text('¡Gracias por su preferencia!', pageWidth / 2, footerY, { align: 'center' });
                    doc.text('Explore World - Viaje con nosotros', pageWidth / 2, footerY + 4, { align: 'center' });
                    doc.text('Tel: +503 1234-5678 | Email: info@exploreworld.com', pageWidth / 2, footerY + 8, { align: 'center' });

                    // Guardar el PDF
                    const fileName = `Factura_${facturaSeleccionada.idFactura}_ExploreWorld.pdf`;
                    doc.save(fileName);

                    // Cerrar el loading y mostrar confirmación
                    Swal.close();
                    Swal.fire({
                        title: '¡PDF Generado!',
                        text: `La factura ${facturaSeleccionada.idFactura} ha sido descargada exitosamente`,
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    });

                } catch (error) {
                    console.error('Error generando PDF:', error);
                    Swal.close();
                    Swal.fire({
                        title: 'Error',
                        text: 'No se pudo generar el PDF. Por favor, intente nuevamente.',
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    });
                }
            }, 500);
        }

        // Funciones existentes para cerrar sesión y menú de usuario
        function cerrarSesion() {
            Swal.fire({
                title: '¿Cerrar sesión?',
                text: '¿Estás seguro de que quieres salir?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('usuarioLogueado');
                    sessionStorage.removeItem('usuarioLogueado');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('authToken');
                    sessionStorage.removeItem('token');
                    window.location.href = 'Login.html';
                }
            });
        }

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