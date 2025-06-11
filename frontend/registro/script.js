document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registroForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
/*Este es al archivo*/ 
            // Campos recolectados correctamente
            const nombre = document.getElementById('nombre').value.trim();
            const correo = document.getElementById('correo').value.trim();
            const contrasena = document.getElementById('contrasena').value;
            const confirmarContrasena = document.getElementById('confirmarContrasena').value;
            const terminos = document.getElementById('terminos').checked;

            if (!nombre || !correo || !contrasena || !confirmarContrasena || !terminos) {
                alert('Por favor, completa todos los campos y acepta los términos.');
                return;
            }

            if (contrasena !== confirmarContrasena) {
                alert('Las contraseñas no coinciden');
                return;
            }

            // Validación de nombre completo (al menos dos palabras)
            if (!/^([A-Za-zÁÉÍÓÚáéíóúÑñ]+\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]+.*)$/.test(nombre)) {
                alert('Por favor, ingresa tu nombre completo (nombre y apellido).');
                return;
            }

            // Validación de correo (formato válido y termina en .com)
            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.com)$/.test(correo)) {
                alert('Por favor, ingresa un correo válido que termine en .com');
                return;
            }

            // Validación de contraseña (solo letras y números)
            if (!/^[A-Za-z0-9]+$/.test(contrasena)) {
                alert('La contraseña solo debe contener letras y números.');
                return;
            }

            try {
                const response = await fetch('http://localhost:3001/api/registro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombre,
                        correo,
                        contrasena,
                        terminos_aceptados: terminos ? 1 : 0
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
                    window.location.href = '../login/index.html';
                } else {
                    alert(data.message || 'Error al registrar el usuario.');
                }
            } catch (error) {
                alert('Error de conexión con el servidor.');
            }
        });
    }
});

// Validación unificada con login
if (!/[A-Z]/.test(contrasena)) {
  showError('La contraseña debe contener al menos una mayúscula');
}
