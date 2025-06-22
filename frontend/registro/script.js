document.addEventListener('DOMContentLoaded', function() { // Espera a que el DOM esté completamente cargado
    const form = document.getElementById('registroForm'); // Obtiene el formulario por su ID
    if (form) { // Si el formulario existe
        form.addEventListener('submit', async function(e) { // Agrega un listener para el evento submit del formulario
            e.preventDefault(); // Previene el envío tradicional del formulario
/*Este es al archivo*/ 
            // Campos recolectados correctamente
            const nombre = document.getElementById('nombre').value.trim(); // Obtiene y limpia el valor del campo nombre
            const correo = document.getElementById('correo').value.trim(); // Obtiene y limpia el valor del campo correo
            const contrasena = document.getElementById('contrasena').value; // Obtiene el valor del campo contraseña
            const confirmarContrasena = document.getElementById('confirmarContrasena').value; // Obtiene el valor del campo confirmar contraseña
            const terminos = document.getElementById('terminos').checked; // Verifica si el checkbox de términos está marcado

            if (!nombre || !correo || !contrasena || !confirmarContrasena || !terminos) { // Verifica que todos los campos estén completos
                alert('Por favor, completa todos los campos y acepta los términos.'); // Muestra alerta si falta algún campo
                return; // Sale de la función
            }

            if (contrasena !== confirmarContrasena) { // Verifica que las contraseñas coincidan
                alert('Las contraseñas no coinciden'); // Muestra alerta si no coinciden
                return; // Sale de la función
            }

            // Validación de nombre completo (al menos dos palabras)
            if (!/^([A-Za-zÁÉÍÓÚáéíóúÑñ]+\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]+.*)$/.test(nombre)) { // Expresión regular para nombre completo
                alert('Por favor, ingresa tu nombre completo (nombre y apellido).'); // Alerta si el nombre no es válido
                return; // Sale de la función
            }

            // Validación de correo (formato válido y termina en .com)
            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.com)$/.test(correo)) { // Expresión regular para correo que termina en .com
                alert('Por favor, ingresa un correo válido que termine en .com'); // Alerta si el correo no es válido
                return; // Sale de la función
            }

            // Validación de contraseña (solo letras y números)
            if (!/^[A-Za-z0-9]+$/.test(contrasena)) { // Expresión regular para contraseña alfanumérica
                alert('La contraseña solo debe contener letras y números.'); // Alerta si la contraseña no es válida
                return; // Sale de la función
            }

            try {
                const response = await fetch('http://localhost:3001/api/registro', { // Envía los datos al backend usando fetch
                    method: 'POST', // Método POST
                    headers: {
                        'Content-Type': 'application/json' // Indica que el contenido es JSON
                    },
                    body: JSON.stringify({
                        nombre,
                        correo,
                        contrasena,
                        terminos_aceptados: terminos ? 1 : 0 // Envía 1 si aceptó términos, 0 si no
                    })
                });

                const data = await response.json(); // Espera la respuesta en formato JSON
                if (response.ok) { // Si la respuesta es exitosa
                    alert('¡Registro exitoso! Ahora puedes iniciar sesión.'); // Muestra mensaje de éxito
                    window.location.href = '../login/index.html'; // Redirige a la página de login
                } else {
                    alert(data.message || 'Error al registrar el usuario.'); // Muestra mensaje de error del backend
                }
            } catch (error) {
                alert('Error de conexión con el servidor.'); // Alerta si hay un error de red
            }
        });
    }
});
// Eliminado el bloque fuera del DOMContentLoaded que causaba error
