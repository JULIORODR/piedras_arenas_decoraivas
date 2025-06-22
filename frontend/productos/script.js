// Espera a que el DOM esté completamente cargado para ejecutar el código
// Esto asegura que todos los elementos estén disponibles
// Carrusel automático y manual de imágenes en la sección principal

document.addEventListener('DOMContentLoaded', function() {
    // Selecciona todos los slides del carrusel
    const slides = document.querySelectorAll('.carousel-slide');
    let currentSlide = 0; // Índice del slide actual
    const prevBtn = document.querySelector('.carousel-btn.prev'); // Botón anterior
    const nextBtn = document.querySelector('.carousel-btn.next'); // Botón siguiente
    let intervalId; // ID del intervalo para el carrusel automático

    // Muestra el slide correspondiente al índice
    function showSlide(idx) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === idx);
        });
    }
    // Avanza al siguiente slide
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    // Retrocede al slide anterior
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }
    // Inicia el carrusel automático
    function startCarousel() {
        intervalId = setInterval(nextSlide, 3500);
    }
    // Detiene el carrusel automático
    function stopCarousel() {
        clearInterval(intervalId);
    }
    // Inicializa el carrusel si hay slides
    if (slides.length > 0) {
        showSlide(currentSlide);
        startCarousel();
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', function() {
                stopCarousel();
                prevSlide();
                startCarousel();
            });
            nextBtn.addEventListener('click', function() {
                stopCarousel();
                nextSlide();
                startCarousel();
            });
        }
    }

    // Manejo de comentarios de usuario en la sección de comentarios
    const comentariosLista = document.querySelector('.comentarios-lista');
    const form = document.querySelector('.comentario-form');
    const usuarioInput = document.getElementById('comentario-usuario');
    const textoInput = document.getElementById('comentario-texto');
    let comentarios = []; // Arreglo para almacenar los comentarios

    // Renderiza los comentarios en pantalla
    function renderComentarios() {
        comentariosLista.innerHTML = '';
        comentarios.forEach(com => {
            const div = document.createElement('div');
            div.className = 'comentario';
            div.innerHTML = `<span class='comentario-usuario'>${com.usuario}:</span> <span class='comentario-texto'>${com.texto}</span>`;
            comentariosLista.appendChild(div);
        });
    }
    // Maneja el envío del formulario de comentarios
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const usuario = usuarioInput.value.trim() || 'Anónimo';
            const texto = textoInput.value.trim();
            if (texto.length === 0) return;
            comentarios.push({ usuario, texto });
            renderComentarios();
            textoInput.value = '';
        });
    }
});

// Carrusel de imágenes para productos destacados (mini-carrusel)
// Permite navegar entre imágenes de productos destacados
function moveMiniCarousel(btn, direction) {
  const container = btn.closest('.mini-carousel-container');
  const slides = container.querySelectorAll('.mini-carousel-slide img');
  let currentIndex = 0;
  slides.forEach((img, idx) => {
    if (img.style.display !== 'none') {
      currentIndex = idx;
    }
    img.style.display = 'none';
  });
  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = slides.length - 1;
  if (newIndex >= slides.length) newIndex = 0;
  slides[newIndex].style.display = '';
}
// Inicializa el primer slide visible en cada mini-carrusel de productos
window.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.mini-carousel-slide').forEach(slide => {
    const imgs = slide.querySelectorAll('img');
    imgs.forEach((img, idx) => {
      img.style.display = idx === 0 ? '' : 'none';
    });
  });
});
