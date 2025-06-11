document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de login cargada.');

    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const correoInput = document.getElementById('correo');
            const contrasenaInput = document.getElementById('contrasena');
            const mensajeError = document.getElementById('mensajeError');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if ( !correoInput || !contrasenaInput) {
                if(mensajeError) mensajeError.textContent = 'Error en el formulario.';
                return;
            }

            const correo = correoInput.value.trim();
            const contrasena = contrasenaInput.value;

            // Validaciones adicionales de seguridad
            const correoValido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo);
            const contrasenaValida = contrasena.length >= 8;
            if (!correoValido) {
                if(mensajeError) mensajeError.textContent = 'Por favor, ingresa un correo válido.';
                return;
            }
            if (!contrasenaValida) {
                if(mensajeError) mensajeError.textContent = 'La contraseña debe tener al menos 8 caracteres.';
                return;
            }

            if (!correo || !contrasena) {
                if(mensajeError) mensajeError.textContent = 'Por favor, ingresa correo y contraseña.';
                return;
            }

            // Deshabilitar botón para evitar múltiples envíos
            if(submitBtn) submitBtn.disabled = true;
            if(mensajeError) mensajeError.textContent = '';

            try {
                const response = await fetch('http://localhost:3001/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ correo, contrasena })
                });

                const data = await response.json();

                if (response.ok) {
                    if(mensajeError) {
                        mensajeError.style.color = 'green';
                        mensajeError.textContent = 'Ingreso exitoso.';
                    }
                    setTimeout(() => {
                        window.location.href = '../productos/index.html';
                    }, 1000);
                } else {
                    if(mensajeError) {
                        mensajeError.style.color = 'red';
                        mensajeError.textContent = 'Correo o contraseña incorrectos. Por favor, vuelve a intentarlo.';
                    }
                }
            } catch (error) {
                if(mensajeError) mensajeError.textContent = 'Error de conexión. Inténtalo más tarde.';
            } finally {
                if(submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Redirección al hacer clic en "Regístrate aquí"
    const registerLink = document.querySelector('.register-row a');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../registro/index.html'; // Cambia '/registro' por la ruta real de tu página de registro
        });
    }
});
// Redirección al enviar el formulario de login
// Eliminado: duplicado y potencialmente inseguro. La lógica de redirección está gestionada arriba tras la verificación del login.
// Redirección al hacer clic en "Regístrate aquí"
const registerLink = document.querySelector('.register-row a');
if (registerLink) {
    registerLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '../registro'; // Cambia '/registro' por la ruta real de tu página de registro
    });
}
// Redirección al hacer clic en "Volver a la página principal"
const volverLink = document.querySelector('.volver');
if (volverLink) {
    volverLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/'; // Cambia '/' por la ruta real de tu página principal
    });
}

// Ejemplo de redirección tras registro exitoso
const registerForm = document.querySelector('.register-form');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Aquí iría la lógica de registro (validación, petición al backend, etc.)
        // Si el registro es exitoso:
        window.location.href = '../inicio'; // Cambia '/inicio' por la ruta real de tu página de inicio
    });
}
