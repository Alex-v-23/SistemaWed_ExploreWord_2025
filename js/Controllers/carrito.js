// js/carrito.js
class CarritoService {
    constructor() {
        this.carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        this.actualizarContador();
    }

    agregarViaje(viaje) {
        // Verificar si el usuario está autenticado
        if (!ApiService.getToken()) {
            Swal.fire({
                title: 'Iniciar sesión requerido',
                text: 'Debes iniciar sesión para reservar viajes',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ir a login',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'login.html';
                }
            });
            return false;
        }

        const viajeExistente = this.carrito.find(item => item.id === viaje.id);
        
        if (viajeExistente) {
            viajeExistente.cantidad += 1;
        } else {
            this.carrito.push({
                ...viaje,
                cantidad: 1
            });
        }

        this.guardarCarrito();
        this.actualizarContador();
        this.mostrarConfirmacion(viaje.nombre);
        return true;
    }

    eliminarViaje(id) {
        this.carrito = this.carrito.filter(item => item.id !== id);
        this.guardarCarrito();
        this.actualizarContador();
    }

    actualizarCantidad(id, cantidad) {
        const viaje = this.carrito.find(item => item.id === id);
        if (viaje) {
            viaje.cantidad = cantidad;
            if (viaje.cantidad <= 0) {
                this.eliminarViaje(id);
            } else {
                this.guardarCarrito();
            }
        }
    }

    vaciarCarrito() {
        this.carrito = [];
        this.guardarCarrito();
        this.actualizarContador();
    }

    obtenerTotal() {
        return this.carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    }

    guardarCarrito() {
        localStorage.setItem('carrito', JSON.stringify(this.carrito));
    }

    actualizarContador() {
        const contador = document.querySelector('.cart-count');
        if (contador) {
            const totalItems = this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
            contador.textContent = totalItems;
            contador.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    mostrarConfirmacion(nombreViaje) {
        Swal.fire({
            title: '¡Agregado al carrito!',
            text: `${nombreViaje} se ha agregado a tu carrito`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    }

    async procesarPago() {
        if (!ApiService.getToken()) {
            Swal.fire('Error', 'Debes iniciar sesión para realizar una compra', 'error');
            return;
        }

        if (this.carrito.length === 0) {
            Swal.fire('Error', 'El carrito está vacío', 'error');
            return;
        }

        try {
            const loading = Swal.fire({
                title: 'Procesando reserva...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Crear reserva para cada viaje en el carrito
            for (const item of this.carrito) {
                const reserva = {
                    viajeId: item.id,
                    cantidad: item.cantidad,
                    fecha: new Date().toISOString().split('T')[0],
                    estado: 'Confirmado',
                    total: item.precio * item.cantidad
                };

                await ReservacionService.crear(reserva);
            }

            await loading.close();

            Swal.fire({
                title: '¡Reserva exitosa!',
                text: 'Tus viajes han sido reservados correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });

            this.vaciarCarrito();
            this.cerrarModal();

        } catch (error) {
            Swal.fire('Error', 'No se pudo procesar la reserva: ' + error.message, 'error');
        }
    }

    mostrarModal() {
        const modal = document.getElementById('modal-carrito');
        const contenido = document.getElementById('contenido-carrito');
        const total = document.getElementById('total-carrito');

        if (modal && contenido && total) {
            contenido.innerHTML = this.generarHTMLCarrito();
            total.textContent = `$${this.obtenerTotal().toFixed(2)}`;
            modal.style.display = 'block';
        }
    }

    cerrarModal() {
        const modal = document.getElementById('modal-carrito');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    generarHTMLCarrito() {
        if (this.carrito.length === 0) {
            return '<p class="carrito-vacio">Tu carrito está vacío</p>';
        }

        return this.carrito.map(item => `
            <div class="item-carrito">
                <div class="info-item">
                    <h4>${item.nombre}</h4>
                    <p>Precio: $${item.precio}</p>
                </div>
                <div class="controles-item">
                    <div class="control-cantidad">
                        <button onclick="carrito.actualizarCantidad(${item.id}, ${item.cantidad - 1})">-</button>
                        <span>${item.cantidad}</span>
                        <button onclick="carrito.actualizarCantidad(${item.id}, ${item.cantidad + 1})">+</button>
                    </div>
                    <button class="btn-eliminar" onclick="carrito.eliminarViaje(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// Inicializar carrito
const carrito = new CarritoService();

// Event listeners para el carrito
document.addEventListener('DOMContentLoaded', function() {
    // Botones "Reservar Ahora"
    document.querySelectorAll('.agregar-carrito').forEach(button => {
        button.addEventListener('click', function() {
            const viaje = {
                id: this.dataset.id,
                nombre: this.dataset.nombre,
                precio: parseFloat(this.dataset.precio)
            };
            carrito.agregarViaje(viaje);
        });
    });

    // Icono del carrito
    const iconoCarrito = document.getElementById('icono-carrito');
    if (iconoCarrito) {
        iconoCarrito.addEventListener('click', () => carrito.mostrarModal());
    }

    // Cerrar modal
    const cerrarCarrito = document.getElementById('cerrar-carrito');
    if (cerrarCarrito) {
        cerrarCarrito.addEventListener('click', () => carrito.cerrarModal());
    }

    // Vaciar carrito
    const vaciarCarrito = document.getElementById('vaciar-carrito');
    if (vaciarCarrito) {
        vaciarCarrito.addEventListener('click', () => {
            Swal.fire({
                title: '¿Vaciar carrito?',
                text: 'Se eliminarán todos los viajes del carrito',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, vaciar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    carrito.vaciarCarrito();
                    carrito.mostrarModal();
                }
            });
        });
    }

    // Proceder al pago
    const procederPago = document.getElementById('proceder-pago');
    if (procederPago) {
        procederPago.addEventListener('click', () => carrito.procesarPago());
    }
});