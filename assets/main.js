// Shared behaviour for every page: header/footer, content rendering from
// data.js, and interactive effects.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hoverable = matchMedia('(hover: hover)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const page = document.body.dataset.page;

/* ---------- Google Sheets ---------- */
// Parses CSV text (handles quoted fields, commas and line breaks inside quotes).
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head = [], ...data] = rows;
  const keys = head.map(h => h.trim());
  return data.filter(r => r.some(v => v.trim())).map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

const yes = v => /^(1|y|yes|true|ใช่|แสดง|✓|x)$/i.test(String(v).trim());
const shown = r => !('show' in r) || r.show === '' || yes(r.show);
const paras = v => String(v).split(/\n\s*\n|\n/).map(x => x.trim()).filter(Boolean);
const driveImg = url => {
  // Turn a Google Drive share link into a direct image link.
  const m = String(url).match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
  return m ? `https://lh3.googleusercontent.com/d/${m[1]}` : url;
};

async function loadSheets() {
  if (!SHEET_ID) return;
  const url = tab => `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  const get = tab => fetch(url(tab)).then(r => r.ok ? r.text() : Promise.reject()).then(parseCSV).catch(() => null);
  const [settings, products, news, articles, history, herbs] = await Promise.all(['settings', 'products', 'news', 'articles', 'history', 'herbs'].map(get));

  if (settings) settings.forEach(r => { if (r.key && r.value) SITE[r.key] = r.value; });
  if (products?.length) PRODUCTS = products.filter(shown).map((r, i) => ({
    ...r, id: r.id || 'p' + i, price: r.price, featured: yes(r.featured),
    icon: r.icon || '🌿', color: r.color || '#EEF5E6', image: r.image ? driveImg(r.image) : ''
  }));
  if (news?.length) NEWS = news.filter(shown).map((r, i) => ({
    ...r, id: r.id || 'n' + i, slide: yes(r.slide), body: paras(r.body), image: r.image ? driveImg(r.image) : ''
  }));
  if (articles?.length) ARTICLES = articles.filter(shown).map((r, i) => ({
    ...r, id: r.id || 'k' + i, body: paras(r.body), icon: r.icon || '📖', image: r.image ? driveImg(r.image) : ''
  }));
  if (history?.length) HISTORY = history.filter(shown).filter(r => r.year || r.text)
    .map(r => ({ ...r, image: r.image ? driveImg(r.image) : '' }));
  if (herbs?.length) HERBS = herbs.filter(shown).filter(r => r.name);
}

(async function start() {
  /* ---------- Header & footer ---------- */
  const NAV = [
    ['index', 'index.html', 'หน้าแรก'],
    ['about', 'about.html', 'เกี่ยวกับเรา'],
    ['products', 'products.html', 'ผลิตภัณฑ์'],
    ['farmers', 'farmers.html', 'รับซื้อสมุนไพร'],
  ['knowledge', 'knowledge.html', 'ความรู้'],
    ['news', 'news.html', 'ข่าวสาร'],
    ['contact', 'contact.html', 'ติดต่อ']
  ];

  $('#site-header').outerHTML = `
  <header>
    <div class="wrap bar">
      <a href="index.html" class="brand">
        <img src="assets/logo-center.png" alt="ศูนย์แพทย์แผนไทยพนา">
        <span>พนาพรรณ</span>
      </a>
      <nav>
        <button class="menu-btn" aria-label="เมนู">☰</button>
        <ul>${NAV.map(([id, href, label]) =>
          `<li><a href="${href}"${id === page ? ' class="active" aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul>
      </nav>
    </div>
  </header>`;

  await loadSheets();

  /* ---------- Footer ---------- */
  $('#site-footer').outerHTML = `
  <footer>
    <div class="wrap">
      <div class="foot">
        <div>
          <div class="logos">
            <img src="assets/logo-center.png" alt="ศูนย์แพทย์แผนไทยพนา">
            <img src="assets/logo-hospital.png" alt="โรงพยาบาลพนา">
          </div>
          <p>โรงงานผลิตยาสมุนไพร ศูนย์แพทย์แผนไทยพนา<br>โรงพยาบาลพนา อ.พนา จ.อำนาจเจริญ</p>
        </div>
        <div>
          <h4>ติดต่อ</h4>
          <p>โทร ${esc(SITE.phone)}<br>LINE ${esc(SITE.line)}</p>
          <a href="https://www.panthaiphana.org" target="_blank" rel="noopener">panthaiphana.org</a>
        </div>
        <div>
          <h4>เจ้าหน้าที่</h4>
          <a class="staff" href="${esc(SITE.staffUrl)}" target="_blank" rel="noopener">🔒 สำหรับเจ้าหน้าที่</a>
        </div>
      </div>
      <div class="copy">© 2569 พนาพรรณ · Since 2536 PHANA PROJECT</div>
    </div>
  </footer>
  <a class="line-fab" href="${esc(SITE.lineUrl)}" target="_blank" rel="noopener" aria-label="LINE">💬<span> LINE</span></a>`;

  $('.menu-btn').onclick = () => $('nav ul').classList.toggle('open');
  const header = $('header');
  addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 10), { passive: true });

  /* ---------- Templates ---------- */
  const thumb = (p, span) => p.image
    ? `<div class="thumb" style="background:${esc(p.color)} url(${esc(p.image)}) center/cover"></div>`
    : `<div class="thumb" style="background:${esc(p.color)}">${span ? `<span>${esc(p.icon)}</span>` : esc(p.icon)}</div>`;

  const productCard = p => `
    <article class="card" data-id="${esc(p.id)}" tabindex="0">
      ${thumb(p, true)}
      <div class="body">
        <span class="tag">${esc(p.cat)}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <div class="row-between"><div class="price">฿${esc(p.price)}</div><div class="more">ดูรายละเอียด →</div></div>
      </div>
    </article>`;

  const pic = (item, fallback) => item.image
    ? `style="background-image:url(${esc(item.image)});background-position:${esc(item.imagePos || 'center')}"`
    : `style="background:${fallback}"`;

  const postRow = (item, type) => `
    <a class="post" href="article.html?type=${type}&id=${esc(item.id)}">
      <div class="pic" ${pic(item, type === 'news' ? 'linear-gradient(120deg,#2FA67A,#EFD84E)' : 'var(--green-soft)')}>${item.image ? '' : esc(item.icon || '📢')}</div>
      <div>
        <div class="meta"><span class="tag">${esc(item.tag)}</span>${item.date ? esc(item.date) : `อ่าน ${esc(item.read)} นาที`}</div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.summary)}</p>
      </div>
    </a>`;

  const listItem = (item, type) => `
    <li><small>${esc(item.date || item.tag)}</small><a href="article.html?type=${type}&id=${esc(item.id)}">${esc(item.title)}</a></li>`;

  /* ---------- Product modal ---------- */
  function openProduct(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    let m = $('#modal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'modal'; m.className = 'modal';
      m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
      document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('.close')) m.classList.remove('open'); });
      addEventListener('keydown', e => { if (e.key === 'Escape') m.classList.remove('open'); });
    }
    m.innerHTML = `
      <div class="box">
        <button class="close" aria-label="ปิด">✕</button>
        ${thumb(p)}
        <div class="body">
          <span class="tag">${esc(p.cat)}</span>
          <h3>${esc(p.name)}</h3>
          <div class="price">฿${esc(p.price)} <small style="color:var(--muted);font-weight:400;font-size:15px">/ ${esc(p.unit)}</small></div>
          <dl>
            <dt>สรรพคุณ</dt><dd>${esc(p.desc)}</dd>
            <dt>วิธีใช้</dt><dd>${esc(p.use)}</dd>
            <dt>ข้อควรระวัง</dt><dd>${esc(p.warn)}</dd>
          </dl>
          <a class="btn btn-primary" style="margin-top:24px" href="${esc(SITE.lineUrl)}" target="_blank" rel="noopener">สอบถาม / สั่งซื้อทาง LINE</a>
        </div>
      </div>`;
    requestAnimationFrame(() => m.classList.add('open'));
    $('.close', m).focus();
  }
  document.addEventListener('click', e => {
    const c = e.target.closest('.card[data-id]');
    if (c) openProduct(c.dataset.id);
  });
  document.addEventListener('keydown', e => {
    const c = e.target.closest?.('.card[data-id]');
    if (c && e.key === 'Enter') openProduct(c.dataset.id);
  });

  /* ---------- Page content ---------- */
  const fill = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

  fill('#featured', PRODUCTS.filter(p => p.featured).map(productCard).join(''));
  fill('#home-news', NEWS.slice(0, 3).map(n => listItem(n, 'news')).join(''));
  fill('#home-knowledge', ARTICLES.slice(0, 3).map(a => listItem(a, 'knowledge')).join(''));
  fill('#timeline', HISTORY.map(h => `
    <li><b>${esc(h.year)}</b><p>${esc(h.text)}</p>${h.image ? `<img src="${esc(h.image)}" alt="${esc(h.text)}" loading="lazy">` : ''}</li>`).join(''));
  fill('#news-list', NEWS.map(n => postRow(n, 'news')).join(''));

  // Products: category chips + search
  const grid = $('#product-grid');
  if (grid) {
    const cats = ['ทั้งหมด', ...new Set(PRODUCTS.map(p => p.cat))];
    let cat = 'ทั้งหมด', q = '';
    const draw = () => {
      const list = PRODUCTS.filter(p => (cat === 'ทั้งหมด' || p.cat === cat) &&
        (p.name + p.desc).toLowerCase().includes(q.toLowerCase()));
      grid.innerHTML = list.map(productCard).join('');
      $('#empty').hidden = list.length > 0;
      bindTilt();
    };
    $('#chips').innerHTML = cats.map(c => `<button class="chip${c === cat ? ' on' : ''}">${esc(c)}</button>`).join('');
    $('#chips').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      cat = b.textContent;
      $('#chips').querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
      draw();
    });
    $('#search').addEventListener('input', e => { q = e.target.value.trim(); draw(); });
    draw();
  }

  // Knowledge: tag chips
  const alist = $('#article-list');
  if (alist) {
    const tags = ['ทั้งหมด', ...new Set(ARTICLES.map(a => a.tag))];
    const draw = t => { alist.innerHTML = ARTICLES.filter(a => t === 'ทั้งหมด' || a.tag === t).map(a => postRow(a, 'knowledge')).join(''); };
    $('#tag-chips').innerHTML = tags.map((t, i) => `<button class="chip${i ? '' : ' on'}">${esc(t)}</button>`).join('');
    $('#tag-chips').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      $('#tag-chips').querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
      draw(b.textContent);
    });
    draw('ทั้งหมด');
  }

  // Article detail
  const art = $('#article');
  if (art) {
    const qs = new URLSearchParams(location.search);
    const type = qs.get('type') === 'knowledge' ? 'knowledge' : 'news';
    const item = (type === 'news' ? NEWS : ARTICLES).find(x => x.id === qs.get('id'));
    const backHref = type === 'news' ? 'news.html' : 'knowledge.html';
    const backLabel = type === 'news' ? 'ข่าวสาร' : 'คลังความรู้';
    $('#crumb').innerHTML = `<a href="index.html">หน้าแรก</a> / <a href="${backHref}">${backLabel}</a>`;
    if (!item) {
      $('#a-title').textContent = 'ไม่พบเนื้อหา';
      art.innerHTML = `<p>เนื้อหานี้อาจถูกลบหรือย้ายไปแล้ว</p><a class="back" href="${backHref}">← กลับไปหน้า${backLabel}</a>`;
    } else {
      document.title = `${item.title} | พนาพรรณ`;
      $('#a-title').textContent = item.title;
      $('#a-meta').innerHTML = `<span class="tag">${esc(item.tag)}</span>${item.date ? esc(item.date) : `อ่าน ${esc(item.read)} นาที`}`;
      art.innerHTML = `
        <div class="cover" ${pic(item, type === 'news' ? 'linear-gradient(120deg,#2FA67A,#EFD84E)' : 'var(--green-soft)')}>${item.image ? '' : esc(item.icon || '📢')}</div>
        ${item.body.map(p => `<p>${esc(p)}</p>`).join('')}
        <a class="back" href="${backHref}">← กลับไปหน้า${backLabel}</a>`;
    }
  }

  // Herb buying prices (farmers page)
  const hbody = $('#h-body');
  if (hbody) {
    const pct = k => parseFloat(SITE[k]) || 0;
    // Round down to the nearest 0.5 baht, as in the buying price sheet
    const half = v => Math.floor(v * 2 + 1e-9) / 2;
    const money = v => v.toLocaleString('th-TH', { minimumFractionDigits: v % 1 ? 1 : 0, maximumFractionDigits: 1 });
    const bonus = { normal: 0, gap: pct('gapBonus'), organic: pct('organicBonus') };
    const isOpen = h => !/ปิด|งด|หยุด|no|closed/i.test(h.status || '');
    let type = 'normal', q = '', onlyOpen = false;
    $('#h-updated').textContent = SITE.herbsUpdated || '-';
    $('#h-gap').textContent = `+${bonus.gap}%`;
    $('#h-org').textContent = `+${bonus.organic}%`;
    const draw = () => {
      const m = 1 + bonus[type] / 100;
      const list = HERBS.filter(h => (!onlyOpen || isOpen(h)) && (h.name + h.code).includes(q));
      hbody.innerHTML = list.map(h => {
        const a = parseFloat(String(h.price).replace(/,/g, '')) || 0;
        const g = [a, half(a * pct('gradeB') / 100), half(a * pct('gradeC') / 100)].map(v => money(half(v * m)));
        const open = isOpen(h);
        return `<tr class="${open ? '' : 'closed'}">
          <td data-l="รหัส">${esc(h.code)}</td><td data-l="รายการ" class="name">${esc(h.name)}</td><td data-l="หน่วย">${esc(h.unit || 'kg')}</td>
          <td data-l="เกรด A" class="num a">${g[0]}</td><td data-l="เกรด B" class="num">${g[1]}</td><td data-l="เกรด C" class="num">${g[2]}</td>
          <td data-l="สถานะ"><span class="status ${open ? 'on' : 'off'}">${esc(h.status || 'เปิดรับ')}</span></td></tr>`;
      }).join('');
      $('#h-empty').hidden = list.length > 0;
    };
    $('#h-type').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      type = b.dataset.type;
      $('#h-type').querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
      draw();
    });
    $('#h-search').addEventListener('input', e => { q = e.target.value.trim(); draw(); });
    $('#h-open').addEventListener('change', e => { onlyOpen = e.target.checked; draw(); });
    $('#h-tel').href = 'tel:' + SITE.phone.replace(/[^0-9+]/g, '');
    $('#h-line').href = SITE.lineUrl;
    draw();
  }

  // Contact details
  fill('#c-phone', esc(SITE.phone));
  fill('#c-line', esc(SITE.line));
  fill('#c-email', esc(SITE.email));
  fill('#c-address', esc(SITE.address));
  fill('#c-hours', esc(SITE.hours));
  const tel = $('#c-phone-link'); if (tel) tel.href = 'tel:' + SITE.phone.replace(/[^0-9+]/g, '');
  const lineLink = $('#c-line-link'); if (lineLink) lineLink.href = SITE.lineUrl;
  const mail = $('#c-email-link'); if (mail) mail.href = 'mailto:' + SITE.email;
  const mapLink = $('#c-map-link'); if (mapLink) mapLink.href = SITE.mapUrl || 'https://maps.google.com/?q=' + encodeURIComponent(SITE.mapQuery);
  const map = $('#map'); if (map) map.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(SITE.mapQuery) + '&output=embed';

  /* ---------- Slider (home) ---------- */
  const slider = $('#slider');
  if (slider) {
    slider.insertAdjacentHTML('afterbegin', NEWS.filter(n => n.slide).map(n => `
      <a class="slide" href="article.html?type=news&id=${esc(n.id)}" style="${n.image
        ? `background-image:url(${esc(n.image)});background-position:${esc(n.imagePos || 'right bottom')}`
        : 'background-image:linear-gradient(120deg,#2FA67A,#BFD78E 55%,#EFD84E)'}">
        <div class="bg"></div>
        <div class="txt"><small>${esc(n.tag)}</small><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p></div>
      </a>`).join(''));
    const slides = [...slider.querySelectorAll('.slide')];
    const dotsBox = $('.dots', slider);
    const bar = $('.progress', slider);
    let cur = 0, timer;
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `สไลด์ ${i + 1}`);
      b.onclick = () => go(i);
      dotsBox.appendChild(b);
    });
    const dots = [...dotsBox.children];
    function go(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, j) => s.classList.toggle('active', j === cur));
      dots.forEach((d, j) => d.classList.toggle('on', j === cur));
      bar.classList.remove('run'); void bar.offsetWidth;
      if (!reduce) bar.classList.add('run');
      clearTimeout(timer);
      if (!reduce) timer = setTimeout(() => go(cur + 1), 6000);
    }
    $('.s-prev', slider).onclick = () => go(cur - 1);
    $('.s-next', slider).onclick = () => go(cur + 1);
    let x0 = null;
    slider.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    slider.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    go(0);
  }

  /* ---------- Effects ---------- */
  function bindTilt() {
    if (reduce || !hoverable) return;
    document.querySelectorAll('.card:not([data-tilt])').forEach(c => {
      c.dataset.tilt = 1;
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        c.style.transform = `perspective(800px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-4px)`;
      });
      c.addEventListener('mouseleave', () => c.style.transform = '');
    });
  }
  bindTilt();

  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();
