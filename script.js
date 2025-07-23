// ─── HERO: Typed.js Effect ─────────────────────────────
if (window.Typed) {
  new Typed('#typed-text', {
    strings: [
      'Wireless Connectivity',
      'Automotive Telematics',
      'RF Measurement',
      'PHY/MAC Analysis',
      'Machine Learning',
      'Test Automation'
    ],
    typeSpeed: 55,
    backSpeed: 28,
    loop: true,
    showCursor: false,
  });
} else {
  document.getElementById('typed-text').innerText = 'Wireless Connectivity';
}

// ─── GET ELEMENTS FOR PROGRESS / TOGGLE / TOP BTN / NAV │───────────────
const progress = document.getElementById('scroll-progress');
const topBtn   = document.getElementById('topBtn');
const toggle   = document.querySelector('.toggle-dark');
const navLinks = document.querySelectorAll('nav ul li a');
const sections = document.querySelectorAll('section[id]');

// ─── DARK/LIGHT THEME TOGGLE ─────────────────────────────
toggle.addEventListener('click', () => {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  toggle.innerHTML = isDark
    ? '<i class="bi bi-moon"></i>'
    : '<i class="bi bi-brightness-high"></i>';
});

// ─── SCROLL HANDLER: PROGRESS BAR, TOP BUTTON, ACTIVE LINK ──────────
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const docH    = document.documentElement.scrollHeight - window.innerHeight;

  // a) update progress bar
  const pct = docH > 0 ? (scrollY / docH) * 100 : 0;
  progress.style.width = pct + '%';

  // b) show/hide back‑to‑top
  topBtn.style.display = scrollY > 200 ? 'block' : 'none';

  // c) active‑link highlighting
  const offset = scrollY + 100;
  sections.forEach(sec => {
    const top  = sec.offsetTop;
    const bot  = top + sec.offsetHeight;
    const id   = sec.getAttribute('id');
    const link = document.querySelector(`nav ul li a[href="#${id}"]`);
    if (offset >= top && offset < bot) {
      navLinks.forEach(a => a.classList.remove('active'));
      link && link.classList.add('active');
    }
  });
});

// ─── BACK‑TO‑TOP BUTTON CLICK ────────────────────────────
topBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ─── PUBLICATIONS: Hover Animation ───────────────────────
document.querySelectorAll('.publications-section ul li').forEach(li => {
  li.addEventListener('mouseenter', () => li.classList.add('hovered'));
  li.addEventListener('mouseleave', () => li.classList.remove('hovered'));
});

// ─── ABOUT BOX: Entry Animation ─────────────────────────
window.addEventListener('load', () => {
  document.querySelector('.about-box')?.classList.add('loaded');
});

// ─── FOOTER: Ripple Generation, Sound & Vibration ───────
window.addEventListener('DOMContentLoaded', () => {
  // generate ripples
  const pulseContainer = document.getElementById('wave-pulse');
  if (pulseContainer) {
    const rippleCount = 5;
    for (let i = 0; i < rippleCount; i++) {
      const span = document.createElement('span');
      span.style.animationDelay = `${i * 1}s`;
      pulseContainer.appendChild(span);
    }
  }

  // dot vibration & sound
  const dot = document.getElementById('center-dot');
  if (dot) {
    dot.addEventListener('touchstart', () => {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    });
    dot.addEventListener('mouseenter', () => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    });
  }
});
