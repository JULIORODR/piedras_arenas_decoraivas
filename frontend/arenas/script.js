// CRUD de arenas usando la API real del backend

const API_URL = "http://localhost:3001/api/arenas";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('arena-form');
    const nombreInput = document.getElementById('nombre');
    const colorInput = document.getElementById('color');
    const descripcionInput = document.getElementById('descripcion');
    const idInput = document.getElementById('arena-id');
    const guardarBtn = document.getElementById('guardar-btn');
    const cancelarBtn = document.getElementById('cancelar-btn');
    const tabla = document.getElementById('arenas-table').querySelector('tbody');

    let editando = false;

    async function obtenerArenas() {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Error al obtener arenas');
        return await res.json();
    }

    async function crearArena(arena) {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(arena)
        });
        if (!res.ok) throw new Error('Error al crear arena');
        return await res.json();
    }

    async function actualizarArena(id, arena) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(arena)
        });
        if (!res.ok) throw new Error('Error al actualizar arena');
        return await res.json();
    }

    async function eliminarArena(id) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Error al eliminar arena');
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

    // Función para comprar una arena desde la tabla de administración
    async function comprarArena(id) {
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
            const res = await fetch('http://localhost:3001/api/comprar-arena', {
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
            const arenas = await obtenerArenas();
            arenas.forEach((arena) => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${arena.id}</td>
                    <td>${arena.nombre}</td>
                    <td>${arena.valor || arena.precio || ''}</td>
                    <td>${arena.descripcion || ''}</td>
                    <td>${arena.color || ''}</td>
                    <td>${arena.tamano || ''}</td>
                    <td>${arena.cantidad}</td>
                    <td>
                        <button class="editar-btn" data-id="${arena.id}">Editar</button>
                        <button class="eliminar-btn" data-id="${arena.id}">Eliminar</button>
                        <button class="comprar-btn" data-id="${arena.id}">Comprar</button>
                    </td>
                `;
                tabla.appendChild(fila);
            });
            // Listener para comprar
            tabla.querySelectorAll('.comprar-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    await comprarArena(id);
                });
            });
        } catch (err) {
            tabla.innerHTML = '<tr><td colspan="8">Error al cargar arenas</td></tr>';
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
                await actualizarArena(id, { nombre, color, descripcion });
            } else {
                await crearArena({ nombre, color, descripcion });
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
                if (!res.ok) throw new Error('Error al obtener arena');
                const arena = await res.json();
                idInput.value = arena.id;
                nombreInput.value = arena.nombre;
                colorInput.value = arena.color;
                descripcionInput.value = arena.descripcion;
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
              title: '¿Seguro que deseas eliminar esta arena?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Sí, eliminar',
              cancelButtonText: 'Cancelar'
            }).then(async (result) => {
              if (result.isConfirmed) {
                try {
                  await eliminarArena(id);
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

    cargarArenas();
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
    const arena = window.arenas ? window.arenas.find(a => a.id === item.id) : null;
    const valorActual = arena ? Number(arena.valor) : Number(item.precio);
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
    if (arena && item.precio !== valorActual) {
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

// Agregar arena al carrito (localStorage)
function agregarAlCarritoArena(arena) {
  let carrito = getCarrito();
  const idx = carrito.findIndex(item => item.id === arena.id);
  if (idx >= 0) {
    if (carrito[idx].cantidad < arena.cantidad) {
      carrito[idx].cantidad += 1;
    }
  } else {
    carrito.push({
      id: arena.id,
      nombre: arena.nombre,
      img: arena.img,
      precio: Number(arena.valor),
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

async function cargarArenas() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        if (Array.isArray(data)) {
            window.arenas = data.map(a => ({
                id: a.id,
                nombre: a.nombre || a.nombre_arena,
                valor: Number(a.valor),
                img: a.imagen_url || a.imagen || '/images/arena-color.jpg',
                descripcion: a.descripcion || '',
                color: a.color || '',
                tamano: a.tamano || '',
                cantidad: a.cantidad
            }));
            renderGaleriaArenas();
        } else {
            const grid = document.querySelector('.product-gallery-grid');
            if (grid) grid.innerHTML = '<div style="color:#a37c40;text-align:center;">No hay arenas para mostrar.</div>';
        }
    } catch (err) {
        console.error('Error al cargar arenas:', err);
        const grid = document.querySelector('.product-gallery-grid');
        if (grid) grid.innerHTML = '<div style="color:#a37c40;text-align:center;">Error al cargar arenas.</div>';
    }
}

function renderGaleriaArenas() {
    const grid = document.querySelector('.product-gallery-grid');
    if (!grid || !window.arenas) return;
    grid.innerHTML = window.arenas.map((a, i) => `
      <div class="gallery-item" onclick="mostrarDetalleArena(${i})">
        <img src="${a.img}" alt="${a.nombre}">
        <div class="gallery-info">
          <div class="gallery-name">${a.nombre}</div>
          <div class="gallery-price">$${a.valor ? a.valor.toLocaleString() : ''}</div>
          <div class="gallery-stock">Stock: ${a.cantidad}</div>
          <button class="btn-primary btn-vermas">Ver más</button>
        </div>
      </div>
    `).join('');
}

function mostrarDetalleArena(idx) {
    const arena = window.arenas[idx];
    document.querySelector('.product-gallery-grid').style.display = 'none';
    document.getElementById('detalle-producto').style.display = 'block';
    document.getElementById('detalle-nombre').textContent = arena.nombre;
    document.getElementById('detalle-precio').textContent = "$" + (arena.valor ? arena.valor.toLocaleString() : '');
    document.getElementById('detalle-img').src = arena.img;
    document.getElementById('detalle-img').alt = arena.nombre;
    document.getElementById('detalle-desc').textContent = arena.descripcion || '';
    let table = document.getElementById('detalle-table');
    table.innerHTML = "";
    [
      ["ID", arena.id],
      ["Nombre", arena.nombre],
      ["Valor", arena.valor],
      ["Descripción", arena.descripcion || ''],
      ["Color", arena.color || ''],
      ["Tamaño", arena.tamano || ''],
      ["Cantidad", arena.cantidad]
    ].forEach(d => {
      let tr = document.createElement('tr');
      tr.innerHTML = `<td><b>${d[0]}</b></td><td>${d[1]}</td>`;
      table.appendChild(tr);
    });
    const actions = document.querySelector('.product-actions');
    actions.innerHTML = '';
    const btnCarrito = document.createElement('button');
    btnCarrito.textContent = 'Agregar al carrito';
    btnCarrito.className = 'btn-primary';
    btnCarrito.onclick = function() {
      agregarAlCarritoArena(arena);
      Swal.fire({ icon: 'success', title: 'Agregado al carrito', text: arena.nombre });
    };
    actions.appendChild(btnCarrito);
    const btnComprar = document.createElement('button');
    btnComprar.textContent = 'Comprar';
    btnComprar.className = 'btn-primary';
    btnComprar.style.marginLeft = '12px';
    btnComprar.onclick = function() {
      actions.innerHTML = `
        <form id="form-compra-arena" style="display:flex;flex-direction:column;gap:8px;max-width:320px;">
          <label>Cantidad:
            <input type="number" id="compra-cantidad" min="1" max="${arena.cantidad}" value="1" required style="width:80px;">
          </label>
          <label>Nombre:
            <input type="text" id="compra-nombre" required>
          </label>
          <label>Email:
            <input type="email" id="compra-email" required>
          </label>
          <label>Dirección:
            <input type="text" id="compra-direccion" required>
          </label>
          <label>Método de pago:
            <select id="compra-pago" required>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </label>
          <button type="submit" class="btn-primary">Confirmar compra</button>
        </form>
      `;
      document.getElementById('form-compra-arena').onsubmit = async function(e) {
        e.preventDefault();
        const cantidad = Number(document.getElementById('compra-cantidad').value);
        const nombre = document.getElementById('compra-nombre').value.trim();
        const email = document.getElementById('compra-email').value.trim();
        const direccion = document.getElementById('compra-direccion').value.trim();
        const pago = document.getElementById('compra-pago').value;
        if (!nombre || !email || !direccion || !cantidad || cantidad < 1) {
          Swal.fire('Error', 'Completa todos los campos correctamente.', 'error');
          return;
        }
        try {
          const arenaId = arena.id;
          if (!arenaId) {
            Swal.fire('Error', 'ID de arena no válido.', 'error');
            return;
          }
          const res = await fetch('http://localhost:3001/api/comprar-arena', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: Number(arenaId),
              cantidad,
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
              html: `<b>Producto:</b> ${arena.nombre}<br><b>Cantidad:</b> ${cantidad}<br><b>Total:</b> $${(arena.valor * cantidad).toLocaleString()}<br><b>Cliente:</b> ${nombre}<br><b>Email:</b> ${email}<br><b>Dirección:</b> ${direccion}<br><b>Pago:</b> ${pago}`
            });
            cargarArenas();
            volverGaleria();
          } else {
            Swal.fire('Error', data.message, 'error');
          }
        } catch (err) {
          Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
        }
      };
    };
    actions.appendChild(btnComprar);
}