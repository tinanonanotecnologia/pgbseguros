import * as THREE from './assets/three/three.module.min.js';

export async function startHeroScene({ hero, stage, canvas, motion, finePointer }) {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!gl) return;

  const renderer = new THREE.WebGLRenderer({ canvas, context: gl });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 30);
  camera.position.z = 7.85;

  scene.add(new THREE.HemisphereLight(0xfff5d8, 0x1d417b, 2.2));
  for (const [color, intensity, position] of [
    [0xffe6a8, 3.35, [2.8, 4, 5]],
    [0x689fff, 2.4, [-4, -1.7, 2]],
    [0xe7b541, 2.9, [2.5, -1.3, -3]],
  ]) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...position);
    scene.add(light);
  }

  const logo = await new THREE.TextureLoader().loadAsync(new URL('./assets/logo-pgb.webp', import.meta.url).href);
  logo.colorSpace = THREE.SRGBColorSpace;
  logo.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const medal = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xcda04e, metalness: .59, roughness: .25 });
  const rim = new THREE.MeshStandardMaterial({ color: 0xf4cf75, metalness: .42, roughness: .21 });
  const measuredEdge = new THREE.CylinderGeometry(1.17, 1.17, .28, 96);
  measuredEdge.rotateX(Math.PI / 2);
  medal.add(new THREE.Mesh(measuredEdge, gold));
  for (const z of [-.14, .14]) {
    const bevel = new THREE.Mesh(new THREE.TorusGeometry(1.151, .023, 10, 96), rim);
    bevel.position.z = z;
    medal.add(bevel);
  }
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.155, 128), new THREE.MeshBasicMaterial({ map: logo, alphaTest: .5, toneMapped: false }));
  face.position.z = .153;
  medal.add(face);

  const orbitSpecs = [
    { radius: 1.64, width: .013, color: 0xe6bc68, angles: [.4, -.24, -.5], arc: 5.42, start: -.7 },
    { radius: 1.88, width: .009, color: 0x5f9cea, angles: [.78, .29, -.36], arc: 5.73, start: .15 },
    { radius: 2.11, width: .012, color: 0x38ba83, angles: [-.88, .21, .52], arc: 4.94, start: 1.1 },
    { radius: 2.27, width: .007, color: 0xd6b364, angles: [.22, -.73, .08], arc: 5.68, start: -.5 },
  ];
  const orbits = new THREE.Group();
  const pearl = new THREE.SphereGeometry(1, 20, 12);
  const satellites = orbitSpecs.map(({ radius, width, color, angles, arc, start }, index) => {
    const orbit = new THREE.Group();
    orbit.rotation.set(...angles);
    const loop = new THREE.Mesh(new THREE.TorusGeometry(radius, width, 7, 120, arc), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .76 }));
    loop.rotation.z = start;
    const satellite = new THREE.Mesh(pearl, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .34, roughness: .38 }));
    satellite.scale.setScalar(index === 0 ? .095 : .073);
    orbit.add(loop, satellite);
    orbits.add(orbit);
    return { satellite, radius, start, arc, index };
  });

  const sparkleGeometry = new THREE.BufferGeometry();
  const positions = [];
  for (let index = 0; index < 58; index++) {
    const angle = index * 2.39996;
    const radius = 1.48 + (index % 17) * .074;
    positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(index * 7.3) * 1.05 - .42);
  }
  sparkleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const sparkles = new THREE.Points(sparkleGeometry, new THREE.PointsMaterial({ color: 0xe7c68a, size: .029, transparent: true, opacity: .62 }));
  scene.add(sparkles, orbits, medal);

  let pointerX = 0;
  let pointerY = 0;
  let scroll = 0;
  let tiltX = 0;
  let tiltY = 0;
  let spin = 0;
  let elapsed = 0;
  let lastTime = 0;
  let frame = 0;
  let visible = true;
  let contextLost = gl.isContextLost();

  function render(now) {
    frame = 0;
    if (contextLost || !visible || document.hidden) return;
    const moving = motion.matches;
    const delta = lastTime ? Math.min(.035, (now - lastTime) / 1000) : 0;
    lastTime = moving ? now : 0;
    elapsed += moving ? delta : 0;
    const blend = 1 - Math.exp(-delta * 6);
    tiltX = THREE.MathUtils.lerp(tiltX, pointerX, blend);
    tiltY = THREE.MathUtils.lerp(tiltY, pointerY, blend);
    spin = THREE.MathUtils.lerp(spin, scroll, blend);

    const t = moving ? elapsed : 0;
    const x = moving ? tiltX : 0;
    const y = moving ? tiltY : 0;
    const progress = moving ? spin : 0;
    medal.rotation.set(-.15 + y * .32 + Math.sin(t * .73) * .09 + progress * .22, -.26 + x * .62 + Math.sin(t * .95) * .3 + progress * .78, -.055 + x * .11);
    medal.position.set(x * .18, Math.sin(t * .98) * .1 + .08 - progress * .49, 0);
    orbits.rotation.set(.12 + y * .32 + progress * .5, -.03 + x * .47, -.09 + t * .065 + progress * .79);
    orbits.position.y = .08 - progress * .42;
    orbits.scale.setScalar(1 + progress * .14);
    sparkles.rotation.set(y * .16, x * .3, t * -.042 + progress * .45);
    for (const { satellite, radius, start, arc, index } of satellites) {
      const angle = start + arc * (.5 + Math.sin(t * (.55 + index * .09) + index * 1.4) * .42);
      satellite.position.set(radius * Math.cos(angle), radius * Math.sin(angle), 0);
    }
    renderer.render(scene, camera);
    stage.classList.add('has-scene');
    if (moving) requestDraw();
  }

  function requestDraw() {
    if (!frame && visible && !contextLost && !document.hidden) frame = requestAnimationFrame(render);
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = stage;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 1 ? 7.85 / camera.aspect : 7.85;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, width < 430 ? 1.35 : 1.65));
    renderer.setSize(width, height, false);
    requestDraw();
  }

  function readScroll() {
    scroll = THREE.MathUtils.clamp(scrollY / (hero.offsetHeight * .82), 0, 1);
  }

  const resizeStage = new ResizeObserver(resize);
  const watchStage = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    lastTime = 0;
    requestDraw();
  });
  resizeStage.observe(stage);
  watchStage.observe(stage);
  addEventListener('scroll', readScroll, { passive: true });
  hero.addEventListener('pointermove', (event) => {
    if (!motion.matches || !finePointer.matches) return;
    const rect = hero.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointerY = (event.clientY - rect.top) / rect.height * 2 - 1;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    contextLost = true;
    stage.classList.remove('has-scene');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    resize();
  });
  document.addEventListener('visibilitychange', () => { lastTime = 0; requestDraw(); });
  motion.addEventListener('change', requestDraw);
  readScroll();
  resize();
}
