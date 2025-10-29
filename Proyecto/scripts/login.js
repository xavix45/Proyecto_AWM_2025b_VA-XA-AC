// Espera a que todo el contenido del HTML se haya cargado
document.addEventListener('DOMContentLoaded', () => {

    // Tus datos de usuario (los que ya tenías)
    const usuario = [
        { nombre: "Xavier Anatoa", email: "xavier.anatoa@epn.edu.ec", contra: "12345", tipoViajero: "estudiante" },
        { nombre: "Angelo Conterón", email: "angelo.conteron@epn.edu.ec", contra: "12345", tipoViajero: "estudiante"},
        { nombre: "Veronica Aguilar", email: "veronica.aguilar@epn.edu.ec", contra: "12345", tipoViajero: "estudiante" }
    ];
    const admin = [
        { nombre: "Admin", email: "admin@epn.edu.ec", contra: "admin123" }
    ];

    // Combinamos ambas listas en una sola para facilitar la búsqueda
    const todosLosUsuarios = [...usuario, ...admin];

    // 1. Seleccionar los elementos del DOM que necesitamos
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // 2. Añadir un "escuchador" para el evento 'submit' del formulario
    loginForm.addEventListener('submit', (event) => {
        // 3. Prevenir que el formulario se envíe de la forma tradicional (recargando la página)
        event.preventDefault();

        // 4. Obtener los valores escritos por el usuario
        const emailIngresado = emailInput.value;
        const contraIngresada = passwordInput.value;

        // 5. Lógica de validación
        // Usamos el método .find() para buscar en el array
        const usuarioEncontrado = todosLosUsuarios.find(user => {
            return user.email === emailIngresado && user.contra === contraIngresada;
        });

        // 6. Mostrar resultado
        if (usuarioEncontrado) {
            //Redirigir a otra página
            window.location.href = '../pages/home.html';
        } else {
            // Si no se encontró el usuario
            alert('Correo electrónico o contraseña incorrectos.');
        }
    });
});