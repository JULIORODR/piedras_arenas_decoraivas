const productsGrid = document.querySelector('.products-grid');

// Simulación de carga desde API (reemplaza por fetch a tu backend real)
const productos = [
  {
    id: 1,
    nombre: "Piedra Blanca Decorativa",
    imagen: "/images/piedra-blanca.jpg",
    precio: 12000,
    precioAnterior: 15000,
    etiqueta: "Nuevo"
  },
  {
    id: 2,
    nombre: "Arena de Color",
    imagen: "/images/arena-color.jpg",
    precio: 8500,
    precioAnterior: 10000,
    etiqueta: "Oferta"
  },
  {
    id: 3,
    nombre: "Granito Natural",
    imagen: "/images/granito-natural.jpg",
    precio: 9500,
    precioAnterior: null,
    etiqueta: ""
  }
];

function renderProductos() {
  productsGrid.innerHTML = "";
  productos.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'product-card anim-fadein';
    card.innerHTML = `
      ${prod.etiqueta ? `<div class="product-label ${prod.etiqueta === 'Oferta' ? 'offer' : 'new'}">${prod.etiqueta}</div>` : ''}
      <img src="${prod.imagen}" alt="${prod.nombre}" class="product-img">
      <h3>${prod.nombre}</h3>
      <div class="product-prices">
        <span class="price">$${prod.precio.toLocaleString()}</span>
        ${prod.precioAnterior ? `<span class="old-price">$${prod.precioAnterior.toLocaleString()}</span>` : ''}
      </div>
      <button class="btn-primary" onclick="agregarAlCarrito(${prod.id})">Agregar al carrito</button>
    `;
    productsGrid.appendChild(card);
  });
}

// Demo función para botón
window.agregarAlCarrito = function(id) {
  alert('Producto ' + id + ' agregado al carrito (demo)');
};

renderProductos();