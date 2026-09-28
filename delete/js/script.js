/* SABCA Account Deletion - Slideshow & Lightbox Controller */

document.addEventListener('DOMContentLoaded', () => {
  // Slideshow Elements
  const slides = document.querySelectorAll('.slide');
  const indicatorsContainer = document.getElementById('indicators');
  const progressText = document.getElementById('slide-progress');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  let currentSlide = 0;
  const totalSlides = slides.length;

  // Initialize Indicators
  function createIndicators() {
    indicatorsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('span');
      dot.classList.add('indicator');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(i));
      indicatorsContainer.appendChild(dot);
    }
  }

  // Update Slide State
  function updateSlideshow() {
    // Toggle Active Classes
    slides.forEach((slide, idx) => {
      if (idx === currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // Toggle Active Indicator
    const indicators = document.querySelectorAll('.indicator');
    if (indicators.length > 0) {
      indicators.forEach((indicator, idx) => {
        if (idx === currentSlide) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });
    }

    // Update Progress Header Text
    if (progressText) {
      progressText.textContent = `Slide ${currentSlide + 1} of ${totalSlides}`;
    }

    // Manage Prev/Next Disabled States
    if (prevBtn) prevBtn.disabled = currentSlide === 0;
    if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;
  }

  // Change Slide (Relative Offset)
  window.changeSlide = function(direction) {
    const target = currentSlide + direction;
    if (target >= 0 && target < totalSlides) {
      currentSlide = target;
      updateSlideshow();
    }
  };

  // Go to Slide (Absolute Index)
  window.goToSlide = function(index) {
    if (index >= 0 && index < totalSlides) {
      currentSlide = index;
      updateSlideshow();
    }
  };

  // Initialize Page Elements
  createIndicators();
  updateSlideshow();

  // Keyboard Navigation Support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentSlide > 0) {
      changeSlide(-1);
    } else if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
      changeSlide(1);
    }
  });

  // Lightbox Magnification
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');

  window.openLightbox = function(index) {
    if (!lightbox || !lightboxImg || !lightboxCaption) return;
    
    const slide = slides[index];
    const imgElement = slide.querySelector('img');
    const titleElement = slide.querySelector('.slide-title');
    const descElement = slide.querySelector('.slide-description');

    if (imgElement) {
      lightboxImg.src = imgElement.src;
      lightboxCaption.innerHTML = `<strong>${titleElement.textContent}</strong> — ${descElement.textContent}`;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden'; // Lock background scroll
    }
  };

  window.closeLightbox = function() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Unlock background scroll
  };

  // Close lightbox on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
    }
  });
});
