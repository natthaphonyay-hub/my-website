// Shared behaviour for every page: header/footer, content rendering from
// data.js, and interactive effects.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hoverable = matchMedia('(hover: hover)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const page = document.body.dataset.page;

/* ---------- Google Sheets ---------- */
// Splits CSV text into rows of cells (handles quoted fields, commas and line
// breaks inside quotes).
function csvRows(text) {
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
  return rows;
}
// CSV text -> [{ header: value }] objects.
function parseCSV(text) {
  const [head = [], ...data] = csvRows(text);
  const keys = head.map(h => h.trim());
  return data.filter(r => r.some(v => v.trim())).map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

const yes = v => /^(1|y|yes|true|ใช่|แสดง|✓|x)$/i.test(String(v).trim());
const shown = r => !('show' in r) || r.show === '' || yes(r.show);
const paras = v => String(v).split(/\n\s*\n|\n/).map(x => x.trim()).filter(Boolean);
const driveImg = url => {
  // Turn a Google Drive share link into a direct image link.
  const m = String(url).match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600` : url;
};

// Fetches every tab as raw rows. Returns null when the sheet can't be reached.
async function fetchSheets() {
  const url = (id, tab) => `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;
  const get = (id, tab, raw) => !id ? Promise.resolve(null)
    : fetch(url(id, tab), { cache: 'no-store' }).then(r => r.ok ? r.text() : Promise.reject())
      .then(raw ? csvRows : parseCSV).catch(() => null);
  const jobs = [
    ...['settings', 'news', 'articles', 'history'].map(t => [t, SHEET_ID, t]),
    ['herbPrices', HERB_SHEET_ID, 'ราคา'], ['herbCover', HERB_SHEET_ID, 'ปก'],
    ['drugs', DRUG_SHEET_ID, 'ยา', true], ['drugCover', DRUG_SHEET_ID, 'ปก', true]
  ];
  const rows = await Promise.all(jobs.map(([, id, tab, raw]) => get(id, tab, raw)));
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

// Drug list rows (header row first) -> one object per visible item. Columns are
// found by header name, so they may be reordered; both "ประเภท" columns are kept.
const DRUG_COLS = {
  show: 'show', status: 'status', unit: 'unit', featured: 'featured', no: 'ลำดับ', code: 'เลข',
  ptype: 'ประเภทผลิตภัณฑ์', form: 'รูปแบบเภสัชภัณฑ์', name: 'รายการยาและเวชภัณฑ์มิใช่ยา', price: 'ราคา',
  size: 'ขนาดบรรจุ', trade: 'ชื่อการค้า', strength: 'รหัสขนาดความแรงยา', code24: 'เลข 24 หลักใหม่',
  ttmt: 'TTMTID ใหม่', image: 'image', container: 'ภาชนะบรรจุ', drugType: 'ประเภท ยา',
  list: 'บัญชียาจากสมุนไพร', use: 'สรรพคุณยา/ข้อบ่งใช้', dose: 'ขนาดและวิธีใช้', contra: 'ข้อห้ามใช้',
  warn: 'คำเตือน', caution: 'ข้อควรระวัง', adverse: 'อาการไม่พึงประสงค์', label: 'ฉลากยาพิเศษ', store: 'การเก็บ'
};
function buildDrugs(rows) {
  const norm = h => String(h).replace(/\s+/g, ' ').trim().toLowerCase();
  const [head = [], ...data] = rows;
  const heads = head.map(norm);
  const at = Object.fromEntries(Object.entries(DRUG_COLS).map(([k, h]) => [k, heads.indexOf(norm(h))]));
  const typeCols = heads.map((h, i) => h === 'ประเภท' ? i : -1).filter(i => i >= 0);
  const blank = v => !v || /^[-–—]+$/.test(v);
  return data.map(r => r.map(v => String(v ?? '').trim())).filter(r => r.some(Boolean)).map((r, i) => {
    const d = Object.fromEntries(Object.keys(DRUG_COLS).map(k => [k, at[k] >= 0 ? (r[at[k]] || '') : '']));
    for (const k of Object.keys(d)) if (k !== 'price' && blank(d[k])) d[k] = '';
    return {
      ...d, id: String(i + 1), featured: yes(d.featured), image: d.image ? driveImg(d.image) : '',
      types: typeCols.map(c => r[c]).filter(v => !blank(v)),
      units: d.unit.split(/[,\n\/]+/).map(x => x.trim()).filter(Boolean)
    };
  }).filter(d => d.name && (d.show === '' || yes(d.show)));
}

// Copies raw sheet rows into the site data (SITE, DRUGS, ...).
function applySheets(raw) {
  const { settings, news, articles, history, herbPrices, herbCover, drugs, drugCover } = raw;
  if (settings) settings.forEach(r => { if (r.key && r.value) SITE[r.key] = r.value; });
  if (drugs?.length > 1) DRUGS = buildDrugs(drugs);
  // "ปก" tab: rows of [key, value, ...]
  const cover = (rows, re) => rows?.find(r => re.test(String(r[0]).trim()))?.[1]?.trim();
  SITE.drugsUpdated = cover(drugCover, /^อัปเดต/) || SITE.drugsUpdated;
  SITE.drugsYear = cover(drugCover, /^ปีงบ/) || SITE.drugsYear;
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
  const year = herbCover?.find(r => /^ปีงบ/.test(String(r.key)));
  if (year?.value) SITE.herbsYear = year.value;
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
          ${SITE.website && SITE.website !== '-' ? `<a href="${esc(SITE.website)}" target="_blank" rel="noopener">${esc(SITE.website.replace(/^https?:\/\/(www\.)?|\/$/g, ''))}</a>` : ''}
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
  // Drug helpers
  const drugIcon = d => /ครีม|เจล|ขี้ผึ้ง|หม่อง|บาล์ม|ลูกประคบ/.test(d.form + d.name) ? '🧴'
    : /แคปซูล|เม็ด|ลูกกลอน/.test(d.form + d.name) ? '💊' : /ผง|ชา/.test(d.form + d.name) ? '🍵'
    : /น้ำ|สเปรย์|ไซรัป/.test(d.form + d.name) ? '🧪' : '🌿';
  // Drive images: try the thumbnail link, with the lh3 link underneath as a fallback
  const imgLayers = src => {
    const id = String(src).match(/thumbnail\?id=([\w-]+)/)?.[1];
    return id ? `url('${esc(src)}') center/contain no-repeat,url('https://lh3.googleusercontent.com/d/${id}')` : `url('${esc(src)}')`;
  };
  const drugThumb = (d, cls = 'thumb') => d.image
    ? `<div class="${cls}" style="background:${imgLayers(d.image)} center/contain no-repeat,#F3F1EA"></div>`
    : `<div class="${cls}" style="background:linear-gradient(135deg,#E6F1EA,#F6F0D4)"><span>${drugIcon(d)}</span></div>`;
  const baht = v => { const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? esc(v) : '฿' + n.toLocaleString('th-TH', { maximumFractionDigits: 2 }); };
  const statusCls = s => /ปกติ/.test(s) ? 'ok' : /ปี/.test(s) ? 'long' : 'pre';
  const typeTag = t => `<span class="tag${/^NED$/i.test(t) ? ' ned' : ''}">${esc(t)}</span>`;
  const statusBadge = s => s ? `<span class="dstat ${statusCls(s)}">${esc(s)}</span>` : '';

  // Drug table columns: [key, header, class, cell(drug, index)]
  const DRUG_TABLE_COLS = (() => {
    const txt = v => esc(v) || '–';
    const code = v => v ? `<span class="code">${esc(v)}</span>` : '–';
    return [
      ['n', 'ลำดับ', 'n', (d, i) => i + 1], ['code', 'เลข', '', d => txt(d.code)], ['ptype', 'ประเภทผลิตภัณฑ์', '', d => txt(d.ptype)],
      ['form', 'รูปแบบเภสัชภัณฑ์', '', d => txt(d.form)],
      ['name', 'รายการยาและเวชภัณฑ์มิใช่ยา', 'name', d => `<b>${esc(d.name)}</b>${statusBadge(d.status)}`],
      ['price', 'ราคา', 'num', d => d.price ? baht(d.price) : '–'], ['size', 'ขนาดบรรจุ', '', d => txt(d.size)],
      ['types', 'ประเภท', '', d => d.types.map(typeTag).join(' ') || '–'], ['trade', 'ชื่อการค้า', '', d => txt(d.trade)],
      ['strength', 'รหัสขนาดความแรงยา', '', d => code(d.strength)], ['code24', 'เลข 24 หลักใหม่', '', d => code(d.code24)],
      ['ttmt', 'TTMTID ใหม่', '', d => code(d.ttmt)]
    ];
  })();

  const drugCard = d => `
    <a class="card" href="products.html?id=${esc(d.id)}">
      ${drugThumb(d)}
      <div class="body">
        <span class="tag">${esc(d.form || d.ptype)}</span>
        <h3>${esc(d.name)}</h3>
        <p>${esc(paras(d.use)[0] || d.trade)}</p>
        <div class="row-between"><div class="price">${baht(d.price)}</div><div class="more">ดูรายละเอียด →</div></div>
      </div>
    </a>`;

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

  /* ---------- Drug modal ---------- */
  const textBlock = v => {
    const lines = paras(v).map(x => x.replace(/^[-•*·]\s*/, ''));
    return lines.length > 1 ? `<ul>${lines.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p>${esc(lines[0])}</p>`;
  };
  function openDrug(id) {
    const d = DRUGS.find(x => x.id === id);
    if (!d) return;
    let m = $('#modal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'modal'; m.className = 'modal';
      m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
      document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('.close')) m.classList.remove('open'); });
      addEventListener('keydown', e => { if (e.key === 'Escape') m.classList.remove('open'); });
    }
    const facts = [['เลข', d.code], ['ประเภทผลิตภัณฑ์', d.ptype], ['รูปแบบเภสัชภัณฑ์', d.form], ['ขนาดบรรจุ', d.size],
      ['ภาชนะบรรจุ', d.container], ['ประเภท', d.types.join(' · '), d.types.map(typeTag).join(' ')], ['ประเภท ยา', d.drugType],
      ['บัญชียาจากสมุนไพร', d.list], ['ชื่อการค้า', d.trade], ['รหัสขนาดความแรงยา', d.strength],
      ['เลข 24 หลักใหม่', d.code24], ['TTMTID ใหม่', d.ttmt]].filter(([, v]) => v);
    const texts = [['สรรพคุณยา / ข้อบ่งใช้', d.use], ['ขนาดและวิธีใช้', d.dose], ['ข้อห้ามใช้', d.contra], ['คำเตือน', d.warn],
      ['ข้อควรระวัง', d.caution], ['อาการไม่พึงประสงค์', d.adverse], ['ฉลากยาพิเศษ', d.label], ['การเก็บ', d.store]].filter(([, v]) => v);
    m.innerHTML = `
      <div class="box wide">
        <button class="close" aria-label="ปิด">✕</button>
        ${drugThumb(d)}
        <div class="body">
          <div class="badges-row">${statusBadge(d.status)}${d.units.map(u => `<span class="tag">${esc(u)}</span>`).join('')}</div>
          <h3>${esc(d.name)}</h3>
          <div class="price">${baht(d.price)} <small>${d.size ? '/ ' + esc(d.size) : ''}</small></div>
          <dl class="facts">${facts.map(([k, v, html]) => `<div><dt>${k}</dt><dd>${html || esc(v)}</dd></div>`).join('')}</dl>
          <dl>${texts.map(([k, v]) => `<dt>${k}</dt><dd>${textBlock(v)}</dd>`).join('')}</dl>
        </div>
      </div>`;
    requestAnimationFrame(() => m.classList.add('open'));
    $('.close', m).focus();
  }
  once('drugs-open', () => {
    document.addEventListener('click', e => {
      const c = e.target.closest('[data-drug]');
      if (c) openDrug(c.dataset.drug);
    });
    document.addEventListener('keydown', e => {
      const c = e.target.closest?.('[data-drug]');
      if (c && e.key === 'Enter' && c.tagName !== 'BUTTON') openDrug(c.dataset.drug);
    });
  });

  /* ---------- Page content ---------- */
  const fill = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

  fill('#featured', DRUGS.filter(d => d.featured).map(drugCard).join(''));
  fill('#home-news', NEWS.slice(0, 3).map(n => listItem(n, 'news')).join(''));
  fill('#home-knowledge', ARTICLES.slice(0, 3).map(a => listItem(a, 'knowledge')).join(''));
  fill('#timeline', HISTORY.map(h => `
    <li><b>${esc(h.year)}</b><p>${esc(h.text)}</p>${h.image ? `<a href="${esc(h.image)}" target="_blank" rel="noopener"><img src="${esc(h.image)}" alt="${esc(h.text)}" loading="lazy"></a>` : ''}</li>`).join(''));
  fill('#news-list', NEWS.map(n => postRow(n, 'news')).join(''));

  // Products: featured slider + drug table with unit / status filters
  const dbody = $('#d-body');
  if (dbody) {
    const UNIT_ORDER = ['โรงพยาบาล', 'ศูนย์แพทย์แผนไทยพนา', 'ร้านค้ามูลนิธิ'];
    const byOrder = order => (a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99);
    const units = [...new Set(DRUGS.flatMap(d => d.units))].sort(byOrder(UNIT_ORDER));
    const statuses = [...new Set(DRUGS.map(d => d.status).filter(Boolean))].sort(byOrder(['ผลิตปกติ']));
    const DEFAULT_COLS = ['n', 'price', 'size', 'types', 'code24', 'ttmt'];
    const st = render.drugs ||= { unit: 'โรงพยาบาล', status: 'ทั้งหมด', q: '', cols: [...DEFAULT_COLS] };
    const narrow = matchMedia('(max-width: 860px)');
    if (DRUGS.length && st.unit !== 'ทั้งหมด' && !units.includes(st.unit)) st.unit = 'ทั้งหมด';
    if (st.status !== 'ทั้งหมด' && DRUGS.length && !statuses.includes(st.status)) st.status = 'ทั้งหมด';
    const chips = (list, cur) => ['ทั้งหมด', ...list].map(v => `<button class="chip${v === cur ? ' on' : ''}" data-v="${esc(v)}">${esc(v)}</button>`).join('');
    $('#d-unit').innerHTML = chips(units.length ? units : UNIT_ORDER, st.unit);
    $('#d-status').innerHTML = chips(statuses, st.status);
    $('#d-updated').textContent = [SITE.drugsYear, SITE.drugsUpdated && 'อัปเดตล่าสุด ' + SITE.drugsUpdated].filter(Boolean).join(' · ') || '-';
    const draw = render.drawDrugs = () => {
      const q = st.q.toLowerCase();
      const list = DRUGS.filter(d => (st.unit === 'ทั้งหมด' || d.units.includes(st.unit)) &&
        (st.status === 'ทั้งหมด' || d.status === st.status) &&
        [d.name, d.trade, d.code, d.ptype, d.form, d.code24, d.ttmt].join(' ').toLowerCase().includes(q));
      const cols = DRUG_TABLE_COLS.filter(([key]) => key === 'name' || st.cols.includes(key));
      // On phones the drug name comes first so it stays pinned on the left while scrolling
      if (narrow.matches) cols.unshift(...cols.splice(cols.findIndex(([key]) => key === 'name'), 1));
      $('#d-head').innerHTML = `<tr>${cols.map(([, h, c]) => `<th class="${c}">${h}</th>`).join('')}</tr>`;
      dbody.innerHTML = list.map((d, i) => `
        <tr data-drug="${esc(d.id)}" tabindex="0">${cols.map(([, , c, f]) => `<td class="${c}">${f(d, i)}</td>`).join('')}</tr>`).join('');
      $('#d-table').classList.toggle('few', cols.length <= 8);
      $('#d-count').textContent = DRUGS.length ? `แสดง ${list.length} จาก ${DRUGS.length} รายการ` : '';
      const empty = $('#d-empty');
      empty.hidden = list.length > 0;
      empty.textContent = DRUGS.length ? 'ไม่พบรายการที่ค้นหา'
        : render.drugFailed ? 'ขออภัย โหลดรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือโทรสอบถาม'
        : 'กำลังโหลดรายการ…';
      const qs = new URLSearchParams({ unit: st.unit, status: st.status, cols: [...st.cols, 'status'].join(',') });
      $('#d-print').href = 'drug-sheet.html?' + qs;
    };
    once('drugs', () => {
      const pick = (box, key) => $(box).addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        st[key] = b.dataset.v;
        $(box).querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
        render.drawDrugs();
      });
      pick('#d-unit', 'unit'); pick('#d-status', 'status');
      $('#d-search').addEventListener('input', e => { st.q = e.target.value.trim(); render.drawDrugs(); });
      // Column picker
      const picker = $('#d-cols');
      const tick = () => picker.querySelectorAll('input').forEach(i => { i.checked = i.value === 'name' || st.cols.includes(i.value); });
      picker.querySelector('.cols-list').innerHTML = DRUG_TABLE_COLS.map(([key, h]) =>
        `<label><input type="checkbox" value="${key}"${key === 'name' ? ' disabled' : ''}> ${h}</label>`).join('');
      tick();
      picker.addEventListener('change', e => {
        st.cols = [...picker.querySelectorAll('input:checked')].map(i => i.value).filter(k => k !== 'name');
        render.drawDrugs();
      });
      picker.querySelector('.cols-reset').addEventListener('click', () => { st.cols = [...DEFAULT_COLS]; tick(); render.drawDrugs(); });
      document.addEventListener('click', e => { if (!picker.contains(e.target)) picker.open = false; });
      narrow.addEventListener('change', () => render.drawDrugs());
    });
    draw();

    // Featured banner (one or more items marked "featured" in the sheet)
    const feat = $('#d-feature');
    const items = DRUGS.filter(d => d.featured);
    feat.hidden = !items.length;
    const fs = render.feature ||= { cur: 0, timer: 0 };
    feat.innerHTML = items.map((d, i) => `
      <div class="fslide${i === 0 ? ' active' : ''}">
        ${drugThumb(d, 'fpic')}
        <div class="ftxt">
          <small>★ ผลิตภัณฑ์แนะนำ</small>
          <h2>${esc(d.name)}</h2>
          ${d.trade ? `<div class="trade">${esc(d.trade)}</div>` : ''}
          <p>${esc(paras(d.use).slice(0, 2).join(' · ').replace(/^[-•]\s*/, ''))}</p>
          <div class="fbuy"><span class="price">${baht(d.price)}</span><span>${esc(d.size)}</span>
            <button class="btn btn-primary" data-drug="${esc(d.id)}">ดูรายละเอียด</button></div>
        </div>
      </div>`).join('') + (items.length > 1 ? `<div class="dots">${items.map((_, i) => `<button aria-label="รายการ ${i + 1}"></button>`).join('')}</div>` : '');
    const slides = [...feat.querySelectorAll('.fslide')], dots = [...feat.querySelectorAll('.dots button')];
    const go = i => {
      if (!slides.length) return;
      fs.cur = (i + slides.length) % slides.length;
      slides.forEach((s, j) => s.classList.toggle('active', j === fs.cur));
      dots.forEach((b, j) => { b.classList.toggle('on', j === fs.cur); b.onclick = () => go(j); });
      clearTimeout(fs.timer);
      if (slides.length > 1) fs.timer = setTimeout(() => go(fs.cur + 1), 7000);
    };
    go(fs.cur);

    // products.html?id=… (from the home page cards) opens that item once
    const want = new URLSearchParams(location.search).get('id');
    if (want && !render.deepOpened && DRUGS.some(d => d.id === want)) { render.deepOpened = true; openDrug(want); }
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
    const st = render.herbs ||= { type: 'normal', q: '', onlyOpen: true };
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
      bar.classList.add('run');
      clearTimeout(sl.timer);
      sl.timer = setTimeout(() => go(sl.cur + 1), 6000);
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
    if (!raw?.drugs?.length && !DRUGS.length) { render.drugFailed = true; render.drawDrugs?.(); }
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
