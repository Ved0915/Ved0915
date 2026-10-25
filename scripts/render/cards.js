// Builds one profile card from data/cards.json. render.ts picks it with ?card=<name>&brand=<personal|org>[&slug=<project>].
const q = new URLSearchParams(location.search);
const brand = q.get('brand') ?? 'personal';
const data = await (await fetch('/data/cards.json')).json();
const B = data[brand];
const icons = data.icons;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// These simple-icons marks are wide wordmarks that turn illegible at icon size.
const WORDMARKS = new Set(['filament', 'mysql', 'woocommerce', 'composer']);
const svgLogo = (slug) => (icons[slug] && !WORDMARKS.has(slug) ? `<svg class="logo" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[slug].path}"/></svg>` : '');
const monogram = (label) => `<span class="mono">${esc(label.replace(/[^A-Za-z]/g, '').slice(0, 2))}</span>`;
const logo = (slug, label) => svgLogo(slug) || monogram(label);
const logos = (list) => `<div class="logos">${list.map(([slug, label]) => `<span class="chip">${svgLogo(slug)}${esc(label)}</span>`).join('')}</div>`;
const LINE_ICONS = {
  window: 'M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5zM3 9h18M6.5 6.5h.01M9 6.5h.01',
  panel: 'M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5zM9 4v16M12.5 9h5M12.5 12.5h5M12.5 16h3',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14',
  bag: 'M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8',
  doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 15.5h6M9 19h3',
  check: 'M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6zM8.5 12l2.5 2.5 4.5-5',
  phone: 'M7.5 2.5h9A1.5 1.5 0 0 1 18 4v16a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V4a1.5 1.5 0 0 1 1.5-1.5zM10.5 18.5h3',
  cloud: 'M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.5 4.5 4.5 0 0 0 7 18.5z',
  shield: 'M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6zM12 8.5v4M12 15.5h.01',
  monitor: 'M3 4.5h18v11.5H3zM8.5 20h7M12 16v4',
  brush: 'M14.5 4.5l5 5-8.5 8.5-5-5zM6 13l-2.5 6.5L10 17',
  search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5L20 20',
  flask: 'M9.5 3h5M10.5 3v6L5 19.5A1 1 0 0 0 6 21h12a1 1 0 0 0 1-1.5L13.5 9V3M7.5 15h9',
};
const lineIcon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${LINE_ICONS[name]}"/></svg>`;

// Small, quiet mocks of the actual work, one per tile; they replace generic icon-only cards.
const MOCKS = {
  panel: () => `<div class="mock admin"><aside>${'<i></i>'.repeat(5)}</aside><main><div class="kpis">${['Orders', 'Revenue', 'Users'].map((k, i) => `<div><small>${k}</small><b class="kpi" style="width:${[64, 78, 52][i]}%"></b></div>`).join('')}</div>
    <svg viewBox="0 0 300 60" preserveAspectRatio="none"><path d="M0 48 C30 40 50 44 80 30 S130 34 160 22 S220 26 250 12 L300 8" fill="none" stroke="var(--p)" stroke-width="2.5"/><path d="M0 48 C30 40 50 44 80 30 S130 34 160 22 S220 26 250 12 L300 8 V60 H0Z" fill="rgb(var(--p-rgb) / .12)"/></svg>
    <div class="rows">${'<div><i></i><i></i><i></i></div>'.repeat(3)}</div></main></div>`,
  window: () => `<div class="mock site"><div class="bar"><i></i><i></i><i></i><span></span></div><div class="hero-b"><b></b><b></b><em></em></div><div class="grid3"><i></i><i></i><i></i></div></div>`,
  code: () => `<pre class="mock json"><span class="k">GET</span> /api/orders/42  <span class="ok">200</span>
{
  <span class="k">"id"</span>: 42,
  <span class="k">"status"</span>: <span class="s">"paid"</span>,
  <span class="k">"items"</span>: 3
}</pre>`,
  check: () => `<pre class="mock term"><span class="ok">PASS</span>  Feature\\CheckoutTest
<span class="ok">PASS</span>  Feature\\InvoiceTest
<span class="ok">✓</span> Larastan  <span class="ok">✓</span> Pint
<span class="dim">Deploying to production…</span></pre>`,
  bag: () => `<div class="mock shop">${['#2DD4BF', '#8B93F8'].map((c) => `<div class="prod"><i style="background:linear-gradient(135deg, ${c}55, ${c}10)"></i><b></b><em></em></div>`).join('')}<span class="cart">2</span></div>`,
  doc: () => `<div class="mock blocks"><div class="b h"></div><div class="b p"></div><div class="b img"></div><div class="b p short"></div></div>`,
  phone: () => `<div class="mock phone"><div class="screen"><b></b><i></i><i></i><i></i><span></span></div></div>`,
  cloud: () => `<div class="mock deploy">${['Build', 'Test', 'Deploy'].map((s) => `<span><i></i>${s}</span>`).join('<em></em>')}</div>`,
  shield: () => `<div class="mock audit">${['Auth and sessions', 'Injection', 'Access control', 'Secrets'].map((s, i) => `<div><i class="${i === 2 ? 'warn' : ''}"></i>${s}</div>`).join('')}</div>`,
  monitor: () => `<div class="mock desk"><div class="bar"><i></i><i></i><i></i></div><div class="tbl">${'<div><i></i><i></i><i></i><i></i></div>'.repeat(4)}</div></div>`,
};

