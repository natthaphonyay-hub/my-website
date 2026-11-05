// Research summaries listed on the knowledge page (#research-list, full rows)
// and the home page (#home-research, compact rows above the articles).
// research/index.js names the pages (window.RESEARCH_LIST); each page's own data
// file supplies its title and quick answer, so nothing is written twice.
(function () {
  const VERSION = '20261105v';
  const full = document.getElementById('research-list');
  const compact = document.getElementById('home-research');
  const ids = (window.RESEARCH_LIST || []).filter(id => /^[a-z0-9-]{2,60}$/.test(id));
  if ((!full && !compact) || !ids.length) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const trial = d => d.status !== 'published' ? '<span class="rl-trial">ฉบับทดลอง</span>' : '';

  const load = id => new Promise(done => {
    const s = document.createElement('script');
    s.src = `research/${id}.js?v=${VERSION}`;
    s.onload = s.onerror = () => done();
    document.head.appendChild(s);
  });

  Promise.all(ids.map(load)).then(() => {
    const pages = ids.map(id => [id, (window.RESEARCH_PAGES || {})[id]]).filter(([, d]) => d);
    if (!pages.length) return;
    const href = id => `research.html?id=${encodeURIComponent(id)}`;
    if (full) {
      full.querySelector('.rl-list').innerHTML = pages.map(([id, d]) => {
        const s0 = (d.summary || [])[0] || {};
        return `<li><a class="rl-item" href="${href(id)}">
          <span class="rl-meta"><span class="tag">${esc(d.tag)}</span>${esc(d.herb)}${trial(d)}</span>
          <b>${esc(d.title)}</b>
          ${s0.em ? `<span class="rl-answer"><strong>${esc(s0.em)}</strong> ${esc(s0.a)}</span>` : ''}
        </a></li>`;
      }).join('');
      full.hidden = false;
    }
    if (compact) {
      compact.innerHTML = pages.slice(0, 3).map(([id, d]) =>
        `<li><small>สรุปงานวิจัย${trial(d)}</small><a href="${href(id)}">${esc(d.title)}</a></li>`).join('');
    }
  });
})();
