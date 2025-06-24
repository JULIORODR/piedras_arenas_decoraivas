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
    // Ocultar botón de finalizar compra si existe
    const btnFinalizar = document.getElementById('btn-finalizar-compra-carrito');
    if (btnFinalizar) btnFinalizar.style.display = 'none';
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
    // Mostrar botón de finalizar compra si hay productos
    const btnFinalizar = document.getElementById('btn-finalizar-compra-carrito');
    if (btnFinalizar) btnFinalizar.style.display = 'block';
  });
}

// Finalizar compra desde el carrito
function finalizarCompraCarrito() {
  const carrito = getCarrito();
  
  if (carrito.length === 0) {
    Swal.fire('Error', 'El carrito está vacío', 'error');
    return;
  }
  
  // Convertir carrito al formato esperado por mostrarModalCompraDirecta
  const productosParaCompra = carrito.map(item => ({
    id: item.id,
    nombre: item.nombre,
    precio: item.precio,
    img: item.img,
    cantidad: item.cantidad,
    tipo: item.tipo || 'piedra'
  }));
  
  // Usar el modal de compra directa con los productos del carrito
  mostrarModalCompraCarrito(productosParaCompra);
}

// Modal de compra específico para carrito (limpia el carrito después)
function mostrarModalCompraCarrito(productos) {
  const total = productos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  
  Swal.fire({
    title: 'Finalizar Compra desde Carrito',
    html: `
      <div style="text-align: left; margin-bottom: 20px;">
        <h4>Productos en tu carrito:</h4>
        ${productos.map(item => `
          <div style="border-bottom: 1px solid #eee; padding: 8px 0;">
            <strong>${item.nombre}</strong><br>
            Cantidad: ${item.cantidad} | Precio: $${item.precio.toLocaleString()}<br>
            Subtotal: $${(item.precio * item.cantidad).toLocaleString()}
          </div>
        `).join('')}
        <div style="margin-top: 10px; font-size: 18px; font-weight: bold;">
          Total: $${total.toLocaleString()}
        </div>
      </div>
      <form id="form-compra-carrito">
        <input type="text" id="compra-carrito-nombre" placeholder="Nombre completo" required style="width: 100%; margin: 5px 0; padding: 8px;">
        <input type="email" id="compra-carrito-email" placeholder="Email" required style="width: 100%; margin: 5px 0; padding: 8px;">
        <input type="text" id="compra-carrito-direccion" placeholder="Dirección" required style="width: 100%; margin: 5px 0; padding: 8px;">
        <select id="compra-carrito-pago" required style="width: 100%; margin: 5px 0; padding: 8px;">
          <option value="">Seleccionar método de pago</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
      </form>
    `,
    showCancelButton: true,
    confirmButtonText: 'Confirmar Compra',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const nombre = document.getElementById('compra-carrito-nombre').value.trim();
      const email = document.getElementById('compra-carrito-email').value.trim();
      const direccion = document.getElementById('compra-carrito-direccion').value.trim();
      const pago = document.getElementById('compra-carrito-pago').value;
      
      if (!nombre || !email || !direccion || !pago) {
        Swal.showValidationMessage('Por favor completa todos los campos');
        return false;
      }
      
      return { nombre, email, direccion, pago };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      await procesarCompraDesdeCarrito(productos, result.value);
    }
  });
}

