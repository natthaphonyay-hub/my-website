// "สรุปงานวิจัย" list on the knowledge page.
// research/index.js names the pages (window.RESEARCH_LIST); each page's own data
// file supplies its title and quick answer, so nothing is written twice.
(function () {
  const VERSION = '20261105u';
  const box = document.getElementById('research-list');
  const ids = (window.RESEARCH_LIST || []).filter(id => /^[a-z0-9-]{2,60}$/.test(id));
  if (!box || !ids.length) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const load = id => new Promise(done => {
    const s = document.createElement('script');
    s.src = `research/${id}.js?v=${VERSION}`;
    s.onload = s.onerror = () => done();
    document.head.appendChild(s);
  });

  Promise.all(ids.map(load)).then(() => {
    const pages = ids.map(id => [id, (window.RESEARCH_PAGES || {})[id]]).filter(([, d]) => d);
    if (!pages.length) return;
    box.querySelector('.rl-list').innerHTML = pages.map(([id, d]) => {
      const s0 = (d.summary || [])[0] || {};
      return `<li><a class="rl-item" href="research.html?id=${encodeURIComponent(id)}">
        <span class="rl-meta"><span class="tag">${esc(d.tag)}</span>${esc(d.herb)}${d.status !== 'published' ? '<span class="rl-trial">ฉบับทดลอง</span>' : ''}</span>
        <b>${esc(d.title)}</b>
        ${s0.em ? `<span class="rl-answer"><strong>${esc(s0.em)}</strong> ${esc(s0.a)}</span>` : ''}
      </a></li>`;
    }).join('');
    box.hidden = false;
  });
})();
