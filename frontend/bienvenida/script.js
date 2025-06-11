document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.carousel-slide');
    const btnLeft = document.querySelector('.carousel-btn.left');
    const btnRight = document.querySelector('.carousel-btn.right');
    let current = 0;
    let interval;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active', 'fade-in');
            if (i === index) {
                slide.classList.add('active', 'fade-in');
            }
        });
    }

    function nextSlide() {
        current = (current + 1) % slides.length;
        showSlide(current);
    }

    function prevSlide() {
        current = (current - 1 + slides.length) % slides.length;
        showSlide(current);
    }

    function startAutoSlide() {
        interval = setInterval(nextSlide, 3000);
    }

    function stopAutoSlide() {
        clearInterval(interval);
    }

    btnLeft.addEventListener('click', () => {
        stopAutoSlide();
        prevSlide();
        startAutoSlide();
    });

    btnRight.addEventListener('click', () => {
        stopAutoSlide();
        nextSlide();
        startAutoSlide();
    });

    // Touch/Swipe support for innovation
    let startX = 0;
    let isSwiping = false;
    document.querySelector('.carousel-container').addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwiping = true;
    });
    document.querySelector('.carousel-container').addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        let diff = e.touches[0].clientX - startX;
        if (Math.abs(diff) > 50) {
            stopAutoSlide();
            if (diff > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
            startAutoSlide();
            isSwiping = false;
        }
    });
    document.querySelector('.carousel-container').addEventListener('touchend', () => {
        isSwiping = false;
    });

    // Animación inicial
    showSlide(current);
    startAutoSlide();
});
console.log('Página de bienvenida cargada.');
