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

document.addEventListener('DOMContentLoaded', () => {
  const section  = document.querySelector('.gallery-section');
  const track    = document.getElementById('galleryTrack');
  const bg       = document.getElementById('galleryBg');
  const dots     = document.querySelectorAll('.dot');
  const panels   = document.querySelectorAll('.gallery-panel');
  const counter  = document.getElementById('panelCurrent');
  const squiggle = document.querySelector('.squiggle');

  const TOTAL = panels.length;
  const panelData = Array.from(panels).map(p => ({
    bg:   p.dataset.bg   || '#e4dfd3',
    text: p.dataset.text || 'dark',
  }));

  let idx      = 0;
  let curX     = 0;
  let tgtX     = 0;
  let dragging = false;
  let dragX0   = 0;
  let dragBase = 0;
  let moved    = false;
  let raf      = null;
  let running  = false;

  const W = () => section.clientWidth;

  /* ── color lerp ── */
  const h2r = h => [
    parseInt(h.slice(1,3),16),
    parseInt(h.slice(3,5),16),
    parseInt(h.slice(5,7),16)
  ];
  const lerpC = (a,b,t) => {
    const [r1,g1,b1]=h2r(a), [r2,g2,b2]=h2r(b);
    return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
  };

  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

  const updateBg = () => {
    if (!bg) return;
    const p = curX / W();
    const from = Math.floor(p), to = Math.min(from+1, TOTAL-1);
    const t = clamp(p - from, 0, 1);
    bg.style.background = lerpC(panelData[clamp(from,0,TOTAL-1)].bg, panelData[to].bg, t);
  };

  const updateUI = () => {
    dots.forEach((d,i) => d.classList.toggle('active', i===idx));
    if (counter) counter.textContent = String(idx+1).padStart(2,'0');
    const mode = panelData[idx].text;
    section.classList.toggle('is-light', mode==='light');
    section.classList.toggle('is-dark',  mode==='dark');
    if (squiggle) squiggle.style.color = mode==='light' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
  };

  const animate = () => {
    running = true;
    curX += (tgtX - curX) * 0.1;
    track.style.transform = `translateX(${-curX}px)`;
    updateBg();
    if (Math.abs(curX - tgtX) < 0.3) {
      curX = tgtX;
      track.style.transform = `translateX(${-curX}px)`;
      updateBg();
      running = false;
      raf = null;
      return;
    }
    raf = requestAnimationFrame(animate);
  };

  const goTo = (i) => {
    idx  = clamp(i, 0, TOTAL-1);
    tgtX = idx * W();
    updateUI();
    if (!running) animate();
  };

  /* ── mouse drag ── */
  track.addEventListener('mousedown', e => {
    dragging = true; moved = false;
    dragX0 = e.clientX; dragBase = curX;
    if (raf) { cancelAnimationFrame(raf); raf=null; running=false; }
    track.classList.add('grabbing');
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - dragX0;
    if (Math.abs(dx) > 4) moved = true;
    curX = clamp(dragBase - dx, 0, (TOTAL-1)*W());
    tgtX = curX;
    track.style.transform = `translateX(${-curX}px)`;
    updateBg();
  });

  window.addEventListener('mouseup', e => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('grabbing');
    const dx = e.clientX - dragX0;
    if      (dx < -60) goTo(idx+1);
    else if (dx >  60) goTo(idx-1);
    else               goTo(idx);
  });

  /* ── touch ── */
  let tx0 = 0, tbase = 0;
  track.addEventListener('touchstart', e => {
    tx0=e.touches[0].clientX; tbase=curX;
    if (raf) { cancelAnimationFrame(raf); raf=null; running=false; }
  }, {passive:true});
  track.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - tx0;
    curX = clamp(tbase - dx, 0, (TOTAL-1)*W());
    tgtX = curX;
    track.style.transform = `translateX(${-curX}px)`;
    updateBg();
  }, {passive:true});
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx0;
    if      (dx < -50) goTo(idx+1);
    else if (dx >  50) goTo(idx-1);
    else               goTo(idx);
  });

  /* ── wheel ── */
  section.addEventListener('wheel', e => {
    e.preventDefault();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (d > 30) goTo(idx+1);
    if (d < -30) goTo(idx-1);
  }, {passive:false});

  /* ── dots ── */
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.panel)));

  /* ── keyboard ── */
  document.addEventListener('keydown', e => {
    if (e.key==='ArrowRight') goTo(idx+1);
    if (e.key==='ArrowLeft')  goTo(idx-1);
  });

  /* ── resize ── */
  window.addEventListener('resize', () => {
    curX = tgtX = idx * W();
    track.style.transform = `translateX(${-curX}px)`;
  });

  /* ── init ── */
  track.style.transform = 'translateX(0)';
  updateUI();
  updateBg();

const blobColors = [
  'rgba(212,0,15,0.3)',       // panel 1 
  'rgba(212,0,15,0.2)',       // panel 2
  'rgba(255,100,50,0.15)',    // panel 3 
  'rgba(212,0,15,0.35)',      // panel 4 
];

const blob = document.querySelector('.gallery-bg');
if (blob) {
  blob.style.setProperty('--blob-color', blobColors[idx]);
}
});

/* =============================================
   CONTACT FORM SUBMIT FEEDBACK
   ============================================= */
contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('btnText');
  btn.textContent = 'SENDING...';

  const data = new FormData(contactForm);

  const res = await fetch('', {
    method: 'POST',
    body: data,
    headers: { 'Accept': 'application/json' }
  });

  if (res.ok) {
    btn.textContent = 'SENT ✓';
    contactForm.reset();
  } else {
    btn.textContent = 'ERROR — TRY AGAIN';
  }
});