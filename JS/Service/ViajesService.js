// js/Services/ViajesService.js

// URL del EndPoint de los viajes - API
const API_URL = "http://localhost:8080/ApiViajes";

// Función para hacer peticiones con manejo de CORS
window.makeRequest = async function(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        return response.json();
    } catch (error) {
        console.error("Error en la petición:", error);
        throw error;
    }
}

// Obtener viajes con paginación
window.getViajes = async function(page = 0, size = 5) {
    return window.makeRequest(`${API_URL}/ListaViajes?page=${page}&size=${size}`);
}

// Crear nuevo viaje
window.createViaje = async function(data) {
    return window.makeRequest(`${API_URL}/registrarViaje`, {
        method: "POST",
        body: JSON.stringify(data)
    });
}

// Actualizar viaje
window.updateViaje = async function(id, data) {
    return window.makeRequest(`${API_URL}/editarViaje/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

// Eliminar viaje
window.deleteViaje = async function(id) {
    return window.makeRequest(`${API_URL}/eliminarViaje/${id}`, {
        method: "DELETE"
    });
}