const loginForm = document.getElementById('login-form');
const errorMensaje = document.getElementById('error-mensaje');
const nombreUsuario = document.getElementById('nombreUsuario').value;
const contrasena = document.getElementById('contrasena').value;

console.log('Datos enviados:', { nombreUsuario, contrasena }); // Agrega este log para validar


// Manejar inicio de sesión
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que el formulario se envíe de manera tradicional
    const nombreUsuario = document.getElementById('nombreUsuario').value;
    const contrasena = document.getElementById('contrasena').value;

    try {
        // Enviar los datos del formulario al servidor
        const res = await axios.post('/api/login', { nombreUsuario, contrasena });

        if (res.data.success) {
            // Si el login es exitoso, redirige al usuario
            window.location.href = '/index.html'; // Cambia esta URL si es necesario
        } else {
            // Mostrar el mensaje de error si las credenciales son incorrectas
            errorMensaje.textContent = res.data.message || 'Usuario y/o contraseña incorrectos.';
            errorMensaje.classList.remove('d-none'); // Muestra el mensaje de error
        }
    }catch (error) {
        console.error('Error en la solicitud:', error); // Muestra detalles del error en la consola
        errorMensaje.textContent = 'Contraseña o/y usuario incorrecto.';
        errorMensaje.classList.remove('d-none');
    }
    
});
