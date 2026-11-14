const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

const samples = 64;

function fillWave(context, points, width, height, offset, paint) {
  context.beginPath();
  for (let index = 0; index <= samples; index++) {
    const x = index * width / samples;
    const y = Math.min(height, points[index] + offset);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fillStyle = paint;
  context.fill();
}

export function startSectionSeams(main, motion) {
  const seams = [...main.querySelectorAll('.section-seam')].flatMap((element) => {
    const canvas = element.querySelector('canvas');
    const context = canvas.getContext('2d');
    if (!context) return [];
    return [{
      element, canvas, context, width: 0, height: 0, progress: -1,
      points: new Float32Array(samples + 1), ribbon: null,
      color: getComputedStyle(element).getPropertyValue('--seam-color').trim(),
    }];
  });
  if (!seams.length) return;

  let frame = 0;

  function resize(seam) {
    const { element, canvas, context } = seam;
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (!width || !height || (seam.width === width && seam.height === height)) return;

    const density = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    seam.width = width;
    seam.height = height;
    seam.progress = -1;
    const ribbon = context.createLinearGradient(0, height, width, 0);
    ribbon.addColorStop(0, '#082f79');
    ribbon.addColorStop(.58, '#064a5e');
    ribbon.addColorStop(1, '#078c47');
    seam.ribbon = ribbon;
  }

  function draw(seam, progress) {
    if (seam.progress === progress || (progress > 0 && progress < 1 && Math.abs(seam.progress - progress) < .001)) return;
    seam.progress = progress;
    const { context, width, height, points, color, ribbon } = seam;
    context.clearRect(0, 0, width, height);
    if (progress === 0) return;

    // A diagonal sweep arrives from the right. A traveling curve softens its edge.
    for (let index = 0; index <= samples; index++) {
      const x = index / samples;
      const arrival = smooth((progress - (1 - x) * .39) / .61);
      const curve = Math.sin(x * Math.PI * 1.34 - progress * 3.5);
      const depth = .45 + x * .46 + curve * .11 * (1 - progress);
      points[index] = height * (1 - depth * arrival);
    }

    const accent = smooth(progress / .28) * (1 - smooth((progress - .66) / .34));
    const band = height * .15 * accent;
    const highlight = height * .025 * accent;
    if (accent > 0) {
      fillWave(context, points, width, height, 0, '#d6b364');
      fillWave(context, points, width, height, highlight, ribbon);
    }
    fillWave(context, points, width, height, band + highlight, color);
  }

  function update() {
    frame = 0;
    if (!motion.matches) return;
    const viewport = innerHeight;
    for (const seam of seams) {
      resize(seam);
      if (!seam.height) continue;
      const boundary = seam.element.getBoundingClientRect().bottom;
      draw(seam, clamp((viewport * .93 - boundary) / (viewport * .71)));
    }
  }

  function onScroll() {
    if (!frame && motion.matches) frame = requestAnimationFrame(update);
  }

  function setMotion() {
    main.classList.toggle('has-seams', motion.matches);
    onScroll();
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  const resizeMain = new ResizeObserver(onScroll);
  resizeMain.observe(main);
  motion.addEventListener('change', setMotion);
  setMotion();
}
