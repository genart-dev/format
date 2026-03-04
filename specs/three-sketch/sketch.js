function sketch(THREE, state, container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(state.colorPalette[0]);
  const camera = new THREE.PerspectiveCamera(75, state.canvas.width / state.canvas.height, 0.1, 1000);
  camera.position.z = 15;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(state.canvas.width, state.canvas.height);
  container.appendChild(renderer.domElement);
  const cubes = [];
  function mulberry32(a) { return function() { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function initializeSystem() {
    cubes.forEach(c => scene.remove(c));
    cubes.length = 0;
    const rng = mulberry32(state.seed);
    const material = new THREE.MeshStandardMaterial({ color: state.colorPalette[1] });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < state.params.cubeCount; i++) {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set((rng() - 0.5) * state.params.spread, (rng() - 0.5) * state.params.spread, (rng() - 0.5) * state.params.spread);
      scene.add(cube);
      cubes.push(cube);
    }
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));
  }
  function animate() {
    requestAnimationFrame(animate);
    cubes.forEach(c => { c.rotation.x += state.params.rotationSpeed; c.rotation.y += state.params.rotationSpeed; });
    renderer.render(scene, camera);
  }
  initializeSystem();
  animate();
  return { initializeSystem, dispose() { renderer.dispose(); } };
}