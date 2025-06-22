document.getElementById('form-compra').addEventListener('submit', async function(e) {
  e.preventDefault();
  limpiarErrores();

  // Recoge datos del formulario
  const nombre = document.getElementById('cliente-nombre').value.trim();
  const email = document.getElementById('cliente-email').value.trim();
  const direccion = document.getElementById('cliente-direccion').value.trim();
  const telefono = document.getElementById('cliente-telefono').value.trim();
  const pago = document.querySelector('input[name="pago"]:checked')?.value || '';
  const carrito = getCarrito();

  // Validación de productos y cliente (igual que ya tienes)
  // ...

  // Construcción del objeto datosCompra
  const cliente = { nombre, email, direccion };
  if (telefono) cliente.telefono = telefono;
  const productos = carrito.map(item => ({
    nombre: item.nombre,
    cantidad: item.cantidad,
    precio: item.precio
  }));
  const total = productos.reduce((a, b) => a + (b.precio * b.cantidad), 0);
  const fecha = new Date().toLocaleString();
  const datosCompra = { productos, cliente, pago, total, fecha };

  // Envío a la API
  try {
    const res = await fetch('http://localhost:3001/api/comprar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosCompra)
    });
    let data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (res.ok && data.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Compra realizada!',
        text: 'Tu compra fue guardada exitosamente. Se descargará tu recibo.',
        timer: 3000,
        showConfirmButton: false
      });
      generarReciboPDF({
        cliente: datosCompra.cliente,
        productos: datosCompra.productos,
        total: datosCompra.total,
        fecha: datosCompra.fecha,
        pago: datosCompra.pago
      });
      setCarrito([]);
      cerrarCarrito();
      setTimeout(() => location.reload(), 1000);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error en la compra',
        html: data.mensaje ? data.mensaje : 'Ocurrió un error inesperado. Revisa los datos enviados.'
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar con el servidor. Intenta más tarde.'
    });
  }
});