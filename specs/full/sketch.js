function sketch(p, state) {
  p.setup = () => {
    p.createCanvas(state.canvas.width, state.canvas.height);
    p.randomSeed(state.seed);
    p.noiseSeed(state.seed);
  };
  p.draw = () => {
    p.background(state.colorPalette[1]);
    const margin = state.params.margin;
    const cells = state.params.cellCount;
    const cellW = (p.width - margin * 2) / cells;
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const n = p.noise(i * state.params.noiseScale, j * state.params.noiseScale);
        p.fill(p.lerpColor(p.color(state.colorPalette[0]), p.color(state.colorPalette[2]), n));
        p.rect(margin + i * cellW, margin + j * cellW, cellW * 0.9, cellW * 0.9);
      }
    }
    p.noLoop();
  };
  return { initializeSystem() {} };
}