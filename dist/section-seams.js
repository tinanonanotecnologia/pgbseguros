const clamp = (value) => Math.min(1, Math.max(0, value));

export function startSectionSeams(main, motion) {
  const seams = [...main.querySelectorAll('.section-seam')].flatMap((element) => {
    const canvas = element.querySelector('canvas');
    const context = canvas.getContext('2d');
    if (!context) return [];
    return [{
      element, canvas, context, width: 0, height: 0, progress: -1, tiles: [],
      color: getComputedStyle(element).getPropertyValue('--seam-color').trim(),
    }];
  });
  if (!seams.length) return;

  const angles = Array.from({ length: 6 }, (_, index) => Math.PI * (index / 3 - .5));
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
    seam.tiles = [];
    const radius = width < 650 ? 15 : 25;
    const step = Math.sqrt(3) * radius;
    for (let row = 0, y = height + radius; y >= -radius; row++, y -= radius * 1.5) {
      for (let column = 0, x = (row % 2) * step / 2; x <= width + step / 2; column++, x += step) {
        const wave = Math.sin(x / width * 7.5 + row * .51) * .10;
        const delay = clamp((height - y) / height * .63 + .14 + wave + (column % 3) * .021);
        seam.tiles.push({ x, y, radius, delay, warm: (row + column) % 5 === 0 });
      }
    }
  }

  function draw(seam, progress) {
    if (Math.abs(seam.progress - progress) < .001 && progress !== 1 && progress !== 0) return;
    if (seam.progress === progress) return;
    seam.progress = progress;
    const { context, width, height, tiles, color } = seam;
    context.clearRect(0, 0, width, height);
    if (progress === 0) return;

    if (progress === 1) {
      context.fillStyle = color;
      context.fillRect(0, 0, width, height);
      return;
    }

    for (const tile of tiles) {
      const amount = clamp((progress - tile.delay) / .27);
      if (amount === 0) continue;
      const eased = 1 - (1 - amount) ** 2;
      const spin = (1 - eased) * (tile.warm ? -.4 : .25);
      const radius = (tile.radius + .36) * (.36 + eased * .64);
      const depth = .17 + .83 * eased;
      context.beginPath();
      angles.forEach((angle, index) => {
        const x = tile.x + Math.cos(angle + spin) * radius * depth;
        const y = tile.y + Math.sin(angle + spin) * radius;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.closePath();
      context.fillStyle = color;
      context.fill();
      if (amount < .98) {
        context.strokeStyle = tile.warm ? `rgba(231, 187, 97, ${.83 * (1 - amount)})` : `rgba(99, 158, 206, ${.56 * (1 - amount)})`;
        context.lineWidth = 1.1;
        context.stroke();
      }
    }
  }

  function update() {
    frame = 0;
    if (!motion.matches) return;
    const viewport = innerHeight;
    for (const seam of seams) {
      resize(seam);
      if (!seam.height) continue;
      const boundary = seam.element.getBoundingClientRect().bottom;
      draw(seam, clamp((viewport * .99 - boundary) / (viewport * .78)));
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
