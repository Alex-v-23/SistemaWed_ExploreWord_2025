const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
registerBtn.addEventListener('click', () => {
 container.classList.add('active');
});
loginBtn.addEventListener('click', () => {
 container.classList.remove('active');
});

// Verificar si viene de un cierre de sesión
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);  
    const logoutParam = urlParams.get('logout');
    
    if (logoutParam === 'true') {
        // Prevenir que el usuario pueda retroceder a la página anterior
        history.pushState(null, null, location.href);
        
        window.onpopstate = function() {
            history.go(1);
            // Opcional: redirigir al login si aún así intenta retroceder
            window.location.href = "login.html";
        };
        
        // Limpiar el parámetro de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

