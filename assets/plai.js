// Line-art plai (Zingiber montanum) that grows in the hero: rhizome, shoots,
// alternating leaves, then a flower cone rising from the rhizome.
(function () {
  const box = document.getElementById('leaves');
  if (!box) return;

  const G = '#1F7A4D', GOLD = '#E3C94A', BRACT = '#8E4A5E', BRACT_FILL = '#EBCFD3';
  const parts = [];
  let t = 0; // running delay, seconds
  const add = (svg, delay, dur, cls = 'draw') => parts.push(`<g class="${cls}" style="--d:${delay}s;--t:${dur}s">${svg}</g>`);
  const line = (d, w = 2) => `<path d="${d}" pathLength="1" fill="none" stroke="${G}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Ground in cross-section: a surface line, a soil band below it and a lower
  // boundary line; the rhizome sits underground with shoots rising from it.
  const SOIL = '#B98A4E', RHIZ = '#A87A2E', RHIZ_FILL = '#F6E3A6';
  const under = []; // drawn outside the swaying group so the ground stays still
  const addU = (svg, delay, dur, cls = 'draw') => under.push(`<g class="${cls}" style="--d:${delay}s;--t:${dur}s">${svg}</g>`);
  const shape = (d, fill, stroke, w = 1.5) => `<path d="${d}" pathLength="1" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  addU(`<path d="M20 522 Q110 516 200 522 T380 521 L380 598 L20 598 Z" fill="url(#soil)"/>`, .2, .8, 'fade');
  addU(line('M20 522 Q110 516 200 522 T380 521', 1.8), 0, .8);
  addU(`<path d="M20 598 L380 598" pathLength="1" fill="none" stroke="${SOIL}" stroke-width="1.2" stroke-dasharray=".012 .01"/>`, .3, .8, 'fade');
  // soil specks
  addU([[60, 540], [96, 580], [128, 552], [338, 548], [356, 584], [312, 590], [72, 566], [120, 592], [350, 532]]
    .map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${2 + i % 3}" ry="${1.4 + i % 2}" fill="${SOIL}" opacity=".35"/>`).join(''), .6, .6, 'fade');
  // grass tufts on the surface
  addU(line('M84 519 l-4 -10 M88 519 l1 -13 M92 519 l5 -9 M334 520 l-4 -9 M338 520 l1 -12 M342 520 l5 -8', 1.2), .5, .6);

  // Rhizome: finger branches, then the main knobby body, ring-like nodes, roots
  addU(shape('M156 566 C140 570 122 582 112 578 C104 572 114 560 130 556 C140 553 152 556 160 560 Z', RHIZ_FILL, RHIZ), .7, .9, 'draw leafy');
  addU(shape('M300 572 C318 580 334 594 346 590 C354 584 346 572 330 566 C320 562 306 562 298 566 Z', RHIZ_FILL, RHIZ), .8, .9, 'draw leafy');
  addU(shape('M236 574 C234 586 226 594 218 592 C210 588 216 578 226 572 Z', RHIZ_FILL, RHIZ), .9, .8, 'draw leafy');
  addU(shape('M146 562 C144 550 156 544 170 548 C174 541 190 540 194 548 C202 544 212 543 220 549 C228 543 240 543 246 549 C256 544 268 545 274 551 C284 546 298 547 306 553 C320 555 326 566 318 573 C312 581 298 580 290 576 C280 582 264 582 256 576 C244 582 228 582 218 576 C206 582 188 582 180 576 C168 582 150 578 146 562 Z', RHIZ_FILL, RHIZ, 1.8), .6, 1.4, 'draw leafy');
  addU(`<path d="M178 549 q-5 13 1 27 M208 546 q-5 14 0 30 M238 546 q-5 14 0 30 M266 548 q-5 13 0 28 M296 551 q-4 12 1 25 M128 558 q-3 9 2 17 M326 568 q-4 9 2 17"
    pathLength="1" fill="none" stroke="${RHIZ}" stroke-width="1" opacity=".7"/>`, 1.6, .6);
  addU(`<path d="M168 580 q-3 8 -1 15 M196 581 q2 7 -1 14 M230 581 q-4 6 -2 13 M262 580 q3 7 1 14 M284 579 q-2 8 1 14 M120 580 q-4 6 -3 12 M340 591 q2 4 0 6"
    pathLength="1" fill="none" stroke="${RHIZ}" stroke-width=".8" opacity=".55"/>`, 1.9, .6);

  // Pseudostems: [base x, top y, bend]
  const stems = [[180, 70, -14], [214, 150, 10], [246, 250, 16]];
  const stemPoint = (s, f) => {
    const [x, top, bend] = s, y = 548 - (548 - top) * f;
    return [x + bend * Math.sin(f * Math.PI * .8), y];
  };
  stems.forEach((s, i) => {
    const [x, top, bend] = s;
    add(line(`M${x} 548 Q${x + bend * 1.4} ${(548 + top) / 2} ${x + bend * .6} ${top}`, 2.4), 1.4 + i * .35, 1.6);
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

  // Flower: a slender stalk from the rhizome ending in a pointed cone of
  // overlapping bracts, with small orchid-like flowers peeking out.
  add(line('M290 551 C292 520 300 494 298 450', 2), 5.2, .9);
  const rows = 8, baseY = 456, coneH = 100, scales = [];
  for (let i = 0; i < rows; i++) {
    const f = i / rows, y = baseY - f * coneH, w = 34 * (1 - f * .8), h = 22 - f * 8;
    (i % 2 ? [-w * .28, w * .28] : [0]).forEach(dx => {
      const cx = 298 + dx, hw = (i % 2 ? w * .42 : w * .5);
      scales.push([i, `<path d="M${cx - hw} ${y} Q${cx - hw} ${y - h * .8} ${cx} ${y - h} Q${cx + hw} ${y - h * .8} ${cx + hw} ${y} Q${cx} ${y + h * .35} ${cx - hw} ${y} Z"
        pathLength="1" fill="${BRACT_FILL}" stroke="${BRACT}" stroke-width="1.3" stroke-linejoin="round"/>`]);
    });
  }
  // Paint top rows first so each lower scale overlaps the one above, like a cone
  scales.sort((p, q) => q[0] - p[0]).forEach(([i, svg]) => add(svg, 5.8 + i * .12, .5, 'draw leafy'));

  // Each flower faces outward: two narrow side petals and a wide frilled lip with a yellow throat
  const flower = (x, y, a, s) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">
      <path d="M0 0 C-6 -3 -14 -4 -20 -2 C-14 1 -6 2 0 0 Z" fill="#FFF8E1" stroke="${BRACT}" stroke-width=".8"/>
      <path d="M0 0 C6 -3 14 -4 20 -2 C14 1 6 2 0 0 Z" fill="#FFF8E1" stroke="${BRACT}" stroke-width=".8"/>
      <path d="M0 0 C-9 -1 -15 -10 -13 -18 C-11 -25 -5 -27 -2 -24 C-1 -27 1 -27 2 -24 C5 -27 11 -25 13 -18 C15 -10 9 -1 0 0 Z"
        fill="#FFFDF6" stroke="${BRACT}" stroke-width=".9"/>
      <path d="M0 -2 C-4 -7 -4 -14 0 -18 C4 -14 4 -7 0 -2 Z" fill="${GOLD}"/>
      <path d="M0 -4 L0 -15" stroke="#C99A2E" stroke-width=".8"/>
    </g>`;
  [[280, 438, -62, 1], [317, 418, 58, .9], [284, 396, -48, .75]].forEach(([x, y, a, sc], i) =>
    add(flower(x, y, a, sc), 6.9 + i * .35, .7, 'bloom'));

  box.classList.add('plai');
  box.innerHTML = `<svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <defs><linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#D9C39A" stop-opacity=".55"/><stop offset="1" stop-color="#D9C39A" stop-opacity=".12"/></linearGradient>
      <linearGradient id="edge"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".18" stop-color="#fff"/><stop offset=".82" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="edges" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="600"><rect x="20" y="500" width="360" height="100" fill="url(#edge)"/></mask></defs>
    <g class="sway">${parts.join('')}</g>
    <g mask="url(#edges)">${under.join('')}</g>
    <g class="falling">
      <path d="M0 0 C10 -6 26 -4 34 0 C26 4 10 6 0 0 Z" fill="rgba(31,122,77,.15)" stroke="${G}" stroke-width="1.2" style="--x:120px;--dly:9s"/>
      <path d="M0 0 C10 -6 26 -4 34 0 C26 4 10 6 0 0 Z" fill="rgba(31,122,77,.15)" stroke="${G}" stroke-width="1.2" style="--x:-90px;--dly:15s"/>
    </g>
  </svg>`;
})();
