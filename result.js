document.addEventListener('DOMContentLoaded', () => {
  const photo  = document.getElementById('hoverPhoto');
  const img    = document.getElementById('hoverImg');
  const label  = document.getElementById('hoverLabel');
  const rows   = document.querySelectorAll('.result-row');

  // Scroll reveal
  rows.forEach((row, i) => {
    row.style.transitionDelay = `${i * 70}ms`;
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      io.unobserve(e.target);
    });
  }, { threshold: 0.1 });
  rows.forEach(r => io.observe(r));

  if (!photo || !img) return;

  // Lerp cursor tracking
  let mx = 0, my = 0, px = 0, py = 0;
  let active = false, raf = null;
  const LERP = 0.12;

  const tick = () => {
    if (!active) { raf = null; return; }
    px += (mx - px) * LERP;
    py += (my - py) * LERP;
    photo.style.transform = `translate(${px}px, ${py}px) scale(1) rotate(0deg)`;
    raf = requestAnimationFrame(tick);
  };

  document.addEventListener('mousemove', (e) => {
    const photoW = photo.offsetWidth + 32;
    const flipX  = e.clientX > window.innerWidth - photoW;
    mx = flipX ? e.clientX - photoW : e.clientX + 24;
    my = e.clientY - photo.offsetHeight / 2;
  });

  rows.forEach((row) => {
    row.addEventListener('mouseenter', () => {
      const src = row.dataset.photo || '';
      if (src) img.src = src;
      label.textContent = row.dataset.label || '';
      active = true;
      photo.classList.add('visible');
      if (!raf) {
        px = mx; py = my;
        raf = requestAnimationFrame(tick);
      }
    });
    row.addEventListener('mouseleave', () => {
      active = false;
      photo.classList.remove('visible');
      photo.style.transform = 'scale(0.9) rotate(-2deg)';
    });
  });
});