/* Finance Daily — dashboard + calendar date picker */
const SECTIONS = {
  x: 'data/x-digest.json',
  earnings: 'data/earnings.json',
  bofa: 'data/bofa.json',
  iran: 'data/iran.json'
};
const cache = {};
const app = document.getElementById('app');
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
}[c]));
const load = k => cache[k] || (cache[k] = fetch(SECTIONS[k] + '?v=' + Date.now()).then(r => r.json()));
const dates = d => Object.keys(d.days || {}).sort().reverse();
const fmt = s => {
  const [y, m, d] = s.split('-');
  return `${y}年${+m}月${+d}日`;
};
const fmtShort = s => {
  const [, m, d] = s.split('-');
  return `${+m}/${+d}`;
};
const handles = h => h && h.length
  ? `<span class="h">${h.map(x => `<a href="https://x.com/${encodeURIComponent(x)}" target="_blank" rel="noopener">@${esc(x)}</a>`).join('')}</span>`
  : '';
const unv = i => i.unverified ? '<span class="unv">未证实</span>' : '';

/* —— Shared date helpers —— */
function unionDates(datasets) {
  const s = new Set();
  datasets.forEach(d => Object.keys(d.days || {}).forEach(x => s.add(x)));
  return [...s].sort().reverse();
}

function parseYMD(s) {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}

