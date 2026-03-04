function sketch(state) {
  function generate() {
    const w = state.canvas.width;
    const h = state.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) / 2 - 20;
    const n = state.params.ringCount;
    let circles = '';
    for (let i = 0; i < n; i++) {
      const r = maxR * ((i + 1) / n);
      circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${state.colorPalette[1]}" stroke-width="${state.params.strokeWidth}" />`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${state.colorPalette[0]}" />${circles}</svg>`;
  }
  return { generate, initializeSystem: generate };
}