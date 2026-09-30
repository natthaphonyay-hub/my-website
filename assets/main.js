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

// Fetches every tab as raw rows. Returns null when the sheet can't be reached.
async function fetchSheets() {
  const url = (id, tab) => `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;
  const get = (id, tab) => !id ? Promise.resolve(null)
    : fetch(url(id, tab), { cache: 'no-store' }).then(r => r.ok ? r.text() : Promise.reject()).then(parseCSV).catch(() => null);
  const jobs = [
    ...['settings', 'products', 'news', 'articles', 'history'].map(t => [t, SHEET_ID, t]),
    ['herbPrices', HERB_SHEET_ID, 'ราคา'], ['herbCover', HERB_SHEET_ID, 'ปก']
  ];
  const rows = await Promise.all(jobs.map(([, id, tab]) => get(id, tab)));
  if (rows.every(r => !r)) return null;
  return Object.fromEntries(jobs.map(([key], i) => [key, rows[i]]));
}

// Turns the long price table (one row per herb x plot type x grade) into one
// entry per herb: { name, unit, cells: { normal|gap|organic: { A|B|C: {price, open} } } }.
function buildHerbPrices(rows) {
  const TYPE = t => /gap/i.test(t) ? 'gap' : /organic|อินทรีย์/i.test(t) ? 'organic' : 'normal';
  const truthy = v => /^(true|1|ใช่|yes|เปิด)/i.test(String(v).trim());
  const byName = new Map();
  rows.forEach(r => {
    const [, name, plot, grade, unit, price, show, status] = Object.values(r).map(v => String(v ?? '').trim());
    if (!name || !price || (show !== '' && !truthy(show))) return;
    if (!byName.has(name)) byName.set(name, { name, unit, cells: {} });
    const h = byName.get(name), t = TYPE(plot);
    (h.cells[t] ||= {})[(grade || 'A').toUpperCase()] = { price: parseFloat(price.replace(/,/g, '')), open: truthy(status) };
  });
  return [...byName.values()];
}

// Copies raw sheet rows into the site data (SITE, PRODUCTS, ...).
function applySheets(raw) {
  const { settings, products, news, articles, history, herbPrices, herbCover } = raw;
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
  if (herbPrices?.length) HERB_PRICES = buildHerbPrices(herbPrices);
  const upd = herbCover?.find(r => /^อัปเดต/.test(String(r.key)));
  if (upd?.value) SITE.herbsUpdated = upd.value;
}

// The last sheet data this browser saw, so repeat visits render instantly.
const CACHE_KEY = 'phanaphan-sheet-' + SHEET_ID;
const readCache = () => { try { return localStorage.getItem(CACHE_KEY); } catch { return null; } };
const writeCache = v => { try { localStorage.setItem(CACHE_KEY, v); } catch { /* storage unavailable */ } };

(function start() {
  if (!$('#site-header')) return; // standalone pages (e.g. the printable price sheet)
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

  const cached = readCache();
  if (cached) try { applySheets(JSON.parse(cached)); } catch { /* ignore a corrupt cache */ }

  $('.menu-btn').onclick = () => $('nav ul').classList.toggle('open');
  const header = $('header');
  addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 10), { passive: true });

  const bound = new Set(); // listeners are attached once; render() may run twice
  const once = (key, fn) => { if (!bound.has(key)) { bound.add(key); fn(); } };

  function render() {
  /* ---------- Footer ---------- */
  $('#site-footer').innerHTML = `
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
          <dl>${[['สรรพคุณ', p.desc], ['วิธีใช้', p.use], ['ข้อควรระวัง', p.warn]]
          .filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')
          || '<dd style="color:var(--muted)">สอบถามสรรพคุณและวิธีใช้ได้ที่ศูนย์ฯ</dd>'}</dl>
          <a class="btn btn-primary" style="margin-top:24px" href="${esc(SITE.lineUrl)}" target="_blank" rel="noopener">สอบถาม / สั่งซื้อทาง LINE</a>
        </div>
      </div>`;
    requestAnimationFrame(() => m.classList.add('open'));
    $('.close', m).focus();
  }
  once('cards', () => {
    document.addEventListener('click', e => {
      const c = e.target.closest('.card[data-id]');
      if (c) openProduct(c.dataset.id);
    });
    document.addEventListener('keydown', e => {
      const c = e.target.closest?.('.card[data-id]');
      if (c && e.key === 'Enter') openProduct(c.dataset.id);
    });
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
    const st = render.products ||= { cat: 'ทั้งหมด', q: '' };
    if (!cats.includes(st.cat)) st.cat = 'ทั้งหมด';
    const draw = render.drawProducts = () => {
      const { cat, q } = st;
      const list = PRODUCTS.filter(p => (cat === 'ทั้งหมด' || p.cat === cat) &&
        (p.name + p.desc).toLowerCase().includes(q.toLowerCase()));
      grid.innerHTML = list.map(productCard).join('');
      $('#empty').hidden = list.length > 0;
      bindTilt();
    };
    $('#chips').innerHTML = cats.map(c => `<button class="chip${c === st.cat ? ' on' : ''}">${esc(c)}</button>`).join('');
    once('products', () => {
      $('#chips').addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        st.cat = b.textContent;
        $('#chips').querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
        render.drawProducts();
      });
      $('#search').addEventListener('input', e => { st.q = e.target.value.trim(); render.drawProducts(); });
    });
    draw();
  }

  // Knowledge: tag chips
  const alist = $('#article-list');
  if (alist) {
    const tags = ['ทั้งหมด', ...new Set(ARTICLES.map(a => a.tag))];
    if (!tags.includes(render.tag)) render.tag = 'ทั้งหมด';
    const draw = () => { alist.innerHTML = ARTICLES.filter(a => render.tag === 'ทั้งหมด' || a.tag === render.tag).map(a => postRow(a, 'knowledge')).join(''); };
    $('#tag-chips').innerHTML = tags.map(t => `<button class="chip${t === render.tag ? ' on' : ''}">${esc(t)}</button>`).join('');
    once('tags', () => $('#tag-chips').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      $('#tag-chips').querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
      render.tag = b.textContent;
      render.drawArticles();
    }));
    render.drawArticles = draw;
    draw();
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
    const money = v => v.toLocaleString('th-TH', { minimumFractionDigits: v % 1 ? 1 : 0, maximumFractionDigits: 2 });
    const isOpen = (h, t) => Object.values(h.cells[t] || {}).some(c => c.open);
    const st = render.herbs ||= { type: 'normal', q: '', onlyOpen: false };
    $('#h-updated').textContent = SITE.herbsUpdated || '-';
    $('#h-gap').textContent = '';
    $('#h-org').textContent = '';
    const draw = render.drawHerbs = () => {
      const { type, q, onlyOpen } = st;
      const list = HERB_PRICES.filter(h => h.cells[type] && (!onlyOpen || isOpen(h, type)) && h.name.includes(q));
      hbody.innerHTML = list.map((h, i) => {
        const cell = g => {
          const c = h.cells[type][g];
          return !c ? '–' : c.open ? money(c.price) : `<s title="งดรับชั่วคราว">${money(c.price)}</s>`;
        };
        const open = isOpen(h, type);
        return `<tr class="${open ? '' : 'closed'}">
          <td data-l="ลำดับ">${i + 1}</td><td data-l="รายการ" class="name">${esc(h.name)}</td><td data-l="หน่วย">${esc(h.unit || 'กิโลกรัม')}</td>
          <td data-l="เกรด A" class="num a">${cell('A')}</td><td data-l="เกรด B" class="num">${cell('B')}</td><td data-l="เกรด C" class="num">${cell('C')}</td>
          <td data-l="สถานะ"><span class="status ${open ? 'on' : 'off'}">${open ? 'เปิดรับ' : 'งดรับชั่วคราว'}</span></td></tr>`;
      }).join('');
      const empty = $('#h-empty');
      empty.hidden = list.length > 0;
      empty.textContent = HERB_PRICES.length ? 'ไม่พบสมุนไพรที่ค้นหา'
        : render.herbFailed ? 'ขออภัย โหลดราคาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือโทรสอบถาม'
        : 'กำลังโหลดราคา…';
    };
    once('herbs', () => {
      $('#h-type').addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        st.type = b.dataset.type;
        $('#h-type').querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
        render.drawHerbs();
      });
      $('#h-search').addEventListener('input', e => { st.q = e.target.value.trim(); render.drawHerbs(); });
      $('#h-open').addEventListener('change', e => { st.onlyOpen = e.target.checked; render.drawHerbs(); });
    });
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
  const map = $('#map');
  const mapSrc = SITE.mapEmbed || 'https://maps.google.com/maps?q=' + encodeURIComponent(SITE.mapQuery) + '&output=embed';
  if (map && map.getAttribute('src') !== mapSrc) map.src = mapSrc;

  /* ---------- Slider (home) ---------- */
  const slider = $('#slider');
  if (slider) {
    slider.querySelectorAll('.slide').forEach(el => el.remove());
    slider.insertAdjacentHTML('afterbegin', NEWS.filter(n => n.slide).map(n => `
      <a class="slide" href="article.html?type=news&id=${esc(n.id)}" style="${n.image
        ? `background-image:url(${esc(n.image)});background-position:${esc(n.imagePos || 'right bottom')}`
        : 'background-image:linear-gradient(120deg,#2FA67A,#BFD78E 55%,#EFD84E)'}">
        <div class="bg"></div>
        <div class="txt"><small>${esc(n.tag)}</small><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p></div>
      </a>`).join(''));
    const sl = render.slider ||= { cur: 0, timer: 0 };
    const slides = [...slider.querySelectorAll('.slide')];
    const dotsBox = $('.dots', slider);
    const bar = $('.progress', slider);
    dotsBox.innerHTML = '';
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `สไลด์ ${i + 1}`);
      b.onclick = () => go(i);
      dotsBox.appendChild(b);
    });
    const dots = [...dotsBox.children];
    function go(i) {
      if (!slides.length) return;
      sl.cur = (i + slides.length) % slides.length;
      slides.forEach((s, j) => s.classList.toggle('active', j === sl.cur));
      dots.forEach((d, j) => d.classList.toggle('on', j === sl.cur));
      bar.classList.remove('run'); void bar.offsetWidth;
      if (!reduce) bar.classList.add('run');
      clearTimeout(sl.timer);
      if (!reduce) sl.timer = setTimeout(() => go(sl.cur + 1), 6000);
    }
    sl.go = go;
    once('slider', () => {
      $('.s-prev', slider).onclick = () => sl.go(sl.cur - 1);
      $('.s-next', slider).onclick = () => sl.go(sl.cur + 1);
      let x0 = null;
      slider.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
      slider.addEventListener('touchend', e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) sl.go(sl.cur + (dx < 0 ? 1 : -1));
        x0 = null;
      });
    });
    go(sl.cur);
  }

  bindTilt();
  } // end render()

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

  render();

  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Refresh from the sheet in the background; re-render only when it changed.
  // Pull fresh data from the sheets now, then every 2 minutes while the page is
  // visible, so edits in the sheet appear without reloading.
  let last = cached;
  const refresh = () => fetchSheets().then(raw => {
    if (!raw?.herbPrices?.length && !HERB_PRICES.length) { render.herbFailed = true; render.drawHerbs?.(); }
    if (!raw) return;
    const json = JSON.stringify(raw);
    if (json === last) return;
    last = json;
    writeCache(json);
    applySheets(raw);
    render();
  });
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 120000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
