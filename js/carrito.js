// Sistema de carrito unificado para todas las páginas
class CarritoManager {
    constructor() {
        this.carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        this.init();
    }

    init() {
        this.actualizarContadorCarrito();
        this.agregarEventListeners();
    }

    agregarEventListeners() {
        // Agregar productos al carrito
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('agregar-carrito')) {
                this.agregarAlCarrito(e.target);
            }
        });

        // Abrir modal del carrito
        const iconoCarrito = document.getElementById('icono-carrito');
        if (iconoCarrito) {
            iconoCarrito.addEventListener('click', () => this.abrirModalCarrito());
        }

        // Cerrar modal
        const cerrarCarrito = document.getElementById('cerrar-carrito');
        if (cerrarCarrito) {
            cerrarCarrito.addEventListener('click', () => this.cerrarModalCarrito());
        }

        // Vaciar carrito
        const vaciarCarritoBtn = document.getElementById('vaciar-carrito');
        if (vaciarCarritoBtn) {
            vaciarCarritoBtn.addEventListener('click', () => this.vaciarCarrito());
        }

        // Proceder al pago
        const procederPagoBtn = document.getElementById('proceder-pago');
        if (procederPagoBtn) {
            procederPagoBtn.addEventListener('click', () => this.procederPago());
        }
    }

    agregarAlCarrito(boton) {
        const id = boton.dataset.id;
        const nombre = boton.dataset.nombre;
        const precio = parseFloat(boton.dataset.precio);
        const imagen = boton.closest('.tarjeta-destino, .card-viaje')?.querySelector('img')?.src || '';

        const productoExistente = this.carrito.find(item => item.id === id);

        if (productoExistente) {
            productoExistente.cantidad += 1;
        } else {
            this.carrito.push({
                id,
                nombre,
                precio,
                imagen,
                cantidad: 1
            });
        }

        this.guardarCarrito();
        this.actualizarContadorCarrito();
        this.mostrarMensajeExito(nombre);
    }

    actualizarContadorCarrito() {
        const contadorCarrito = document.querySelector('.cart-count');
        if (contadorCarrito) {
            const totalItems = this.carrito.reduce((total, item) => total + item.cantidad, 0);
            contadorCarrito.textContent = totalItems;
        }
    }

    abrirModalCarrito() {
        const modalCarrito = document.getElementById('modal-carrito');
        if (modalCarrito) {
            modalCarrito.style.display = 'flex';
            this.actualizarModalCarrito();
        }
    }

    cerrarModalCarrito() {
        const modalCarrito = document.getElementById('modal-carrito');
        if (modalCarrito) {
            modalCarrito.style.display = 'none';
        }
    }

    actualizarModalCarrito() {
        const contenidoCarrito = document.getElementById('contenido-carrito');
        const totalCarrito = document.getElementById('total-carrito');

        if (!contenidoCarrito) return;

        contenidoCarrito.innerHTML = '';

        if (this.carrito.length === 0) {
            contenidoCarrito.innerHTML = '<div class="carrito-vacio">Tu carrito está vacío</div>';
            if (totalCarrito) totalCarrito.textContent = '$0.00';
            return;
        }

        this.carrito.forEach(item => {
            const itemElemento = document.createElement('div');
            itemElemento.className = 'item-carrito';
            itemElemento.innerHTML = `
                <div class="info-item">
                    <h4>${item.nombre}</h4>
                    <div class="precio-item">$${item.precio.toFixed(2)}</div>
                </div>
                <div class="acciones-item">
                    <input type="number" class="cantidad-item" value="${item.cantidad}" min="1" data-id="${item.id}">
                    <button class="eliminar-item" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            contenidoCarrito.appendChild(itemElemento);
        });

        // Eventos para cantidad y eliminar
        this.agregarEventosModal();

        // Calcular total
        const total = this.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        if (totalCarrito) totalCarrito.textContent = `$${total.toFixed(2)}`;
    }

    agregarEventosModal() {
        document.querySelectorAll('.cantidad-item').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const nuevaCantidad = parseInt(e.target.value);
                
                if (nuevaCantidad < 1) {
                    e.target.value = 1;
                    return;
                }
                
                const item = this.carrito.find(item => item.id === id);
                if (item) {
                    item.cantidad = nuevaCantidad;
                    this.guardarCarrito();
                    this.actualizarContadorCarrito();
                    this.actualizarModalCarrito();
                }
            });
        });

        document.querySelectorAll('.eliminar-item').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                this.eliminarProducto(id);
            });
        });
    }

    eliminarProducto(id) {
        const item = this.carrito.find(item => item.id === id);
        
        if (item && confirm(`¿Quieres eliminar ${item.nombre} del carrito?`)) {
            this.carrito = this.carrito.filter(item => item.id !== id);
            this.guardarCarrito();
            this.actualizarContadorCarrito();
            this.actualizarModalCarrito();
            alert(`${item.nombre} ha sido eliminado del carrito`);
        }
    }

    vaciarCarrito() {
        if (this.carrito.length === 0) {
            alert('Tu carrito ya está vacío');
            return;
        }
        
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            this.carrito = [];
            this.guardarCarrito();
            this.actualizarContadorCarrito();
            this.actualizarModalCarrito();
            alert('Carrito vaciado correctamente');
        }
    }

    procederPago() {
        if (this.carrito.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }
        
        alert('Redirigiendo al proceso de pago...');
        // Aquí iría la lógica de redirección
    }

    guardarCarrito() {
        localStorage.setItem('carrito', JSON.stringify(this.carrito));
    }

    mostrarMensajeExito(nombre) {
        alert(`¡${nombre} agregado al carrito!`);
    }
}

// Inicializar el carrito cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new CarritoManager();
});