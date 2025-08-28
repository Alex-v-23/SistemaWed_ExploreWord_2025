   // Podemos añadir interactividad adicional aquí si es necesario
        document.addEventListener('DOMContentLoaded', function() {
            const menuItems = document.querySelectorAll('.menu-item');
            
            menuItems.forEach(item => {
                item.addEventListener('click', function() {
                    // Remover la clase activa de todos los items
                    menuItems.forEach(i => i.classList.remove('active'));
                    // Añadir clase activa al item clickeado
                    this.classList.add('active');
                    
                    // Aquí podríamos cargar contenido dinámico
                    // según el item seleccionado
                });
            });
        });

// Initialize data from localStorage or use sample data
        let travels = JSON.parse(localStorage.getItem('travels')) || [
            {
                id: 1,
                customerId: "CL-1001", 
                hotelId: 201,
                destination: "La Libertad",
                tripType: "Playa",
                duration: 5,
                total: 750.50,
                customerName: "Juan Pérez",
                date: "2023-01-15"
            }
        ];
        
        let nextId = 4;
        let selectedTravelId = null;
        let invoiceTravels = [];
        
        // DOM elements
        const travelForm = document.getElementById('travelForm');
        const searchCustomerId = document.getElementById('searchCustomerId');
        const searchButton = document.getElementById('searchButton');
        const customerTravels = document.getElementById('customerTravels');
        const invoiceContainer = document.getElementById('invoiceContainer');
        const generateInvoiceBtn = document.getElementById('generateInvoiceBtn');
        const resetButton = document.getElementById('resetButton');
        
        // Form inputs
        const travelIdInput = document.getElementById('travelId');
        const customerIdInput = document.getElementById('customerId');
        const hotelIdInput = document.getElementById('hotelId');
        const destinationInput = document.getElementById('destination');
        const tripTypeInput = document.getElementById('tripType');
        const durationInput = document.getElementById('duration');
        const totalInput = document.getElementById('total');
        
        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            // Event listeners
            travelForm.addEventListener('submit', handleFormSubmit);
            searchButton.addEventListener('click', searchTravels);
            generateInvoiceBtn.addEventListener('click', generateInvoice);
            resetButton.addEventListener('click', resetForm);
            
            // Enable form validation
            setupValidation();
        });
        
        function setupValidation() {
            // Add input event listeners for validation
            const requiredInputs = travelForm.querySelectorAll('[required]');
            
            requiredInputs.forEach(input => {
                input.addEventListener('input', function() {
                    validateInput(this);
                });
                
                input.addEventListener('blur', function() {
                    validateInput(this);
                });
            });
        }
        
        function validateInput(input) {
            const errorElement = document.getElementById(`${input.id}Error`);
            
            if (input.required && !input.value.trim()) {
                errorElement.style.display = 'block';
                return false;
            }
            
            if (input.type === 'number' && input.valueAsNumber < input.min) {
                errorElement.style.display = 'block';
                return false;
            }
            
            errorElement.style.display = 'none';
            return true;
        }
        
        function validateForm() {
            let isValid = true;
            const requiredInputs = travelForm.querySelectorAll('[required]');
            
            requiredInputs.forEach(input => {
                if (!validateInput(input)) {
                    isValid = false;
                }
            });
            
            return isValid;
        }
        
        function handleFormSubmit(e) {
            e.preventDefault();
            
            if (!validateForm()) {
                return;
            }
            
            const travelData = {
                id: selectedTravelId || nextId,
                customerId: customerIdInput.value,
                hotelId: parseInt(hotelIdInput.value),
                destination: destinationInput.value,
                tripType: tripTypeInput.value,
                duration: parseInt(durationInput.value),
                total: parseFloat(totalInput.value),
                customerName: "Cliente Existente" // En una app real, esto vendría de una DB
            };
            
            if (selectedTravelId) {
                // Actualizar viaje existente
                const index = travels.findIndex(t => t.id === selectedTravelId);
                if (index !== -1) {
                    travels[index] = travelData;
                }
            } else {
                // Añadir nuevo viaje con fecha
                travelData.id = nextId++;
                travelData.date = new Date().toISOString().split('T')[0];
                travels.push(travelData);
            }
            
            // Save to localStorage
            localStorage.setItem('travels', JSON.stringify(travels));
            
            // Actualizar la lista de viajes si estamos viendo este cliente
            if (searchCustomerId.value === travelData.customerId) {
                displayTravels([travelData]);
            }
            
            resetForm();
            alert(`Viaje ${selectedTravelId ? 'actualizado' : 'agregado'} correctamente.`);
        }
        
        function resetForm() {
            travelForm.reset();
            selectedTravelId = null;
            travelIdInput.value = '';
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
            });
        }
        
        function searchTravels() {
            const customerId = searchCustomerId.value.trim();
            
            if (!customerId) {
                customerTravels.innerHTML = '<p class="text-gray-500 italic">Ingrese un ID de cliente para ver sus viajes.</p>';
                generateInvoiceBtn.disabled = true;
                return;
            }
            
            const customerTravelsData = travels.filter(travel => travel.customerId === customerId);
            
            if (customerTravelsData.length === 0) {
                customerTravels.innerHTML = '<p class="text-gray-500 italic">No se encontraron viajes para este cliente.</p>';
                generateInvoiceBtn.disabled = true;
            } else {
                displayTravels(customerTravelsData);
                generateInvoiceBtn.disabled = false;
                invoiceTravels = customerTravelsData;
            }
        }
        
        function displayTravels(travelsData) {
            customerTravels.innerHTML = '';
            
            travelsData.forEach(travel => {
                const travelCard = document.createElement('div');
                travelCard.className = 'border p-4 mb-4 rounded-lg hover:bg-gray-50';
                travelCard.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-semibold">${travel.destination} - ${travel.tripType}</h3>
                            <p class="text-sm text-gray-600">Hotel ID: ${travel.hotelId} | ${travel.duration} días</p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold">$${travel.total.toFixed(2)}</p>
                            <div class="flex space-x-2 mt-2">
                                <button onclick="editTravel(${travel.id})" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">Editar</button>
                                <button onclick="deleteTravel(${travel.id})" class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200">Eliminar</button>
                                <button onclick="selectForInvoice(${travel.id})" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">Factura</button>
                            </div>
                        </div>
                    </div>
                `;
                customerTravels.appendChild(travelCard);
            });
        }
        
        function editTravel(id) {
            const travel = travels.find(t => t.id === id);
            if (travel) {
                selectedTravelId = travel.id;
                travelIdInput.value = travel.id;
                customerIdInput.value = travel.customerId;
                hotelIdInput.value = travel.hotelId;
                destinationInput.value = travel.destination;
                tripTypeInput.value = travel.tripType;
                durationInput.value = travel.duration;
                totalInput.value = travel.total;
                
                // Scroll al formulario
                document.getElementById('travelForm').scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        function deleteTravel(id) {
            if (confirm('¿Está seguro que desea eliminar este viaje?')) {
                travels = travels.filter(travel => travel.id !== id);
                searchTravels(); // Refrescar la lista
                alert('Viaje eliminado correctamente.');
            }
        }
        
        function selectForInvoice(id) {
            const travel = travels.find(t => t.id === id);
            if (travel) {
                invoiceTravels = [travel];
                generateInvoice();
            }
        }
        
        function generateInvoice() {
            if (invoiceTravels.length === 0) return;
            
            // Datos de la factura
            const customerId = invoiceTravels[0].customerId;
            const customerName = invoiceTravels[0].customerName;
            const invoiceDate = new Date().toLocaleDateString();
            
            // Actualizar elementos de la factura
            document.getElementById('invoiceCustomerId').textContent = `ID: ${customerId}`;
            document.getElementById('invoiceCustomerName').textContent = `Nombre: ${customerName}`;
            document.getElementById('invoiceDate').textContent = invoiceDate;
            document.getElementById('invoiceNumber').textContent = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
            
            // Items de la factura
            const invoiceItems = document.getElementById('invoiceItems');
            invoiceItems.innerHTML = '';
            
            let subTotal = 0;
            invoiceTravels.forEach(travel => {
                subTotal += travel.total;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${travel.date || ''}</td>
                    <td>${travel.destination}</td>
                    <td>${travel.tripType}</td>
                    <td>${travel.hotelId}</td>
                    <td>${travel.duration}</td>
                    <td>${travel.total.toFixed(2)}</td>
                `;
                invoiceItems.appendChild(row);
            });
            
            // Total
            document.getElementById('invoiceTotal').textContent = `$${subTotal.toFixed(2)}`;
            
            // Mostrar factura
            invoiceContainer.classList.remove('hidden');
            invoiceContainer.scrollIntoView({ behavior: 'smooth' });
        }

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