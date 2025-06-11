document.addEventListener('DOMContentLoaded', function() {
    // Carrusel automático
    const slides = document.querySelectorAll('.carousel-slide');
    let currentSlide = 0;
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    let intervalId;
    function showSlide(idx) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === idx);
        });
    }
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }
    function startCarousel() {
        intervalId = setInterval(nextSlide, 3500);
    }
    function stopCarousel() {
        clearInterval(intervalId);
    }
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

    // Comentarios de usuario
    const comentariosLista = document.querySelector('.comentarios-lista');
    const form = document.querySelector('.comentario-form');
    const usuarioInput = document.getElementById('comentario-usuario');
    const textoInput = document.getElementById('comentario-texto');
    let comentarios = [];
    function renderComentarios() {
        comentariosLista.innerHTML = '';
        comentarios.forEach(com => {
            const div = document.createElement('div');
            div.className = 'comentario';
            div.innerHTML = `<span class='comentario-usuario'>${com.usuario}:</span> <span class='comentario-texto'>${com.texto}</span>`;
            comentariosLista.appendChild(div);
        });
    }
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
// Carrusel de imágenes para productos destacados
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
// Inicializa el primer slide visible en cada carrusel
window.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.mini-carousel-slide').forEach(slide => {
    const imgs = slide.querySelectorAll('img');
    imgs.forEach((img, idx) => {
      img.style.display = idx === 0 ? '' : 'none';
    });
  });
});
