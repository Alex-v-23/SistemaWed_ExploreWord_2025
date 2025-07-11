// script.js
document.getElementById("add-btn").addEventListener("click", function () {
  document.getElementById("form-section").classList.remove("hidden");
});

document.getElementById("transport-form").addEventListener("submit", function (e) {
  e.preventDefault();

  // Obtener valores del formulario
  const marca = document.getElementById("marca").value;
  const asientos = document.getElementById("asientos").value;
  const modelo = document.getElementById("modelo").value;
  const placa = document.getElementById("placa").value;
  const estado = document.getElementById("estado").value;

  // Crear nueva tarjeta
  const nuevaCard = document.createElement("div");
  nuevaCard.classList.add("card");
  nuevaCard.innerHTML = `
    <img src="default.jpg" alt="${marca}">
    <h3>${marca}</h3>
    <p><span class="icon">👥</span> Capacidad: ${asientos} personas</p>
    <p><span class="icon">🚗</span> Placa: ${placa}</p>
    <p class="status ${estado === 'Disponible' ? 'available' : 'maintenance'}">${estado}</p>
    <a href="#">Ver detalles</a>
  `;

  // Agregar tarjeta a la lista
  document.getElementById("transport-list").appendChild(nuevaCard);

  // Limpiar formulario y ocultarlo
  document.getElementById("transport-form").reset();
  document.getElementById("form-section").classList.add("hidden");
});