// Función para procesar compra desde carrito (limpia el carrito después)
async function procesarCompraDesdeCarrito(productos, datosCliente) {
  try {
    const compraData = {
      productos: productos,
      cliente: datosCliente,
      total: productos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
      fecha: new Date().toISOString()
    };
    
    const response = await fetch('http://localhost:3001/api/comprar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(compraData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Generar factura PDF
      generarFacturaPDF(compraData, result.compraId || 'CARRITO-' + Date.now());
      
      // Limpiar carrito después de compra exitosa
      setCarrito([]);
      renderCarrito();
      
      // Cerrar modal del carrito si está abierto
      const modalCarrito = document.getElementById('modal-carrito');
      if (modalCarrito) modalCarrito.style.display = 'none';
      
      Swal.fire({
        icon: 'success',
        title: '¡Compra realizada con éxito!',
        text: `Número de compra: ${result.compraId || 'CARRITO-' + Date.now()}. El carrito ha sido vaciado.`,
        timer: 4000
      });
      
      // Recargar productos para actualizar stock
      cargarPiedras();
    } else {
      Swal.fire('Error', result.message || 'Error al procesar la compra', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
  }
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

// Reemplaza la función cargarPiedras para que muestre los productos de la base de datos en la galería
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
                cantidad: p.cantidad,
                descripcion: p.descripcion || '',
                color: p.color || '',
                tamano: p.tamano || ''
            }));
            renderGaleriaPiedras();
        } else {
            // Si la respuesta no es un array, muestra mensaje de error en la galería
            const grid = document.querySelector('.product-gallery-grid');
            if (grid) grid.innerHTML = '<div style="color:#a37c40;text-align:center;">No hay piedras para mostrar.</div>';
        }
    } catch (err) {
        console.error('Error al cargar piedras:', err);
        const grid = document.querySelector('.product-gallery-grid');
        if (grid) grid.innerHTML = '<div style="color:#a37c40;text-align:center;">Error al cargar piedras.</div>';
    }
}

// Renderiza la galería de piedras desde la base de datos
function renderGaleriaPiedras() {
    const grid = document.querySelector('.product-gallery-grid');
    if (!grid || !window.piedras) return;
    grid.innerHTML = window.piedras.map((p, i) => `
      <div class="gallery-item" onclick="mostrarDetallePiedra(${i})">
        <img src="${p.img}" alt="${p.nombre_piedra}">
        <div class="gallery-info">
          <div class="gallery-name">${p.nombre_piedra}</div>
          <div class="gallery-price">$${p.valor ? p.valor.toLocaleString() : ''}</div>
          <div class="gallery-stock">Stock: ${p.cantidad}</div>
          <button class="btn-primary btn-vermas">Ver más</button>
        </div>
      </div>
    `).join('');
}

// Obtener información unificada del producto
function obtenerInfoProducto(piedra, cantidad = 1) {
    return {
        id: piedra.id,
        nombre: piedra.nombre_piedra,
        precio: Number(piedra.valor),
        imagen: piedra.img,
        cantidad: cantidad,
        stock: piedra.cantidad,
        descripcion: piedra.descripcion || '',
        color: piedra.color || '',
        tamano: piedra.tamano || '',
        tipo: 'piedra'
    };
}

// Mostrar detalle de piedra desde la base de datos
function mostrarDetallePiedra(idx) {
    const piedra = window.piedras[idx];
    document.querySelector('.product-gallery-grid').style.display = 'none';
    document.getElementById('detalle-producto').style.display = 'block';
    document.getElementById('detalle-nombre').textContent = piedra.nombre_piedra;
    document.getElementById('detalle-precio').textContent = "$" + (piedra.valor ? piedra.valor.toLocaleString() : '');
    document.getElementById('detalle-img').src = piedra.img;
    document.getElementById('detalle-img').alt = piedra.nombre_piedra;
    document.getElementById('detalle-desc').textContent = piedra.descripcion || '';
    // Detalles
    let table = document.getElementById('detalle-table');
    table.innerHTML = "";
    [
      ["ID", piedra.id],
      ["Nombre", piedra.nombre_piedra],
      ["Valor", piedra.valor],
      ["Descripción", piedra.descripcion || ''],
      ["Color", piedra.color || ''],
      ["Tamaño", piedra.tamano || ''],
      ["Cantidad", piedra.cantidad]
    ].forEach(d => {
      let tr = document.createElement('tr');
      tr.innerHTML = `<td><b>${d[0]}</b></td><td>${d[1]}</td>`;
      table.appendChild(tr);
    });
    // Botones Agregar al carrito y Comprar con información compartida
    const actions = document.querySelector('.product-actions');
    actions.innerHTML = `
        <select class="qty-select" id="qty-detalle">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
        </select>
        <button class="btn-primary" onclick="agregarAlCarritoDesdeDetalle(${idx})">Agregar al carrito</button>
        <button class="btn-primary" onclick="comprarDirectoDesdeDetalle(${idx})" style="margin-left:8px;">Comprar ahora</button>
    `;
}

