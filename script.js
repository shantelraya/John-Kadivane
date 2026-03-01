const cursor    = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;


document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});


function animateCursor() {
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';

  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, button, .timeline-item, .gallery-item').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width      = '20px';
    cursor.style.height     = '20px';
    cursorRing.style.width  = '56px';
    cursorRing.style.height = '56px';
    cursorRing.style.opacity = '0.3';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width      = '12px';
    cursor.style.height     = '12px';
    cursorRing.style.width  = '36px';
    cursorRing.style.height = '36px';
    cursorRing.style.opacity = '0.6';
  });
});

/* =============================================
   SCROLL REVEAL
   ============================================= */
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 80);
    }
  });
}, { threshold: 0.1 });

revealElements.forEach((el) => revealObserver.observe(el));

/* =============================================
   ANIMATED STAT COUNTERS
   ============================================= */
function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const duration = 1400;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);

    el.textContent = Math.floor(eased * target);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  }

  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('[data-target]').forEach(animateCounter);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('.about-stats').forEach((el) => counterObserver.observe(el));

/* =============================================
   SMOOTH SCROLL (NAV LINKS)
   ============================================= */

function toggleMenu() {
  const nav = document.getElementById('navLinks');
  nav.classList.toggle('open');
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* =============================================
   CONTACT FORM SUBMIT FEEDBACK
   ============================================= */
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btnText = document.getElementById('btnText');
  btnText.textContent = 'SENDING...';

  const data = {
    name:    document.getElementById('name').value,
    email:   document.getElementById('email').value,
    subject: document.getElementById('subject').value,
    message: document.getElementById('message').value
  };

  try {
    const response = await fetch('http://localhost:3000/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      btnText.textContent = 'SENT ✓';
      e.target.reset();
      setTimeout(() => btnText.textContent = 'SEND IT →', 3000);
    } else {
      btnText.textContent = 'FAILED — TRY AGAIN';
      setTimeout(() => btnText.textContent = 'SEND IT →', 3000);
    }
  } catch (error) {
    btnText.textContent = 'FAILED — TRY AGAIN';
    setTimeout(() => btnText.textContent = 'SEND IT →', 3000);
  }
});