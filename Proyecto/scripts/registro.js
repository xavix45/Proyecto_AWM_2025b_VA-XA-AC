// Espera a que todo el contenido del HTML se haya cargado
document.addEventListener('DOMContentLoaded', () => {

    // 1. Seleccionar el formulario de registro
    const registerForm = document.getElementById('register-form');

    registerForm.addEventListener('submit', (event) => {
        // 2. Prevenir que el formulario se envíe por defecto
        event.preventDefault();

        // 3. Obtener los valores de los inputs
        // Usamos .getElementById() porque ya tienes IDs en tu HTML
        const nombre = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const contra = document.getElementById('reg-pass').value;
        
        // Para los radio buttons, buscamos el que está seleccionado (checked)
        const tipoViajero = document.querySelector('input[name="viajero"]:checked').value;

        // 4. Obtener la lista de usuarios actual del localStorage
        // JSON.parse() convierte el texto de localStorage de nuevo en un array
        // Si no hay nada ('null'), empezamos con un array vacío []
        let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

        // 5. (Opcional pero recomendado) Verificar si el email ya existe
        const usuarioExiste = usuarios.find(user => user.email === email);
        if (usuarioExiste) {
            alert('Error: El correo electrónico ya está registrado.');
            return; // Detenemos la ejecución
        }

        // 6. Crear el objeto del nuevo usuario
        const nuevoUsuario = {
            nombre: nombre,
            email: email,
            contra: contra,
            tipoViajero: tipoViajero
            // OJO: En un proyecto real, la contraseña NUNCA se guarda así.
            // Se guarda un "hash" (una versión encriptada).
        };

        // 7. Añadir el nuevo usuario al array
        usuarios.push(nuevoUsuario);

        // 8. Guardar el array actualizado de vuelta en localStorage
        // JSON.stringify() convierte el array en un texto plano para guardarlo
        localStorage.setItem('usuarios', JSON.stringify(usuarios));

        // 9. Informar al usuario y redirigir
        alert('¡Cuenta creada con éxito! Serás redirigido a la página principal.');
        
        // 10. Redirigir al home (index.html)
        // Asumiendo que index.html está un nivel arriba (fuera de la carpeta /pages/)
        window.location.href = '../pages/home.html';
    });
});