// Agregar al carrito desde la página de detalle
function agregarAlCarritoDesdeDetalle(idx) {
    const piedra = window.piedras[idx];
    const cantidad = parseInt(document.getElementById('qty-detalle').value) || 1;
    const infoProducto = obtenerInfoProducto(piedra, cantidad);
    
    let carrito = getCarrito();
    const existeIdx = carrito.findIndex(item => item.id === infoProducto.id && item.tipo === infoProducto.tipo);
    
    if (existeIdx >= 0) {
        const nuevaCantidad = carrito[existeIdx].cantidad + cantidad;
        if (nuevaCantidad <= infoProducto.stock) {
            carrito[existeIdx].cantidad = nuevaCantidad;
        } else {
            Swal.fire('Error', `Stock insuficiente. Máximo disponible: ${infoProducto.stock}`, 'error');
            return;
        }
    } else {
        if (cantidad <= infoProducto.stock) {
            carrito.push({
                id: infoProducto.id,
                nombre: infoProducto.nombre,
                precio: infoProducto.precio,
                img: infoProducto.imagen,
                cantidad: cantidad,
                tipo: infoProducto.tipo
            });
        } else {
            Swal.fire('Error', `Stock insuficiente. Máximo disponible: ${infoProducto.stock}`, 'error');
            return;
        }
    }
    
    setCarrito(carrito);
    Swal.fire({
        icon: 'success',
        title: 'Agregado al carrito',
        text: `${infoProducto.nombre} (${cantidad} unidades)`,
        timer: 1500,
        showConfirmButton: false
    });
}

// Comprar directamente desde la página de detalle
function comprarDirectoDesdeDetalle(idx) {
    const piedra = window.piedras[idx];
    const cantidad = parseInt(document.getElementById('qty-detalle').value) || 1;
    const infoProducto = obtenerInfoProducto(piedra, cantidad);
    
    // Crear carrito temporal para usar el sistema de compra existente
    let carritoTemp = [{
        id: infoProducto.id,
        nombre: infoProducto.nombre,
        precio: infoProducto.precio,
        img: infoProducto.imagen,
        cantidad: cantidad,
        tipo: infoProducto.tipo
    }];
    
    // Mostrar modal de compra con el producto
    mostrarModalCompraDirecta(carritoTemp);
}

