function sketch(p, state) {
  p.setup = () => {
    p.createCanvas(state.canvas.width, state.canvas.height);
    p.noiseSeed(state.seed);
  };
  p.draw = () => {
    p.background(state.colorPalette[0]);
    p.stroke(state.colorPalette[1]);
    p.strokeWeight(1.5);
    p.noFill();
    const rows = state.params.rows;
    const amp = state.params.amplitude;
    const freq = state.params.frequency;
    const spacing = p.height / (rows + 1);
    for (let r = 1; r <= rows; r++) {
      p.beginShape();
      for (let x = 0; x <= p.width; x += 4) {
        const y = r * spacing + p.noise(x * freq, r * 0.3, state.seed) * amp;
        p.vertex(x, y);
      }
      p.endShape();
    }
    p.noLoop();
  };
  return { initializeSystem() {} };
}