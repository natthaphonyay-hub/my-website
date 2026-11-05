// Research one-page summaries.
// research.html?id=<id> loads research/<id>.js, which registers its content in
// window.RESEARCH_PAGES[<id>]. All text is escaped; references are numbers that
// point into the page's own reference list. Data format: research/README.md
(function () {
  const VERSION = '20261105z';
  const root = document.getElementById('rp');
  if (!root) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const id = (new URLSearchParams(location.search).get('id') || '').toLowerCase();

  const fail = () => {
    document.getElementById('rp-title').textContent = 'ไม่พบสรุปงานวิจัยนี้';
    root.innerHTML = '<p>เนื้อหานี้อาจถูกย้ายหรือยังไม่เผยแพร่</p><a class="back" href="knowledge.html">← กลับไปหน้าคลังความรู้</a>';
  };
  if (!/^[a-z0-9-]{2,60}$/.test(id)) return fail();
  const s = document.createElement('script');
  s.src = `research/${id}.js?v=${VERSION}`;
  s.onload = () => { const d = (window.RESEARCH_PAGES || {})[id]; d ? render(d) : fail(); };
  s.onerror = fail;
  document.head.appendChild(s);

  // Superscript reference numbers, linked to the list at the bottom.
  const sup = refs => (refs && refs.length)
    ? `<sup class="rp-ref">${refs.map(n => `<a href="#rp-r${n}" aria-label="อ้างอิงที่ ${n}">${n}</a>`).join(',')}</sup>` : '';
  const thNum = (v, dp = 2) => Number(v).toLocaleString('th-TH', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  const list = (items, cls = '') => `<ul${cls ? ` class="${cls}"` : ''}>${items.map(x => `<li>${esc(x.text)}${sup(x.refs)}</li>`).join('')}</ul>`;

  // Words come from the page data: effect-size bands use the thresholds the
  // review itself states, consistency uses its I² thresholds. A confidence
  // interval that crosses zero always reads as "not clear".
  const sizeOf = (r, f) => {
    if (r.lo <= 0 && r.hi >= 0) return { word: f.unclearWord, cls: 'wu' };
    if (r.est < 0) return { word: f.harmWord, cls: 'wh' };
    const i = Math.max(f.bands.filter(b => r.est >= b.from).length - 1, 0);
    return { word: f.bands[i].word, cls: `w${i}` };
  };
  const consistency = (i2, rules) => rules.filter(r => i2 >= r.from).pop() || rules[0];

  function forest(f) {
    const [min, max] = f.axis;
    const at = v => (Math.min(Math.max(v, min), max) - min) / (max - min) * 100;
    const pct = v => `${at(v).toFixed(2)}%`;
    const zones = f.bands.map((b, i) => {
      const from = Math.max(b.from, 0), to = f.bands[i + 1] ? f.bands[i + 1].from : max;
      return `<span class="rp-zone z${i}" style="left:${pct(from)};width:${(at(to) - at(from)).toFixed(2)}%"></span>`;
    }).join('');
    const rows = f.rows.map(r => {
      const size = sizeOf(r, f);
      const said = `${r.label}: ${size.word} ขนาดผล ${thNum(r.est)} ช่วงความเชื่อมั่น 95% ${thNum(r.lo)} ถึง ${thNum(r.hi)}`;
      return `<li class="rp-row">
        <div class="rp-row-txt"><b>${esc(r.label)}</b><span class="rp-word ${size.cls}">${esc(size.word)}</span><small>${esc(r.people)}</small></div>
        <div class="rp-track" role="img" aria-label="${esc(said)}">
          ${zones}
          <span class="rp-zero" style="left:${pct(0)}"></span>
          <span class="rp-ci" style="left:${pct(r.lo)};width:${(at(r.hi) - at(r.lo)).toFixed(2)}%"></span>
          <span class="rp-dot" style="left:${pct(r.est)}"></span>
        </div>
      </li>`;
    }).join('');
    const ticks = (f.ticks || [0, ...f.bands.filter(b => b.from > 0).map(b => b.from)])
      .map(v => `<span style="left:${pct(v)}">${v === 0 ? '0' : thNum(v, 1)}</span>`).join('');
    // I² is left out when the source does not report it for that row (network meta-analysis, abstract only)
    const numbers = f.rows.map(r => `<li>${esc(r.label)} ${thNum(r.est)} (${thNum(r.lo)} ถึง ${thNum(r.hi)})${r.i2 == null ? '' : ` ${esc(consistency(r.i2, f.consistency).word)}`}</li>`).join('');
    return `<figure class="rp-forest">
      <ul class="rp-rows">${rows}</ul>
      <div class="rp-axis" aria-hidden="true">
        <div class="rp-ticks">${ticks}</div>
        <div class="rp-axis-words"><span>${esc(f.axisLabels[0])}</span><span>${esc(f.axisLabels[1])}</span></div>
      </div>
    </figure>
    <details class="rp-more rp-how">
      <summary>อ่านกราฟนี้อย่างไร</summary>
      <p>${esc(f.howToRead)}</p>
      <ul class="rp-tight">${numbers}</ul>
      ${(f.notes || []).map(n => `<p>${esc(n.text)}${sup(n.refs)}</p>`).join('')}
    </details>`;
  }

  // Results without one shared scale (ratios, scores in different units, trials
  // the review did not pool) are answer rows instead of a chart: a coloured word,
  // who it was measured in, one line of context, and optionally "n in 100 people".
  const TONE = { better: 'w2', similar: 'w0', unclear: 'wu', worse: 'wh' };
  function points(f) {
    const per100 = bars => `<div class="rp-p100" role="img" aria-label="${esc(bars.map(b => `${b.name} ${b.n} ใน 100 คน`).join(' '))}">
      ${bars.map((b, i) => `<div class="rp-p100-row${i ? ' is-ref' : ''}"><span>${esc(b.name)}</span><span class="rp-p100-bar"><i style="width:${Math.min(Math.max(Number(b.n) || 0, 0), 100)}%"></i></span><b>${esc(b.n)}<small> ใน 100</small></b></div>`).join('')}
    </div>`;
    const rows = f.points.map(p => `<li class="rp-row rp-pt">
        <div class="rp-row-txt"><b>${esc(p.label)}</b><span class="rp-word ${TONE[p.tone] || 'w0'}">${esc(p.word)}</span><small>${esc(p.people)}</small></div>
        <div class="rp-pt-body">${p.text ? `<p>${esc(p.text)}${sup(p.refs)}</p>` : ''}${p.per100 ? per100(p.per100) : ''}</div>
      </li>`).join('');
    const numbers = f.points.filter(p => p.stat).map(p => `<li>${esc(p.label)}: ${esc(p.stat)}</li>`).join('');
    return `<ul class="rp-rows rp-points">${rows}</ul>
    <details class="rp-more rp-how">
      <summary>อ่านผลนี้อย่างไร</summary>
      <p>${esc(f.howToRead)}</p>
      ${numbers ? `<ul class="rp-tight">${numbers}</ul>` : ''}
      ${(f.notes || []).map(n => `<p>${esc(n.text)}${sup(n.refs)}</p>`).join('')}
    </details>`;
  }

  // Plain meanings shown under the summary box when the page uses the word (พี่ขอ 2026-11-05).
  // ยาหลอก: from NCI Dictionary of Cancer Terms "placebo", put in our own plain Thai.
  const GLOSSARY = [
    ['ยาหลอก', 'คือ ยาที่หน้าตาและวิธีใช้เหมือนยาจริง แต่ไม่มีตัวยา งานวิจัยใช้เทียบเพื่อดูว่ายาจริงได้ผลมากกว่าหรือไม่']
  ];

  function render(d) {
    document.title = `${d.title} | พนาพรรณ`;
    const shown = JSON.stringify([d.summary, d.findings.heading, d.findings.sub, d.findings.points || d.findings.rows]);
    const gloss = GLOSSARY.filter(([term]) => shown.includes(term));
    const s0 = d.summary[0];
    document.querySelector('meta[name="description"]')?.setAttribute('content', `${s0.em} ${s0.a}`);
    document.getElementById('rp-title').textContent = d.title;
    document.getElementById('rp-dek').remove();
    document.getElementById('rp-meta').innerHTML =
      `<span class="tag">${esc(d.tag)}</span><span>${esc(d.herb)}${d.scientific ? ` <i lang="la">${esc(d.scientific)}</i>` : ''}</span>`;

    const sf = d.safety;
    root.innerHTML = `
      ${d.status !== 'published' ? `<p class="rp-draft" role="note">${esc(d.statusNote)}</p>` : ''}
      <section class="rp-summary" aria-labelledby="rp-summary-h">
        <h2 id="rp-summary-h">สรุปสั้น</h2>
        <dl>${d.summary.map(r => `<div><dt${r.tone === 'no' ? ' class="rp-no"' : ''}>${esc(r.q)}</dt><dd><b>${esc(r.em)}</b> ${esc(r.a)}${sup(r.refs)}</dd></div>`).join('')}</dl>
        ${gloss.map(([term, meaning]) => `<p class="rp-gloss"><b>${esc(term)}</b> ${esc(meaning)}</p>`).join('')}
      </section>
      <section class="rp-findings">
        <h2>${esc(d.findings.heading)}</h2>
        <p class="rp-sub">${esc(d.findings.sub)}${sup(d.findings.subRefs)}</p>
        ${d.findings.points ? points(d.findings) : forest(d.findings)}
      </section>
      <section class="rp-safety" aria-labelledby="rp-safety-h">
        <h2 id="rp-safety-h">ความปลอดภัย</h2>
        ${[].concat(sf.frequency || []).map(f => `<p class="rp-freq">${esc(f.text)}${sup(f.refs)}</p>`).join('')}
        <div class="rp-cols">
          <div><h3 class="rp-no">ห้ามใช้${sup(sf.avoidRefs)}</h3>${list(sf.avoid, 'rp-tight')}</div>
          <div><h3>ระวัง${sup(sf.cautionRefs)}</h3>${list(sf.caution, 'rp-tight')}</div>
        </div>
      </section>
      <section class="rp-extra" aria-label="อ่านเพิ่มเติม">
        ${d.more.map(m => `<details class="rp-more">
          <summary>${esc(m.title)}</summary>
          ${m.text ? `<p>${esc(m.text)}${sup(m.refs)}</p>` : ''}
          ${m.list ? list(m.list, 'rp-tight') : ''}
        </details>`).join('')}
      </section>
      <section class="rp-end">
        <p class="rp-disclaimer">${esc(d.disclaimer)}</p>
        <p class="rp-credit">${esc(d.credit)}</p>
        <details class="rp-more rp-sources">
          <summary>อ้างอิง ${d.references.length} รายการ</summary>
          <ol class="rp-refs">${d.references.map((r, i) => `<li id="rp-r${i + 1}">${esc(r.text)}${/^https:\/\//.test(r.url || '') ? ` <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.urlLabel || r.url)}</a>` : ''}${r.note ? ` <small>${esc(r.note)}</small>` : ''}</li>`).join('')}</ol>
        </details>
        <div class="rp-actions">
          <button type="button" class="rp-print">พิมพ์หรือบันทึกเป็น PDF</button>
          <a class="back" href="knowledge.html">← กลับไปหน้าคลังความรู้</a>
        </div>
      </section>`;
    root.querySelector('.rp-print').addEventListener('click', () => print());
    // References stay folded; a superscript click, a #rp-rN link or printing opens them.
    const src = root.querySelector('.rp-sources');
    root.addEventListener('click', e => { if (e.target.closest('.rp-ref a')) src.open = true; });
    if (/^#rp-r\d+$/.test(location.hash)) { src.open = true; document.querySelector(location.hash)?.scrollIntoView(); }
    addEventListener('beforeprint', () => { src.dataset.was = src.open; src.open = true; });
    addEventListener('afterprint', () => { src.open = src.dataset.was === 'true'; });
  }
})();
