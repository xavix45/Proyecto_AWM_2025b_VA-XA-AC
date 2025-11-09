// Espera a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {

    const btnPermitir = document.getElementById('btn-permitir');
    const btnMasTarde = document.getElementById('btn-mas-tarde');

    // --- Lógica del botón "Permitir" ---
    btnPermitir.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que el enlace '#' navegue
        
        // Comprueba si el navegador soporta Geolocalización
        if ('geolocation' in navigator) {
            
            // Pide la ubicación
            navigator.geolocation.getCurrentPosition(
                
                // 1. ÉXITO: Si el usuario ACEPTA
                (position) => {
                    console.log('Ubicación obtenida:', position.coords.latitude, position.coords.longitude);
                    // Guardamos la preferencia "true" para este usuario
                    guardarPreferenciaUbicacion(true);
                    // Redirigimos al Home
                    window.location.href = '../pages/intereses.html';
                },
                
                // 2. ERROR: Si el usuario RECHAZA o hay error
                (error) => {
                    console.warn('Error al obtener ubicación:', error.message);
                    // Guardamos la preferencia "false" para este usuario
                    guardarPreferenciaUbicacion(false);
                    // Redirigimos al Home
                    window.location.href = '../pages/intereses.html';
                }
            );

        } else {
            // El navegador es muy antiguo y no soporta geolocalización
            alert('Tu navegador no soporta la geolocalización.');
            guardarPreferenciaUbicacion(false);
            window.location.href = '../pages/intereses.html';
        }
    });

    // --- Lógica del botón "Más tarde" ---
    btnMasTarde.addEventListener('click', (e) => {
        e.preventDefault();
        // Guardamos la preferencia "false" para este usuario
        guardarPreferenciaUbicacion(false);
        // Redirigimos al Home
        window.location.href = '../pages/intereses.html';
    });
});


/**
 * Función para guardar la preferencia en el objeto del usuario
 * en localStorage.
 */
function guardarPreferenciaUbicacion(permisoConcedido) {
    // 1. Obtenemos el email del usuario que guardamos en login/registro
    const emailUsuarioActual = localStorage.getItem('currentUserEmail');

    // Si no hay un usuario logueado, no hacemos nada
    if (!emailUsuarioActual) {
        console.error('Error: No se encontró un usuario actual.');
        return;
    }

    // 2. Obtenemos la lista COMPLETA de usuarios
    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    // 3. Buscamos al usuario actual en esa lista
    const indexUsuario = usuarios.findIndex(user => user.email === emailUsuarioActual);

    // 4. Si encontramos al usuario, actualizamos su objeto
    if (indexUsuario !== -1) {
        // Añadimos o actualizamos la propiedad 'permisoUbicacion'
        usuarios[indexUsuario].permisoUbicacion = permisoConcedido;
        
        // 5. Guardamos la lista COMPLETA de usuarios de vuelta
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
    } else {
        console.error('Error: No se pudo encontrar al usuario en la base de datos local.');
    }
}