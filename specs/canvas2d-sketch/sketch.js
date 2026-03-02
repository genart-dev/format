function sketch(ctx, state) {
  const { width, height } = state.canvas;
  function mulberry32(a) { return function() { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function initializeSystem() {
    const rng = mulberry32(state.seed);
    ctx.fillStyle = state.colorPalette[0];
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = state.colorPalette[1];
    ctx.lineWidth = 1;
    for (let i = 0; i < state.params.count; i++) {
      ctx.beginPath();
      ctx.arc(rng() * width, rng() * height, rng() * state.params.maxRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  return { initializeSystem };
}