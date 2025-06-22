// CRUD de piedras usando la API real del backend

const API_URL = "http://localhost:3001/api/piedras";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('piedra-form');
    const nombreInput = document.getElementById('nombre');
    const colorInput = document.getElementById('color');
    const descripcionInput = document.getElementById('descripcion');
    const idInput = document.getElementById('piedra-id');
    const guardarBtn = document.getElementById('guardar-btn');
    const cancelarBtn = document.getElementById('cancelar-btn');
    const tabla = document.getElementById('piedras-table').querySelector('tbody');

    let editando = false;

    async function obtenerPiedras() {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Error al obtener piedras');
        return await res.json();
    }

    async function crearPiedra(piedra) {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(piedra)
        });
        if (!res.ok) throw new Error('Error al crear piedra');
        return await res.json();
    }

    async function actualizarPiedra(id, piedra) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(piedra)
        });
        if (!res.ok) throw new Error('Error al actualizar piedra');
        return await res.json();
    }

    async function eliminarPiedra(id) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Error al eliminar piedra');
        return await res.json();
    }

    function limpiarFormulario() {
        idInput.value = '';
        nombreInput.value = '';
        colorInput.value = '';
        descripcionInput.value = '';
        guardarBtn.textContent = 'Guardar';
        cancelarBtn.style.display = 'none';
        editando = false;
    }

    // Función para comprar una piedra desde la tabla de administración
    async function comprarPiedra(id) {
        const { value: cantidad } = await Swal.fire({
            title: '<span style="color:#bfa074;font-weight:bold;">¿Cuántas unidades deseas comprar?</span>',
            input: 'number',
            inputLabel: '<span style="color:#bfa074;">Cantidad</span>',
            inputValue: 1,
            inputAttributes: { min: 1, step: 1 },
            showCancelButton: true,
            confirmButtonText: '<b>Continuar</b>',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'swal2-popup-custom',
                confirmButton: 'swal2-confirm-custom',
                cancelButton: 'swal2-cancel-custom'
            }
        });
        if (!cantidad || isNaN(cantidad) || cantidad <= 0) return;
        // Solicitar datos del cliente y método de pago
        const { value: formValues } = await Swal.fire({
           
            focusConfirm: false,
            confirmButtonText: '<b>Finalizar compra</b>',
            cancelButtonText: 'Cancelar',
            showCancelButton: true,
            customClass: {
                popup: 'swal2-popup-custom',
                confirmButton: 'swal2-confirm-custom',
                cancelButton: 'swal2-cancel-custom'
            },
            preConfirm: () => {
                return [
                    document.getElementById('swal-nombre').value,
                    document.getElementById('swal-email').value,
                    document.getElementById('swal-direccion').value,
                    document.getElementById('swal-pago').value
                ];
            }
        });
        if (!formValues) return;
        const [nombre, email, direccion, pago] = formValues;
        try {
            const res = await fetch('http://localhost:3001/api/comprar-piedra', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    cantidad: Number(cantidad),
                    cliente: { nombre, email, direccion },
                    pago,
                    fecha: new Date().toLocaleString()
                })
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({
                  icon: 'success',
                  title: '¡Compra realizada!',
                  html: `<div style='color:#bfa074;font-size:1.1em;'><b>Gracias por tu compra</b><br>Producto comprado: <b>${nombre}</b><br>Unidades: <b>${cantidad}</b></div>`
                });
                await renderizarTabla();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
        }
    }

    async function renderizarTabla() {
        tabla.innerHTML = '';
        try {
            const piedras = await obtenerPiedras();
            piedras.forEach((piedra) => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${piedra.id}</td>
                    <td>${piedra.nombre_piedra}</td>
                    <td>${piedra.precio}</td>
                    <td>${piedra.descripcion || ''}</td>
                    <td>${piedra.color || ''}</td>
                    <td>${piedra.tamano || ''}</td>
                    <td>${piedra.cantidad}</td>
                    <td>
                        <button class="editar-btn" data-id="${piedra.id}">Editar</button>
                        <button class="eliminar-btn" data-id="${piedra.id}">Eliminar</button>
                        <button class="comprar-btn" data-id="${piedra.id}">Comprar</button>
                    </td>
                `;
                tabla.appendChild(fila);
            });
            // Listener para comprar
            tabla.querySelectorAll('.comprar-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    await comprarPiedra(id);
                });
            });
        } catch (err) {
            tabla.innerHTML = '<tr><td colspan="8">Error al cargar piedras</td></tr>';
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = nombreInput.value.trim();
        const color = colorInput.value.trim();
        const descripcion = descripcionInput.value.trim();
        try {
            if (editando) {
                const id = idInput.value;
                await actualizarPiedra(id, { nombre, color, descripcion });
            } else {
                await crearPiedra({ nombre, color, descripcion });
            }
            await renderizarTabla();
            limpiarFormulario();
        } catch (err) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.message
            });
        }
    });

    tabla.addEventListener('click', async (e) => {
        if (e.target.classList.contains('editar-btn')) {
            const id = e.target.getAttribute('data-id');
            try {
                const res = await fetch(`${API_URL}/${id}`);
                if (!res.ok) throw new Error('Error al obtener piedra');
                const piedra = await res.json();
                idInput.value = piedra.id;
                nombreInput.value = piedra.nombre;
                colorInput.value = piedra.color;
                descripcionInput.value = piedra.descripcion;
                guardarBtn.textContent = 'Actualizar';
                cancelarBtn.style.display = 'inline-block';
                editando = true;
            } catch (err) {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: err.message
                });
            }
        } else if (e.target.classList.contains('eliminar-btn')) {
            const id = e.target.getAttribute('data-id');
            Swal.fire({
              title: '¿Seguro que deseas eliminar esta piedra?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sí, eliminar',
              cancelButtonText: 'Cancelar'
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  await eliminarPiedra(id);
                  await renderizarTabla();
                  limpiarFormulario();
                  Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    timer: 1500,
                    showConfirmButton: false
                  });
                } catch (err) {
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.message
                  });
                }
              }
            });
        }
    });

    cancelarBtn.addEventListener('click', limpiarFormulario);

    renderizarTabla();
});

// Agrega estilos personalizados para el modal de compra
const swalStyle = document.createElement('style');
swalStyle.innerHTML = `
.swal2-popup-custom { border-radius: 18px !important; border: 2px solid #bfa074 !important; }
.swal2-confirm-custom { background: #bfa074 !important; color: #fff !important; font-weight: bold; border-radius: 8px !important; }
.swal2-cancel-custom { background: #fff !important; color: #bfa074 !important; border: 1.5px solid #bfa074 !important; border-radius: 8px !important; }
`;
document.head.appendChild(swalStyle);

// Carrito persistente
function getCarrito() {
  return JSON.parse(localStorage.getItem('carrito') || '[]');
}
function setCarrito(arr) {
  localStorage.setItem('carrito', JSON.stringify(arr));
  document.getElementById('cart-count').textContent = arr.reduce((a, b) => a + b.cantidad, 0);
}

// Renderiza los productos del carrito en el modal con botón eliminar
function renderCarrito() {
  const carrito = getCarrito();
  const lista = document.getElementById('carrito-lista');
  if (!lista) return;
  if (carrito.length === 0) {
    lista.innerHTML = "<div style='margin:24px 0;'>El carrito está vacío.</div>";
    document.getElementById('carrito-total').textContent = '';
    return;
  }
  let html = '';
  let total = 0;
  Promise.all(carrito.map(async (item, i) => {
    const piedra = window.piedras ? window.piedras.find(p => p.id === item.id) : null;
    const valorActual = piedra ? Number(piedra.valor) : Number(item.precio);
    const subtotal = valorActual * item.cantidad;
    total += subtotal;
    html += `
      <div class="carrito-item">
        <img src="${item.img}" alt="${item.nombre}" class="carrito-img-mini">
        <span class="carrito-nombre">${item.nombre}</span>
        <input type="number" min="1" max="99" value="${item.cantidad}" class="carrito-cantidad-input" onchange="actualizarCantidadCarrito(${i}, this.value)">
        <span class="carrito-precio">$${subtotal.toLocaleString()}</span>
        <button type="button" class="carrito-eliminar" onclick="eliminarDelCarrito(${i})" title="Eliminar este producto">✕</button>
      </div>
    `;
    if (piedra && item.precio !== valorActual) {
      item.precio = valorActual;
    }
  })).then(() => {
    lista.innerHTML = html;
    document.getElementById('carrito-total').textContent = "Total: $" + total.toLocaleString();
    setCarrito(carrito);
  });
}

function actualizarCantidadCarrito(idx, nuevaCantidad) {
  let carrito = getCarrito();
  nuevaCantidad = parseInt(nuevaCantidad, 10);
  if (isNaN(nuevaCantidad) || nuevaCantidad < 1) return;
  carrito[idx].cantidad = nuevaCantidad;
  setCarrito(carrito);
  renderCarrito();
}

// Elimina un producto del carrito
function eliminarDelCarrito(idx) {
  let carrito = getCarrito();
  carrito.splice(idx, 1);
  setCarrito(carrito);
  renderCarrito();
}

// Agregar piedra al carrito (localStorage)
function agregarAlCarritoPiedra(piedra) {
  let carrito = getCarrito();
  const idx = carrito.findIndex(item => item.id === piedra.id);
  if (idx >= 0) {
    if (carrito[idx].cantidad < piedra.cantidad) {
      carrito[idx].cantidad += 1;
    }
  } else {
    carrito.push({
      id: piedra.id,
      nombre: piedra.nombre_piedra,
      img: piedra.img,
      precio: Number(piedra.valor),
      cantidad: 1
    });
  }
  setCarrito(carrito);
}

// Validación y envío del formulario de compra (carrito)
document.getElementById('form-compra').addEventListener('submit', async function(e) {
  e.preventDefault();
  limpiarErrores();
  const nombre = document.getElementById('cliente-nombre').value.trim();
  const email = document.getElementById('cliente-email').value.trim();
  const direccion = document.getElementById('cliente-direccion').value.trim();
  const telefono = document.getElementById('cliente-telefono').value.trim();
  const pago = document.querySelector('input[name="pago"]:checked')?.value || '';
  const carrito = getCarrito();
  const cliente = { nombre, email, direccion };
  if (telefono) cliente.telefono = telefono;
  const productos = carrito.map(item => ({
    id: item.id,
    nombre: String(item.nombre).trim(),
    cantidad: Number(item.cantidad),
    precio: Number(item.precio) // Fuerza a número
  }));
  const total = productos.reduce((a, b) => a + (b.precio * b.cantidad), 0);
  const fecha = new Date().toLocaleString();
  const datosCompra = { productos, cliente, pago, total, fecha };
  // Validación
  let errores = [];
  if (!Array.isArray(productos) || productos.length === 0) errores.push('El carrito está vacío.');
  if (!cliente || typeof cliente.nombre !== 'string' || !cliente.nombre.trim()) errores.push('Nombre requerido.');
  if (typeof cliente.email !== 'string' || !cliente.email.trim()) errores.push('Correo requerido.');
  if (typeof cliente.direccion !== 'string' || !cliente.direccion.trim()) errores.push('Dirección requerida.');
  if (typeof pago !== 'string' || !pago.trim()) errores.push('Método de pago requerido.');
  if (typeof total !== 'number' || isNaN(total) || total <= 0) errores.push('Total inválido.');
  if (typeof fecha !== 'string' || !fecha.trim()) errores.push('Fecha inválida.');
  productos.forEach((p, i) => {
    if (typeof p.nombre !== 'string' || !p.nombre.trim()) errores.push(`Producto #${i+1}: nombre requerido.`);
    if (typeof p.cantidad !== 'number' || isNaN(p.cantidad) || p.cantidad <= 0) errores.push(`Producto #${i+1}: cantidad inválida.`);
    if (typeof p.precio !== 'number' || isNaN(p.precio) || p.precio < 0) errores.push(`Producto #${i+1}: precio inválido.`);
  });
  if (errores.length > 0) {
    Swal.fire({ icon: 'error', title: 'Error de validación', html: errores.join('<br>') });
    return;
  }
  // ENVÍO A LA API
  try {
    const res = await fetch('http://localhost:3001/api/comprar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosCompra)
    });
    let data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (res.ok && (data.success || data.message)) {
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

async function cargarPiedras() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        if (Array.isArray(data)) {
            window.piedras = data.map(p => ({
                id: p.id,
                nombre_piedra: p.nombre_piedra,
                valor: Number(p.valor),
                img: p.imagen || '/images/granitos-coloridos.jpg',
                descripcion: p.descripcion || '',
                color: p.color || '',
                tamano: p.tamano || '',
                cantidad: p.cantidad
            }));
            renderGaleriaPiedras();
        }
    } catch (err) {
        console.error('Error al cargar piedras:', err);
    }
}