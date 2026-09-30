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
  const SOIL = '#B98A4E', RHIZ = '#A87A2E', RHIZ_FILL = '#EBD3A0';
  const under = []; // drawn outside the swaying group so the ground stays still
  const addU = (svg, delay, dur, cls = 'draw') => under.push(`<g class="${cls}" style="--d:${delay}s;--t:${dur}s">${svg}</g>`);
  const shape = (d, fill, stroke, w = 1.5) => `<path d="${d}" pathLength="1" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  addU(`<path d="M20 522 Q110 516 200 522 T380 521 L380 598 L20 598 Z" fill="url(#soil)"/>`, .2, .8, 'fade');
  addU(line('M20 522 Q110 516 200 522 T380 521', 1.8), 0, .8);
  // soil specks
  addU([[60, 540], [96, 580], [128, 552], [338, 548], [356, 584], [312, 590], [72, 566], [120, 592], [350, 532]]
    .map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${2 + i % 3}" ry="${1.4 + i % 2}" fill="${SOIL}" opacity=".35"/>`).join(''), .6, .6, 'fade');
  // grass tufts on the surface
  addU(line('M84 519 l-4 -10 M88 519 l1 -13 M92 519 l5 -9 M334 520 l-4 -9 M338 520 l1 -12 M342 520 l5 -8', 1.2), .5, .6);

  // Rhizome: one hand-drawn outline with uneven knuckles and fingers; shoots
  // rise from the knobs. Roots go first so the rhizome sits on top of them.
  addU(`<path d="M168 582 C160 588 150 590 140 597 M178 584 C176 590 170 595 168 600 M204 585 C206 591 202 596 204 601 M236 582 C232 590 234 595 228 601 M270 590 C270 595 266 598 264 602 M150 590 C142 592 132 590 124 594"
    pathLength="1" fill="none" stroke="${RHIZ}" stroke-width=".9" stroke-linecap="round" opacity=".6"/>`, 1.8, .7);
  // A plump main rhizome with slimmer daughter fingers branching off it in
  // different directions. Each finger is a slightly swollen, tapering capsule
  // with a few rings across it; the main piece is drawn last so it covers the
  // bases of the fingers growing from it.
  const finger = (x1, y1, x2, y2, w1, w2, rings = [.45, .75]) => {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const P = (t, v) => `${(x1 + dx * t + nx * v).toFixed(1)} ${(y1 + dy * t + ny * v).toFixed(1)}`;
    const wm = Math.max(w1, w2) * 1.12; // gentle swelling in the middle
    // A(u, v): u pixels along the finger, v across it (for the rounded ends)
    const A = (u, v) => `${(x1 + ux * u + nx * v).toFixed(1)} ${(y1 + uy * u + ny * v).toFixed(1)}`;
    const k = .55; // cubic approximation of a quarter circle
    const body = `M${P(0, w1)} C${P(.35, wm)} ${P(.75, w2 * 1.05)} ${P(1, w2)}
      C${A(L + k * w2, w2)} ${A(L + w2, k * w2)} ${A(L + w2, 0)} C${A(L + w2, -k * w2)} ${A(L + k * w2, -w2)} ${P(1, -w2)}
      C${P(.75, -w2 * 1.05)} ${P(.35, -wm)} ${P(0, -w1)}
      C${A(-k * w1, -w1)} ${A(-w1, -k * w1)} ${A(-w1, 0)} C${A(-w1, k * w1)} ${A(-k * w1, w1)} ${P(0, w1)} Z`;
    const ring = rings.map(t => { const w = (w1 + (w2 - w1) * t) * .95; return `M${P(t, w)} Q${P(t + .04, 0)} ${P(t, -w)}`; }).join(' ');
    return `<path d="${body}" pathLength="1" fill="url(#rhiz)" stroke="${RHIZ}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="${ring}" pathLength="1" fill="none" stroke="${RHIZ}" stroke-width=".8" stroke-linecap="round" opacity=".5"/>`;
  };
  [
    [172, 576, 138, 590, 8, 6, [.5]],            // small finger, down-left
    [236, 578, 262, 594, 7, 5, [.55]],           // small finger, down-right
    [250, 564, 318, 538, 11, 8, [.35, .6, .82]], // daughter rhizome, up-right
    [290, 552, 296, 540, 7, 5, []],              // bud under the flower stalk
    [182, 560, 184, 545, 9, 7, []],              // knobs the shoots rise from
    [214, 558, 216, 543, 9, 7, []],
    [252, 562, 252, 547, 7, 6, []],
    [160, 570, 262, 566, 16, 13, [.22, .45, .7]] // main rhizome
  ].forEach((f, i) => addU(finger(...f), .6 + i * .12, .8, 'draw leafy'));
  // the cut tip of the small left finger shows the yellow flesh
  addU(`<ellipse cx="134" cy="592" rx="4.5" ry="6" transform="rotate(-24 134 592)" fill="#F4C542" stroke="${RHIZ}" stroke-width="1.1"/>`, 1.7, .4, 'fade');

  // Pseudostems: [base x, top y, bend]
  const stems = [[180, 70, -14], [214, 150, 10]];
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
    const n = [7, 5][si];
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

  // Young shoot beside the flower: a short rolled spear just out of the soil,
  // one leaf starting to unfurl
  add(line('M250 548 C250 530 251 512 252 496', 2.2), 2, .8);
  add(`<path d="M246 504 C247 488 250 472 253 458 C256 472 258 488 258 504 C256 500 248 500 246 504 Z"
    pathLength="1" fill="rgba(31,122,77,.12)" stroke="${G}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M252 500 L253 466" pathLength="1" fill="none" stroke="${G}" stroke-width=".9"/>`, 2.6, .8, 'draw leafy');
  add(leaf(252, 502, -40, 34, 7), 3.2, .8, 'draw leafy');

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
      <linearGradient id="rhiz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FAEDC8"/><stop offset="1" stop-color="#E6CB8E"/></linearGradient>
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
