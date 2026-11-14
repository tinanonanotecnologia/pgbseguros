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
const lightSections = new Set(['solucoes', 'diferenciais', 'blog', 'parceiros-titulo']);
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
  const anchorOffset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 1;
  const section = sections.find((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.top <= anchorOffset && bounds.bottom > anchorOffset;
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

const newsCarousel = select('#news-carousel');
const newsCards = [...newsCarousel.children];
const newsInterval = 6500;
let newsInView = false;
let newsTimer;

function moveNews(direction, wrap = false) {
  const firstCardLeft = newsCards[0].offsetLeft;
  const end = newsCarousel.scrollWidth - newsCarousel.clientWidth;
  const stops = newsCards.map((card) => Math.min(end, card.offsetLeft - firstCardLeft));
  const position = newsCarousel.scrollLeft;
  const next = direction > 0
    ? stops.find((stop) => stop > position + 2)
    : stops.reverse().find((stop) => stop < position - 2);
  if (next === undefined && !wrap) return;
  newsCarousel.scrollTo({ left: next ?? 0, behavior: motion.matches ? 'smooth' : 'instant' });
}

function scheduleNews() {
  clearTimeout(newsTimer);
  if (!newsInView || document.hidden || !motion.matches) return;
  newsTimer = setTimeout(() => {
    const isReading = newsCarousel.matches(':focus-within') || (finePointer.matches && newsCarousel.matches(':hover'));
    if (!isReading) moveNews(1, true);
    scheduleNews();
  }, newsInterval);
}

new IntersectionObserver(([entry]) => {
  newsInView = entry.isIntersecting;
  scheduleNews();
}, { threshold: .35 }).observe(newsCarousel);
motion.addEventListener('change', scheduleNews);
document.addEventListener('visibilitychange', scheduleNews);
newsCarousel.addEventListener('pointerdown', scheduleNews, { passive: true });
newsCarousel.addEventListener('wheel', scheduleNews, { passive: true });
newsCarousel.addEventListener('keydown', (event) => {
  if (event.target !== newsCarousel || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  moveNews(event.key === 'ArrowRight' ? 1 : -1);
});

const partnerVisibility = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
  }
});

for (const carousel of selectAll('.partner-carousel')) {
  const track = carousel.querySelector('.partner-carousel-track');
  const repeatedLogos = track.querySelector('.partner-logos').cloneNode(true);
  repeatedLogos.setAttribute('aria-hidden', 'true');
  track.append(repeatedLogos);
  carousel.classList.add('is-animated');
  partnerVisibility.observe(carousel);
}

const scene = select('#hero-scene');
import('./hero-scene.js')
  .then(({ startHeroScene }) => startHeroScene({ hero, stage: scene.parentElement, canvas: scene, motion, finePointer }))
  .catch(() => {}); // Keep the original logo visible if 3D is unavailable.

import('./section-seams.js')
  .then(({ startSectionSeams }) => startSectionSeams(select('main'), motion));