// Mostrar modal de compra directa
function mostrarModalCompraDirecta(productos) {
    const total = productos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    Swal.fire({
        title: 'Finalizar Compra',
        html: `
            <div style="text-align: left; margin-bottom: 20px;">
                <h4>Productos:</h4>
                ${productos.map(item => `
                    <div style="border-bottom: 1px solid #eee; padding: 8px 0;">
                        <strong>${item.nombre}</strong><br>
                        Cantidad: ${item.cantidad} | Precio: $${item.precio.toLocaleString()}<br>
                        Subtotal: $${(item.precio * item.cantidad).toLocaleString()}
                    </div>
                `).join('')}
                <div style="margin-top: 10px; font-size: 18px; font-weight: bold;">
                    Total: $${total.toLocaleString()}
                </div>
            </div>
            <form id="form-compra-directa">
                <input type="text" id="compra-nombre" placeholder="Nombre completo" required style="width: 100%; margin: 5px 0; padding: 8px;">
                <input type="email" id="compra-email" placeholder="Email" required style="width: 100%; margin: 5px 0; padding: 8px;">
                <input type="text" id="compra-direccion" placeholder="Dirección" required style="width: 100%; margin: 5px 0; padding: 8px;">
                <select id="compra-pago" required style="width: 100%; margin: 5px 0; padding: 8px;">
                    <option value="">Seleccionar método de pago</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                </select>
            </form>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirmar Compra',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const nombre = document.getElementById('compra-nombre').value.trim();
            const email = document.getElementById('compra-email').value.trim();
            const direccion = document.getElementById('compra-direccion').value.trim();
            const pago = document.getElementById('compra-pago').value;
            
            if (!nombre || !email || !direccion || !pago) {
                Swal.showValidationMessage('Por favor completa todos los campos');
                return false;
            }
            
            return { nombre, email, direccion, pago };
        }
    }).then(async (result) => {
         if (result.isConfirmed) {
             await procesarCompraDirecta(productos, result.value);
         }
     });
 }
 
 // Actualizar la función mostrarModalCompraDirecta para detectar si viene del carrito
 function mostrarModalCompraDirectaOriginal(productos) {
     const total = productos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
     
     Swal.fire({
         title: 'Finalizar Compra',
         html: `
             <div style="text-align: left; margin-bottom: 20px;">
                 <h4>Productos:</h4>
                 ${productos.map(item => `
                     <div style="border-bottom: 1px solid #eee; padding: 8px 0;">
                         <strong>${item.nombre}</strong><br>
                         Cantidad: ${item.cantidad} | Precio: $${item.precio.toLocaleString()}<br>
                         Subtotal: $${(item.precio * item.cantidad).toLocaleString()}
                     </div>
                 `).join('')}
                 <div style="margin-top: 10px; font-size: 18px; font-weight: bold;">
                     Total: $${total.toLocaleString()}
                 </div>
             </div>
             <form id="form-compra-directa">
                 <input type="text" id="compra-nombre" placeholder="Nombre completo" required style="width: 100%; margin: 5px 0; padding: 8px;">
                 <input type="email" id="compra-email" placeholder="Email" required style="width: 100%; margin: 5px 0; padding: 8px;">
                 <input type="text" id="compra-direccion" placeholder="Dirección" required style="width: 100%; margin: 5px 0; padding: 8px;">
                 <select id="compra-pago" required style="width: 100%; margin: 5px 0; padding: 8px;">
                     <option value="">Seleccionar método de pago</option>
                     <option value="efectivo">Efectivo</option>
                     <option value="transferencia">Transferencia</option>
                     <option value="tarjeta">Tarjeta</option>
                 </select>
             </form>
         `,
         showCancelButton: true,
         confirmButtonText: 'Confirmar Compra',
         cancelButtonText: 'Cancelar',
         preConfirm: () => {
             const nombre = document.getElementById('compra-nombre').value.trim();
             const email = document.getElementById('compra-email').value.trim();
             const direccion = document.getElementById('compra-direccion').value.trim();
             const pago = document.getElementById('compra-pago').value;
             
             if (!nombre || !email || !direccion || !pago) {
                 Swal.showValidationMessage('Por favor completa todos los campos');
                 return false;
             }
             
             return { nombre, email, direccion, pago };
         }
     }).then(async (result) => {
         if (result.isConfirmed) {
             await procesarCompraDirecta(productos, result.value);
         }
     });
}

// Procesar compra directa
async function procesarCompraDirecta(productos, datosCliente) {
    try {
        const compraData = {
            productos: productos,
            cliente: datosCliente,
            total: productos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
            fecha: new Date().toISOString()
        };
        
        const response = await fetch('http://localhost:3001/api/comprar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(compraData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Generar factura PDF
            generarFacturaPDF(compraData, result.compraId);
            
            Swal.fire({
                icon: 'success',
                title: '¡Compra realizada con éxito!',
                text: `Número de compra: ${result.compraId}`,
                timer: 3000
            });
            
            // Recargar productos para actualizar stock
            cargarPiedras();
        } else {
            Swal.fire('Error', result.message || 'Error al procesar la compra', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
}

// Generar factura PDF
function generarFacturaPDF(compraData, compraId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFontSize(20);
    doc.text('FACTURA DE COMPRA', 20, 30);
    doc.setFontSize(12);
    doc.text(`Número: ${compraId}`, 20, 45);
    doc.text(`Fecha: ${new Date(compraData.fecha).toLocaleDateString()}`, 20, 55);
    
    // Datos del cliente
    doc.text('DATOS DEL CLIENTE:', 20, 75);
    doc.text(`Nombre: ${compraData.cliente.nombre}`, 20, 85);
    doc.text(`Email: ${compraData.cliente.email}`, 20, 95);
    doc.text(`Dirección: ${compraData.cliente.direccion}`, 20, 105);
    doc.text(`Método de pago: ${compraData.cliente.pago}`, 20, 115);
    
    // Productos
    doc.text('PRODUCTOS:', 20, 135);
    let yPos = 145;
    compraData.productos.forEach(producto => {
        doc.text(`${producto.nombre}`, 20, yPos);
        doc.text(`Cantidad: ${producto.cantidad}`, 20, yPos + 10);
        doc.text(`Precio unitario: $${producto.precio.toLocaleString()}`, 20, yPos + 20);
        doc.text(`Subtotal: $${(producto.precio * producto.cantidad).toLocaleString()}`, 20, yPos + 30);
        yPos += 50;
    });
    
    // Total
    doc.setFontSize(14);
    doc.text(`TOTAL: $${compraData.total.toLocaleString()}`, 20, yPos + 20);
    
    // Descargar
    doc.save(`factura-${compraId}.pdf`);
}

// Guarda los datos del usuario en localStorage al registrarse
async function registrarUsuario(datos) {
  try {
    const res = await fetch('http://localhost:3001/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const data = await res.json();
    if (res.ok) {
      // Guarda los datos relevantes en localStorage para el perfil
      localStorage.setItem('usuario', JSON.stringify({
        nombre: datos.nombre,
        email: datos.correo,
        telefono: datos.telefono || '',
        direccion: datos.direccion || ''
      }));
      // Actualiza el modal de perfil si está abierto
      actualizarPerfilModal();
      Swal.fire({ icon: 'success', title: 'Registro exitoso', text: 'Bienvenido, ' + datos.nombre });
      // window.location.href = '/inicio.html'; // Descomenta si quieres redirigir
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'No se pudo registrar.' });
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor.' });
  }
}

// Actualiza los datos del modal de perfil con los datos del usuario en localStorage
function actualizarPerfilModal() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {
    nombre: "Usuario Demo",
    email: "usuario@demo.com",
    telefono: "No registrado",
    direccion: "No registrada"
  };
  if (document.getElementById('perfil-nombre-modal')) {
    document.getElementById('perfil-nombre-modal').textContent = usuario.nombre;
    document.getElementById('perfil-email-modal').textContent = usuario.email;
    document.getElementById('perfil-telefono-modal').textContent = usuario.telefono || 'No registrado';
    document.getElementById('perfil-direccion-modal').textContent = usuario.direccion || 'No registrada';
  }
}

// Cuando abras el modal de perfil, muestra los datos guardados
function abrirPerfilModal() {
  actualizarPerfilModal();
  // ...código para mostrar compras...
  document.getElementById('modal-perfil').style.display = 'flex';
}

// Cerrar sesión y redirigir a bienvenida
function cerrarSesion() {
  localStorage.removeItem('usuario');
  localStorage.removeItem('compras_usuario');
  localStorage.removeItem('carrito');
  window.location.href = '../bienvenida/index.html';
}