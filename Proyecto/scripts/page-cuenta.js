// Espera a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- Claves de LocalStorage ---
    const LS_USUARIOS_KEY = 'usuarios';
    const LS_CURRENT_USER_KEY = 'currentUserEmail';

    // --- 1. Obtener el usuario actual ---
    const emailUsuarioActual = localStorage.getItem(LS_CURRENT_USER_KEY);
    if (!emailUsuarioActual) {
        // Si no hay nadie logueado, no debería estar aquí.
        alert('Debes iniciar sesión para ver tu cuenta.');
        window.location.href = '../pages/login.html';
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem(LS_USUARIOS_KEY) || '[]');
    const indexUsuario = usuarios.findIndex(u => u.email === emailUsuarioActual);
    let currentUser = (indexUsuario !== -1) ? usuarios[indexUsuario] : null;

    if (!currentUser) {
        alert('Error al cargar el perfil de usuario.');
        localStorage.removeItem(LS_CURRENT_USER_KEY); // Limpia sesión corrupta
        window.location.href = '../pages/login.html';
        return;
    }

    // --- 2. Seleccionar elementos del DOM ---
    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    const userLocationEl = document.getElementById('user-location');
    
    const selectRegion = document.getElementById('select-region');
    const selectIdioma = document.getElementById('select-idioma');
    const selectMoneda = document.getElementById('select-moneda');
    
    const interesContainer = document.getElementById('interes-chips-container');
    
    const btnNotif24h = document.getElementById('btn-notif-24h');
    const btnNotif1h = document.getElementById('btn-notif-1h');
    const btnNotifCambios = document.getElementById('btn-notif-cambios');
    const btnNotifCercanos = document.getElementById('btn-notif-cercanos');
    
    const btnGuardar = document.getElementById('btn-guardar');
    const btnLogout = document.getElementById('btn-logout');

    // --- 3. Cargar datos del usuario en la página ---

    function loadProfileData() {
        // Cargar Panel de Usuario
        userNameEl.textContent = currentUser.nombre;
        userEmailEl.textContent = currentUser.email;
        if (currentUser.permisoUbicacion === true) {
            userLocationEl.textContent = 'Ubicación: Permiso activo';
            userLocationEl.style.color = 'green'; // Opcional
        } else {
            userLocationEl.textContent = 'Ubicación: Permiso denegado';
            userLocationEl.style.color = 'gray'; // Opcional
        }

        // Cargar Preferencias (si no existen, crea el objeto)
        currentUser.preferencias = currentUser.preferencias || {};
        selectRegion.value = currentUser.preferencias.region || 'ninguna';
        selectIdioma.value = currentUser.preferencias.idioma || 'es';
        selectMoneda.value = currentUser.preferencias.moneda || 'usd';

        // Cargar Intereses (solo lectura)
        interesContainer.innerHTML = ''; // Limpiar
        if (currentUser.intereses && currentUser.intereses.tags.length > 0) {
            currentUser.intereses.tags.forEach(tag => {
                const chip = document.createElement('button');
                chip.className = 'chip is-on'; // Clase 'is-on' para mostrarlo activo
                chip.disabled = true; // Desactivado, es solo de vista
                chip.textContent = tag.replace(/_/g, ' '); // Pone 'fiestas quito' en vez de 'fiestas_quito'
                interesContainer.appendChild(chip);
            });
        } else {
            interesContainer.innerHTML = '<p class="muted">Aún no has seleccionado intereses.</p>';
        }

        // Cargar Notificaciones
        currentUser.notificaciones = currentUser.notificaciones || {};
        // Se usa una función para no repetir código
        setupNotifButton(btnNotif24h, currentUser.notificaciones.alerta24h);
        setupNotifButton(btnNotif1h, currentUser.notificaciones.alerta1h);
        setupNotifButton(btnNotifCambios, currentUser.notificaciones.cambios);
        setupNotifButton(btnNotifCercanos, currentUser.notificaciones.cercanos);
    }
    
    // Función helper para configurar botones de notificación
    function setupNotifButton(button, isEnabled) {
        if (isEnabled) {
            button.classList.add('is-on');
            button.textContent = 'On';
        } else {
            button.classList.remove('is-on');
            button.textContent = 'Off';
        }
    }

    // --- 4. Añadir Event Listeners ---

    // Toggle para botones de notificación
    function toggleNotif(e) {
        const button = e.target;
        button.classList.toggle('is-on');
        button.textContent = button.classList.contains('is-on') ? 'On' : 'Off';
    }
    
    btnNotif24h.addEventListener('click', toggleNotif);
    btnNotif1h.addEventListener('click', toggleNotif);
    btnNotifCambios.addEventListener('click', toggleNotif);
    btnNotifCercanos.addEventListener('click', toggleNotif);

    // Botón Guardar Cambios
    btnGuardar.addEventListener('click', () => {
        // 1. Recoger datos de preferencias
        currentUser.preferencias = {
            region: selectRegion.value,
            idioma: selectIdioma.value,
            moneda: selectMoneda.value
        };

        // 2. Recoger datos de notificaciones
        currentUser.notificaciones = {
            alerta24h: btnNotif24h.classList.contains('is-on'),
            alerta1h: btnNotif1h.classList.contains('is-on'),
            cambios: btnNotifCambios.classList.contains('is-on'),
            cercanos: btnNotifCercanos.classList.contains('is-on')
        };
        
        // 3. Actualizar el usuario en el array general
        usuarios[indexUsuario] = currentUser;
        
        // 4. Guardar el array completo en localStorage
        localStorage.setItem(LS_USUARIOS_KEY, JSON.stringify(usuarios));
        
        // 5. Feedback y redirección
        alert('¡Cambios guardados con éxito!');
        window.location.href = '../pages/home.html';
    });

    // Botón Cerrar Sesión
    btnLogout.addEventListener('click', () => {
        const guardar = confirm('¿Deseas guardar los cambios antes de salir?');
        
        if (guardar) {
            // Si dice OK, simula un clic en "Guardar"
            // El guardado ya incluye la redirección a home.html,
            // pero cerrar sesión debe ir a index.html.
            // Así que copiamos la lógica de guardado pero no la redirección
            
            currentUser.preferencias = {
                region: selectRegion.value,
                idioma: selectIdioma.value,
                moneda: selectMoneda.value
            };
            currentUser.notificaciones = {
                alerta24h: btnNotif24h.classList.contains('is-on'),
                alerta1h: btnNotif1h.classList.contains('is-on'),
                cambios: btnNotifCambios.classList.contains('is-on'),
                cercanos: btnNotifCercanos.classList.contains('is-on')
            };
            usuarios[indexUsuario] = currentUser;
            localStorage.setItem(LS_USUARIOS_KEY, JSON.stringify(usuarios));
            
            alert('Cambios guardados. Cerrando sesión...');
        }
        
        // Finalmente, cierra la sesión y redirige al inicio
        localStorage.removeItem(LS_CURRENT_USER_KEY);
        window.location.href = '../index.html'; // Al index principal
    });

    // --- 5. Cargar todo al iniciar ---
    loadProfileData();

});