/**
 * SABCA Unified Web Portal - Core Script
 * Controls mobile navigation, Account Deletion slideshow & lightbox, and Contact form interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // Mobile Navigation Toggle
  // ==========================================
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        if (navLinks.classList.contains('open')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-xmark');
        } else {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      }
    });

    // Close mobile nav when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      });
    });
  }

  // ==========================================
  // Contact Form Submission Feedback
  // ==========================================
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('contact-email')?.value.trim();
      const name = document.getElementById('contact-name')?.value.trim();
      const subject = document.getElementById('contact-subject')?.value.trim();
      const message = document.getElementById('contact-message')?.value.trim();

      if (!email || !name || !message) {
        formStatus.textContent = 'Please fill in all required fields (Name, Email, and Message).';
        formStatus.style.display = 'block';
        formStatus.className = 'form-status';
        formStatus.style.background = 'rgba(239, 68, 68, 0.15)';
        formStatus.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        formStatus.style.color = '#fca5a5';
        return;
      }

      // Display success message
      formStatus.textContent = 'Thank you for reaching out! Your message has been received. Our team will contact you shortly.';
      formStatus.style.display = 'block';
      formStatus.className = 'form-status success';
      contactForm.reset();
    });
  }

  // ==========================================
  // Account Deletion Slideshow Controller
  // ==========================================
  const slides = document.querySelectorAll('.slide');
  const indicatorsContainer = document.getElementById('indicators');
  const progressText = document.getElementById('slide-progress');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  if (slides.length > 0) {
    let currentSlide = 0;
    const totalSlides = slides.length;

    // Create dot indicators
    function createIndicators() {
      if (!indicatorsContainer) return;
      indicatorsContainer.innerHTML = '';
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('span');
        dot.classList.add('indicator');
        if (i === 0) dot.classList.add('active');
        dot.setAttribute('title', `Go to slide ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        indicatorsContainer.appendChild(dot);
      }
    }

    // Update slideshow display
    function updateSlideshow() {
      slides.forEach((slide, idx) => {
        if (idx === currentSlide) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      const indicators = document.querySelectorAll('.indicator');
      indicators.forEach((indicator, idx) => {
        if (idx === currentSlide) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });

      if (progressText) {
        progressText.textContent = `Slide ${currentSlide + 1} of ${totalSlides}`;
      }

      if (prevBtn) prevBtn.disabled = currentSlide === 0;
      if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;
    }

    // Relative navigation
    window.changeSlide = function (direction) {
      const target = currentSlide + direction;
      if (target >= 0 && target < totalSlides) {
        currentSlide = target;
        updateSlideshow();
      }
    };

    // Absolute navigation
    window.goToSlide = function (index) {
      if (index >= 0 && index < totalSlides) {
        currentSlide = index;
        updateSlideshow();
      }
    };

    createIndicators();
    updateSlideshow();

    // Keyboard navigation (Left / Right Arrow)
    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is focused inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        changeSlide(-1);
      } else if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
        changeSlide(1);
      }
    });

    // ==========================================
    // Lightbox Magnification
    // ==========================================
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    window.openLightbox = function (index) {
      if (!lightbox || !lightboxImg || !lightboxCaption) return;

      const slide = slides[index];
      if (!slide) return;

      const imgElement = slide.querySelector('img');
      const titleElement = slide.querySelector('.slide-title');
      const descElement = slide.querySelector('.slide-description');

      if (imgElement) {
        lightboxImg.src = imgElement.src;
        const title = titleElement ? titleElement.textContent : '';
        const desc = descElement ? descElement.textContent : '';
        lightboxCaption.innerHTML = `<strong>${title}</strong> — ${desc}`;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    };

    window.closeLightbox = function () {
      if (!lightbox) return;
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    });
  }
});

