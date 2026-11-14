'use strict';

const select = (query) => document.querySelector(query);
const selectAll = (query) => Array.from(document.querySelectorAll(query));
const motion = matchMedia('(prefers-reduced-motion: no-preference)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const clamp = (value) => Math.min(1, Math.max(0, value));

document.documentElement.classList.add('js');

const header = select('.header');
const menuButton = select('.menu-toggle');
const menu = select('.nav');
const menuLinks = selectAll('.nav a');
const sections = selectAll('main > section');
const lightSections = new Set(['solucoes', 'blog', 'parceiros-titulo']);
const timeline = select('.timeline');
const hero = select('.hero');
const heroCopy = select('.hero-copy');
let scrollFrame = 0;

function setMenu(open) {
  menu.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
}

menuButton.hidden = false;
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
menuLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('pointerdown', (event) => {
  if (!header.contains(event.target)) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});

function updateScroll() {
  scrollFrame = 0;
  const headerBottom = header.offsetHeight;
  const section = sections.find((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.top <= headerBottom && bounds.bottom > headerBottom;
  });
  const activeSection = section?.id || section?.getAttribute('aria-labelledby');
  header.classList.toggle('scrolled', scrollY > 20);
  header.classList.toggle('on-light', lightSections.has(activeSection));
  menuLinks.forEach((link) => {
    if (link.hash === '#' + activeSection) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const bounds = timeline.getBoundingClientRect();
  const progress = (innerHeight * .84 - bounds.top) / (bounds.height * .8);
  timeline.style.setProperty('--timeline-progress', motion.matches ? clamp(progress) : 1);
  const heroProgress = motion.matches && finePointer.matches ? clamp(scrollY / hero.offsetHeight) : 0;
  heroCopy.style.translate = `0 ${heroProgress * -48}px`;
}

function queueScrollUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}

addEventListener('scroll', queueScrollUpdate, { passive: true });
addEventListener('resize', queueScrollUpdate);
motion.addEventListener('change', queueScrollUpdate);
updateScroll();

if (motion.matches) {
  heroCopy.classList.add('enter');
  select('.hero-art').classList.add('enter');
}

const reveal = new IntersectionObserver((entries, observer) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    if (motion.matches) target.classList.add('enter');
    observer.unobserve(target);
  });
}, { threshold: .13 });
selectAll('[data-reveal]').forEach((element) => reveal.observe(element));

const filters = select('.filters');
const filterButtons = selectAll('[data-filter]');
const products = selectAll('.product');
const filterStatus = select('#filter-status');
filters.hidden = false;
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    products.forEach((product) => {
      const visible = filter === 'todos' || product.dataset.audience.split(' ').includes(filter);
      product.hidden = !visible;
      if (visible) count++;
    });
    filterStatus.textContent = `${count} soluções exibidas.`;
    queueScrollUpdate();
  });
});

const dialog = select('#cotacao');
const quoteProduct = select('#quote-product');
const quoteUnit = select('#quote-unit');
const quoteForm = select('#quote-form');
let quoteTrigger;
products.forEach(({ dataset }) => quoteProduct.add(new Option(dataset.quote, dataset.quote)));
selectAll('[data-quote]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !dialog.showModal) return;
    event.preventDefault();
    quoteTrigger = link;
    quoteProduct.value = link.dataset.quote || '';
    dialog.showModal();
    quoteProduct.focus();
  });
});
select('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => quoteTrigger?.focus({ preventScroll: true }));
quoteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const subject = quoteProduct.value;
  const message = subject ? `Olá, PGB! Gostaria de uma cotação para: ${subject}.` : 'Olá, PGB! Gostaria de conversar sobre uma cotação.';
  window.open(`https://wa.me/${quoteUnit.value}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});

const heroArt = select('.hero-art');
const artFrame = select('#art-frame');
heroArt.addEventListener('pointermove', (event) => {
  if (!motion.matches || !finePointer.matches) return;
  const bounds = heroArt.getBoundingClientRect();
  artFrame.style.setProperty('--rx', `${(0.5 - (event.clientY - bounds.top) / bounds.height) * 8}deg`);
  artFrame.style.setProperty('--ry', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 8}deg`);
});
heroArt.addEventListener('pointerleave', () => {
  artFrame.style.removeProperty('--rx');
  artFrame.style.removeProperty('--ry');
});

// Gold rings and particles add depth to the navy background. The canvas runs only in view.
const canvas = select('#hero-motion');
const context = canvas.getContext('2d');
if (context) {
  const particles = Array.from({ length: 31 }, () => ({
    x: Math.random(), y: Math.random(), size: .4 + Math.random() * 1.4, phase: Math.random() * 7,
  }));
  let width = 0;
  let height = 0;
  let pointerX = 0;
  let pointerY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let visible = true;
  let animation = 0;

  function draw(time) {
    animation = 0;
    context.clearRect(0, 0, width, height);
    const animate = motion.matches && visible && !document.hidden;
    const tick = animate ? time * .001 : 0;
    offsetX += ((animate ? pointerX : 0) - offsetX) * .055;
    offsetY += ((animate ? pointerY : 0) - offsetY) * .055;
    const centerX = width * (width < 650 ? .65 : .76) + offsetX * 33;
    const centerY = height * (width < 650 ? .71 : .55) + offsetY * 26;
    const radius = Math.min(width * .37, 390);

    for (let ring = 0; ring < 4; ring++) {
      context.beginPath();
      context.strokeStyle = ring === 0 ? '#d6b36452' : '#d6b36429';
      context.lineWidth = 1;
      context.ellipse(centerX, centerY, radius * (1 + ring * .19), radius * (.59 + ring * .15), -.62, 0, Math.PI * 2);
      context.stroke();
    }

    particles.forEach((particle, index) => {
      const x = (particle.x * .63 + .34) * width + Math.sin(tick * .37 + particle.phase) * 12 + offsetX * 19;
      const y = particle.y * height + Math.cos(tick * .29 + particle.phase) * 9 + offsetY * 14;
      const alpha = .25 + .38 * ((Math.sin(tick * .6 + particle.phase) + 1) / 2);
      context.fillStyle = index % 6 === 0 ? `rgba(80, 199, 139, ${alpha})` : `rgba(239, 206, 143, ${alpha})`;
      context.beginPath();
      context.arc(x, y, particle.size, 0, Math.PI * 2);
      context.fill();
    });
    if (animate) scheduleDraw();
  }

  function scheduleDraw() {
    if (!animation) animation = requestAnimationFrame(draw);
  }

  const resizeCanvas = new ResizeObserver(() => {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const density = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    scheduleDraw();
  });
  const watchHero = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) scheduleDraw();
  });
  resizeCanvas.observe(hero);
  watchHero.observe(hero);
  hero.addEventListener('pointermove', (event) => {
    if (!motion.matches || !finePointer.matches) return;
    const bounds = hero.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / width - .5;
    pointerY = (event.clientY - bounds.top) / height - .5;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  document.addEventListener('visibilitychange', scheduleDraw);
  motion.addEventListener('change', scheduleDraw);
}
