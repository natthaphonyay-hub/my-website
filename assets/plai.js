// Line-art plai (Zingiber montanum) that grows in the hero: rhizome, shoots,
// alternating leaves, then a flower cone rising from the rhizome.
(function () {
  const box = document.getElementById('leaves');
  if (!box) return;

  const G = '#1F7A4D', GOLD = '#E3C94A', BRACT = '#C9A13B';
  const parts = [];
  let t = 0; // running delay, seconds
  const add = (svg, delay, dur, cls = 'draw') => parts.push(`<g class="${cls}" style="--d:${delay}s;--t:${dur}s">${svg}</g>`);
  const line = (d, w = 2) => `<path d="${d}" pathLength="1" fill="none" stroke="${G}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Ground and rhizome
  add(line('M40 540 L380 540', 1.5), 0, .8);
  add(line('M150 552 C150 540 176 538 186 548 C196 540 214 540 222 550 C232 542 252 544 256 556 C266 560 262 578 246 576 C234 584 214 582 206 574 C194 584 170 582 164 572 C146 574 140 560 150 552 Z', 1.8), .4, 1.2);
  add(line('M168 560 q6 4 12 0 M204 562 q6 4 12 0 M232 564 q6 4 10 0', 1.2), 1.2, .5);

  // Pseudostems: [base x, top y, bend]
  const stems = [[180, 70, -14], [214, 150, 10], [246, 250, 16]];
  const stemPoint = (s, f) => {
    const [x, top, bend] = s, y = 540 - (540 - top) * f;
    return [x + bend * Math.sin(f * Math.PI * .8), y];
  };
  stems.forEach((s, i) => {
    const [x, top, bend] = s;
    add(line(`M${x} 540 Q${x + bend * 1.4} ${(540 + top) / 2} ${x + bend * .6} ${top}`, 2.4), 1.4 + i * .35, 1.6);
  });

  // Leaves: long, narrow and pointed, alternating left/right up each stem
  const leaf = (x, y, ang, len, w) => {
    const r = ang * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    const P = (u, v) => `${(x + u * c - v * s).toFixed(1)} ${(y + u * s + v * c).toFixed(1)}`;
    const droop = len * .12; // tips arch slightly downward
    return `<path d="M${P(0, 0)} C${P(len * .3, -w)} ${P(len * .75, -w * .7 + droop * .5)} ${P(len, droop)} C${P(len * .75, w * .6 + droop * .5)} ${P(len * .3, w)} ${P(0, 0)} Z"
      pathLength="1" fill="rgba(31,122,77,.07)" stroke="${G}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M${P(0, 0)} Q${P(len * .5, droop * .2)} ${P(len * .96, droop * .95)}" pathLength="1" fill="none" stroke="${G}" stroke-width="1"/>`;
  };
  stems.forEach((s, si) => {
    const n = [7, 5, 4][si];
    for (let k = 0; k < n; k++) {
      const f = .28 + k * (.7 / n);
      const [x, y] = stemPoint(s, f);
      const left = (k + si) % 2 === 0;
      const len = 150 - k * 12 - si * 10, ang = left ? -152 + k * 6 : -28 - k * 6;
      add(leaf(x, y, ang, len, 17 - k), 2.6 + si * .5 + k * .38, 1.1, 'draw leafy');
    }
  });
  // Top spike leaf on each stem
  stems.forEach((s, i) => {
    const [x, y] = stemPoint(s, 1);
    add(leaf(x, y, -90 + (i - 1) * 12, 60, 8), 5 + i * .2, .9, 'draw leafy');
  });

  // Flower: short stalk from the rhizome with a cone of bracts and small flowers
  add(line('M292 548 Q296 510 300 470', 2.2), 5.2, .8);
  const bracts = [[300, 462, 16, 13], [300, 444, 14, 12], [300, 428, 12, 10], [300, 414, 9, 8]];
  bracts.forEach(([cx, cy, rx, ry], i) =>
    add(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" pathLength="1" fill="rgba(201,161,59,.25)" stroke="${BRACT}" stroke-width="1.6"/>`, 5.8 + i * .18, .6));
  [[282, 450, -30], [318, 438, 30], [286, 426, -40], [314, 418, 35]].forEach(([x, y, a], i) =>
    add(`<g transform="translate(${x} ${y}) rotate(${a})"><ellipse cx="0" cy="-9" rx="6" ry="10" fill="${GOLD}" opacity=".85"/><ellipse cx="0" cy="-6" rx="2.2" ry="4" fill="#fff" opacity=".8"/></g>`, 6.6 + i * .2, .6, 'bloom'));

  box.classList.add('plai');
  box.innerHTML = `<svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <g class="sway">${parts.join('')}</g>
    <g class="falling">
      <path d="M0 0 C10 -6 26 -4 34 0 C26 4 10 6 0 0 Z" fill="rgba(31,122,77,.15)" stroke="${G}" stroke-width="1.2" style="--x:120px;--dly:9s"/>
      <path d="M0 0 C10 -6 26 -4 34 0 C26 4 10 6 0 0 Z" fill="rgba(31,122,77,.15)" stroke="${G}" stroke-width="1.2" style="--x:-90px;--dly:15s"/>
    </g>
  </svg>`;
})();