// Bento spans per tile count: [columns, rows] for each tile in order, on a 4-column grid.
const BENTO = {
  6: [[2, 2], [2, 1], [1, 1], [1, 1], [2, 1], [2, 1]],
  7: [[2, 1], [1, 2], [1, 2], [1, 1], [1, 1], [2, 1], [2, 1]],
};

const cards = {
  tiles: () => {
    const t = B.tiles;
    const order = brand === 'org' ? [0, 2, 5, 1, 4, 3, 6] : [1, 0, 2, 5, 3, 4];
    const spans = BENTO[t.items.length];
    return `<section class="card"><h2>${esc(t.title)}</h2><p class="sub">${esc(t.subtitle)}</p>
      <div class="bento">${order
        .map((idx, i) => {
          const it = t.items[idx];
          const [c, r] = spans[i];
          return `<div class="tile glass${r > 1 ? ' tall' : ''}" style="grid-column:span ${c};grid-row:span ${r}">${MOCKS[it.icon]()}<div class="tile-copy"><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p>${logos(it.logos)}</div></div>`;
        })
        .join('')}</div></section>`;
  },
  strip: () => `<section class="card strip"><h2>${esc(B.work.title)}</h2><p class="sub">${esc(B.work.subtitle)}</p><div class="rule"></div></section>`,
  work: () => {
    const p = data.projects.find((pr) => pr.slug === q.get('slug'));
    const text = brand === 'org' && p.orgText ? p.orgText : p.text;
    return `<section class="card work"><div class="work-copy"><div class="kind"><i></i>${esc(p.kind)}</div><h3>${esc(p.name)}</h3><p>${esc(text)}</p>
      <div class="domain">${p.domain ? esc(p.domain) : 'Private admin app'}</div>${logos(p.stackLogos)}</div>
      <div class="browser"><div class="bar"><i></i><i></i><i></i></div>${p.hasShot ? `<img src="/assets/shots/${p.slug}.webp" alt="">` : p.domain ? MOCKS.window() : MOCKS.panel()}</div></section>`;
  },
  ship: () => `<section class="card"><h2>${esc(B.ship.title)}</h2><p class="sub">${esc(B.ship.subtitle)}</p>
    <div class="pipe"><div class="track"></div><div class="pulse"></div><div class="steps">${data.ship
      .map((s, i) => `<div class="step"><div class="node glass" style="animation-delay:${(i * 6.02) / 7}s">${svgLogo(s.logo) || `<span class="line">${lineIcon(s.icon)}</span>`}</div><b>${esc(s.name)}</b><span>${esc(s.note)}</span></div>`)
      .join('')}</div></div></section>`,
  toolkit: () => `<section class="card"><h2>${esc(B.toolkit.title)}</h2><p class="sub">${esc(B.toolkit.subtitle)}</p>
    <div class="keyboard">${data.toolkit
      .map((g) => `<div class="row"><b>${esc(g.group)}</b><div class="keys">${g.items.map(([slug, label]) => `<div class="key">${logo(slug, label)}<small>${esc(label)}</small></div>`).join('')}</div></div>`)
      .join('')}</div></section>`,
  activity: () => {
    const a = data.activity;
    const stats = [
      ['Contributions', a.total.toLocaleString('en-IN'), 'in the last year'],
      ['Active days', a.activeDays, `out of ${a.days}`],
      ['Longest streak', `${a.longestStreak} days`, 'in a row'],
      ['Busiest day', a.busiest.count, a.busiest.label],
    ];
    return `<section class="card act"><div class="act-copy"><h2>Activity</h2><p class="sub">Most of my work lives in private client repos, so these are the real totals.</p>
      <div class="stats">${stats.map(([k, v, n]) => `<div class="stat glass"><span>${esc(k)}</span><b>${esc(v)}</b><small>${esc(n)}</small></div>`).join('')}</div>
      <p class="note">Updated daily, last on ${esc(a.generatedLabel)}.</p></div><canvas id="sky"></canvas></section>`;
  },
  ohero: () => {
    const bars = [[34, 150, 100], [64, 128, 122], [94, 110, 140], [124, 104, 146], [154, 86, 164], [184, 68, 182]];
    const tags = [['Web', 4, 46], ['Mobile', 84, 40], ['APIs', 88, 78], ['Cloud', 2, 82], ['Security', 50, 96], ['Desktop', 46, 2]];
    return `<section class="card ohero"><div><h1>BalanceView</h1><div class="role">IT services from Ahmedabad</div>
      <p>Software development, security reviews and cloud hosting. You get the full source code of what we build.</p>
      ${logos([['laravel', 'Laravel'], ['react', 'React'], ['vuedotjs', 'Vue'], ['flutter', 'Flutter'], ['aws', 'AWS'], ['wordpress', 'WordPress']])}</div>
      <div class="stage"><div class="halo"></div><div class="orbit2"></div><div class="orbit"></div>
      <svg class="mark" viewBox="0 0 240 240" aria-hidden="true"><defs><linearGradient id="mf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B57FBE"/><stop offset="1" stop-color="#4954AA"/></linearGradient><clipPath id="mc"><circle cx="120" cy="120" r="112"/></clipPath></defs>
      <circle cx="120" cy="120" r="112" fill="url(#mf)"/><g clip-path="url(#mc)" fill="#EEEDFB">${bars.map(([x, y, h], i) => `<rect class="bar" style="animation-delay:${i * 0.12}s" x="${x}" y="${y}" width="16" height="${h}" rx="2"/>`).join('')}</g>
      <path class="arrow" d="M14 156 L96 98 L116 116 L196 62" fill="none" stroke="#EEEDFB" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M176 50 L214 46 L206 84 Z" fill="#EEEDFB"/></svg>
      ${tags.map(([t, x, y]) => `<span class="tag" style="left:${x}%;top:${y}%">${t}</span>`).join('')}</div></section>`;
  },
  footer: () => `<section class="card foot"><div><h2>${esc(B.footer.lines[0])}<br>${esc(B.footer.lines[1])}</h2><div class="line"></div></div>
    <div class="contact glass">${B.footer.rows.map(([slug, text]) => `<div>${logo(slug, text)}<span>${esc(text)}</span></div>`).join('')}</div></section>`,
};

