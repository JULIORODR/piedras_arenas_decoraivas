const productsGrid = document.querySelector('.products-grid');

// Carga dinámica de todos los productos desde el backend (piedras, arenas y terrarios)
async function cargarTodosLosProductos() {
  const productsGrid = document.querySelector('.products-grid');
  if (!productsGrid) return;
  try {
    const res = await fetch('http://localhost:3001/api/todos-productos');
    if (!res.ok) throw new Error('No se pudo obtener productos');
    const productos = await res.json();
    productsGrid.innerHTML = "";
    if (!Array.isArray(productos) || productos.length === 0) {
      productsGrid.innerHTML = '<div style="color:#bfa074;text-align:center;">No hay productos para mostrar.</div>';
      return;
    }
    productos.forEach(prod => {
      const card = document.createElement('div');
      card.className = 'product-card anim-fadein';
      card.innerHTML = `
        <span class="product-badge badge-offer">${prod.tipo}</span>
        <img src="${prod.imagen_url || '/images/granitos-coloridos.jpg'}" alt="${prod.nombre}" class="product-img">
        <div class="product-title">${prod.nombre}</div>
        <div class="product-price-row">
          <span class="product-price">$${Number(prod.valor).toLocaleString()}</span>
        </div>
        <div class="product-desc" style="font-size:0.98em;color:#666;margin:8px 0 10px 0;">${prod.descripcion || ''}</div>
        <button class="btn btn-product" onclick="agregarAlCarrito(${prod.id}, '${prod.tipo}')">Agregar al carrito</button>
      `;
      productsGrid.appendChild(card);
    });
  } catch (err) {
    productsGrid.innerHTML = '<div style="color:#bfa074;text-align:center;">Error al cargar productos.</div>';
  }
}

// Demo función para botón
window.agregarAlCarrito = function(id, tipo) {
  alert('Producto ' + id + ' (' + tipo + ') agregado al carrito (demo)');
};

document.addEventListener('DOMContentLoaded', cargarTodosLosProductos);