function ymd(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/* —— Calendar date picker —— */
const calState = { open: false, viewY: 0, viewM: 0, list: [], cur: '', base: '' };

function closeCal() {
  calState.open = false;
  const panel = document.getElementById('cal-panel');
  const btn = document.getElementById('cal-btn');
  if (panel) panel.hidden = true;
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function openCal() {
  calState.open = true;
  const panel = document.getElementById('cal-panel');
  const btn = document.getElementById('cal-btn');
  if (panel) {
    panel.hidden = false;
    renderCalGrid();
  }
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function toggleCal(e) {
  if (e) e.stopPropagation();
  if (calState.open) closeCal();
  else openCal();
}

function calNav(delta) {
  let { viewY: y, viewM: m } = calState;
  m += delta;
  if (m < 1) { m = 12; y--; }
  if (m > 12) { m = 1; y++; }
  calState.viewY = y;
  calState.viewM = m;
  renderCalGrid();
}

function calPick(date) {
  if (!calState.list.includes(date)) return;
  closeCal();
  const base = calState.base; // '' for home, 'x' / 'earnings' / ...
  if (!base) location.hash = '#/' + date;
  else location.hash = '#/' + base + '/' + date;
}

function renderCalGrid() {
  const panel = document.getElementById('cal-panel');
  if (!panel) return;
  const { viewY: y, viewM: m, list, cur } = calState;
  const have = new Set(list);
  const first = new Date(y, m - 1, 1);
  // Monday-first week
  let start = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m, 0).getDate();
  const title = `${y}年${m}月`;

  const minD = list.length ? list[list.length - 1] : null;
  const maxD = list.length ? list[0] : null;
  const canPrev = minD && ymd(y, m, 1) > minD.slice(0, 7) + '-01';
  const canNext = maxD && ymd(y, m, 1) < maxD.slice(0, 7) + '-01';

  let cells = '';
  for (let i = 0; i < start; i++) cells += '<span class="cal-cell cal-pad"></span>';
  for (let d = 1; d <= daysInMonth; d++) {
    const id = ymd(y, m, d);
    const ok = have.has(id);
    const isCur = id === cur;
    const cls = ['cal-cell', ok ? 'cal-ok' : 'cal-off', isCur ? 'cal-cur' : ''].filter(Boolean).join(' ');
    if (ok) {
      cells += `<button type="button" class="${cls}" data-date="${id}" aria-label="${fmt(id)}"${isCur ? ' aria-current="date"' : ''}>${d}</button>`;
    } else {
      cells += `<span class="${cls}" aria-disabled="true">${d}</span>`;
    }
  }

  panel.innerHTML = `
    <div class="cal-head">
      <button type="button" class="cal-nav" data-nav="-1" aria-label="上个月"${canPrev ? '' : ' disabled'}>‹</button>
      <div class="cal-title">${title}</div>
      <button type="button" class="cal-nav" data-nav="1" aria-label="下个月"${canNext ? '' : ' disabled'}>›</button>
    </div>
    <div class="cal-dow" aria-hidden="true"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
    <div class="cal-grid">${cells}</div>
    <div class="cal-legend"><span class="cal-dot"></span> 有数据的日期可选</div>
  `;
}

function picker(base, list, cur) {
  if (!list.length) return '';
  const { y, m } = parseYMD(cur);
  calState.list = list;
  calState.cur = cur;
  calState.base = base || '';
  calState.viewY = y;
  calState.viewM = m;
  calState.open = false;
  return `<div class="datebar">
    <span class="muted">日期</span>
    <div class="cal-wrap">
      <button type="button" class="cal-btn" id="cal-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="cal-panel">
        <span class="cal-btn-date">${fmt(cur)}</span>
        <span class="cal-btn-ico" aria-hidden="true">▾</span>
      </button>
      <div class="cal-panel" id="cal-panel" role="dialog" aria-label="选择日期" hidden></div>
    </div>
    <span class="cal-meta muted">${list.length} 天有数据</span>
  </div>`;
}

function empty(msg) {
  return `<div class="empty"><div class="big">Empty</div><h3>暂无数据</h3><p>${msg}</p></div>`;
}

function xItems(day) {
  return day.topics.map(t =>
    `<div class="card topic"><h3>${esc(t.title)}</h3><ul>${
      t.items.map(i => `<li>${esc(i.text)}${unv(i)} ${handles(i.handles)}</li>`).join('')
    }</ul></div>`
  ).join('');
}

function earnItems(day) {
  return day.sessions.map(s =>
    `<div class="card"><h3>${esc(s.name)}</h3><table><thead><tr><th>代码</th><th>EPS（实际 vs 预期）</th><th>营收</th><th>要点</th><th>股价反应</th></tr></thead><tbody>${
      s.items.map(i =>
        `<tr><td class="t">${esc(i.ticker)}</td><td data-l="EPS">${esc(i.eps) || '—'}</td><td data-l="营收">${esc(i.revenue) || '—'}</td><td data-l="要点" class="note${i.notes ? '' : ' empty-cell'}">${esc(i.notes) || '—'}</td><td data-l="反应" class="${i.dir}">${esc(i.move) || '—'}</td></tr>`
      ).join('')
    }</tbody></table><div class="src">来源：${
      s.sources.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(new URL(u).hostname)}</a>`).join(' · ')
    }</div></div>`
  ).join('');
}

function simpleItems(day) {
  return (day.items || []).map(i =>
    `<div class="card">${esc(i.text)} ${handles(i.handles)}${
      i.source ? ` <a href="${esc(i.source)}" target="_blank">来源</a>` : ''
    }</div>`
  ).join('');
}

async function section(k, date) {
  const d = await load(k);
  const list = dates(d);
  let h = `<h1>${esc(d.title)}</h1><p class="sub">${[d.schedule, d.note].filter(Boolean).map(esc).join(' · ')}</p>`;
  if (!list.length) {
    return h + empty(d.nextIssue ? `下一期：${fmt(d.nextIssue)}` : '敬请关注，有新进展将第一时间更新');
  }
  const cur = list.includes(date) ? date : list[0];
  const day = d.days[cur];
  h += picker(k, list, cur);
  if (k === 'x') h += xItems(day);
  else if (k === 'earnings') h += earnItems(day);
  else h += simpleItems(day);
  return h;
}

/* —— Dashboard home —— */
function dashCard(opts) {
  const { title, href, meta, body, emptyMsg } = opts;
  return `<section class="dash-card">
    <header class="dash-head">
      <h2 class="dash-title">${esc(title)}</h2>
      <div class="dash-meta">${meta || ''}</div>
      ${href ? `<a class="dash-more" href="${href}">详情 →</a>` : ''}
    </header>
    <div class="dash-body">${body || `<p class="dash-empty">${esc(emptyMsg || '该日无内容')}</p>`}</div>
  </section>`;
}

function collectHighlights(x, e, day) {
  const hl = [];
  if (x.days[day]) {
    x.days[day].topics.forEach(t =>
      t.items.filter(i => i.highlight).forEach(i =>
        hl.push({
          tag: t.title,
          html: `${esc(i.text)}${unv(i)} ${handles(i.handles)}`,
          href: '#/x/' + day
        })
      )
    );
  }
  if (e.days[day]) {
    e.days[day].sessions.forEach(s =>
      s.items.filter(i => i.highlight).forEach(i =>
        hl.push({
          tag: '财报·' + s.name,
          html: `<b>${esc(i.ticker)}</b> ${esc(i.notes || i.revenue || i.eps)} — <span class="${i.dir}">${esc(i.move)}</span>`,
          href: '#/earnings/' + day
        })
      )
    );
  }
  return hl;
}

function xDigestPreview(day) {
  if (!day || !(day.topics || []).length) return '';
  // Full day: every topic and every item (scannable by topic)
  return day.topics.map(t =>
    `<div class="dash-topic"><h3>${esc(t.title)}</h3><ul>${
      t.items.map(i => `<li>${esc(i.text)}${unv(i)} ${handles(i.handles)}</li>`).join('')
    }</ul></div>`
  ).join('');
}

function earningsPreview(day) {
  if (!day) return '';
  const sessions = (day.sessions || []).filter(s => (s.items || []).length);
  if (!sessions.length) return '';
  // Full day: all tickers per session, with key fields
  return sessions.map(s =>
    `<div class="dash-session"><h3>${esc(s.name)} <span class="muted">${s.items.length}</span></h3>
    <ul class="dash-earn">${s.items.map(i =>
      `<li><span class="t">${esc(i.ticker)}</span><span class="${i.dir}">${esc(i.move) || '—'}</span><span class="note">${esc([i.eps, i.revenue, i.notes].filter(Boolean).join(' · '))}</span></li>`
    ).join('')}</ul></div>`
  ).join('');
}

function listPreview(day) {
  if (!day || !(day.items || []).length) return '';
  // Full day: every item
  return `<ul class="dash-bullets">${day.items.map(i =>
    `<li>${esc(i.text)}${handles(i.handles)}${i.source ? ` <a href="${esc(i.source)}" target="_blank" rel="noopener">来源</a>` : ''}</li>`
  ).join('')}</ul>`;
}

async function home(dateParam) {
  const [x, e, b, ir] = await Promise.all(['x', 'earnings', 'bofa', 'iran'].map(load));
  const list = unionDates([x, e, b, ir]);
  if (!list.length) {
    return `<h1>今日看板</h1><p class="sub">各栏目重点一览</p>` + empty('尚无任何数据');
  }
  const cur = list.includes(dateParam) ? dateParam : list[0];
  const hl = collectHighlights(x, e, cur);
  const hasX = !!x.days[cur];
  const hasE = !!e.days[cur];
  const hasB = !!b.days[cur];
  const hasIr = !!ir.days[cur];

  const hlBody = hl.length
    ? `<ul class="hl">${hl.map(i =>
        `<li><span class="tag">${esc(i.tag)}</span><div>${i.html} <a href="${i.href}">详情 →</a></div></li>`
      ).join('')}</ul>`
    : '';

  let html = `<div class="dash-top">
    <div>
      <h1>今日看板</h1>
      <p class="sub">一眼看完 ${fmt(cur)} 各栏目当日全文 · 无需切换标签</p>
    </div>
  </div>`;
  html += picker('', list, cur);

  html += `<div class="dash">`;
  html += dashCard({
    title: '今日要点',
    href: hasX ? '#/x/' + cur : (hasE ? '#/earnings/' + cur : null),
    meta: hl.length ? `${hl.length} 条` : '',
    body: hlBody,
    emptyMsg: '该日暂无标注重点（highlight）'
  });
  html += dashCard({
    title: 'X 博主精选',
    href: '#/x/' + (hasX ? cur : (dates(x)[0] || '')),
    meta: hasX ? `${fmtShort(cur)} · ${x.days[cur].topics.reduce((n, tp) => n + tp.items.length, 0)} 条` : '该日无更新',
    body: xDigestPreview(x.days[cur]),
    emptyMsg: '该日无 X 博主日报'
  });
  html += dashCard({
    title: '财报速览摘要',
    href: '#/earnings/' + (hasE ? cur : (dates(e)[0] || '')),
    meta: hasE ? `${fmtShort(cur)} · 美东 · ${e.days[cur].sessions.reduce((n, s) => n + s.items.length, 0)} 只` : '该日无财报',
    body: earningsPreview(e.days[cur]),
    emptyMsg: '该日无财报数据'
  });
  html += dashCard({
    title: '美伊局势要点',
    href: '#/iran/' + (hasIr ? cur : (dates(ir)[0] || '')),
    meta: hasIr ? `${fmtShort(cur)} · ${ir.days[cur].items.length} 条` : '该日无更新',
    body: listPreview(ir.days[cur]),
    emptyMsg: '该日无美伊局势更新'
  });

  // BofA: weekly — show if this day has it, else note next issue / latest
  let bofaBody = '';
  let bofaMeta = '';
  let bofaEmpty = '';
  if (hasB) {
    bofaBody = listPreview(b.days[cur]);
    bofaMeta = `${fmtShort(cur)} · ${b.days[cur].items.length} 条`;
  } else {
    const latestB = dates(b)[0];
    bofaMeta = '非本期';
    bofaEmpty = latestB
      ? `该日无美银牛熊更新（周更）。最近一期：${fmt(latestB)}${b.nextIssue ? ' · 下一期：' + fmt(b.nextIssue) : ''}`
      : (b.nextIssue ? `暂无数据 · 下一期：${fmt(b.nextIssue)}` : '暂无数据');
    if (latestB) {
      bofaBody = `<p class="dash-empty">${esc(bofaEmpty)}</p>` +
        `<div class="dash-aside"><span class="muted">最近一期全文 · ${fmt(latestB)} · ${b.days[latestB].items.length} 条</span>${listPreview(b.days[latestB])}
         <a class="dash-more" href="#/bofa/${latestB}">栏目页 →</a></div>`;
      bofaEmpty = '';
    }
  }
  html += dashCard({
    title: '美银牛熊',
    href: '#/bofa/' + (hasB ? cur : (dates(b)[0] || '')),
    meta: bofaMeta,
    body: bofaBody,
    emptyMsg: bofaEmpty || '该日无美银牛熊更新'
  });

  html += `</div>`;
  return html;
}

async function archive() {
  const all = await Promise.all(Object.keys(SECTIONS).map(async k => [k, await load(k)]));
  return `<h1>归档</h1><p class="sub">按日期浏览历史内容</p>` +
    all.map(([k, d]) =>
      `<div class="card"><h3>${esc(d.title)}</h3>${
        dates(d).map(x => `<a class="arch-link" href="#/${k}/${x}">${fmt(x)}</a>`).join('') ||
        '<span class="muted">暂无</span>'
      }</div>`
    ).join('');
}

async function route() {
  document.body.classList.remove('nav-open');
  closeCal();
  const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/');
  const a = parts[0] || '';
  const b = parts[1] || '';

  let mode = 'home';
  let k = '';
  let date = '';
  if (!a) {
    mode = 'home';
  } else if (DATE_RE.test(a)) {
    mode = 'home';
    date = a;
  } else if (a === 'archive') {
    mode = 'archive';
  } else if (SECTIONS[a]) {
    mode = 'section';
    k = a;
    date = b;
  } else {
    mode = '404';
  }

  document.querySelectorAll('nav a').forEach(link => {
    const href = link.getAttribute('href');
    const on = mode === 'home'
      ? href === '#/'
      : mode === 'archive'
        ? href === '#/archive'
        : href === '#/' + k;
    link.classList.toggle('on', on);
  });

  try {
    if (mode === 'home') app.innerHTML = await home(date);
    else if (mode === 'archive') app.innerHTML = await archive();
    else if (mode === 'section') app.innerHTML = await section(k, date);
    else app.innerHTML = '<p>页面不存在</p>';
  } catch (err) {
    app.innerHTML = '<p class="muted">数据加载失败，请稍后重试。</p>';
  }
  window.scrollTo(0, 0);
}

/* Event delegation for calendar */
document.addEventListener('click', e => {
  const t = e.target.closest('#cal-btn');
  if (t) {
    toggleCal(e);
    return;
  }
  const nav = e.target.closest('.cal-nav');
  if (nav && !nav.disabled) {
    e.stopPropagation();
    calNav(+nav.getAttribute('data-nav'));
    return;
  }
  const cell = e.target.closest('.cal-cell.cal-ok');
  if (cell && cell.dataset.date) {
    e.stopPropagation();
    calPick(cell.dataset.date);
    return;
  }
  if (calState.open && !e.target.closest('.cal-wrap')) closeCal();
});

document.addEventListener('keydown', e => {
  if (!calState.open) return;
  if (e.key === 'Escape') {
    closeCal();
    document.getElementById('cal-btn')?.focus();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    calNav(-1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    calNav(1);
  }
});

addEventListener('hashchange', route);
route();
