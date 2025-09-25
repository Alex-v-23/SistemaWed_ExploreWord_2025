// js/Services/EmpleadosService.js

// URL del EndPoint de los empleados - API
const API_URL = "http://localhost:8080/ApiEmpleado";

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

// Obtener empleados con paginación
window.getEmpleados = async function(page = 0, size = 5) {
    return window.makeRequest(`${API_URL}/ListaEmpleado?page=${page}&size=${size}`);
}

// Crear nuevo empleado
window.createEmpleado = async function(data) {
    return window.makeRequest(`${API_URL}/registrarEmpleado`, {
        method: "POST",
        body: JSON.stringify(data)
    });
}

// Actualizar empleado
window.updateEmpleado = async function(id, data) {
    return window.makeRequest(`${API_URL}/editarEmpleado/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

// Eliminar empleado
window.deleteEmpleado = async function(id) {
    return window.makeRequest(`${API_URL}/eliminarEmpleado/${id}`, {
        method: "DELETE"
    });
}