document.body.className = brand === 'org' ? 'org' : '';
document.body.innerHTML = cards[q.get('card')]();
await document.fonts.ready;
await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)));

if (q.get('card') === 'activity') {
  const { mountSkyline, LOOP } = await import('./skyline.js');
  const draw = mountSkyline(document.getElementById('sky'), data.activity.weeks, Number(q.get('dpr') ?? 1.25));
  window.LOOP = LOOP;
  window.renderAt = draw;
  draw(0);
} else {
  // CSS-animated cards are stepped through the Web Animations API so every frame is deterministic.
  const anims = document.getAnimations();
  anims.forEach((a) => a.pause());
  window.LOOP = anims.length ? 7 : 0;
  window.renderAt = (t) => anims.forEach((a) => (a.currentTime = t * 1000));
}
// Any clipped text block fails the render instead of shipping overlapping or cut-off copy.
const clipped = [...document.querySelectorAll('.work-copy, .tile, .stat, .contact, .step, .key')].find((el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
window.layoutError = clipped
  ? `text overflows in .${clipped.className.split(' ')[0]} (${clipped.scrollWidth}x${clipped.scrollHeight} > ${clipped.clientWidth}x${clipped.clientHeight}): "${clipped.textContent.trim().slice(0, 60)}"`
  : '';
window.ready = Promise.resolve(true);
