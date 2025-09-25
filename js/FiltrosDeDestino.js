
        // Filtrado de destinos
        document.addEventListener('DOMContentLoaded', function() {
            const filtros = document.querySelectorAll('.filtro-btn');
            const destinos = document.querySelectorAll('.tarjeta-destino');
            
            filtros.forEach(filtro => {
                filtro.addEventListener('click', function() {
                    // Remover clase activa de todos los filtros
                    filtros.forEach(f => f.classList.remove('activo'));
                    // Agregar clase activa al filtro clickeado
                    this.classList.add('activo');
                    
                    const categoria = this.getAttribute('data-categoria');
                    
                    // Mostrar/ocultar destinos según la categoría
                    destinos.forEach(destino => {
                        if (categoria === 'todos' || destino.getAttribute('data-categoria').includes(categoria)) {
                            destino.style.display = 'block';
                        } else {
                            destino.style.display = 'none';
                        }
                    });
                });
            });
        });