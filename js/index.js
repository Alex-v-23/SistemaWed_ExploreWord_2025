// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
    // Configurar el gráfico de ingresos mensuales
    setupIncomeChart();

    // Configurar interacciones adicionales si son necesarias
    setupDashboardInteractions();
});

function setupIncomeChart() {
    const ctx = document.getElementById('grafico-ingresos');

    // Verificar si el canvas existe
    if (!ctx) {
        console.error('No se encontró el elemento canvas para el gráfico de ingresos');
        return;
    }

    // Datos para el gráfico
    const chartData = {
        labels: ['Ene', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [{
            label: 'Ingresos ($)',
            data: [8500, 9200, 10500, 12450, 11000, 9800, 13200],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
        }]
    };

    // Opciones del gráfico
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return '$' + context.raw.toLocaleString();
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return '$' + value.toLocaleString();
                    },
                    stepSize: 2000
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            }
        }
    };

    // Crear el gráfico
    try {
        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
        console.log('Gráfico de ingresos creado exitosamente');
    } catch (error) {
        console.error('Error al crear el gráfico:', error);
    }
}

function setupDashboardInteractions() {
    // Configurar los checkboxes de destinos
    const checkboxes = document.querySelectorAll('.destinos-lista input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            console.log(`Destino ${this.id} ${this.checked ? 'marcado' : 'desmarcado'}`);
            // Aquí puedes agregar lógica adicional cuando se cambia un checkbox
        });
    });

    // Configurar tooltips para las métricas si es necesario
    const metricCards = document.querySelectorAll('.dashboard-card');

    metricCards.forEach(card => {
        card.addEventListener('click', function () {
            const metricName = this.querySelector('h2').textContent;
            console.log(`Card de ${metricName} clickeada`);
            // Aquí puedes agregar interacciones adicionales
        });
    });

    // Verificar que todos los elementos estén presentes
    if (checkboxes.length === 0) {
        console.warn('No se encontraron checkboxes de destinos');
    }

    if (metricCards.length === 0) {
        console.warn('No se encontraron cards de métricas');
    }
}

// Función para redimensionar el gráfico cuando cambia el tamaño de la ventana
window.addEventListener('resize', function () {
    // Los gráficos de Chart.js son responsive por defecto con la opción configurada
    console.log('Ventana redimensionada - gráficos se ajustarán automáticamente');
});


// Asegúrate de tener este elemento en tu HTML:
// <canvas class="grafico-circular" id="graficoCircularDestinos"></canvas>

document.addEventListener('DOMContentLoaded', function () {
    // Configurar el gráfico circular
    const crearGraficoCircular = () => {
        const ctx = document.getElementById('graficoCircularDestinos');

        // Verificar si el elemento existe
        if (!ctx) {
            console.error('No se encontró el elemento canvas para el gráfico circular');
            return;
        }

        // Datos para el gráfico
        const data = {
            labels: ['Ruta Flores', 'El Turco', 'Coatepeque', 'Volcán', 'Suchitoto'],
            datasets: [{
                data: [15, 8, 24, 12, 18],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        };

        // Opciones del gráfico
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 12,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        };

        // Crear el gráfico
        try {
            new Chart(ctx, {
                type: 'doughnut',
                data: data,
                options: options
            });
        } catch (error) {
            console.error('Error al crear el gráfico circular:', error);
        }
    };

    // Llamar a la función de creación
    crearGraficoCircular();

});

document.getElementById("btnCerrarSecion").addEventListener("click", function  (e){
    e.preventDefault();


      Swal.fire({
        title: "¿Estás seguro?",
        text: "Se cerrará tu sesión.",
        icon: "warning",    
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, cerrar sesión",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            // Aquí puedes poner la redirección real de logout
            Swal.fire({
                title: "Sesión cerrada",
                text: "Has cerrado sesión correctamente.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                // Redirige después del mensaje
                window.location.href = result.close; // cambia a logout.php si usas backend
            });
        }
    });
});







